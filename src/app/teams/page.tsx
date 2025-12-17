
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default async function TeamsPage() {
    const supabase = await createClient()

    const { data: teams } = await supabase.from('teams').select('*')
    const { data: users } = await supabase.from('users').select('*') // For member counts

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold tracking-tight">Teams & Members</h1>
                {/* TODO: Add 'New Team' Button */}
            </div>
            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                    <h2 className="text-lg font-medium">Teams</h2>
                    <div className="grid gap-2">
                        {teams?.map(team => (
                            <div key={team.id} className="p-3 border rounded-md flex justify-between">
                                <span>{team.name}</span>
                                <Badge variant="outline">{users?.filter(u => u.team_id === team.id).length} members</Badge>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-medium">Members</h2>
                    <div className="grid gap-2">
                        {users?.map(user => (
                            <div key={user.id} className="p-3 border rounded-md flex justify-between items-center">
                                <div>
                                    <div className="font-medium">{user.name}</div>
                                    <div className="text-xs text-muted-foreground">{user.role}</div>
                                </div>
                                <Badge variant="secondary">{user.message_handle || 'No Phone'}</Badge>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
