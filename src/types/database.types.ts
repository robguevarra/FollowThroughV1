export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "13.0.5"
    }
    public: {
        Tables: {
            ai_settings: {
                Row: {
                    created_at: string | null
                    followup_frequency: Database["public"]["Enums"]["ai_frequency"] | null
                    include_weekends: boolean | null
                    last_active_at: string | null
                    optimize_costs: boolean | null
                    personality: Database["public"]["Enums"]["ai_personality"] | null
                    timezone: string | null
                    updated_at: string | null
                    user_id: string
                    work_hours_end: string | null
                    work_hours_start: string | null
                }
                Insert: {
                    created_at?: string | null
                    followup_frequency?:
                    | Database["public"]["Enums"]["ai_frequency"]
                    | null
                    include_weekends?: boolean | null
                    last_active_at?: string | null
                    optimize_costs?: boolean | null
                    personality?: Database["public"]["Enums"]["ai_personality"] | null
                    timezone?: string | null
                    updated_at?: string | null
                    user_id: string
                    work_hours_end?: string | null
                    work_hours_start?: string | null
                }
                Update: {
                    created_at?: string | null
                    followup_frequency?:
                    | Database["public"]["Enums"]["ai_frequency"]
                    | null
                    include_weekends?: boolean | null
                    last_active_at?: string | null
                    optimize_costs?: boolean | null
                    personality?: Database["public"]["Enums"]["ai_personality"] | null
                    timezone?: string | null
                    updated_at?: string | null
                    user_id?: string
                    work_hours_end?: string | null
                    work_hours_start?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "ai_settings_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            audit_logs: {
                Row: {
                    action: string
                    created_at: string | null
                    details: Json | null
                    id: string
                    task_id: string | null
                }
                Insert: {
                    action: string
                    created_at?: string | null
                    details?: Json | null
                    id?: string
                    task_id?: string | null
                }
                Update: {
                    action?: string
                    created_at?: string | null
                    details?: Json | null
                    id?: string
                    task_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "audit_logs_task_id_fkey"
                        columns: ["task_id"]
                        isOneToOne: false
                        referencedRelation: "tasks"
                        referencedColumns: ["id"]
                    },
                ]
            }
            messages: {
                Row: {
                    content: string
                    created_at: string | null
                    direction: Database["public"]["Enums"]["message_direction"]
                    id: string
                    status: string | null
                    task_id: string | null
                    user_id: string | null
                }
                Insert: {
                    content: string
                    created_at?: string | null
                    direction: Database["public"]["Enums"]["message_direction"]
                    id?: string
                    status?: string | null
                    task_id?: string | null
                    user_id?: string | null
                }
                Update: {
                    content?: string
                    created_at?: string | null
                    direction?: Database["public"]["Enums"]["message_direction"]
                    id?: string
                    status?: string | null
                    task_id?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "messages_task_id_fkey"
                        columns: ["task_id"]
                        isOneToOne: false
                        referencedRelation: "tasks"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "messages_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            tasks: {
                Row: {
                    assignee_id: string
                    blocker_reason: string | null
                    created_at: string | null
                    creator_id: string
                    deadline: string
                    description: string | null
                    id: string
                    status: Database["public"]["Enums"]["task_status"]
                    team_id: string | null
                    title: string
                    updated_at: string | null
                }
                Insert: {
                    assignee_id: string
                    blocker_reason?: string | null
                    created_at?: string | null
                    creator_id: string
                    deadline: string
                    description?: string | null
                    id?: string
                    status?: Database["public"]["Enums"]["task_status"]
                    team_id?: string | null
                    title: string
                    updated_at?: string | null
                }
                Update: {
                    assignee_id?: string
                    blocker_reason?: string | null
                    created_at?: string | null
                    creator_id?: string
                    deadline?: string
                    description?: string | null
                    id?: string
                    status?: Database["public"]["Enums"]["task_status"]
                    team_id?: string | null
                    title?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "tasks_assignee_id_fkey"
                        columns: ["assignee_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "tasks_creator_id_fkey"
                        columns: ["creator_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "tasks_team_id_fkey"
                        columns: ["team_id"]
                        isOneToOne: false
                        referencedRelation: "teams"
                        referencedColumns: ["id"]
                    },
                ]
            }
            teams: {
                Row: {
                    created_at: string | null
                    id: string
                    name: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    name: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    name?: string
                }
                Relationships: []
            }
            users: {
                Row: {
                    auth_id: string | null
                    created_at: string | null
                    email: string | null
                    id: string
                    message_handle: string | null
                    name: string
                    role: Database["public"]["Enums"]["user_role"]
                    team_id: string | null
                }
                Insert: {
                    auth_id?: string | null
                    created_at?: string | null
                    email?: string | null
                    id?: string
                    message_handle?: string | null
                    name: string
                    role?: Database["public"]["Enums"]["user_role"]
                    team_id?: string | null
                }
                Update: {
                    auth_id?: string | null
                    created_at?: string | null
                    email?: string | null
                    id?: string
                    message_handle?: string | null
                    name?: string
                    role?: Database["public"]["Enums"]["user_role"]
                    team_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "users_auth_id_fkey"
                        columns: ["auth_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "users_team_id_fkey"
                        columns: ["team_id"]
                        isOneToOne: false
                        referencedRelation: "teams"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            ai_frequency: "aggressive" | "balanced" | "relaxed"
            ai_personality: "professional" | "friendly" | "strict"
            message_direction: "inbound" | "outbound"
            task_status:
            | "pending"
            | "confirmed"
            | "blocked"
            | "at_risk"
            | "completed"
            user_role: "admin" | "leader" | "staff"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// Simplified Helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
