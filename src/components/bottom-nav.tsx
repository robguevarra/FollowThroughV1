
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, CheckSquare, Users, Activity, LayoutDashboard, Settings } from "lucide-react"

export function BottomNav() {
    const pathname = usePathname()

    const items = [
        {
            title: "Tasks",
            url: "/tasks",
            icon: CheckSquare,
        },
        {
            title: "Signal",
            url: "/leader",
            icon: LayoutDashboard,
        },
        {
            title: "Auto",
            url: "/autopilot",
            icon: Activity,
        },
        // "Teams" logic: hide on mobile or put in "More"? 
        // Requirements say "Leader can find what needs attention... Admin can create task..."
        // Teams is less frequent. Maybe exclude from bottom bar or add small "More".
        // For V1, I'll add simple Teams access via top right or just "More" is separate.
        // Let's stick to core 3 for "Calm". Teams can be accessed via /teams URL or admin menu.
        // I'll add "Teams" for now to check requirements. "Nav... top level... Teams... Members". 
        // Mobile bottom bar space is limited. 
        // I'll add Teams.
        {
            title: "Teams",
            url: "/teams",
            icon: Users,
        },
        {
            title: "Settings",
            url: "/settings/ai",
            icon: Settings,
        }
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-2 md:hidden">
            <div className="flex justify-around items-center">
                {items.map((item) => {
                    const isActive = pathname === item.url
                    return (
                        <Link key={item.title} href={item.url} className={`flex flex-col items-center p-2 rounded-lg ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                            <item.icon className="h-6 w-6" />
                            <span className="text-xs mt-1">{item.title}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
