
import { Tables } from "@/types/database.types";

export function evaluateTaskRisk(task: Tables<'tasks'>): { isAtRisk: boolean; reason?: string } {
    if (task.status === 'completed' || task.status === 'blocked') {
        return { isAtRisk: false };
    }

    const now = new Date();
    const deadline = new Date(task.deadline);
    const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) {
        return { isAtRisk: true, reason: 'Overdue' };
    }

    if (diffHours < 24 && task.status !== 'confirmed' && task.status !== 'at_risk') {
        // If less than 24h & not even confirmed, high risk
        if (task.status === 'pending') return { isAtRisk: true, reason: 'Deadline < 24h & Pending' };
    }

    return { isAtRisk: false };
}
