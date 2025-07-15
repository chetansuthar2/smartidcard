"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LogOut, User, Clock, QrCode, RefreshCw, Copy, Check, ChevronDown, ChevronUp, Info } from "lucide-react"
import { dbStore, type Student, type EntryLog } from "@/lib/database-store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function StudentApp() {
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null)
  const [studentEntries, setStudentEntries] = useState<EntryLog[]>([])
  const [loading, setLoading] = useState(false)
  const [copiedQR, setCopiedQR] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeSection, setActiveSection] = useState<"idCard" | "details" | "history" | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const entriesPerPage = 5
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const studentLoggedIn = localStorage.getItem("studentLoggedIn")
      const studentId = localStorage.getItem("studentId")

      if (!studentLoggedIn || !studentId) {
        router.push("/")
        return
      }

      loadStudentData(studentId)
    }
  }, [router])

  // Auto-refresh student entries every 3 seconds for real-time updates
  useEffect(() => {
    if (!isAuthenticated || !currentStudent) return

    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing student entries...")
      loadStudentEntries()
    }, 3000) // 3 seconds for faster updates

    return () => clearInterval(interval)
  }, [isAuthenticated, currentStudent])

  const loadStudentEntries = async () => {
    if (!currentStudent) return

    try {
      console.log(`🔍 Fetching entries for student: ${currentStudent.name} (${currentStudent.application_number})`)

      // Try to get entries with shorter timeout and better error handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log("⏰ Request timeout after 5 seconds")
        controller.abort()
      }, 5000) // Reduced to 5 second timeout

      console.log("📡 Making API request to /api/entries...")
      const entriesRes = await fetch('/api/entries', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      console.log("✅ API request completed, status:", entriesRes.status)

      if (entriesRes.ok) {
        const allEntries = await entriesRes.json()
        console.log(`📊 Total entries in database: ${allEntries.length}`)

        // Filter entries for this student by both student_id and application_number
        const studentEntries = allEntries.filter((entry: any) => {
          const matchesId = entry.student_id === currentStudent.id
          const matchesAppNumber = entry.application_number === currentStudent.application_number
          const matchesName = entry.student_name === currentStudent.name

          return matchesId || matchesAppNumber || matchesName
        })

        // Sort by entry time (newest first)
        studentEntries.sort((a: any, b: any) => {
          const dateA = new Date(a.entry_time || a.entryTime || a.timestamp)
          const dateB = new Date(b.entry_time || b.entryTime || b.timestamp)
          return dateB.getTime() - dateA.getTime()
        })

        setStudentEntries(studentEntries)
        console.log(`✅ Found ${studentEntries.length} entries for ${currentStudent.name}:`, studentEntries)

        // Cache successful results for offline access
        if (studentEntries.length > 0) {
          try {
            localStorage.setItem(`student_entries_${currentStudent.application_number}`, JSON.stringify(studentEntries))
            console.log("💾 Cached entries for offline access")
          } catch (cacheError) {
            console.warn("⚠️ Failed to cache entries:", cacheError)
          }
        }

        // Debug: Check entry data structure
        if (studentEntries.length > 0) {
          console.log("📊 Sample entry structure:", studentEntries[0])
          console.log("📊 Entry properties:", Object.keys(studentEntries[0]))
        }
      } else {
        console.error(`❌ API error: ${entriesRes.status} - ${entriesRes.statusText}`)
        // Try fallback - use empty array but don't crash
        setStudentEntries([])
      }
    } catch (error) {
      console.error("❌ Error refreshing entries:", error)

      // Handle specific error types with user-friendly messages
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error("❌ Request timeout - API took too long to respond")
          console.log("💡 This might be due to slow database connection or server issues")
        } else if (error.message.includes('Failed to fetch')) {
          console.error("❌ Network error - Check if server is running")
          console.log("💡 Make sure the smartidcard server is running on the correct port")
        } else {
          console.error("❌ Unexpected error:", error.message)
        }
      }

      // Try to load from localStorage as fallback
      console.log("🔄 Attempting to load cached entries...")
      try {
        const cachedEntries = localStorage.getItem(`student_entries_${currentStudent.application_number}`)
        if (cachedEntries) {
          const parsedEntries = JSON.parse(cachedEntries)
          setStudentEntries(parsedEntries)
          console.log("✅ Loaded cached entries:", parsedEntries.length)
          return
        }
      } catch (cacheError) {
        console.error("❌ Failed to load cached entries:", cacheError)
      }

      // Set empty entries array as final fallback
      console.log("📝 No cached data available, showing empty state")
      setStudentEntries([])
    }
  }

  const loadStudentData = async (studentId: string) => {
    try {
      setLoading(true)
      setIsAuthenticated(true)

      // Get student data from shared MongoDB via API
      const studentsRes = await fetch('/api/students')
      if (!studentsRes.ok) throw new Error('Failed to fetch students')

      const students = await studentsRes.json()
      const student = students.find((s: Student) => s.id === studentId)

      if (student) {
        setCurrentStudent(student)

        // Get student's entry history from shared MongoDB
        try {
          const entriesRes = await fetch(`/api/entries?studentId=${student.id}`)
          if (entriesRes.ok) {
            const allEntries = await entriesRes.json()
            // Filter entries for this student
            const studentEntries = allEntries.filter((entry: any) =>
              entry.student_id === student.id || entry.application_number === student.application_number
            )
            setStudentEntries(studentEntries)
            console.log(`✅ Loaded ${studentEntries.length} entries for student ${student.name}`)
          } else {
            console.log("⚠️ Could not fetch entries from API, using fallback")
            const entries = await dbStore.getStudentEntries(student.id)
            setStudentEntries(entries)
          }
        } catch (entriesError) {
          console.log("⚠️ API error, using database fallback for entries")
          const entries = await dbStore.getStudentEntries(student.id)
          setStudentEntries(entries)
        }
      } else {
        handleLogout()
      }
    } catch (error) {
      console.error("Error loading student data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("studentLoggedIn")
      localStorage.removeItem("studentId")
      localStorage.removeItem("studentAppNumber")
    }
    router.push("/")
  }

  const handleRefresh = () => {
    if (currentStudent) {
      loadStudentData(currentStudent.id)
    }
  }

  const generateSimpleQRCode = () => {
    if (!currentStudent) return ""

    // For display purposes, just show enrollment number
    // But for scanning validation, we'll use structured data
    return currentStudent.application_number
  }

  const copyQRData = async () => {
    try {
      const qrData = generateSimpleQRCode()
      await navigator.clipboard.writeText(qrData)
      setCopiedQR(true)
      setTimeout(() => setCopiedQR(false), 2000)
    } catch (error) {
      alert("Failed to copy QR data")
    }
  }



  const formatTime = (date: Date | string | null | undefined) => {
    if (!date) return "N/A"
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return "Invalid Date"

    return dateObj.toLocaleString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A"
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return "Invalid Date"

    return dateObj.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const calculateDuration = (entryTime: Date | string | null | undefined, exitTime: Date | string | null | undefined) => {
    if (!entryTime || !exitTime) return null

    const entryDate = typeof entryTime === 'string' ? new Date(entryTime) : entryTime
    const exitDate = typeof exitTime === 'string' ? new Date(exitTime) : exitTime

    if (isNaN(entryDate.getTime()) || isNaN(exitDate.getTime())) return null

    const diffMs = exitDate.getTime() - entryDate.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`
    } else {
      return `${diffMinutes}m`
    }
  }

  const toggleSection = (section: "idCard" | "details" | "history") => {
    setActiveSection(activeSection === section ? null : section)
  }

  if (!isAuthenticated || !currentStudent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading student data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <img
                  src={currentStudent?.image_url || "/placeholder.svg?height=50&width=50"}
                  alt={currentStudent?.name}
                  className="w-10 h-10 rounded-full border-2 border-green-200 object-cover"
                />
                <div>
                  <CardTitle className="text-lg">Welcome, {currentStudent?.name}</CardTitle>
                  <CardDescription className="text-xs">App No: {currentStudent?.application_number}</CardDescription>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button 
                  onClick={handleRefresh} 
                  variant="outline" 
                  size="sm"
                  disabled={loading}
                  className="flex-1 sm:flex-none"
                >
                  <RefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  <span className="sr-only sm:not-sr-only">Refresh</span>
                </Button>
                
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <LogOut className="mr-1 h-4 w-4" />
                  <span className="sr-only sm:not-sr-only">Logout</span>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Collapsible Sections */}
        <div className="space-y-3">
          {/* Digital ID Card Section */}
          <Card className="border border-blue-200">
            <button 
              onClick={() => toggleSection("idCard")}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <QrCode className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Digital ID Card</h3>
                  <p className="text-sm text-gray-500">Show your QR code at security stations</p>
                </div>
              </div>
              {activeSection === "idCard" ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
            {activeSection === "idCard" && (
              <CardContent className="pt-0 px-4 pb-4">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-5 text-white relative overflow-hidden">


                  <div className="relative z-10">
                    {/* Mobile-first responsive header */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {/* KPGU Logo - better visibility */}
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-lg p-2 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <div className="w-full h-full flex items-center justify-center">
                            {/* KPGU Logo SVG - Always visible */}
                            <svg width="100%" height="100%" viewBox="0 0 100 100" className="fill-current text-red-600">
                              <g transform="translate(50,50)">
                                {/* Outer circular text */}
                                <path id="topCircle" d="M -35,0 A 35,35 0 0,1 35,0" fill="none"/>
                                <text fontFamily="Arial, sans-serif" fontSize="3.5" fontWeight="bold" fill="currentColor">
                                  <textPath href="#topCircle" startOffset="5%">DRS. KIRAN &amp; PALLAVI PATEL GLOBAL</textPath>
                                </text>

                                <path id="bottomCircle" d="M 35,0 A 35,35 0 0,1 -35,0" fill="none"/>
                                <text fontFamily="Arial, sans-serif" fontSize="3.5" fontWeight="bold" fill="currentColor">
                                  <textPath href="#bottomCircle" startOffset="25%">UNIVERSITY</textPath>
                                </text>

                                {/* Left Peacock */}
                                <g transform="translate(-15,-7.5) scale(0.15)">
                                  <path d="M-15,-35 Q-25,-45 -35,-40 Q-30,-30 -20,-25 Q-10,-20 -5,-10 Q0,0 5,10 Q10,20 15,30 Q20,35 15,25 Q10,15 5,5 Q0,-5 -5,-15 Q-10,-25 -15,-35 Z" fill="currentColor"/>
                                  <circle cx="-20" cy="-30" r="1.5" fill="currentColor"/>
                                </g>

                                {/* Right Peacock */}
                                <g transform="translate(15,-7.5) scale(0.15) scale(-1,1)">
                                  <path d="M-15,-35 Q-25,-45 -35,-40 Q-30,-30 -20,-25 Q-10,-20 -5,-10 Q0,0 5,10 Q10,20 15,30 Q20,35 15,25 Q10,15 5,5 Q0,-5 -5,-15 Q-10,-25 -15,-35 Z" fill="currentColor"/>
                                  <circle cx="-20" cy="-30" r="1.5" fill="currentColor"/>
                                </g>

                                {/* Central Shield */}
                                <path d="M-8.75,-12.5 L8.75,-12.5 L10,-7.5 L8.75,12.5 L-8.75,12.5 L-10,-7.5 Z" fill="none" stroke="currentColor" strokeWidth="0.6"/>

                                {/* Lotus/Mandala design at top */}
                                <g transform="translate(0,-8.75)">
                                  <circle cx="0" cy="0" r="3" fill="none" stroke="currentColor" strokeWidth="0.4"/>
                                  <path d="M-2,-2 L0,-4 L2,-2 L2,2 L0,4 L-2,2 Z" fill="none" stroke="currentColor" strokeWidth="0.25"/>
                                </g>

                                {/* Graduation cap */}
                                <g transform="translate(0,-1.25)">
                                  <path d="M-3,-0.75 L3,-0.75 L2.5,0.5 L-2.5,0.5 Z" fill="currentColor"/>
                                  <circle cx="0" cy="-0.75" r="0.4" fill="currentColor"/>
                                </g>

                                {/* Globe */}
                                <circle cx="0" cy="3.75" r="2.5" fill="none" stroke="currentColor" strokeWidth="0.4"/>
                                <path d="M-2.5,3.75 Q0,2.5 2.5,3.75" fill="none" stroke="currentColor" strokeWidth="0.25"/>
                                <path d="M-1.5,1.75 Q0,5 1.5,1.75" fill="none" stroke="currentColor" strokeWidth="0.25"/>

                                {/* KPGU Banner */}
                                <path d="M-6.25,8.75 L-5,7.5 L5,7.5 L6.25,8.75 L5,11.25 L-5,11.25 Z" fill="currentColor"/>
                                <text x="0" y="10" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="2.5" fontWeight="bold" fill="white">KPGU</text>

                                {/* VADODARA text */}
                                <text x="0" y="16.25" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="3" fontWeight="bold" fill="currentColor">VADODARA</text>
                              </g>
                            </svg>
                          </div>

                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-sm sm:text-lg font-bold leading-tight">Drs. Kiran & Pallavi Patel Global University</h2>
                          <p className="text-blue-100 text-xs sm:text-sm">Official Identification Document</p>
                        </div>
                      </div>
                      <div className="text-right sm:text-right self-end sm:self-start">
                        <div className="text-xs text-blue-200">Valid Until</div>
                        <div className="font-bold text-sm">31/12/2025</div>
                      </div>
                    </div>
                  
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="flex gap-4">
                        <div className="bg-white border-2 border-white rounded-lg overflow-hidden">
                          <img
                            src={currentStudent?.image_url || "/placeholder.svg?height=100&width=80"}
                            alt={currentStudent?.name}
                            className="w-20 h-24 object-cover"
                          />
                        </div>
                        
                        <div>
                          <h1 className="text-lg font-bold">{currentStudent?.name}</h1>
                          <div className="mt-2 space-y-1">
                            <div>
                              <div className="text-xs text-blue-200">Enrollment Number</div>
                              <div className="font-mono font-bold">{currentStudent?.application_number}</div>
                            </div>
                            <div>
                              <div className="text-xs text-blue-200">Department</div>
                              <div className="font-bold">{currentStudent?.department}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-xs text-blue-200">Semester</div>
                          <div className="font-bold">{currentStudent?.class}</div>
                        </div>
                        <div>
                          <div className="text-xs text-blue-200">Phone</div>
                          <div className="font-bold">{currentStudent?.phone}</div>
                        </div>
                      </div>

                      {currentStudent?.address && (
                        <div className="mt-2">
                          <div className="text-xs text-blue-200">Address</div>
                          <div className="font-bold text-sm">{currentStudent?.address}</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <div className="bg-white p-2 rounded-lg">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(generateSimpleQRCode())}`}
                          alt="Student QR Code"
                          className="w-32 h-32"
                        />
                      </div>
                      <div className="mt-2 text-center">
                        <div className="font-mono text-xs bg-blue-400/20 px-2 py-1 rounded">
                          {currentStudent?.application_number}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="relative">
                      <Input
                        value={generateSimpleQRCode()}
                        readOnly
                        className="bg-white/10 border-white/20 text-white placeholder-white/50 text-center font-mono text-sm"
                      />
                      <Button
                        onClick={copyQRData}
                        size="sm"
                        className="absolute top-1 right-1 h-6 px-2 bg-white/20 hover:bg-white/30"
                      >
                        {copiedQR ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                    <p className="text-xs text-blue-200 mt-1 text-center">
                      Copy enrollment number for manual entry at station
                    </p>
                  </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
          
          {/* Personal Details Section */}
          <Card className="border border-green-200">
            <button 
              onClick={() => toggleSection("details")}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Personal Details</h3>
                  <p className="text-sm text-gray-500">View your registration information</p>
                </div>
              </div>
              {activeSection === "details" ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
            {activeSection === "details" && (
              <CardContent className="pt-0 px-4 pb-4">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center">
                    <img
                      src={currentStudent?.image_url || "/placeholder.svg?height=120&width=120"}
                      alt={currentStudent?.name}
                      className="w-24 h-24 rounded-full border-4 border-green-200 object-cover"
                    />
                    <h3 className="mt-2 text-lg font-semibold">{currentStudent?.name}</h3>
                    <Badge variant="secondary" className="mt-1">{currentStudent?.class}</Badge>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-500 text-sm">Phone</Label>
                        <p className="font-medium">{currentStudent?.phone}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500 text-sm">Email</Label>
                        <p className="font-medium">{currentStudent?.email || "Not provided"}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500 text-sm">Department</Label>
                        <p className="font-medium">{currentStudent?.department}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500 text-sm">Schedule</Label>
                        <p className="font-medium">{currentStudent?.schedule || "Not assigned"}</p>
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <Label className="text-gray-500 text-sm">Address</Label>
                        <p className="font-medium">{currentStudent?.address || "Not provided"}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <Label className="text-gray-500 text-sm">Enrollment Number</Label>
                      <Badge variant="outline" className="font-mono mt-1">
                        {currentStudent?.application_number}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
          
          {/* Entry History Section */}
          <Card className="border border-amber-200">
            <button 
              onClick={() => toggleSection("history")}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Entry/Exit History</h3>
                  <p className="text-sm text-gray-500">View your campus access records</p>
                </div>

              </div>
              {activeSection === "history" ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
            {activeSection === "history" && (
              <CardContent className="pt-0 px-4 pb-4">
                {studentEntries.length === 0 ? (
                  <div className="text-center py-6">
                    <Clock className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">No entries recorded yet</p>
                  </div>
                ) : (
                  <>
                    {/* Compact Entry List */}
                    <div className="space-y-2">
                      {studentEntries
                        .slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage)
                        .map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-4 border-l-blue-500">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${entry.status === "entry" ? "bg-green-500" : "bg-red-500"}`}></div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium">
                                    {entry.status === "entry" ? "Entry" : "Exit"}
                                  </span>
                                  <Badge variant="outline" className="text-xs px-1 py-0">
                                    {entry.verified ? "✓" : "⚠"}
                                  </Badge>
                                </div>

                                {/* Entry Time */}
                                <div className="text-xs text-gray-600 mb-1">
                                  <span className="font-medium">Entry:</span> {formatDate((entry as any).entry_time || entry.entryTime)} • {formatTime((entry as any).entry_time || entry.entryTime)}
                                </div>

                                {/* Exit Time (only for exit records) */}
                                {entry.status === "exit" && (entry as any).exit_time && (
                                  <>
                                    <div className="text-xs text-gray-600">
                                      <span className="font-medium">Exit:</span> {formatDate((entry as any).exit_time)} • {formatTime((entry as any).exit_time)}
                                    </div>
                                    {/* Duration */}
                                    {calculateDuration((entry as any).entry_time || entry.entryTime, (entry as any).exit_time) && (
                                      <div className="text-xs text-blue-600 font-medium mt-1">
                                        Duration: {calculateDuration((entry as any).entry_time || entry.entryTime, (entry as any).exit_time)}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                entry.status === "entry"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}>
                                {entry.status === "entry" ? "In" : "Out"}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {studentEntries.length > entriesPerPage && (
                      <div className="flex items-center justify-between mt-4 pt-3 border-t">
                        <p className="text-xs text-gray-500">
                          Showing {((currentPage - 1) * entriesPerPage) + 1}-{Math.min(currentPage * entriesPerPage, studentEntries.length)} of {studentEntries.length}
                        </p>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="h-7 w-7 p-0"
                          >
                            ←
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(studentEntries.length / entriesPerPage), prev + 1))}
                            disabled={currentPage >= Math.ceil(studentEntries.length / entriesPerPage)}
                            className="h-7 w-7 p-0"
                          >
                            →
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="mt-3 pt-3 border-t bg-blue-50 rounded-lg p-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Total Entries: {studentEntries.length}</span>
                        <span className="text-gray-600">
                          Last Updated: {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            )}
          </Card>
        </div>

        {/* Instructions */}
        <Card className="border border-blue-100">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              How to Use Your Digital ID Card
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-700 mb-2 flex items-center">
                  <QrCode className="mr-2 h-4 w-4" />
                  QR Code Scanning
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Show your QR code to station operator</li>
                  <li>Operator will scan with the camera</li>
                  <li>Hold QR code steady in front of camera</li>
                  <li>System retrieves your details automatically</li>
                  <li>Proceed to face verification</li>
                </ol>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-700 mb-2 flex items-center">
                  <Copy className="mr-2 h-4 w-4" />
                  Manual Input Option
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Copy your Enrollment Number</li>
                  <li>Go to station's "Manual Entry" section</li>
                  <li>Paste your Enrollment Number</li>
                  <li>Click "Validate" to retrieve details</li>
                  <li>Continue with face verification</li>
                </ul>
              </div>
            </div>
            
            <Alert className="mt-4 bg-yellow-50 border-yellow-200">
              <AlertDescription className="text-sm">
                <span className="font-semibold">Important:</span> Your digital ID card is for official use only. 
                Do not share it with unauthorized persons. Report lost cards immediately.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}