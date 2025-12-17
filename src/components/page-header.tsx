
import { Separator } from "@/components/ui/separator"
import { ReactNode } from "react"

interface PageHeaderProps {
    title: string
    description?: string
    children?: ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-4 pb-4">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-xl font-medium tracking-tight text-foreground">{title}</h1>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>
                <div className="flex items-center gap-2">
                    {children}
                </div>
            </div>
            <Separator className="bg-border/50" />
        </div>
    )
}
