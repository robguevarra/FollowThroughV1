
import { createClient } from "@/lib/supabase/server";
import { classifyMessage, AIClassification } from "./classifier";
import { generateReply } from "./generator";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { Tables } from "@/types/database.types";

// Define the AIActionPlan interface
export interface AIActionPlan {
    classification: AIClassification;
    dbUpdates: { table: string, id: string, data: any }[];
    reply: string | null;
    skipReplyReason?: string;
}

export class AIEngine {

    /**
     * Main entry point for processing incoming messages
     */
    static async processMessage(userId: string, messageText: string, messageId: string) {
        const plan = await this.createPlan(userId, messageText);
        await this.executePlan(plan, userId);
    }

    /**
     * Generates a detailed action plan without executing side effects (Dry Run)
     */
    static async createPlan(userId: string, messageText: string, overrideTime?: Date): Promise<AIActionPlan> {
        const supabase = await createClient();

        // 1. Fetch Context
        const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
        if (!user) throw new Error("User not found");

        const { data: settings } = await supabase.from('ai_settings').select('*').eq('user_id', userId).single();
        const { data: activeTasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('assignee_id', userId)
            .neq('status', 'completed');

        // 2. Classify
        const classification = await classifyMessage(messageText, activeTasks || []);

        const plan: AIActionPlan = {
            classification,
            dbUpdates: [],
            reply: null
        };

        // 3. Handle STOP
        if (classification.intent === 'STOP') {
            plan.reply = "AI Paused. (Placeholder functionality)";
            return plan;
        }

        // 4. Decision Logic
        let replyIntent = classification.intent;
        let replyData: any = {};
        let targetTask: Tables<'tasks'> | undefined;

        if (activeTasks && activeTasks.length > 0) {
            targetTask = activeTasks[0]; // TODO: Ambiguity
        }

        // Prepare DB Updates
        if (classification.intent === 'DONE' && targetTask) {
            plan.dbUpdates.push({ table: 'tasks', id: targetTask.id, data: { status: 'completed' } });
            replyIntent = 'DONE';
        } else if (classification.intent === 'BLOCK' && targetTask) {
            plan.dbUpdates.push({
                table: 'tasks',
                id: targetTask.id,
                data: { status: 'blocked', blocker_reason: classification.reason }
            });
        } else if (classification.intent === 'RESCHEDULE' && targetTask && classification.new_deadline) {
            plan.dbUpdates.push({
                table: 'tasks',
                id: targetTask.id,
                data: { deadline: classification.new_deadline }
            });
            replyData = { new_deadline: classification.new_deadline };
        }

        // 5. Generate Reply (Check Constraints)
        let shouldReply = true;
        let skipReason = '';

        if (settings) {
            const now = overrideTime || new Date();
            const userTimeParams = { timeZone: settings.timezone || 'UTC', hour12: false };

            // Update last_active_at matches current time, not override? 
            // In simulation we don't update DB, so it's fine.

            // Check Weekend Mode
            if (!settings.include_weekends) {
                const dayOfWeek = new Intl.DateTimeFormat('en-US', { ...userTimeParams, weekday: 'short' }).format(now);
                if (dayOfWeek === 'Sat' || dayOfWeek === 'Sun') {
                    shouldReply = false;
                    skipReason = 'Weekend Mode';
                }
            }

            // Check Quiet Hours
            if (shouldReply && settings.work_hours_start && settings.work_hours_end) {
                const userTime = new Intl.DateTimeFormat('en-US', { ...userTimeParams, hour: '2-digit', minute: '2-digit' }).format(now);
                const current = userTime;
                const start = settings.work_hours_start;
                const end = settings.work_hours_end;

                let isWorkHours = false;
                if (start <= end) {
                    isWorkHours = current >= start && current <= end;
                } else {
                    isWorkHours = current >= start || current <= end;
                }

                if (!isWorkHours) {
                    shouldReply = false;
                    skipReason = 'Outside Work Hours';
                }
            }
        }

        if (classification.intent === 'STOP' || classification.intent === 'RESCHEDULE') {
            shouldReply = true;
        }

        if (!shouldReply) {
            plan.skipReplyReason = skipReason;
        } else {
            plan.reply = await generateReply(settings?.personality || 'professional', {
                user: { name: user.name },
                task: targetTask,
                intent: replyIntent,
                data: replyData
            });
        }

        return plan;
    }

    /**
     * Executes the plan (Side Effects)
     */
    static async executePlan(plan: AIActionPlan, userId: string) {
        const supabase = await createClient();

        // 1. DB Updates
        for (const update of plan.dbUpdates) {
            await supabase.from(update.table as any).update(update.data).eq('id', update.id);
        }

        // 2. Update Last Active (Always on execution)
        // Check if ai_settings exists for user first? Or upsert?
        // simple update.
        await supabase.from('ai_settings').update({
            last_active_at: new Date().toISOString()
        }).eq('user_id', userId);

        // 3. Send Reply
        if (plan.reply) {
            const { data: user } = await supabase.from('users').select('message_handle').eq('id', userId).single();
            if (user?.message_handle) {
                // settings is not needed for sendReply, passing null for now
                await this.sendReply(user.message_handle, plan.reply, null);
            }
        }
    }

    private static async sendReply(to: string, body: string, settings: any) {
        // Here we could check "Quiet Hours" if we wanted to queue it instead.
        // But usually instant reply is expected even in quiet hours if user messaged US.
        await sendWhatsAppMessage(to, body);
    }
}
