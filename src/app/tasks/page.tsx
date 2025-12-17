
import { createClient } from "@/lib/supabase/server"
import { CreateTaskDialog } from "@/components/create-task-dialog"
import { PageHeader } from "@/components/page-header"
import { TaskFilters } from "@/components/task-filters"
import { TaskTable } from "@/components/task-table"
import { TaskDetailDialog } from "@/components/task-detail-dialog"

// NextJS 15+ allows async searchParams. 
export default async function TasksPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams
    const taskId = typeof searchParams.taskId === 'string' ? searchParams.taskId : null

    const supabase = await createClient()

    // 1. Fetch All Tasks
    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*, assignee:users!assignee_id(name, message_handle)')
        .order('created_at', { ascending: false })

    const { data: users } = await supabase.from('users').select('id, name').eq('role', 'staff')

    if (error) {
        console.error(error)
    }

    // 2. Fetch Selected Task (if any)
    let selectedTask = null
    if (taskId) {
        const { data } = await supabase
            .from('tasks')
            .select('*, assignee:users!assignee_id(name, message_handle)')
            .eq('id', taskId)
            .single()
        selectedTask = data
    }

    return (
        <div className="h-full flex flex-1 flex-col space-y-8 p-2 md:p-4">
            <PageHeader title="Tasks" description="Manage team commitments and execution status.">
                <TaskFilters />
                <CreateTaskDialog users={users || []} />
            </PageHeader>

            <TaskTable tasks={tasks || []} />

            <TaskDetailDialog task={selectedTask} open={!!selectedTask} />
        </div>
    )
}
