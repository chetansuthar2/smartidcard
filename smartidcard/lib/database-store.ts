"use client"

import { supabase } from "./supabase"
import type { Database } from "./supabase"
import clientPromise from "./mongodb"

type Student = Database["public"]["Tables"]["students"]["Row"]
type StudentInsert = Database["public"]["Tables"]["students"]["Insert"]
type StudentUpdate = Database["public"]["Tables"]["students"]["Update"]
type EntryLog = Database["public"]["Tables"]["entry_logs"]["Row"]
type EntryLogInsert = Database["public"]["Tables"]["entry_logs"]["Insert"]

export interface StudentWithDates extends Omit<Student, "created_at" | "updated_at"> {
  createdAt: Date
  updatedAt: Date
}

export interface EntryLogWithDates extends Omit<EntryLog, "entry_time" | "exit_time" | "created_at"> {
  entryTime: Date
  exitTime?: Date
  createdAt: Date
  face_match_score?: number | null
}

// Local storage keys
const STUDENTS_KEY = "smart_id_students"
const ENTRIES_KEY = "smart_id_entries"

class DatabaseStore {
  private isSupabaseAvailable(): boolean {
    return false // Force use API routes for deployment
  }

  private isLocalStorageAvailable(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  }

  // Local Storage Methods
  private saveStudentsToLocal(students: StudentWithDates[]): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(students))
    }
  }

  private loadStudentsFromLocal(): StudentWithDates[] {
    if (!this.isLocalStorageAvailable()) return []

    try {
      const data = localStorage.getItem(STUDENTS_KEY)
      if (!data) return []

      const students = JSON.parse(data)
      return students.map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      }))
    } catch (error) {
      console.error("Error loading students from localStorage:", error)
      return []
    }
  }

  private saveEntriesToLocal(entries: EntryLogWithDates[]): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries))
    }
  }

  private loadEntriesFromLocal(): EntryLogWithDates[] {
    if (!this.isLocalStorageAvailable()) return []

    try {
      const data = localStorage.getItem(ENTRIES_KEY)
      if (!data) return []

      const entries = JSON.parse(data)
      return entries.map((e: any) => ({
        ...e,
        entryTime: new Date(e.entryTime),
        exitTime: e.exitTime ? new Date(e.exitTime) : undefined,
        createdAt: new Date(e.createdAt),
      }))
    } catch (error) {
      console.error("Error loading entries from localStorage:", error)
      return []
    }
  }

  // Student Management
  async addStudent(student: Omit<StudentInsert, "id" | "created_at" | "updated_at">): Promise<StudentWithDates> {
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(student),
    });
    if (!res.ok) throw new Error("Failed to add student");
    const data = await res.json();
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  }

  async getStudents(): Promise<StudentWithDates[]> {
    try {
      const res = await fetch("/api/students");
      if (!res.ok) {
        console.warn("⚠️ Students API not available, using localStorage fallback");
        return this.loadStudentsFromLocal();
      }
      const data = await res.json();
      return data.map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      }));
    } catch (error) {
      console.warn("⚠️ Students API error, using localStorage fallback:", error);
      return this.loadStudentsFromLocal();
    }
  }

  async getStudentByAppNumber(appNumber: string): Promise<StudentWithDates | null> {
    const res = await fetch(`/api/students?application_number=${encodeURIComponent(appNumber)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;
    const s = data[0];
    return {
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
    };
  }

  async getStudentByAppAndPhone(appNumber: string, phone: string): Promise<StudentWithDates | null> {
    const url = `/api/students?application_number=${encodeURIComponent(appNumber)}&phone=${encodeURIComponent(phone)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;
    const s = data[0];
    return {
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
    };
  }

  async updateStudent(id: string, updates: StudentUpdate): Promise<StudentWithDates | null> {
    try {
      console.log("📝 Updating student:", id, "with updates:", updates)

      const res = await fetch("/api/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error("❌ Update student API error:", res.status, errorData)
        throw new Error(`Failed to update student: ${res.status} - ${errorData.error || res.statusText}`)
      }

      const data = await res.json();
      console.log("✅ Student updated successfully:", data.id)

      return {
        ...data,
        createdAt: new Date(data.createdAt || data.created_at || Date.now()),
        updatedAt: new Date(data.updatedAt || data.updated_at || Date.now()),
      };
    } catch (error) {
      console.error("❌ Error in updateStudent:", error)
      throw error
    }
  }

  async deleteStudent(id: string): Promise<boolean> {
    try {
      console.log("🗑️ Deleting student with ID:", id)
      const res = await fetch("/api/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("❌ Delete API error:", res.status, errorData);
        throw new Error(`Failed to delete student: ${errorData.error || res.statusText}`);
      }

      const result = await res.json();
      console.log("✅ Student deleted successfully:", result);
      return true;
    } catch (error) {
      console.error("❌ Error in deleteStudent:", error);
      throw error;
    }
  }

  // Entry Log Management
  async addEntry(studentId: string, applicationNumber: string, studentName: string): Promise<EntryLogWithDates> {
    if (this.isSupabaseAvailable() && supabase) {
      // Use Supabase
      const { data: existingEntry } = await supabase
        .from("entry_logs")
        .select("*")
        .eq("student_id", studentId)
        .is("exit_time", null)
        .order("entry_time", { ascending: false })
        .limit(1)
        .single()

      if (existingEntry) {
        // Student is inside, update existing record with exit time
        const { data, error } = await supabase
          .from("entry_logs")
          .update({
            exit_time: new Date().toISOString(),
          })
          .eq("id", existingEntry.id)
          .select()
          .single()

        if (error) {
          console.error("Error updating entry with exit time:", error)
          throw new Error("Failed to record exit")
        }

        return this.convertEntryLogDates(data)
      } else {
        // New entry
        const { data, error } = await supabase
          .from("entry_logs")
          .insert({
            student_id: studentId,
            application_number: applicationNumber,
            student_name: studentName,
            status: "entry",
            verified: true,
            entry_time: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) {
          console.error("Error adding entry:", error)
          throw new Error("Failed to record entry")
        }

        return this.convertEntryLogDates(data)
      }
    } else {
      // Use localStorage
      const entries = this.loadEntriesFromLocal()

      // Check if student is already inside
      const existingEntry = entries.find((e) => e.student_id === studentId && !e.exitTime)

      if (existingEntry) {
        // Student is inside, update existing entry with exit time
        existingEntry.exitTime = new Date()
        this.saveEntriesToLocal(entries)
        return existingEntry
      } else {
        // New entry
        const newEntry: EntryLogWithDates = {
          id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          student_id: studentId,
          application_number: applicationNumber,
          student_name: studentName,
          entryTime: new Date(),
          status: "entry",
          verified: true,
          createdAt: new Date(),
        }

        entries.unshift(newEntry)
        this.saveEntriesToLocal(entries)
        return newEntry
      }
    }
  }

  async getStudentEntries(studentId: string): Promise<EntryLogWithDates[]> {
    if (this.isSupabaseAvailable() && supabase) {
      // Use Supabase
      const { data, error } = await supabase
        .from("entry_logs")
        .select("*")
        .eq("student_id", studentId)
        .order("entry_time", { ascending: false })

      if (error) {
        console.error("Error fetching student entries:", error)
        return []
      }

      return data.map(this.convertEntryLogDates)
    } else {
      // Use localStorage
      const entries = this.loadEntriesFromLocal()
      return entries.filter((e) => e.student_id === studentId)
    }
  }

  async getAllEntries(): Promise<EntryLogWithDates[]> {
    try {
      // Try API first
      const res = await fetch('/api/entries');
      if (res.ok) {
        const data = await res.json();
        console.log("✅ Entries loaded from API:", data.length);
        return data.map((e: any) => ({
          ...e,
          entryTime: new Date(e.entry_time),
          exitTime: e.exit_time ? new Date(e.exit_time) : undefined,
          createdAt: new Date(e.created_at || e.entry_time),
          updatedAt: new Date(e.updated_at || e.entry_time)
        }));
      } else {
        console.warn("⚠️ Entries API not available, using fallback");
        throw new Error("API failed");
      }
    } catch (error) {
      console.warn("⚠️ Entries API error, using fallback:", error);

      if (this.isSupabaseAvailable() && supabase) {
        // Use Supabase
        const { data, error } = await supabase.from("entry_logs").select("*").order("entry_time", { ascending: false })

        if (error) {
          console.error("Error fetching entries:", error)
          return this.loadEntriesFromLocal()
        }

        return data.map(this.convertEntryLogDates)
      } else {
        // Use localStorage
        return this.loadEntriesFromLocal()
      }
    }
  }

  async getTodayEntries(): Promise<EntryLogWithDates[]> {
    if (this.isSupabaseAvailable() && supabase) {
      // Use Supabase
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const { data, error } = await supabase
        .from("entry_logs")
        .select("*")
        .gte("entry_time", today.toISOString())
        .lt("entry_time", tomorrow.toISOString())
        .order("entry_time", { ascending: false })

      if (error) {
        console.error("Error fetching today entries:", error)
        return []
      }

      return data.map(this.convertEntryLogDates)
    } else {
      // Use localStorage
      const entries = this.loadEntriesFromLocal()
      const today = new Date().toDateString()
      return entries.filter((e) => e.entryTime.toDateString() === today)
    }
  }

  async getEntriesByDate(date: string): Promise<EntryLogWithDates[]> {
    try {
      // Use API route which handles MongoDB
      const res = await fetch(`/api/entries?date=${encodeURIComponent(date)}`);
      if (!res.ok) {
        console.warn("⚠️ Entries API not available, using localStorage fallback");
        // Fallback to localStorage
        const entries = this.loadEntriesFromLocal()
        const targetDate = new Date(date).toDateString()
        return entries.filter((e) => e.entryTime.toDateString() === targetDate)
      }

      const data = await res.json();
      return data.map((e: any) => ({
        ...e,
        entryTime: new Date(e.entry_time),
        exitTime: e.exit_time ? new Date(e.exit_time) : undefined,
        createdAt: new Date(e.created_at || e.entry_time),
        updatedAt: new Date(e.updated_at || e.entry_time)
      }));
    } catch (error) {
      console.error("Error fetching entries by date:", error);
      // Fallback to localStorage
      const entries = this.loadEntriesFromLocal()
      const targetDate = new Date(date).toDateString()
      return entries.filter((e) => e.entryTime.toDateString() === targetDate)
    }
  }

  async recordEntry(entryData: {
    student_id: string
    student_name: string
    application_number: string
    status: 'entry' | 'exit'
    face_match_score?: number
    entryTime: Date
  }): Promise<EntryLogWithDates> {
    if (this.isSupabaseAvailable() && supabase) {
      // Use Supabase
      const { data, error } = await supabase
        .from("entry_logs")
        .insert({
          student_id: entryData.student_id,
          student_name: entryData.student_name,
          application_number: entryData.application_number,
          status: entryData.status,
          face_match_score: entryData.face_match_score,
          entry_time: entryData.entryTime.toISOString(),
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to record entry: ${error.message}`)
      }

      return this.convertEntryLogDates(data)
    } else {
      // Use localStorage
      const entries = this.loadEntriesFromLocal()
      const newEntry: EntryLogWithDates = {
        id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        student_id: entryData.student_id,
        student_name: entryData.student_name,
        application_number: entryData.application_number,
        status: entryData.status,
        verified: true,
        face_match_score: entryData.face_match_score || null,
        entryTime: entryData.entryTime,
        exitTime: undefined,
        createdAt: new Date(),
      }

      entries.unshift(newEntry)
      this.saveEntriesToLocal(entries)
      return newEntry
    }
  }

  async deleteEntry(id: string): Promise<void> {
    if (this.isSupabaseAvailable() && supabase) {
      // Use Supabase
      const { error } = await supabase.from("entry_logs").delete().eq("id", id)

      if (error) {
        throw new Error(`Failed to delete entry: ${error.message}`)
      }
    } else {
      // Use localStorage
      const entries = this.loadEntriesFromLocal()
      const filteredEntries = entries.filter((e) => e.id !== id)
      this.saveEntriesToLocal(filteredEntries)
    }
  }

  async deleteAllStudentEntries(studentId: string): Promise<number> {
    try {
      // Try API first (MongoDB)
      const res = await fetch(`/api/entries?student_id=${encodeURIComponent(studentId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        const result = await res.json();
        console.log(`✅ Deleted ${result.deletedCount || 0} entries via API for student ${studentId}`);
        return result.deletedCount || 0;
      } else {
        throw new Error("API delete failed");
      }
    } catch (apiError) {
      console.warn("⚠️ API not available, using fallback methods");

      if (this.isSupabaseAvailable() && supabase) {
        // Use Supabase
        const { data, error } = await supabase
          .from("entry_logs")
          .delete()
          .eq("student_id", studentId)
          .select("id")

        if (error) {
          throw new Error(`Failed to delete student entries: ${error.message}`)
        }

        return data?.length || 0
      } else {
        // Use localStorage
        const entries = this.loadEntriesFromLocal()
        const studentEntries = entries.filter((e) => e.student_id === studentId)
        const filteredEntries = entries.filter((e) => e.student_id !== studentId)
        this.saveEntriesToLocal(filteredEntries)
        return studentEntries.length
      }
    }
  }

  // Admin Authentication
  async authenticateAdmin(username: string, password: string): Promise<boolean> {
    if (this.isSupabaseAvailable() && supabase) {
      // Use Supabase
      const { data, error } = await supabase.from("admin_users").select("*").eq("username", username).single()

      if (error || !data) {
        return false
      }

      // Simple password check (in production, use proper hashing)
      return password === "admin123"
    } else {
      // Fallback authentication for demo
      return username === "admin" && password === "admin123"
    }
  }

  // Utility functions
  generateApplicationNumber(): string {
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")
    return `APP${year}${random}`
  }

  private convertStudentDates(student: Student): StudentWithDates {
    return {
      ...student,
      createdAt: new Date(student.created_at),
      updatedAt: new Date(student.updated_at),
    }
  }

  private convertEntryLogDates(entry: EntryLog): EntryLogWithDates {
    return {
      ...entry,
      entryTime: new Date(entry.entry_time),
      exitTime: entry.exit_time ? new Date(entry.exit_time) : undefined,
      createdAt: new Date(entry.created_at),
    }
  }

  // Clear all local data (for testing)
  clearLocalData(): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.removeItem(STUDENTS_KEY)
      localStorage.removeItem(ENTRIES_KEY)
    }
  }

  // Get storage info
  async getStorageInfo(): Promise<{ mode: string; studentsCount: number; entriesCount: number }> {
    // Try API first
    try {
      const studentsRes = await fetch("/api/students");
      const entriesRes = await fetch("/api/entries");
      if (studentsRes.ok && entriesRes.ok) {
        const students = await studentsRes.json();
        const entries = await entriesRes.json();
        return {
          mode: "Cloud",
          studentsCount: students.length,
          entriesCount: entries.length,
        };
      }
    } catch (e) {
      // ignore
    }
    // Fallback to localStorage
    const localStudents = this.loadStudentsFromLocal ? this.loadStudentsFromLocal() : [];
    const localEntries = this.loadEntriesFromLocal ? this.loadEntriesFromLocal() : [];
    return {
      mode: "Local",
      studentsCount: localStudents.length,
      entriesCount: localEntries.length,
    };
  }
}

export const dbStore = new DatabaseStore()
export type { StudentWithDates as Student, EntryLogWithDates as EntryLog }
 