
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { BottomNav } from "@/components/bottom-nav"

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                {/* Desktop Sidebar - Hidden on Mobile via Shadcn implementation or CSS override? 
            Shadcn Sidebar is responsive but we want Bottom Nav on mobile. 
            We should hide Sidebar on mobile. 
         */}
                <div className="hidden md:block">
                    <AppSidebar />
                </div>

                <main className="flex-1 w-full pb-16 md:pb-0"> {/* padding bottom for mobile nav */}
                    <div className="p-4 md:p-6">
                        {/* Desktop Trigger */}
                        <div className="hidden md:block mb-4">
                            <SidebarTrigger />
                        </div>
                        {children}
                    </div>
                </main>

                <BottomNav />
            </div>
        </SidebarProvider>
    )
}
