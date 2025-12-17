
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"

interface TaskDetailDialogProps {
    task: any | null
    open: boolean
}

export function TaskDetailDialog({ task, open }: TaskDetailDialogProps) {
    const router = useRouter()

    function onOpenChange(open: boolean) {
        if (!open) {
            router.push('/tasks') // Clear param on close
        }
    }

    if (!task) return null

    const assigneeName = task.assignee?.name || 'Unassigned'
    const initials = assigneeName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md md:max-w-lg p-0 gap-0 overflow-hidden bg-card text-card-foreground border shadow-lg">
                <DialogHeader className="p-6 pb-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <DialogTitle className="text-xl font-semibold leading-tight">{task.title}</DialogTitle>
                            <DialogDescription>Created on {new Date(task.created_at).toLocaleDateString()}</DialogDescription>
                        </div>
                        <StatusBadge status={task.status} />
                    </div>
                </DialogHeader>

                <Separator />

                <ScrollArea className="max-h-[80vh] overflow-y-auto">
                    <div className="p-6 space-y-8">
                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Assignee</label>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8 border">
                                        <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">{initials}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{assigneeName}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Due Date</label>
                                <div className="text-sm font-medium">
                                    {new Date(task.deadline).toLocaleString(undefined, {
                                        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Blocker Section */}
                        {task.status === 'blocked' && (
                            <div className="bg-destructive/10 border-destructive/20 border p-4 rounded-md space-y-2">
                                <label className="text-xs font-bold text-destructive uppercase tracking-wider flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                                    Current Blocker
                                </label>
                                <p className="text-sm font-medium text-destructive-foreground">
                                    "{task.blocker_reason}"
                                </p>
                            </div>
                        )}

                        {/* Description (Optional) */}
                        {task.description && (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
                                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                                    {task.description}
                                </p>
                            </div>
                        )}

                        {/* Timeline / Audit placeholders */}
                        <div className="space-y-4">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Activity</label>
                            <div className="relative border-l pl-4 space-y-6">
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border bg-muted-foreground/20" />
                                    <p className="text-xs text-muted-foreground">Task created by System</p>
                                    <p className="text-[10px] text-muted-foreground/60">{new Date(task.created_at).toLocaleTimeString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        pending: "text-muted-foreground border-dashed",
        confirmed: "text-blue-600 bg-blue-50 border-blue-200",
        blocked: "text-red-700 bg-red-50 border-red-200",
        at_risk: "text-orange-700 bg-orange-50 border-orange-200",
        completed: "text-green-700 bg-green-50 border-green-200"
    }
    const label = status.replace('_', ' ')
    const styleClass = styles[status] || ""

    return (
        <Badge variant="outline" className={`capitalize font-medium text-xs px-2.5 py-0.5 ${styleClass}`}>
            {label}
        </Badge>
    )
}
