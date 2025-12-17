'use server'

import { AIEngine, AIActionPlan } from "@/lib/ai/engine"
import { createClient } from "@/lib/supabase/server"

// Wrapper to allow passing dates as strings
export async function simulateMessage(userId: string, text: string, timeOverride?: string): Promise<AIActionPlan | { error: string }> {
    try {
        const supabase = await createClient()
        // Admin check? For now assuming if they can access the page (auth) it's ok.
        // Or check role.


        // We could verify role 'admin' here.

        const overrideDate = timeOverride ? new Date(timeOverride) : undefined;
        return await AIEngine.createPlan(userId, text, overrideDate);
    } catch (e: any) {
        return { error: e.message }
    }
}
