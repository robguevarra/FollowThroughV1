'use server'

import { AIEngine } from "@/lib/ai/engine"
import { AIActionPlan } from "@/types/ai.types"
import { createClient } from "@/lib/supabase/server"

// Wrapper to allow passing dates as strings
export async function simulateMessage(userId: string, text: string, timeOverride?: string, history: { role: 'user' | 'assistant', content: string }[] = []): Promise<AIActionPlan | { error: string }> {
    try {
        const supabase = await createClient()
        // Admin check? For now assuming if they can access the page (auth) it's ok.
        // Or check role.

        // We could verify role 'admin' here.

        const overrideDate = timeOverride ? new Date(timeOverride) : undefined;
        return await AIEngine.createPlan(userId, text, overrideDate, history);
    } catch (e: any) {
        return { error: e.message }
    }
}
