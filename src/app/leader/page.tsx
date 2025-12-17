
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"

export default async function LeaderPage() {
    const supabase = await createClient()

    // Fetch tasks with status 'at_risk' or 'blocked'
    const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .in('status', ['at_risk', 'blocked'])

    return (
        <div className="h-full flex flex-1 flex-col space-y-8 p-2 md:p-4">
            <PageHeader title="Signal" description="Focus on what needs attention. High risk items only." />

            <div className="grid gap-4">
                {tasks && tasks.length > 0 ? (
                    tasks.map(task => (
                        <div key={task.id} className="p-5 border-l-4 border-l-destructive border bg-card/50 hover:bg-card transition-colors rounded-r-lg shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-lg tracking-tight">{task.title}</h3>
                                    <div className="text-sm font-medium text-destructive flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                                        {task.status === 'blocked' ? `BLOCKED: ${task.blocker_reason}` : 'AT RISK: Deadline approaching'}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2 font-mono">Due: {new Date(task.deadline).toLocaleDateString()}</p>
                                </div>
                                <Badge variant="destructive" className="uppercase font-bold tracking-wider text-[10px]">
                                    {task.status.replace('_', ' ')}
                                </Badge>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border rounded-lg bg-muted/10 border-dashed">
                        <div className="h-12 w-12 rounded-full bg-green-100/50 flex items-center justify-center text-green-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <h2 className="text-xl font-medium">All Clear</h2>
                        <p className="text-muted-foreground max-w-sm text-sm">No critical issues detected. The system is monitoring execution.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
