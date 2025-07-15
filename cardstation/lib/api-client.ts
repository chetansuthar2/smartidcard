// API Client for connecting to deployed smartidcard app
class ApiClient {
  private baseUrl: string

  constructor() {
    // Use deployed smartidcard URL or fallback to local
    this.baseUrl = process.env.NEXT_PUBLIC_SMARTIDCARD_API_URL || 'http://localhost:3000'
  }

  // Students API
  async getStudents() {
    try {
      const response = await fetch(`${this.baseUrl}/api/students`)
      if (!response.ok) throw new Error('Failed to fetch students')
      return await response.json()
    } catch (error) {
      console.error('Error fetching students:', error)
      throw error
    }
  }

  async getStudentByAppNumber(appNumber: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/students?application_number=${appNumber}`)
      if (!response.ok) throw new Error('Failed to fetch student')
      const students = await response.json()
      return students.length > 0 ? students[0] : null
    } catch (error) {
      console.error('Error fetching student by app number:', error)
      throw error
    }
  }

  async getStudentByAppAndPhone(appNumber: string, phone: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/students?application_number=${appNumber}&phone=${phone}`)
      if (!response.ok) throw new Error('Failed to fetch student')
      const students = await response.json()
      return students.length > 0 ? students[0] : null
    } catch (error) {
      console.error('Error fetching student by app and phone:', error)
      throw error
    }
  }

  // Entries API
  async getEntries() {
    try {
      const response = await fetch(`${this.baseUrl}/api/entries`)
      if (!response.ok) throw new Error('Failed to fetch entries')
      return await response.json()
    } catch (error) {
      console.error('Error fetching entries:', error)
      throw error
    }
  }

  async getTodayEntries() {
    try {
      const response = await fetch(`${this.baseUrl}/api/entries/today`)
      if (!response.ok) throw new Error('Failed to fetch today entries')
      return await response.json()
    } catch (error) {
      console.error('Error fetching today entries:', error)
      throw error
    }
  }

  async addEntry(studentId: string, applicationNumber: string, studentName: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          application_number: applicationNumber,
          student_name: studentName,
        }),
      })
      
      if (!response.ok) throw new Error('Failed to add entry')
      return await response.json()
    } catch (error) {
      console.error('Error adding entry:', error)
      throw error
    }
  }

  async getEntriesByDate(date: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/entries/date?date=${date}`)
      if (!response.ok) throw new Error('Failed to fetch entries by date')
      return await response.json()
    } catch (error) {
      console.error('Error fetching entries by date:', error)
      throw error
    }
  }

  // Admin Authentication
  async authenticateAdmin(username: string, password: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })
      
      if (!response.ok) return false
      const result = await response.json()
      return result.success || false
    } catch (error) {
      console.error('Error authenticating admin:', error)
      return false
    }
  }
}

export const apiClient = new ApiClient()
