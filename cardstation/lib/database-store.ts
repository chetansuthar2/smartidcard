"use client"

import { supabase } from "./supabase"
import type { Database } from "./supabase"
import clientPromise from "./mongodb"
import { apiClient } from "./api-client"

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
}

// Local storage keys
const STUDENTS_KEY = "smart_id_students"
const ENTRIES_KEY = "smart_id_entries"

class DatabaseStore {
  private isSupabaseAvailable(): boolean {
    return false // Force use API client for cardstation
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
      if (!data) {
        // Return sample student for testing
        const sampleStudent: StudentWithDates = {
          id: "STU_001",
          application_number: "APP20254105",
          name: "Test Student",
          phone: "9772348371",
          email: "test@example.com",
          class: "12th",
          department: "Science",
          schedule: "Morning",
          image_url: "/placeholder-user.jpg",
          createdAt: new Date(),
          updatedAt: new Date()
        }
        console.log("📝 Using sample student for testing:", sampleStudent.name);
        return [sampleStudent]
      }

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
      // Try smartidcard API first (deployed or local)
      const apiUrl = process.env.NEXT_PUBLIC_SMARTIDCARD_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/students`);
      if (res.ok) {
        const data = await res.json();
        console.log("✅ Students loaded from smartidcard API:", data.length);
        return data.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt || s.created_at || new Date()),
          updatedAt: new Date(s.updatedAt || s.updated_at || new Date()),
        }));
      } else {
        throw new Error("Smartidcard API failed");
      }
    } catch (error) {
      console.warn("⚠️ Smartidcard API not available, using localStorage fallback");
      // Fallback to localStorage
      const localStudents = this.loadStudentsFromLocal();
      console.log("✅ Students loaded from localStorage:", localStudents.length);
      return localStudents;
    }
  }

  async getStudentByAppNumber(appNumber: string): Promise<StudentWithDates | null> {
    try {
      // Try smartidcard API first (deployed or local)
      const apiUrl = process.env.NEXT_PUBLIC_SMARTIDCARD_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/students?application_number=${encodeURIComponent(appNumber)}`);
      if (res.ok) {
        const data = await res.json();
        if (!data || data.length === 0) return null;
        const s = data[0];
        console.log("✅ Student found via smartidcard API:", s.name);
        return {
          ...s,
          createdAt: new Date(s.createdAt || s.created_at || new Date()),
          updatedAt: new Date(s.updatedAt || s.updated_at || new Date()),
        };
      } else {
        throw new Error("Smartidcard API failed");
      }
    } catch (error) {
      console.warn("⚠️ Smartidcard API not available, using localStorage fallback");
      // Fallback to localStorage
      const localStudents = this.loadStudentsFromLocal();
      const student = localStudents.find(s => s.application_number === appNumber);
      if (student) {
        console.log("✅ Student found via localStorage:", student.name);
      } else {
        console.log("❌ Student not found in localStorage");
      }
      return student || null;
    }
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
    const res = await fetch("/api/students", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) throw new Error("Failed to update student");
    const data = await res.json();
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  }

  async deleteStudent(id: string): Promise<boolean> {
    const res = await fetch("/api/students", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error("Failed to delete student");
    return true;
  }

  // Entry Log Management - Using API route for better reliability
  async addEntry(studentId: string, applicationNumber: string, studentName: string): Promise<EntryLogWithDates> {
    try {
      const entryData = {
        student_id: studentId,
        application_number: applicationNumber,
        student_name: studentName,
        verification_method: "qr_and_face",
        qr_validated: true,
        verification_timestamp: new Date().toISOString(),
        station_id: "main_entrance"
      };

      console.log("Sending entry data to API:", entryData);

      try {
        // Try smartidcard API first (deployed or local)
        const apiUrl = process.env.NEXT_PUBLIC_SMARTIDCARD_API_URL || "http://localhost:3001";
        const res = await fetch(`${apiUrl}/api/entries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entryData),
        });

        if (res.ok) {
          const data = await res.json();
          console.log("✅ Entry recorded via API:", data);
          return {
            ...data,
            entryTime: new Date(data.entry_time),
            exitTime: data.exit_time ? new Date(data.exit_time) : undefined,
            createdAt: new Date(data.created_at || data.entry_time),
            updatedAt: new Date(data.updated_at || data.entry_time)
          };
        } else {
          throw new Error("API failed");
        }
      } catch (apiError) {
        console.warn("⚠️ API not available, using localStorage fallback");

        // Fallback to localStorage
        const existingEntries = this.loadEntriesFromLocal();

        // Check if student already has entry today without exit
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayEntry = existingEntries.find(entry =>
          entry.student_id === studentId &&
          entry.entryTime >= today &&
          entry.entryTime < tomorrow &&
          !entry.exitTime
        );

        const now = new Date();
        const entryId = `entry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        let newEntry: EntryLogWithDates;

        if (todayEntry) {
          // This is an exit
          todayEntry.exitTime = now;
          todayEntry.status = "exit";

          // Update existing entry
          const updatedEntries = existingEntries.map(entry =>
            entry.id === todayEntry.id ? todayEntry : entry
          );
          this.saveEntriesToLocal(updatedEntries);

          newEntry = todayEntry;
          console.log("✅ EXIT recorded via localStorage:", newEntry);
        } else {
          // This is an entry
          newEntry = {
            id: entryId,
            student_id: studentId,
            application_number: applicationNumber,
            student_name: studentName,
            entryTime: now,
            exitTime: undefined,
            status: "entry",
            verified: true,
            createdAt: now
          } as EntryLogWithDates;

          existingEntries.push(newEntry);
          this.saveEntriesToLocal(existingEntries);
          console.log("✅ ENTRY recorded via localStorage:", newEntry);
        }

        return newEntry;
      }
    } catch (error) {
      console.error("❌ Error adding entry:", error);
      throw error;
    }
  }


  async getStudentEntries(studentId: string): Promise<EntryLogWithDates[]> {
    try {
      // Use API route which handles both MongoDB and fallback
      const res = await fetch(`/api/entries?student_id=${encodeURIComponent(studentId)}`);
      if (!res.ok) {
        console.error("Failed to fetch entries from API");
        return [];
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
      console.error("Error fetching student entries:", error);
      return [];
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
        throw new Error("API failed");
      }
    } catch (error) {
      console.warn("⚠️ API not available, using localStorage fallback");
      // Fallback to localStorage
      const localEntries = this.loadEntriesFromLocal();
      console.log("✅ Entries loaded from localStorage:", localEntries.length);
      return localEntries;
    }
  }

  async getTodayEntries(): Promise<EntryLogWithDates[]> {
    try {
      // Get all entries and filter for today
      const allEntries = await this.getAllEntries();
      const today = new Date().toDateString();
      return allEntries.filter((e) => e.entryTime.toDateString() === today);
    } catch (error) {
      console.error("Error fetching today entries:", error);
      return [];
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
  getStorageInfo(): { mode: string; studentsCount: number; entriesCount: number } {
  return {
    mode: "Cloud",
    studentsCount: 0,
    entriesCount: 0,
  }
}
}

export const dbStore = new DatabaseStore()
export type { StudentWithDates as Student, EntryLogWithDates as EntryLog }
 