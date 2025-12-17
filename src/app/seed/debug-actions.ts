'use server'

export async function checkPhoneNumbers() {
    const token = process.env.WHATSAPP_API_TOKEN

    if (!token) {
        return { error: 'Missing WHATSAPP_API_TOKEN in .env.local' }
    }

    try {
        console.log(`Checking Token Identity & Specific WABA...`)

        // 1. Try to fetch the specific WABA ID from the screenshot
        const targetWabaId = '1587638782393579'; // From screenshot
        console.log(`Querying WABA ID: ${targetWabaId}`);

        const wabaResponse = await fetch(`https://graph.facebook.com/v22.0/${targetWabaId}/phone_numbers`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        const wabaData = await wabaResponse.json();

        if (wabaResponse.ok && wabaData.data) {
            return {
                success: true,
                message: "FOUND NUMBERS via WABA ID!",
                FOUND_PHONE_NUMBERS: wabaData.data,
                source: "Direct WABA Query"
            }
        }

        // If that failed, fall back to the deep 'me' query
        const query = `me?fields=id,name,permissions,businesses{id,name,whatsapp_business_accounts{id,name,phone_numbers{id,display_phone_number,status,quality_rating}}}`

        const response = await fetch(`https://graph.facebook.com/v21.0/${query}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        })

        const data = await response.json()

        if (!response.ok) {
            return {
                error: "Graph API Query Failed",
                details: data.error,
            }
        }

        // Helper to flatten the results for the user
        const foundPhoneNumbers: any[] = [];

        if (data.businesses && data.businesses.data) {
            data.businesses.data.forEach((biz: any) => {
                const wabas = biz.whatsapp_business_accounts?.data || [];
                wabas.forEach((waba: any) => {
                    const phones = waba.phone_numbers?.data || [];
                    phones.forEach((p: any) => {
                        foundPhoneNumbers.push({
                            phone_number_id: p.id, // THIS IS WHAT WE WANT
                            display_phone_number: p.display_phone_number,
                            verified_name: p.verified_name,
                            business_name: biz.name,
                            waba_name: waba.name,
                            status: p.status
                        });
                    });
                });
            });
        }

        return {
            success: true,
            message: foundPhoneNumbers.length > 0 ? "FOUND PHONE NUMBERS!" : "No Phone Numbers found linked to your Token.",
            FOUND_PHONE_NUMBERS: foundPhoneNumbers,
            raw_data: data
        }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function subscribeWaba(wabaId: string) {
    const token = process.env.WHATSAPP_API_TOKEN
    if (!token) return { success: false, error: "Missing Token" }

    try {
        console.log(`Subscribing App to WABA: ${wabaId}...`)
        const response = await fetch(`https://graph.facebook.com/v22.0/${wabaId}/subscribed_apps`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                subscribed_fields: ['messages']
            })
        });

        const data = await response.json();
        if (!response.ok) {
            return { success: false, error: data.error?.message || "Subscription Failed", details: data }
        }

        return { success: true, message: "SUCCESS: App Subscribed to WABA!", data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function checkSubscribedApps(wabaId: string) {
    const token = process.env.WHATSAPP_API_TOKEN

    try {
        console.log(`Checking Subscribed Apps for WABA: ${wabaId}...`)
        const response = await fetch(`https://graph.facebook.com/v22.0/${wabaId}/subscribed_apps?fields=name,link,id,subscribed_fields`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        return {
            success: true,
            message: "Fetched Subscribed Apps",
            data: data
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Creates a test user and active task to bypass "Unknown User" or "No Active Task" errors
 * during webhook debugging.
 */
export async function seedWebhookExpector(
    phoneNumber: string = '15555555555',
    name: string = 'Webhook Tester'
) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    try {
        console.log(`[Seed] Ensuring user exists for phone: ${phoneNumber}...`);

        // 1. Create or Update User
        // Check if user exists first to avoid unique constraint if we just upsert without knowing ID
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('message_handle', phoneNumber)
            .single();

        let userId = existingUser?.id;

        if (!userId) {
            const { data: newUser, error: userError } = await supabase
                .from('users')
                .insert({
                    name: name,
                    email: `tester_${Date.now()}@example.com`,
                    role: 'staff',
                    message_handle: phoneNumber,
                })
                .select('id')
                .single();

            if (userError) throw new Error(`User creation failed: ${userError.message}`);
            userId = newUser.id;
        }

        // 2. Ensure Active Task
        const { data: activeTask } = await supabase
            .from('tasks')
            .select('id')
            .eq('assignee_id', userId)
            .neq('status', 'completed')
            .limit(1)
            .single();

        if (activeTask) {
            console.log(`[Seed] Active task already exists: ${activeTask.id}`);
            return { success: true, userId, taskId: activeTask.id, message: "User and Task ready for Webhook Test" };
        }

        // Create new task if none active
        const { data: newTask, error: taskError } = await supabase
            .from('tasks')
            .insert({
                title: 'Test Webhook Task',
                description: 'This is a test task to verify webhook reception.',
                assignee_id: userId,
                creator_id: userId, // Self-assigned for test
                status: 'pending',
                deadline: new Date(Date.now() + 86400000).toISOString() // 24 hours from now
            })
            .select('id')
            .single();

        if (taskError) throw new Error(`Task creation failed: ${taskError.message}`);

        console.log(`[Seed] Created new test task: ${newTask.id}`);
        return { success: true, userId, taskId: newTask.id, message: "Created new Task for Webhook Test" };

    } catch (error: any) {
        console.error('[Seed] Error:', error);
        return { success: false, error: error.message };
    }
}
