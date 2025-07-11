"use client"

export interface Student {
  id: string
  applicationNumber: string
  name: string
  phone: string
  email: string
  class: string
  department: string
  schedule: string
  image: string
  createdAt: Date
}

export interface EntryLog {
  id: string
  studentId: string
  applicationNumber: string
  studentName: string
  entryTime: Date
  exitTime?: Date
  status: "entry" | "exit"
  verified: boolean
}

class Store {
  private students: Student[] = []
  private entryLogs: EntryLog[] = []
  private currentEntries: Map<string, EntryLog> = new Map()

  // Student Management
  addStudent(student: Omit<Student, "id" | "createdAt">): Student {
    const newStudent: Student = {
      ...student,
      id: `STU_${Date.now()}`,
      createdAt: new Date(),
    }
    this.students.push(newStudent)
    this.saveToLocalStorage()
    return newStudent
  }

  getStudents(): Student[] {
    this.loadFromLocalStorage()
    return [...this.students]
  }

  getStudentByAppNumber(appNumber: string): Student | undefined {
    this.loadFromLocalStorage()
    return this.students.find((s) => s.applicationNumber === appNumber)
  }

  getStudentByAppAndPhone(appNumber: string, phone: string): Student | undefined {
    this.loadFromLocalStorage()
    return this.students.find((s) => s.applicationNumber === appNumber && s.phone === phone)
  }

  updateStudent(id: string, updates: Partial<Student>): Student | null {
    this.loadFromLocalStorage()
    const index = this.students.findIndex((s) => s.id === id)
    if (index !== -1) {
      this.students[index] = { ...this.students[index], ...updates }
      this.saveToLocalStorage()
      return this.students[index]
    }
    return null
  }

  deleteStudent(id: string): boolean {
    this.loadFromLocalStorage()
    const index = this.students.findIndex((s) => s.id === id)
    if (index !== -1) {
      this.students.splice(index, 1)
      this.saveToLocalStorage()
      return true
    }
    return false
  }

  // Entry Log Management
  addEntry(studentId: string, applicationNumber: string, studentName: string): EntryLog {
    this.loadFromLocalStorage()
    const existingEntry = this.currentEntries.get(studentId)

    if (existingEntry && !existingEntry.exitTime) {
      // Student is already inside, mark exit
      existingEntry.exitTime = new Date()
      existingEntry.status = "exit"
      this.currentEntries.delete(studentId)
      this.saveToLocalStorage()
      return existingEntry
    } else {
      // New entry
      const newEntry: EntryLog = {
        id: `ENTRY_${Date.now()}`,
        studentId,
        applicationNumber,
        studentName,
        entryTime: new Date(),
        status: "entry",
        verified: true,
      }
      this.entryLogs.push(newEntry)
      this.currentEntries.set(studentId, newEntry)
      this.saveToLocalStorage()
      return newEntry
    }
  }

  getStudentEntries(studentId: string): EntryLog[] {
    this.loadFromLocalStorage()
    return this.entryLogs.filter((log) => log.studentId === studentId)
  }

  getAllEntries(): EntryLog[] {
    this.loadFromLocalStorage()
    return [...this.entryLogs].reverse()
  }

  getTodayEntries(): EntryLog[] {
    this.loadFromLocalStorage()
    const today = new Date().toDateString()
    return this.entryLogs.filter((log) => log.entryTime.toDateString() === today)
  }

  generateApplicationNumber(): string {
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")
    return `APP${year}${random}`
  }

  // Local Storage Methods
  private saveToLocalStorage() {
    if (typeof window !== "undefined") {
      localStorage.setItem("students", JSON.stringify(this.students))
      localStorage.setItem("entryLogs", JSON.stringify(this.entryLogs))
    }
  }

  private loadFromLocalStorage() {
    if (typeof window !== "undefined") {
      const studentsData = localStorage.getItem("students")
      const entryLogsData = localStorage.getItem("entryLogs")

      if (studentsData) {
        this.students = JSON.parse(studentsData).map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
        }))
      }

      if (entryLogsData) {
        this.entryLogs = JSON.parse(entryLogsData).map((e: any) => ({
          ...e,
          entryTime: new Date(e.entryTime),
          exitTime: e.exitTime ? new Date(e.exitTime) : undefined,
        }))
      }
    }
  }
}

export const store = new Store()
