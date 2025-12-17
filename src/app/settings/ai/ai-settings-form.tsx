'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Tables } from "@/types/database.types"
import { updateAISettings } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
    personality: z.enum(["professional", "friendly", "strict"]),
    followup_frequency: z.enum(["aggressive", "balanced", "relaxed"]),
    work_hours_start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
    work_hours_end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
    timezone: z.string().min(1, "Timezone is required"),
    include_weekends: z.boolean(),
    optimize_costs: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface AISettingsFormProps {
    initialSettings: Tables<'ai_settings'>
}

export function AISettingsForm({ initialSettings }: AISettingsFormProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            personality: initialSettings.personality || 'professional',
            followup_frequency: initialSettings.followup_frequency || 'balanced',
            work_hours_start: initialSettings.work_hours_start || '09:00',
            work_hours_end: initialSettings.work_hours_end || '17:00',
            timezone: initialSettings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            include_weekends: initialSettings.include_weekends || false,
            optimize_costs: initialSettings.optimize_costs !== false, // default true
        }
    })

    async function onSubmit(data: FormValues) {
        setIsSaving(true)
        setMessage(null)

        // Remove seconds if present in time string, though regex handles HH:MM
        const result = await updateAISettings({
            ...data,
            work_hours_start: data.work_hours_start,
            work_hours_end: data.work_hours_end
        })

        if (result.error) {
            setMessage("Error: " + result.error)
        } else {
            setMessage("Settings saved successfully.")
        }
        setIsSaving(false)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="personality"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>AI Personality</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select personality" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="professional">Professional (Concise, Direct)</SelectItem>
                                        <SelectItem value="friendly">Friendly (Encouraging, Emojis)</SelectItem>
                                        <SelectItem value="strict">Strict (No-nonsense, Demanding)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    Determines the tone of the messages you receive.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="followup_frequency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Follow-up Frequency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="aggressive">Aggressive (Every 2h near deadline)</SelectItem>
                                        <SelectItem value="balanced">Balanced (Daily check-ins)</SelectItem>
                                        <SelectItem value="relaxed">Relaxed (Only when overdue)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    How often the AI should check in on pending tasks.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="work_hours_start"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Work Start Time</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="work_hours_end"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Work End Time</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Timezone</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select timezone" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {/* Simplified list of common timezones */}
                                    <SelectItem value="UTC">UTC</SelectItem>
                                    <SelectItem value="America/New_York">New York (EST)</SelectItem>
                                    <SelectItem value="America/Los_Angeles">Los Angeles (PST)</SelectItem>
                                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                                    <SelectItem value="Asia/Singapore">Singapore (SGT)</SelectItem>
                                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                                    <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Used to calculate work hours accurately.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex flex-col gap-4 border p-4 rounded-lg bg-muted/20">
                    <FormField
                        control={form.control}
                        name="include_weekends"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg p-2">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Weekend Mode</FormLabel>
                                    <FormDescription>
                                        Enable to receive messages on Saturdays and Sundays.
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="optimize_costs"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg p-2">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Cost Optimization</FormLabel>
                                    <FormDescription>
                                        Only reply if you have messaged in the last 24 hours (Free).
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Settings
                    </Button>
                    {message && (
                        <span className={`text-sm ${message.includes('Error') ? 'text-destructive' : 'text-green-600'}`}>
                            {message}
                        </span>
                    )}
                </div>
            </form>
        </Form>
    )
}
