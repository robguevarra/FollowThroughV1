
import { createClient } from "@/lib/supabase/server"
import { evaluateTaskRisk } from "@/lib/ai/risk"
import { NextResponse } from "next/server"

export async function GET() { // Cron usually calls GET
    const supabase = await createClient()

    const { data: tasks } = await supabase.from('tasks').select('*').neq('status', 'completed').neq('status', 'blocked')

    if (!tasks) return NextResponse.json({ count: 0 })

    let updates = 0

    for (const task of tasks) {
        const assessment = evaluateTaskRisk(task)

        if (assessment.isAtRisk && task.status !== 'at_risk') {
            // Mark At Risk
            await supabase.from('tasks').update({ status: 'at_risk' }).eq('id', task.id)

            // Log
            await supabase.from('audit_logs').insert({
                action: 'RISK_DETECTED',
                task_id: task.id,
                details: { reason: assessment.reason }
            })
            updates++
        }
    }

    return NextResponse.json({ processed: tasks.length, updates })
}
