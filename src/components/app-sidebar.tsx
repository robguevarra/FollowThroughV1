
"use client"

import { Calendar, CheckSquare, Users, Activity, LayoutDashboard, Settings } from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
    {
        title: "Tasks",
        url: "/tasks",
        icon: CheckSquare,
    },
    {
        title: "Leader View",
        url: "/leader",
        icon: LayoutDashboard,
    },
    {
        title: "Autopilot",
        url: "/autopilot",
        icon: Activity,
    },
    {
        title: "Teams",
        url: "/teams",
        icon: Users,
    },
    {
        title: "Settings",
        url: "/settings/ai",
        icon: Settings,
    },
]

export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>FollowThrough</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
