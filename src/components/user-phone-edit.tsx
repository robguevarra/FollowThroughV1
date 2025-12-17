'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Pencil, Check, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface UserPhoneEditProps {
    userId: string
    initialPhone: string | null
    name: string
    role: string
}

export function UserPhoneEdit({ userId, initialPhone, name, role }: UserPhoneEditProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [phone, setPhone] = useState(initialPhone || '')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSave = async () => {
        setIsLoading(true)
        const supabase = createClient()

        const { error } = await supabase
            .from('users')
            .update({ message_handle: phone })
            .eq('id', userId)

        setIsLoading(false)

        if (error) {
            alert('Failed to update phone: ' + error.message)
            return
        }

        setIsEditing(false)
        router.refresh()
    }

    return (
        <div className="p-3 border rounded-md flex justify-between items-center bg-card">
            <div>
                <div className="font-medium">{name}</div>
                <div className="text-xs text-muted-foreground capitalize">{role}</div>
            </div>

            <div className="flex items-center gap-2">
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <Input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="639..."
                            className="w-[140px] h-8"
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSave} disabled={isLoading}>
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => setIsEditing(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => setIsEditing(true)}>
                        <Badge variant={initialPhone ? "secondary" : "destructive"}>
                            {initialPhone || 'No Phone'}
                        </Badge>
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                    </div>
                )}
            </div>
        </div>
    )
}
