
'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendWhatsAppMessage } from "@/lib/whatsapp"

export async function createTask(formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const assigneeId = formData.get('assignee_id') as string
    const deadlineStr = formData.get('deadline') as string

    if (!title || !assigneeId || !deadlineStr) {
        return { error: 'Missing required fields' }
    }

    // Creator? For V1 we might hardcode or use session if auth'd.
    // We'll pick the first admin found or use the session user if exists.
    // For V1 Demo, let's assume 'Alice Admin' is the creator if not auth'd properly.
    // Or better, fetch the current user.
    const { data: { user } } = await supabase.auth.getUser()

    let creatorId = user?.id

    // FAILSAFE for V1 Pilot without Auth: find the 'admin' user from our seed.
    if (!creatorId) {
        const { data: adminUser } = await supabase.from('users').select('id').eq('role', 'admin').single()
        creatorId = adminUser?.id
    }

    if (!creatorId) return { error: 'No authorized user found' }

    // 1. Create Task
    const { data: task, error } = await supabase.from('tasks').insert({
        title,
        assignee_id: assigneeId,
        creator_id: creatorId,
        deadline: new Date(deadlineStr).toISOString(), // Ensure ISO
        status: 'pending', // Awaiting Confirmation
        // team_id: ... (Optional, can infer from assignee)
    }).select().single()

    if (error) {
        console.error('Create Task Error:', error)
        return { error: error.message }
    }

    // 2. Mock Send WhatsApp (Assignment)
    const { data: assignee } = await supabase.from('users').select('message_handle, name').eq('id', assigneeId).single()

    if (assignee && assignee.message_handle) {
        const message = `Hi ${assignee.name}, you have a new task: "${title}". Due by ${deadlineStr}. Reply "OK" to confirm.`
        await sendWhatsAppMessage(assignee.message_handle, message, task.id)

        // Log event
        await supabase.from('audit_logs').insert({
            action: 'MSG_SENT',
            task_id: task.id,
            details: { type: 'assignment', to: assignee.name, body: message }
        })
    }

    revalidatePath('/tasks')
    revalidatePath('/leader')
    return { success: true }
}
