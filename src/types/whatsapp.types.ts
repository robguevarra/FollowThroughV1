// WhatsApp Cloud API Webhook Payload Types
// Reference: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components

/**
 * Main webhook payload structure from WhatsApp
 */
export interface WhatsAppWebhookPayload {
    object: 'whatsapp_business_account'
    entry: WhatsAppWebhookEntry[]
}

/**
 * Individual entry in the webhook payload
 */
export interface WhatsAppWebhookEntry {
    id: string // Business Account ID
    changes: WhatsAppWebhookChange[]
}

/**
 * Change object containing the actual message or status data
 */
export interface WhatsAppWebhookChange {
    value: WhatsAppWebhookValue
    field: 'messages' // Can be other types like 'message_template_status_update'
}

/**
 * Value object containing messages and metadata
 */
export interface WhatsAppWebhookValue {
    messaging_product: 'whatsapp'
    metadata: {
        display_phone_number: string
        phone_number_id: string
    }
    contacts?: WhatsAppContact[]
    messages?: WhatsAppMessage[]
    statuses?: WhatsAppStatus[]
}

/**
 * Contact information from the sender
 */
export interface WhatsAppContact {
    profile: {
        name: string
    }
    wa_id: string // WhatsApp ID (phone number without +)
}

/**
 * Message object
 */
export interface WhatsAppMessage {
    from: string // Sender's phone number
    id: string // Message ID
    timestamp: string // Unix timestamp
    type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contacts' | 'interactive'
    text?: {
        body: string
    }
    // Add other message types as needed
    image?: {
        id: string
        mime_type: string
        sha256: string
    }
    context?: {
        from: string
        id: string
    }
}

/**
 * Status update for sent messages
 */
export interface WhatsAppStatus {
    id: string // Message ID
    status: 'sent' | 'delivered' | 'read' | 'failed'
    timestamp: string
    recipient_id: string
    conversation?: {
        id: string
        origin: {
            type: string
        }
    }
    pricing?: {
        billable: boolean
        pricing_model: string
        category: string
    }
    errors?: Array<{
        code: number
        title: string
        message: string
        error_data: {
            details: string
        }
    }>
}

/**
 * WhatsApp Cloud API Send Message Request
 */
export interface WhatsAppSendMessageRequest {
    messaging_product: 'whatsapp'
    recipient_type?: 'individual'
    to: string // Phone number in international format without +
    type: 'text' | 'template' | 'image' | 'video' | 'document'
    text?: {
        preview_url?: boolean
        body: string
    }
    template?: {
        name: string
        language: {
            code: string
        }
        components?: Array<{
            type: string
            parameters: Array<{
                type: string
                text?: string
            }>
        }>
    }
}

/**
 * WhatsApp Cloud API Send Message Response
 */
export interface WhatsAppSendMessageResponse {
    messaging_product: 'whatsapp'
    contacts: Array<{
        input: string
        wa_id: string
    }>
    messages: Array<{
        id: string
    }>
}

/**
 * WhatsApp API Error Response
 */
export interface WhatsAppErrorResponse {
    error: {
        message: string
        type: string
        code: number
        error_data?: {
            messaging_product: string
            details: string
        }
        error_subcode?: number
        fbtrace_id: string
    }
}
