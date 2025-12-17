
import { Tables } from "@/types/database.types";

export type AIIntent = 'CONFIRM' | 'BLOCK' | 'DONE' | 'PROGRESS' | 'UNCLEAR';

export interface AIClassification {
    intent: AIIntent;
    reason?: string;
    confidence: number;
}

export async function classifyMessage(content: string, taskContext: Tables<'tasks'>): Promise<AIClassification> {
    const lower = content.toLowerCase();

    // HEURISTIC / MOCK LOGIC FOR V1
    if (lower.includes('done') || lower.includes('finished') || lower.includes('complete')) {
        return { intent: 'DONE', confidence: 0.9 };
    }

    if (lower.includes('stuck') || lower.includes('block') || lower.includes('wait') || lower.includes("can't")) {
        // Extract everything after the keyword as reason
        return { intent: 'BLOCK', confidence: 0.8, reason: content };
    }

    if (lower.includes('ok') || lower.includes('got it') || lower.includes('sure') || lower.includes('will do')) {
        return { intent: 'CONFIRM', confidence: 0.9 };
    }

    return { intent: 'UNCLEAR', confidence: 0.5 };
}
