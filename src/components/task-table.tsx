
"use client"

import { useRouter } from "next/navigation"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface TaskTableProps {
    tasks: any[]
}

export function TaskTable({ tasks }: TaskTableProps) {
    const router = useRouter()

    return (
        <>
            {/* Desktop View */}
            <div className="hidden md:block rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent bg-muted/20">
                            <TableHead className="w-[400px]">Task</TableHead>
                            <TableHead>Assignee</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Due Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasks && tasks.length > 0 ? (
                            tasks.map(task => {
                                const assigneeName = (task.assignee as any)?.name || 'Unassigned'
                                const initials = assigneeName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

                                return (
                                    <TableRow
                                        key={task.id}
                                        className="h-12 hover:bg-muted/30 cursor-pointer group transition-colors"
                                        onClick={() => router.push(`/tasks?taskId=${task.id}`)}
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{task.title}</span>
                                                {task.blocker_reason && (
                                                    <span className="text-xs text-destructive mt-0.5 truncate max-w-[300px] flex items-center gap-1">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-destructive inline-block" />
                                                        {task.blocker_reason}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6 border">
                                                    <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground">{initials}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs text-muted-foreground">{assigneeName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={task.status} />
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                                            {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground text-sm">
                                    No active tasks. Create one to get started.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-3">
                {tasks && tasks.length > 0 ? (
                    tasks.map(task => {
                        const assigneeName = (task.assignee as any)?.name || 'Unassigned'
                        const initials = assigneeName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

                        return (
                            <div
                                key={task.id}
                                onClick={() => router.push(`/tasks?taskId=${task.id}`)}
                                className="p-4 rounded-lg border bg-card active:scale-[0.99] transition-transform"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex flex-col gap-1 pr-2">
                                        <span className="font-medium text-base">{task.title}</span>
                                        {task.blocker_reason && (
                                            <span className="text-xs text-destructive font-medium flex items-center gap-1">
                                                <span className="h-1.5 w-1.5 rounded-full bg-destructive inline-block" />
                                                {task.blocker_reason}
                                            </span>
                                        )}
                                    </div>
                                    <StatusBadge status={task.status} />
                                </div>

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-5 w-5 border">
                                            <AvatarFallback className="text-[9px] bg-secondary text-secondary-foreground">{initials}</AvatarFallback>
                                        </Avatar>
                                        <span>{assigneeName}</span>
                                    </div>
                                    <span className="font-mono">
                                        {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center py-12 border rounded-lg border-dashed text-muted-foreground text-sm">
                        No active tasks.
                    </div>
                )}
            </div>
        </>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        pending: "text-muted-foreground border-dashed",
        confirmed: "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-50",
        blocked: "text-red-700 bg-red-50 border-red-200 hover:bg-red-50",
        at_risk: "text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-50",
        completed: "text-green-700 bg-green-50 border-green-200 hover:bg-green-50"
    }

    const label = status.replace('_', ' ')
    const styleClass = styles[status] || ""

    return (
        <Badge variant="outline" className={`capitalize font-medium text-[10px] px-2 py-0.5 h-5 ${styleClass}`}>
            {label}
        </Badge>
    )
}
