import { Database } from "./database.types";

export type TaskStatus = Database["public"]["Enums"]["task_status"];

export type AIIntent =
    | 'CONFIRM'
    | 'BLOCK'
    | 'DONE'
    | 'PROGRESS'
    | 'QUERY'
    | 'RESCHEDULE'
    | 'STOP'
    | 'AMBIGUOUS'
    | 'UNCLEAR';

export interface AIClassification {
    intent: AIIntent;
    reason?: string;
    new_deadline?: string;
    task_candidates?: string[];
    confidence: number;
}

export interface AIActionPlan {
    classification: AIClassification;
    // We will be specific about DB updates to avoid loose typing
    dbUpdates: {
        table: keyof Database['public']['Tables'];
        id: string;
        data: Partial<Database['public']['Tables'][keyof Database['public']['Tables']]['Update']>;
    }[];
    reply: string | null;
    skipReplyReason?: string;
    // New: Autopilot Event Logging
    events: AutopilotEvent[];
}

export interface AutopilotEvent {
    type: 'inbound' | 'outbound' | 'internal';
    description: string;
    metadata?: any;
}
