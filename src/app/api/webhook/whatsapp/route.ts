import { createClient } from "@/lib/supabase/server"
import { classifyMessage } from "@/lib/ai/classifier"
import { NextRequest, NextResponse } from "next/server"
import type { WhatsAppWebhookPayload, WhatsAppMessage } from "@/types/whatsapp.types"

/**
 * GET handler for WhatsApp webhook verification
 * This is called by Meta when you first configure the webhook URL
 * 
 * Query params:
 * - hub.mode: should be "subscribe"
 * - hub.challenge: random string to echo back
 * - hub.verify_token: must match WHATSAPP_VERIFY_TOKEN env variable
 */
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN

    // Check if verification request is valid
    if (mode === 'subscribe' && token === verifyToken) {
        console.log('[Webhook] Verification successful')
        // Respond with the challenge token from the request
        return new NextResponse(challenge, { status: 200 })
    } else {
        console.error('[Webhook] Verification failed', { mode, token })
        return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
    }
}

/**
 * POST handler for incoming WhatsApp messages
 * Receives webhook notifications from WhatsApp Cloud API
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient()

    try {
        // Parse WhatsApp webhook payload
        const payload: WhatsAppWebhookPayload = await req.json()

        // Validate payload structure
        if (payload.object !== 'whatsapp_business_account') {
            console.log('[Webhook] Invalid object type:', payload.object)
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
        }

        // Process each entry in the webhook
        for (const entry of payload.entry) {
            for (const change of entry.changes) {
                // Only process message changes
                if (change.field !== 'messages') {
                    continue
                }

                const value = change.value

                // Handle status updates (message delivery, read receipts, etc.)
                if (value.statuses) {
                    console.log('[Webhook] Status update:', value.statuses)
                    // You can log these to your database if needed
                    continue
                }

                // Handle incoming messages
                if (value.messages && value.messages.length > 0) {
                    for (const message of value.messages) {
                        await processIncomingMessage(message, supabase)
                    }
                }
            }
        }

        // Always return 200 to acknowledge receipt
        return NextResponse.json({ success: true }, { status: 200 })

    } catch (error) {
        console.error('[Webhook] Error processing webhook:', error)
        // Still return 200 to prevent WhatsApp from retrying
        return NextResponse.json({ success: false }, { status: 200 })
    }
}

/**
 * Process a single incoming WhatsApp message
 */
async function processIncomingMessage(message: WhatsAppMessage, supabase: any) {
    // Only handle text messages for now
    if (message.type !== 'text' || !message.text) {
        console.log('[Webhook] Non-text message received, skipping')
        return
    }

    const from = message.from // Phone number without +
    const body = message.text.body
    const messageId = message.id

    console.log(`[Webhook] Message from ${from}: ${body}`)

    // 1. Find User by Phone
    // Try with and without country code
    const { data: user } = await supabase
        .from('users')
        .select('id, name, role')
        .or(`message_handle.eq.${from},message_handle.eq.+${from}`)
        .single()

    if (!user) {
        console.log(`[Webhook] Unknown user: ${from}`)
        // Log unknown message for debugging
        await supabase.from('audit_logs').insert({
            action: 'MSG_UNKNOWN_USER',
            task_id: null,
            details: { from, body, messageId }
        })
        return
    }

    // 2. Find Active Task for User
    // Get the latest non-completed task
    const { data: task } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', user.id)
        .neq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (!task) {
        console.log(`[Webhook] No active task found for user ${user.name}`)
        // Log message without task context
        await supabase.from('audit_logs').insert({
            action: 'MSG_NO_TASK',
            task_id: null,
            details: { userId: user.id, from, body, messageId }
        })
        return
    }

    // 3. Log incoming message to messages table
    await supabase.from('messages').insert({
        task_id: task.id,
        user_id: user.id,
        direction: 'inbound',
        content: body,
        status: 'received'
    })

    // 4. AI Classification
    const result = await classifyMessage(body, task)

    // 5. Update Task State based on AI classification
    let newStatus = task.status
    let auditAction = 'MSG_RECEIVED'

    if (result.intent === 'CONFIRM' && task.status === 'pending') {
        newStatus = 'confirmed'
        auditAction = 'TASK_CONFIRMED'
    } else if (result.intent === 'BLOCK') {
        newStatus = 'blocked'
        auditAction = 'TASK_BLOCKED'
        // Update blocker reason
        await supabase.from('tasks').update({ blocker_reason: result.reason }).eq('id', task.id)
    } else if (result.intent === 'DONE') {
        newStatus = 'completed'
        auditAction = 'TASK_COMPLETED'
    }

    // 6. Update task status if changed
    if (newStatus !== task.status) {
        await supabase.from('tasks').update({
            status: newStatus,
            updated_at: new Date().toISOString()
        }).eq('id', task.id)

        // Log status change
        await supabase.from('audit_logs').insert({
            action: auditAction,
            task_id: task.id,
            details: {
                original_msg: body,
                ai_intent: result.intent,
                reason: result.reason,
                messageId
            }
        })

        console.log(`[Webhook] Task ${task.id} status updated: ${task.status} → ${newStatus}`)
    } else {
        // Just log message receipt
        await supabase.from('audit_logs').insert({
            action: 'MSG_RECEIVED_INFO',
            task_id: task.id,
            details: { body, intent: result.intent, messageId }
        })
    }
}
