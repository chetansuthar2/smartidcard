import { createClient } from "@supabase/supabase-js"

// Check if we're in a browser environment and have the required env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Create a fallback client that won't break during build
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export type Database = {
  public: {
    Tables: {
      students: {
        Row: {
          id: string
          application_number: string
          name: string
          phone: string
          email: string | null
          class: string
          department: string | null
          schedule: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_number: string
          name: string
          phone: string
          email?: string | null
          class: string
          department?: string | null
          schedule?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_number?: string
          name?: string
          phone?: string
          email?: string | null
          class?: string
          department?: string | null
          schedule?: string | null
          image_url?: string | null
          updated_at?: string
        }
      }
      entry_logs: {
        Row: {
          id: string
          student_id: string
          application_number: string
          student_name: string
          entry_time: string
          exit_time: string | null
          status: "entry" | "exit"
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          application_number: string
          student_name: string
          entry_time?: string
          exit_time?: string | null
          status: "entry" | "exit"
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          application_number?: string
          student_name?: string
          entry_time?: string
          exit_time?: string | null
          status?: "entry" | "exit"
          verified?: boolean
        }
      }
      admin_users: {
        Row: {
          id: string
          username: string
          email: string
          password_hash: string
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          email: string
          password_hash: string
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          password_hash?: string
        }
      }
    }
  }
}
