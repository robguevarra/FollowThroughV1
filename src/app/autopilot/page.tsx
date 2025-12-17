
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"

export default async function AutopilotPage() {
    const supabase = await createClient()

    // Fetch audit logs
    const { data: logs } = await supabase
        .from('audit_logs')
        .select('*, task:tasks(title)')
        .order('created_at', { ascending: false })
        .limit(50)

    return (
        <div className="h-full flex flex-1 flex-col space-y-8 p-2 md:p-4">
            <PageHeader title="Autopilot" description="Live feed of system decisions and invisible actions." />

            <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-8 pl-10">
                    {logs && logs.length > 0 ? (
                        logs.map(log => (
                            <div key={log.id} className="relative">
                                {/* Timeline Dot */}
                                <div className="absolute -left-[29px] top-1 h-3.5 w-3.5 rounded-full border bg-background" />

                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-muted-foreground">
                                            {new Date(log.created_at || '').toLocaleTimeString()}
                                        </span>
                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">
                                            {log.action}
                                        </Badge>
                                    </div>
                                    <p className="text-sm font-medium">
                                        {(log.task as any)?.title || 'Unknown Task'}
                                    </p>
                                    <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border font-mono">
                                        {JSON.stringify(log.details, null, 2)}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-muted-foreground">No activity recorded yet.</div>
                    )}
                </div>
            </div>
        </div>
    )
}
