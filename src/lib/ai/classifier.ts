
import { Tables } from "@/types/database.types";

export type AIIntent = 'CONFIRM' | 'BLOCK' | 'DONE' | 'PROGRESS' | 'UNCLEAR';

export interface AIClassification {
    intent: AIIntent;
    reason?: string;
    confidence: number;
}

export async function classifyMessage(content: string, taskContext: Tables<'tasks'>): Promise<AIClassification> {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
        console.warn("DEEPSEEK_API_KEY not found, falling back to heuristics.");
        return heuristicClassify(content);
    }

    try {
        const systemPrompt = `
You are an AI assistant managing task execution.
Current Task: "${taskContext.title}" (Status: ${taskContext.status})
User Message: "${content}"

Your goal is to classify the user's intent into one of these categories:
- CONFIRM: User accepts the task or confirms they are working on it (e.g., "OK", "On it", "Will do").
- BLOCK: User is stuck or cannot proceed (e.g., "I need help", "Wait", "Blocker").
- DONE: User has completed the task (e.g., "Finished", "Done", "Completed").
- PROGRESS: User is providing an update but not done yet (e.g., "Halfway there").
- UNCLEAR: Message is unrelated or ambiguous.

Return a JSON object with:
- "intent": One of the categories above.
- "reason": A brief explanation or extracted blocker reason (if intent is BLOCK).
- "confidence": A number between 0 and 1.
`;

        const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: "You are a helpful JSON classifier." },
                    { role: "user", content: systemPrompt }
                ],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`DeepSeek API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const resultString = data.choices[0].message.content;
        const result = JSON.parse(resultString);

        return {
            intent: (result.intent as AIIntent) || 'UNCLEAR',
            reason: result.reason,
            confidence: result.confidence || 0.5
        };

    } catch (error) {
        console.error("AI Classification Failed:", error);
        return heuristicClassify(content);
    }
}

function heuristicClassify(content: string): AIClassification {
    const lower = content.toLowerCase();
    if (lower.includes('done') || lower.includes('finished') || lower.includes('complete')) {
        return { intent: 'DONE', confidence: 0.9 };
    }
    if (lower.includes('stuck') || lower.includes('block') || lower.includes('wait') || lower.includes("can't")) {
        return { intent: 'BLOCK', confidence: 0.8, reason: content };
    }
    if (lower.includes('ok') || lower.includes('got it') || lower.includes('sure') || lower.includes('will do')) {
        return { intent: 'CONFIRM', confidence: 0.9 };
    }
    return { intent: 'UNCLEAR', confidence: 0.5 };
}
