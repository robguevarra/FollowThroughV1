import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/page-header"
import { AISettingsForm } from "./ai-settings-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AISettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()



    // 1. Get Public User ID
    // DEMO MODE: If not logged in, just pick the first user (Alice Admin or similar) 
    // to allow settings configuration without auth.
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
        console.log("Settings Page: No Auth User, fetching default for Demo...");
        const { data: firstUser } = await supabase
            .from('users')
            .select('id')
            .limit(1)
            .single()
        publicUserId = firstUser?.id;
    }

    if (!publicUserId) {
        return <div>No users found in database. Please seed the database first.</div>
    }

    // 2. Get Settings
    const { data: settings } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('user_id', publicUserId)
        .single()

    return (
        <div className="h-full flex flex-1 flex-col space-y-8 p-2 md:p-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="AI Configuration"
                    description="Customize how the Phantom Manager interacts with you."
                />
                <a href="/settings/simulator" className="text-sm font-medium text-primary hover:underline">
                    Open Simulator &rarr;
                </a>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>
                        Control the personality, timing, and behavior of your AI assistant.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AISettingsForm
                        initialSettings={settings || {
                            user_id: publicUserId,
                            personality: 'professional',
                            followup_frequency: 'balanced',
                            work_hours_start: '09:00',
                            work_hours_end: '17:00',
                            timezone: 'UTC',
                            include_weekends: false,
                            optimize_costs: true
                        }}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
