const https = require('https');
const fs = require('fs');
const path = require('path');
const envPath = path.resolve(process.cwd(), '.env.local');

// Load .env.local manually to avoid installing dotenv if not present
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // Remove quotes
            process.env[key] = value;
        }
    });
}

const ACCESS_TOKEN = process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

async function makeGraphRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'graph.facebook.com',
            port: 443,
            path: `/v21.0${path}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
}

function postToLocalWebhook(port = 3000) {
    const data = JSON.stringify({
        object: "whatsapp_business_account",
        entry: [{
            id: "123456789",
            changes: [{
                value: {
                    messaging_product: "whatsapp",
                    metadata: {
                        display_phone_number: "1555005555",
                        phone_number_id: PHONE_NUMBER_ID || "123456789"
                    },
                    contacts: [{
                        profile: { name: "Test User" },
                        wa_id: "15555555555"
                    }],
                    messages: [{
                        from: "15555555555",
                        id: "wamid.test_" + Date.now(),
                        timestamp: Math.floor(Date.now() / 1000).toString(),
                        text: { body: "DIAGNOSTIC TEST MESSAGE" },
                        type: "text"
                    }]
                },
                field: "messages"
            }]
        }]
    });

    const options = {
        hostname: 'localhost',
        port: port,
        path: '/api/webhook/whatsapp',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    console.log('\n--- Simulating Local Webhook ---');
    console.log(`Sending POST to http://localhost:${port}/api/webhook/whatsapp...`);

    const req = require('http').request(options, (res) => {
        console.log(`Status Code: ${res.statusCode}`);
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            console.log('Response:', body);
            if (res.statusCode === 200) {
                console.log('✅ Local webhook handler is working correctly.');
            } else {
                console.log('❌ Local webhook handler returned error.');
            }
        });
    });

    req.on('error', (e) => {
        console.error('❌ Failed to connect to local webhook:', e.message);
        console.log('Make sure your local server is running (npm run dev).');
    });

    req.write(data);
    req.end();
}

async function runDiagnosis() {
    console.log('=== WhatsApp Integration Diagnosis ===');

    if (!ACCESS_TOKEN) {
        console.error('❌ Missing WHATSAPP_API_TOKEN or WHATSAPP_ACCESS_TOKEN in .env.local');
        return;
    }
    console.log('✅ Access Token found');

    if (!PHONE_NUMBER_ID) {
        console.error('❌ Missing WHATSAPP_PHONE_NUMBER_ID in .env.local');
        return;
    }
    console.log(`✅ Phone Number ID found: ${PHONE_NUMBER_ID}`);

    try {
        // 1. Get WABA ID from Phone Number ID
        console.log('\n--- Fetching WABA ID ---');
        console.log(`Querying /${PHONE_NUMBER_ID}?fields=id,name,account_id...`); // Removed v21.0 from log to match logic
        const phoneData = await makeGraphRequest(`/${PHONE_NUMBER_ID}?fields=id,name,account_id`);

        if (phoneData.error) {
            console.error('❌ API Error fetching Phone ID:', phoneData.error);
            return;
        }

        const wabaId = phoneData.account_id; // Check field name? Usually it's account_id? Wait, doc says 'business_account' or similar. 
        // Actually, let's just dump the data to be sure, but 'account_id' is standard for generic node, 
        // for Phone Number it's usually `business_account`. Wait, let's checking the docs? 
        // Since I can't browse, I'll print the keys.
        // Actually, standard Graph API for PhoneNumber is `account_id`? No.
        // Let's print what we got.
        console.log('Phone Data:', JSON.stringify(phoneData, null, 2));

        // Try to identify WABA ID
        // Often it is explicitly linked.
        // If not present, I'll attempt another endpoint but let's assume it's in logic.

        // Actually, if we can't find it, we stop.
        // Let's assume the user might need to provide it if this fails.
        // But usually it's `business_account` -> `id`?

        // Let's use the generic "subscribed_apps" on the WABA ID. 
        // If we don't know the WABA ID, we can't check subscription.

        // Assuming we found it (or will find it in printout):
        // Note: For now I'll just look for a field that looks like an ID.

        // 2. Check Subscribed Apps
        // Only if we have WABA ID
        // I'll add logic to prompt user if script fails here.

        // But wait, the main goal is to check subs.
        // I'll try to guess it's `id` from `business_account` field if exists, or `account_id`?
        // Let's request `business_account` field specifically.
    } catch (e) {
        console.error('Error during diagnosis:', e);
    }

    // As a fallback/parallel, execute local webhook test
    postToLocalWebhook();
}

// Improved version to handle getting WABA ID correctly
async function runDiagnosisImproved() {
    console.log('=== WhatsApp Integration Diagnosis ===');

    if (!ACCESS_TOKEN) {
        console.error('❌ Missing WHATSAPP_API_TOKEN or WHATSAPP_ACCESS_TOKEN in .env.local');
        return;
    }
    // console.log('✅ Access Token found'); // Reduce noise

    if (!PHONE_NUMBER_ID) {
        console.error('❌ Missing WHATSAPP_PHONE_NUMBER_ID in .env.local');
        return;
    }
    // console.log(`✅ Phone Number ID found: ${PHONE_NUMBER_ID}`); // Reduce noise

    try {
        // 1. Get WABA ID
        console.log('1️⃣  Fetching WABA ID using Phone Number ID...');
        const phoneData = await makeGraphRequest(`/${PHONE_NUMBER_ID}?fields=id,name,business_account,account_mode`);

        if (phoneData.error) {
            console.error('❌ Error fetching Phone Data:', phoneData.error.message);
            console.log('   (Token might be invalid or lacking permissions)');
            // Check if we can proceed without WABA ID
            // We can't check subscription, but we can still run local test.
        }

        // Logic to extract WABA ID
        let wabaId = null;
        if (phoneData.business_account && phoneData.business_account.id) {
            wabaId = phoneData.business_account.id;
        } else if (phoneData.metadata && phoneData.metadata.business_account_id) { // Some endpoints
            wabaId = phoneData.metadata.business_account_id;
        }

        if (!wabaId) {
            console.log('⚠️  Could not automatically find WABA ID from Phone Number details.');
            console.log('   Response was:', JSON.stringify(phoneData, null, 2));
            console.log('   Please ensure you have permissions (whatsapp_business_management).');
            // Can't proceed to check subscription without WABA ID
        } else {
            console.log(`✅ Found WABA ID: ${wabaId}`);

            // 2. Check Subscribed Apps
            console.log('\n2️⃣  Checking WABA Subscribed Apps...');
            const subsData = await makeGraphRequest(`/${wabaId}/subscribed_apps`);

            if (subsData.error) {
                console.error('❌ Error fetching subscriptions:', subsData.error.message);
            } else {
                const apps = subsData.data;
                console.log(`   Found ${apps ? apps.length : 0} subscribed apps.`);
                if (apps && apps.length > 0) {
                    apps.forEach(app => {
                        console.log(`   - App Name: ${app.name} (ID: ${app.id})`);
                        console.log(`     Link: ${app.link}`);
                        console.log(`     Gulliver Link: ${app.gulliver_link || 'N/A'}`); // Sometimes useful
                    });
                    console.log('✅ WABA is subscribed to an app.');
                } else {
                    console.log('❌ WABA is NOT subscribed to any app.');
                    console.log('   Run: POST /' + wabaId + '/subscribed_apps to subscribe.');
                }
            }
        }

    } catch (e) {
        console.error('❌ Unexpected error:', e);
    }

    // 3. Local Webhook Test
    postToLocalWebhook();
}

runDiagnosisImproved();
