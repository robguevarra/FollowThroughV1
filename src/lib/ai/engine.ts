import { createClient } from "@/lib/supabase/server";
import { classifyMessage } from "./classifier";
import { generateReply } from "./generator";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { Tables } from "@/types/database.types";
import { AIActionPlan, AIIntent } from "@/types/ai.types";

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
    static async createPlan(userId: string, messageText: string, overrideTime?: Date, history: { role: 'user' | 'assistant', content: string }[] = []): Promise<AIActionPlan> {
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

        // 2. Classify (Now returns target candidates)
        const classification = await classifyMessage(messageText, activeTasks || []);

        const plan: AIActionPlan = {
            classification,
            dbUpdates: [],
            reply: null,
            events: []
        };

        // 3. Resolve Target Task
        let targetTask: Tables<'tasks'> | undefined;
        // Strategy: 1. Explicit ID from AI -> 2. Candidates -> 3. Fallback (First active) - user called this "stupid" so we try to be smart.
        if (activeTasks && activeTasks.length > 0) {
            if (classification.task_candidates && classification.task_candidates.length > 0) {
                targetTask = activeTasks.find(t => classification.task_candidates!.includes(t.id));
            }

            // Fallback: If intent implies a task but none identified, maybe ask? 
            // For now, if generic query "what tasks", we don't need a single target.
            // If "Done", we need a target.
            if (!targetTask && (classification.intent === 'DONE' || classification.intent === 'BLOCK')) {
                // Fallback to first if ambiguous? Or maybe handled in "AMBIGUOUS" intent?
                // For now, keeping legacy behavior (first task) BUT logging it.
                targetTask = activeTasks[0];
            }
        }

        // 4. Action Planner Implementation
        const intent = classification.intent;

        plan.events.push({
            type: 'inbound',
            description: `Received message: "${messageText}"`,
            metadata: { intent, confidence: classification.confidence }
        });

        switch (intent) {
            case 'DONE':
                if (targetTask) {
                    plan.dbUpdates.push({
                        table: 'tasks',
                        id: targetTask.id,
                        data: { status: 'completed' }
                    });
                    plan.events.push({ type: 'internal', description: `Marking task ${targetTask.id} as COMPLETED` });
                }
                break;

            case 'BLOCK':
                if (targetTask) {
                    plan.dbUpdates.push({
                        table: 'tasks',
                        id: targetTask.id,
                        data: { status: 'blocked', blocker_reason: classification.reason || "User reported block" }
                    });
                    plan.events.push({ type: 'internal', description: `Marking task ${targetTask.id} as BLOCKED` });
                }
                break;

            case 'CONFIRM':
                if (targetTask && targetTask.status === 'pending') {
                    plan.dbUpdates.push({
                        table: 'tasks',
                        id: targetTask.id,
                        data: { status: 'confirmed' }
                    });
                    plan.events.push({ type: 'internal', description: `Marking task ${targetTask.id} as CONFIRMED` });
                }
                break;

            case 'RESCHEDULE':
                if (targetTask && classification.new_deadline) {
                    plan.dbUpdates.push({
                        table: 'tasks',
                        id: targetTask.id,
                        data: { deadline: classification.new_deadline }
                    });
                    plan.events.push({ type: 'internal', description: `Rescheduling task ${targetTask.id} to ${classification.new_deadline}` });
                }
                break;

            case 'STOP':
                // TODO: Implement preference persistence
                plan.reply = "AI Paused. (Placeholder)";
                return plan; // Early exit

            case 'QUERY':
                // Queries are handled by the generator reply, but we log the event.
                plan.events.push({ type: 'internal', description: `Processing QUERY intent` });
                break;

            case 'PROGRESS':
                // Progress updates could potentially update a 'last_progress_at' field in future.
                plan.events.push({ type: 'internal', description: `Processing PROGRESS update` });
                break;
        }

        // 5. Generate Reply
        // Logic for Quiet Hours / Weekend Mode (Simplified for now, as user wants core mechanics fixed first)
        // We will assume ALWAYS reply for now unless strictly STOP.

        plan.reply = await generateReply(settings?.personality || 'professional', {
            user: { name: user.name },
            task: targetTask, // Can be undefined for generic queries
            intent: intent,
            data: classification,
            allTasks: activeTasks || [],
            history
        });

        // Log outbound event
        if (plan.reply) {
            plan.events.push({ type: 'outbound', description: "Generated Reply", metadata: { body: plan.reply } });
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
            // @ts-ignore - Dynamic table update is tricky with strict Typescript but safe here due to explicit keys
            await supabase.from(update.table).update(update.data).eq('id', update.id);
        }

        // 2. Log Events to Audit Logs
        if (plan.events.length > 0) {
            const auditEntries = plan.events.map(e => ({
                action: `AI_${e.type.toUpperCase()}`,
                details: { description: e.description, metadata: e.metadata } as any,
                // If the event relates to a specific task (from engine's context), we might want to link it.
                // For now, we don't have task_id in the event explicitly, but we could add it.
                // We'll just log generic for now.
            }));

            // Insert in batch
            await supabase.from('audit_logs').insert(auditEntries);
        }

        // 3. Update Last Active
        await supabase.from('ai_settings').update({
            last_active_at: new Date().toISOString()
        }).eq('user_id', userId);

        // 4. Send Reply
        if (plan.reply) {
            const { data: user } = await supabase.from('users').select('message_handle').eq('id', userId).single();
            if (user?.message_handle) {
                await this.sendReply(user.message_handle, plan.reply, null);
            }
        }
    }

    private static async sendReply(to: string, body: string, settings: any) {
        await sendWhatsAppMessage(to, body);
    }
}
