import { createClient } from "@/lib/supabase/server";
import type { WhatsAppSendMessageRequest, WhatsAppSendMessageResponse, WhatsAppErrorResponse } from "@/types/whatsapp.types";

/**
 * Sends a WhatsApp message using the Cloud API
 * Supports both mock mode (for development) and production mode
 * 
 * @param to - Phone number in international format (with or without +)
 * @param body - Message text content
 * @param taskId - Optional task ID for logging purposes
 * @returns Object with success status and message ID
 */
export async function sendWhatsAppMessage(to: string, body: string, taskId?: string) {
    const isMockMode = process.env.MOCK_MESSAGING === 'true';

    // Clean phone number: remove + and any spaces
    const cleanPhone = to.replace(/[\s+]/g, '');

    if (isMockMode) {
        console.log(`[WhatsApp MOCK] To: ${cleanPhone} | Body: ${body}`);
        return { success: true, messageId: 'mock_' + Date.now() };
    }

    // Real WhatsApp API call
    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!apiToken || !phoneNumberId) {
        console.error('[WhatsApp] Missing API credentials');
        return { success: false, error: 'Missing API credentials' };
    }

    const payload: WhatsAppSendMessageRequest = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: {
            preview_url: false,
            body: body
        }
    };

    try {
        const response = await fetch(
            `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            const errorData: WhatsAppErrorResponse = await response.json();
            console.error('[WhatsApp] API Error:', errorData);

            // Log error to database for tracking
            await logMessageError(cleanPhone, body, errorData.error.message, taskId);

            return {
                success: false,
                error: errorData.error.message,
                code: errorData.error.code
            };
        }

        const data: WhatsAppSendMessageResponse = await response.json();
        const messageId = data.messages[0]?.id;

        console.log(`[WhatsApp] Message sent successfully. ID: ${messageId}`);

        // Log successful send to database
        await logMessageSent(cleanPhone, body, messageId, taskId);

        return { success: true, messageId };

    } catch (error) {
        console.error('[WhatsApp] Network error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Logs successful message send to database
 */
async function logMessageSent(to: string, body: string, messageId: string, taskId?: string) {
    try {
        const supabase = await createClient();

        await supabase.from('messages').insert({
            task_id: taskId || null,
            direction: 'outbound',
            content: body,
            status: 'sent',
            // Store WhatsApp message ID in a metadata field if you have one
        });

        if (taskId) {
            await supabase.from('audit_logs').insert({
                action: 'MSG_SENT',
                task_id: taskId,
                details: { to, messageId, body }
            });
        }
    } catch (error) {
        console.error('[WhatsApp] Failed to log message:', error);
    }
}

/**
 * Logs message sending error to database
 */
async function logMessageError(to: string, body: string, error: string, taskId?: string) {
    try {
        const supabase = await createClient();

        await supabase.from('messages').insert({
            task_id: taskId || null,
            direction: 'outbound',
            content: body,
            status: 'failed',
        });

        if (taskId) {
            await supabase.from('audit_logs').insert({
                action: 'MSG_SEND_FAILED',
                task_id: taskId,
                details: { to, error, body }
            });
        }
    } catch (dbError) {
        console.error('[WhatsApp] Failed to log error:', dbError);
    }
}
