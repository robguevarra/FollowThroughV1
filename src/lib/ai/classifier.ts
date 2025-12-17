import { Tables } from "@/types/database.types";
import { AIClassification, AIIntent } from "@/types/ai.types";

export async function classifyMessage(content: string, tasks: Tables<'tasks'>[]): Promise<AIClassification> {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
        console.warn("DEEPSEEK_API_KEY not found, falling back to heuristics.");
        return heuristicClassify(content);
    }

    try {
        // Include ID for targeting
        const taskList = tasks.map(t => `[ID: ${t.id}] "${t.title}" (Status: ${t.status}, Due: ${t.deadline})`).join('\n');

        const systemPrompt = `
You are an AI assistant managing task execution.
User has the following active tasks:
${taskList}

User Message: "${content}"

Your goal is to classify the user's intent into one of these categories:
- CONFIRM: User accepts a task or confirms they are working on it.
- BLOCK: User is stuck (e.g., "I need help", "Wait", "Blocker").
- DONE: User has completed a task.
- PROGRESS: User is providing an update but not done yet.
- QUERY: User is asking about their tasks or schedule.
- RESCHEDULE: User wants to change a deadline.
- STOP: User wants to stop the AI (e.g. "STOP", "PAUSE", "SHUT UP").
- AMBIGUOUS: User intent is clear (e.g. "Done") but it's unclear WHICH task they refer to (if multiple are active).
- UNCLEAR: Message is unrelated.

Return a JSON object with:
- "intent": The category.
- "reason": Explanation or extracted data.
- "new_deadline": ISO string if intent is RESCHEDULE (future time).
- "target_task_id": The exact ID of the task the user is referring to, if clear from context.
- "task_candidates": Array of probable task IDs if AMBIGUOUS.
- "confidence": 0-1.
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
            new_deadline: result.new_deadline,
            // Map the target_task_id to our candidates if specific
            task_candidates: result.target_task_id ? [result.target_task_id] : result.task_candidates,
            confidence: result.confidence || 0.5
        };

    } catch (error) {
        console.error("AI Classification Failed:", error);
        return heuristicClassify(content);
    }
}

function heuristicClassify(content: string): AIClassification {
    const lower = content.toLowerCase();

    if (lower === 'stop' || lower === 'pause') {
        return { intent: 'STOP', confidence: 1.0 };
    }
    if (lower.includes('done') || lower.includes('finished') || lower.includes('complete')) {
        return { intent: 'DONE', confidence: 0.8 };
    }
    if (lower.includes('stuck') || lower.includes('block') || lower.includes("can't")) {
        return { intent: 'BLOCK', confidence: 0.8, reason: content };
    }
    if (lower.includes('what') && lower.includes('task')) {
        return { intent: 'QUERY', confidence: 0.8 };
    }
    if (lower.includes('later') || lower.includes('tomorrow') || lower.includes('reschedule')) {
        return { intent: 'RESCHEDULE', confidence: 0.7 };
    }

    return { intent: 'UNCLEAR', confidence: 0.5 };
}
