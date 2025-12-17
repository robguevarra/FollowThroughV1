
'use client';

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { registerPhone } from "./actions";
import { checkPhoneNumbers } from "./debug-actions";

export default function SeedUserPage() {
    const [phone, setPhone] = useState("");
    const [name, setName] = useState("Admin User");
    const [status, setStatus] = useState("");

    // Registration State
    const [pin, setPin] = useState("");
    const [regStatus, setRegStatus] = useState("");

    // Debug State
    const [debugResult, setDebugResult] = useState<any>(null);

    const handleSeed = async () => {
        setStatus("Saving...");
        const supabase = createClient();

        try {
            // Check if phone already exists
            const { data: existing } = await supabase.from('users').select('id').eq('message_handle', phone).single();

            if (existing) {
                setStatus(`User with phone ${phone} already exists (ID: ${existing.id}). Updated name.`);
                await supabase.from('users').update({ name, role: 'admin' }).eq('id', existing.id);
            } else {
                const { data, error } = await supabase.from('users').insert({
                    name,
                    message_handle: phone,
                    role: 'admin',
                    email: 'admin@example.com'
                }).select().single();

                if (error) throw error;
                setStatus(`User created! ID: ${data.id}`);
            }
        } catch (err: any) {
            setStatus("Error: " + err.message);
        }
    };

    const handleRegister = async () => {
        if (pin.length !== 6) {
            setRegStatus("PIN must be 6 digits");
            return;
        }
        setRegStatus("Registering...");
        const result = await registerPhone(pin);
        if (result.success) {
            setRegStatus("SUCCESS: Phone Number Registered!");
        } else {
            setRegStatus("Error: " + result.error);
        }
    };

    const handleDebug = async () => {
        setDebugResult("Checking...");
        const result = await checkPhoneNumbers();
        setDebugResult(result);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
            <div className="space-y-6 w-full max-w-[400px]">
                {/* 1. SEED USER CARD */}
                <Card>
                    <CardHeader>
                        <CardTitle>1. Seed Test User</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>WhatsApp Number (No +)</Label>
                            <Input
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="e.g. 639123456789"
                            />
                            <p className="text-xs text-muted-foreground">This number will receive test messages.</p>
                        </div>
                        <Button onClick={handleSeed} className="w-full">Save User</Button>
                        {status && <div className="p-2 bg-yellow-100 rounded text-sm">{status}</div>}
                    </CardContent>
                </Card>

                {/* 2. REGISTER PHONE CARD */}
                <Card>
                    <CardHeader>
                        <CardTitle>2. Register Phone Number</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Required if you get "Object does not exist" errors.
                        </p>
                        <div className="space-y-2">
                            <Label>6-Digit PIN</Label>
                            <Input
                                value={pin}
                                onChange={e => setPin(e.target.value)}
                                placeholder="123456"
                                maxLength={6}
                            />
                            <p className="text-xs text-muted-foreground">
                                If you don't have one, enter a new 6-digit PIN to set it.
                            </p>
                        </div>
                        <Button onClick={handleRegister} variant="secondary" className="w-full">
                            Register with WhatsApp API
                        </Button>
                        {regStatus && <div className={`p-2 rounded text-sm ${regStatus.includes('SUCCESS') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {regStatus}
                        </div>}
                    </CardContent>
                </Card>

                {/* 3. DEBUGGER CARD */}
                <Card>
                    <CardHeader>
                        <CardTitle>3. Debug Credentials</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            If you used a Business Account ID instead of Phone ID, this tool will try to find your real phone ID.
                        </p>
                        <Button onClick={handleDebug} variant="outline" className="w-full">
                            Check Phone Numbers
                        </Button>
                        {debugResult && (
                            <pre className="p-2 bg-slate-900 text-white rounded text-xs overflow-auto max-h-[200px] whitespace-pre-wrap break-all">
                                {typeof debugResult === 'string' ? debugResult : JSON.stringify(debugResult, null, 2)}
                            </pre>
                        )}

                        <div className="pt-4 border-t">
                            <Label>WABA ID (For Subscription)</Label>
                            <div className="flex gap-2 mt-1">
                                <Input defaultValue="1587638782393579" id="waba-id-input" />
                                <Button onClick={async () => {
                                    const wabaId = (document.getElementById('waba-id-input') as HTMLInputElement).value;
                                    setDebugResult("Subscribing...");
                                    const res = await import('./debug-actions').then(m => m.subscribeWaba(wabaId));
                                    setDebugResult(res);
                                }} variant="secondary">
                                    Subscribe App
                                </Button>
                                <Button onClick={async () => {
                                    const wabaId = (document.getElementById('waba-id-input') as HTMLInputElement).value;
                                    setDebugResult("Verifying...");
                                    const res = await import('./debug-actions').then(m => m.checkSubscribedApps(wabaId));
                                    setDebugResult(res);
                                }} variant="outline">
                                    Verify Sub
                                </Button>
                            </div>
                            <div className="mt-2">
                                <Button onClick={async () => {
                                    setDebugResult("Checking Token...");
                                    const res = await import('./debug-actions').then(m => m.checkTokenPermissions());
                                    setDebugResult(res);
                                }} variant="ghost" size="sm" className="w-full text-xs">
                                    Check Token Scopes
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Fixes "Webhook works but replies don't arrive".
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
