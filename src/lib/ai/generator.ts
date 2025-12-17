import { Tables } from "@/types/database.types";

type Personality = 'professional' | 'friendly' | 'strict';

interface ReplyContext {
    user: { name: string };
    task?: Tables<'tasks'>;
    intent: string;
    data?: any; // Extra data like "new_deadline" or "blocker_reason"
}

const SYSTEM_PROMPTS: Record<Personality, string> = {
    professional: `You are a highly efficient, professional project manager. You value brevity and clarity. You do not use emojis unless necessary. Your goal is to unblock the user and ensure delivery.`,
    friendly: `You are a supportive and enthusiastic accountability partner! 🚀 You use emojis, celebrate small wins, and encourage the user. You are firm but kind.`,
    strict: `You are a strict, no-nonsense commander. You demand results. You do not tolerate excuses. You use short, imperative sentences. Time is money.`
};

export async function generateReply(
    personality: Personality,
    context: ReplyContext
): Promise<string> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const systemPrompt = SYSTEM_PROMPTS[personality];

    if (!apiKey) {
        return fallbackReply(personality, context.intent);
    }

    const userPrompt = `
    Context:
    - User: ${context.user.name}
    - Task: ${context.task?.title || "General"} (Status: ${context.task?.status})
    - Intent Detected: ${context.intent}
    - Data: ${JSON.stringify(context.data)}

    Generate a WhatsApp reply (max 2 sentences) based on the detection.
    If the intent is DONE, celebrate/acknowledge.
    If BLOCKED, ask for details or offer help.
    If CONFIRM, acknowledge.
    If AMBIGUOUS, ask for clarification.
    If QUERY, answer the question directly. If you don't know, say you'll check.
    If STOP, confirm silence.
    `;

    try {
        const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 60
            })
        });

        const data = await response.json();
        return data.choices[0].message.content.trim();

    } catch (error) {
        console.error("AI Generation Failed:", error);
        return fallbackReply(personality, context.intent);
    }
}

function fallbackReply(personality: Personality, intent: string): string {
    if (intent === 'DONE') {
        return personality === 'strict' ? "Noted. Next task." : "Great job! Task marked complete. 🎉";
    }
    if (intent === 'BLOCK') {
        return personality === 'strict' ? "Fix it. Now." : "Understood. What's the blocker?";
    }
    return "Got it.";
}
