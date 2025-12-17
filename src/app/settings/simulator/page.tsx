import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/page-header"
import { SimulatorForm } from "./simulator-form"

export default async function SimulatorPage() {
    const supabase = await createClient()

    // Fetch users for the dropdown
    const { data: users } = await supabase
        .from('users')
        .select('id, name, message_handle')
        .order('name')

    return (
        <div className="h-full flex flex-1 flex-col space-y-8 p-2 md:p-4">
            <PageHeader
                title="AI Logic Simulator"
                description="Test the Brain logic without sending real WhatsApp messages."
            />

            <SimulatorForm users={users || []} />
        </div>
    )
}
