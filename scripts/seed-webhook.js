const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const envPath = path.resolve(process.cwd(), '.env.local');

// Load .env.local
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^['"]|['"]$/g, '');
            process.env[key] = value;
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedWebhookExpector(
    phoneNumber = '15555555555',
    name = 'Webhook Tester'
) {
    try {
        console.log(`[Seed] Ensuring user exists for phone: ${phoneNumber}...`);

        // 1. Create or Update User
        // Check if user exists first
        const { data: existingUser, error: findError } = await supabase
            .from('users')
            .select('id')
            .eq('message_handle', phoneNumber)
            .single();

        if (findError && findError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            throw new Error(`User lookup failed: ${findError.message}`);
        }

        let userId = existingUser?.id;

        if (!userId) {
            console.log('[Seed] User not found, creating new user...');
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
            console.log(`[Seed] Created User: ${userId}`);
        } else {
            console.log(`[Seed] Found existing User: ${userId}`);
        }

        // 2. Ensure Active Task
        const { data: activeTask, error: taskFindError } = await supabase
            .from('tasks')
            .select('id')
            .eq('assignee_id', userId)
            .neq('status', 'completed')
            .limit(1)
            .single();

        if (taskFindError && taskFindError.code !== 'PGRST116') {
            throw new Error(`Task lookup failed: ${taskFindError.message}`);
        }

        if (activeTask) {
            console.log(`[Seed] Active task already exists: ${activeTask.id}`);
            return;
        }

        // Create new task if none active
        console.log('[Seed] No active task found, creating one...');
        const { data: newTask, error: taskError } = await supabase
            .from('tasks')
            .insert({
                title: 'Test Webhook Task',
                description: 'This is a test task to verify webhook reception.',
                assignee_id: userId,
                creator_id: userId,
                status: 'pending',
                deadline: new Date(Date.now() + 86400000).toISOString()
            })
            .select('id')
            .single();

        if (taskError) throw new Error(`Task creation failed: ${taskError.message}`);

        console.log(`[Seed] Created new test task: ${newTask.id}`);

    } catch (error) {
        console.error('[Seed] Error:', error.message);
    }
}

seedWebhookExpector();
