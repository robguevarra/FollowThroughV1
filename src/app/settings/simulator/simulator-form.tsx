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
import type { AIActionPlan } from "@/types/ai.types"

interface UserOption {
    id: string;
    name: string;
    message_handle: string | null;
}

export function SimulatorForm({ users }: { users: UserOption[] }) {
    const [selectedUser, setSelectedUser] = useState<string>(users[0]?.id || "")
    const [history, setHistory] = useState<{ role: 'user' | 'assistant' | 'system', content: string, meta?: any }[]>([])
    const [logs, setLogs] = useState<{ type: string, description: string, time: string }[]>([])
    const [input, setInput] = useState("")
    const [overrideTime, setOverrideTime] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleSend() {
        if (!selectedUser || !input.trim()) return;

        const userMsg = input;
        setInput(""); // Clear input early
        setLoading(true);

        // Add User Message to History
        setHistory(prev => [...prev, { role: 'user', content: userMsg }]);

        // Call Action
        // Filter history to only User/Assistant for context
        const contextHistory = history.filter(m => m.role !== 'system').map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

        const response = await simulateMessage(selectedUser, userMsg, overrideTime || undefined, contextHistory)

        if ('error' in response) {
            setHistory(prev => [...prev, { role: 'system', content: `Error: ${response.error}` }]);
        } else {
            const plan = response as AIActionPlan;

            // Add Assistant Reply
            if (plan.reply) {
                setHistory(prev => [...prev, { role: 'assistant', content: plan.reply!, meta: plan.classification }]);
            } else {
                setHistory(prev => [...prev, { role: 'system', content: `(No Reply: ${plan.skipReplyReason})`, meta: plan.classification }]);
            }

            // Append new logs
            const timestamp = new Date().toLocaleTimeString();
            const newLogs = plan.events.map(e => ({
                type: e.type,
                description: e.description,
                time: timestamp
            }));
            setLogs(prev => [...newLogs, ...prev]); // Newest first
        }
        setLoading(false)
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[calc(100vh-200px)] h-full">
            {/* Chat Column */}
            <Card className="flex flex-col h-full min-h-[500px] md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                    <div className="flex flex-col">
                        <CardTitle>Conversation Simulator</CardTitle>
                        <CardDescription>Chat with the Phantom Manager.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select User" />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            type="datetime-local"
                            className="w-[180px]"
                            value={overrideTime}
                            onChange={(e) => setOverrideTime(e.target.value)}
                        />
                    </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                    {history.length === 0 && (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                            Select a user and start chatting to test the AI.
                        </div>
                    )}

                    {history.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : msg.role === 'system'
                                    ? 'bg-muted text-muted-foreground text-xs font-mono'
                                    : 'bg-white border shadow-sm'
                                }`}>
                                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                                {msg.meta && msg.role !== 'user' && (
                                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <Badge variant="secondary" className="text-[10px] h-4 px-1">{msg.meta.intent}</Badge>
                                        <span>Conf: {(msg.meta.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white border shadow-sm rounded-lg p-3">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        </div>
                    )}
                </CardContent>

                <div className="p-4 border-t bg-background">
                    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="resize-none min-h-[2.5rem] max-h-32"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                        <Button type="submit" disabled={!selectedUser || !input.trim() || loading} size="icon" className="h-[auto]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                        </Button>
                    </form>
                </div>
            </Card>

            {/* Logs Column */}
            <Card className="flex flex-col h-full bg-slate-50 border-l">
                <CardHeader className="pb-3 border-b bg-white">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Autopilot Logs</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-0">
                    {logs.length === 0 ? (
                        <div className="p-8 text-center text-xs text-muted-foreground">
                            No events yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 bg-white">
                            {logs.map((log, i) => (
                                <div key={i} className="p-3 text-sm hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                        <Badge variant="outline" className={`text-[10px] h-5 px-1 ${log.type === 'inbound' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                log.type === 'outbound' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    'bg-slate-100 text-slate-600'
                                            }`}>
                                            {log.type.toUpperCase()}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground">{log.time}</span>
                                    </div>
                                    <div className="text-slate-700 leading-tight">
                                        {log.description}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
