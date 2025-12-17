'use server'

export async function registerPhone(pin: string) {
    const token = process.env.WHATSAPP_API_TOKEN
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!token || !phoneId) {
        return { error: 'Missing API Credentials in .env.local' }
    }

    try {
        const response = await fetch(`https://graph.facebook.com/v22.0/${phoneId}/register`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                pin: pin,
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Registration Error:', data)
            return { error: data.error?.message || 'Registration failed' }
        }

        return { success: true, data }
    } catch (error: any) {
        return { error: error.message }
    }
}
