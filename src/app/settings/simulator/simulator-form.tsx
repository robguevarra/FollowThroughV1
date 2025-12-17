'use client'

import { useState } from "react"
import { simulateMessage } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import type { AIActionPlan } from "@/lib/ai/engine"

interface UserOption {
    id: string;
    name: string;
    message_handle: string | null;
}

export function SimulatorForm({ users }: { users: UserOption[] }) {
    const [selectedUser, setSelectedUser] = useState<string>(users[0]?.id || "")
    const [message, setMessage] = useState("")
    const [overrideTime, setOverrideTime] = useState("")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<AIActionPlan | null>(null)
    const [error, setError] = useState<string | null>(null)

    async function handleSimulate() {
        if (!selectedUser) return;
        setLoading(true)
        setResult(null)
        setError(null)

        // Ensure overrideTime is full ISO if possible, or handle in action
        // Input type="datetime-local" returns "YYYY-MM-DDTHH:mm"
        const response = await simulateMessage(selectedUser, message, overrideTime || undefined)

        if ('error' in response) {
            setError(response.error as string)
        } else {
            setResult(response as AIActionPlan)
        }
        setLoading(false)
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Simulation Inputs</CardTitle>
                        <CardDescription>Mock an incoming WhatsApp message.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select User</label>
                            <Select value={selectedUser} onValueChange={setSelectedUser}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a user" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map(u => (
                                        <SelectItem key={u.id} value={u.id}>
                                            {u.name} ({u.message_handle || 'No Phone'})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Message Content</label>
                            <Textarea
                                placeholder="I'm stuck on the report..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Time Override (Optional)</label>
                            <Input
                                type="datetime-local"
                                value={overrideTime}
                                onChange={(e) => setOverrideTime(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Leave blank to use current server time.
                            </p>
                        </div>

                        <Button onClick={handleSimulate} disabled={loading || !selectedUser || !message} className="w-full">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simulate Webhook
                        </Button>

                        {error && (
                            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                                {error}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>AI Decision Analysis</CardTitle>
                        <CardDescription>What the AI would do.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {result ? (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-medium mb-2">Intent Classification</h3>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-lg">
                                            {result.classification.intent}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            (Confidence: {Math.round(result.classification.confidence * 100)}%)
                                        </span>
                                    </div>
                                    {result.classification.reason && (
                                        <p className="text-sm mt-1 bg-muted p-2 rounded">
                                            {result.classification.reason}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium mb-2 text-green-600">Generated Reply</h3>
                                    {result.reply ? (
                                        <div className="bg-green-50 p-3 rounded-md border border-green-200 text-sm">
                                            {result.reply}
                                        </div>
                                    ) : (
                                        <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 text-sm text-yellow-800">
                                            No reply generated.
                                            {result.skipReplyReason && <div className="font-bold mt-1">Reason: {result.skipReplyReason}</div>}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium mb-2 text-blue-600">Database Updates</h3>
                                    {result.dbUpdates.length > 0 ? (
                                        <ul className="space-y-2">
                                            {result.dbUpdates.map((update, i) => (
                                                <li key={i} className="text-xs font-mono bg-slate-100 p-2 rounded border">
                                                    UPDATE {update.table} SET {JSON.stringify(update.data)} WHERE ID = {update.id}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <span className="text-sm text-muted-foreground italic">No structure changes.</span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                                <Loader2 className="h-8 w-8 mb-2 opacity-20" />
                                <p>Run a simulation to see results.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
