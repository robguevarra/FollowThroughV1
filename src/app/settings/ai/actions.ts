'use server'

import { createClient } from "@/lib/supabase/server"
import { Tables } from "@/types/database.types"
import { revalidatePath } from "next/cache"

export async function updateAISettings(data: Partial<Tables<'ai_settings'>>) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()



    // Upsert settings linked to public.users(id)
    // Assuming auth.uid() == public.users.auth_id
    // But our schema says public.users.id is the key for ai_settings.
    // We need to find the public user ID first.

    // 1. Get Public User ID (Demo Mode Fallback)
    let publicUserId = null;

    if (user) {
        const { data: publicUser } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single()
        publicUserId = publicUser?.id;
    }

    if (!publicUserId) {
        const { data: firstUser } = await supabase
            .from('users')
            .select('id')
            .limit(1)
            .single()
        publicUserId = firstUser?.id;
    }

    if (!publicUserId) {
        return { error: "No user found to update." }
    }

    // 2. Upsert Settings
    const { error } = await supabase
        .from('ai_settings')
        .upsert({
            user_id: publicUserId,
            ...data,
            updated_at: new Date().toISOString()
        })

    if (error) {
        console.error("Failed to update AI settings:", error)
        return { error: "Failed to update settings" }
    }

    revalidatePath('/settings/ai')
    return { success: true }
}
