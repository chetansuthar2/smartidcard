"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  UserPlus,
  Users,
  Activity,
  Copy,
  Check,
  Edit,
  Trash2,
  Save,
  X,
  LogOut,
  RefreshCw,
  Database,
  Upload,
  ImageIcon,
  Camera,
  Search,
} from "lucide-react"
import { dbStore, type Student } from "@/lib/database-store"
import { supabase } from "@/lib/supabase"

export default function AdminPanel() {
  const [students, setStudents] = useState<Student[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [dataSource, setDataSource] = useState<string>("local")
  const [databaseConnected, setDatabaseConnected] = useState(false)
  const [storageInfo, setStorageInfo] = useState({ mode: "Local", studentsCount: 0, entriesCount: 0 })
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayEntries: 0,
    todayExits: 0,
    totalEntries: 0,
  })
  const [newStudent, setNewStudent] = useState({
    name: "",
    phone: "",
    email: "",
    class: "",
    department: "",
    schedule: "",
    image: "", // Will store base64 image
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if admin is logged in
    if (typeof window !== "undefined") {
      const adminLoggedIn = localStorage.getItem("adminLoggedIn")
      if (!adminLoggedIn) {
        router.push("/")
        return
      }
    }

    setIsAuthenticated(true)
    checkDatabaseConnection()
    loadData()
  }, [router])

  // Separate function to refresh only stats (not full page)
  const refreshStats = async () => {
    try {
      console.log("🔄 Refreshing stats from shared MongoDB database...")

      let allEntries = []
      let todayEntries = []
      let studentsData = []
      let dataSource = "mongodb"

      try {
        // Use local API which connects to shared MongoDB
        console.log("🔍 Fetching from shared MongoDB via local API...")
        const [localStudentsRes, localEntriesRes] = await Promise.all([
          fetch('/api/students'),
          fetch('/api/entries')
        ])

        if (localStudentsRes.ok && localEntriesRes.ok) {
          studentsData = await localStudentsRes.json()
          allEntries = await localEntriesRes.json()
          dataSource = "mongodb"
          console.log("✅ Data fetched from shared MongoDB database")
        } else {
          throw new Error("MongoDB API not available")
        }
      } catch (apiError) {
        console.log("⚠️ API not available, using database store fallback...")
        // Fallback to database store
        allEntries = await dbStore.getAllEntries()
        todayEntries = await dbStore.getTodayEntries()
        studentsData = await dbStore.getStudents()
        dataSource = "fallback"
      }

      // Filter today's entries if we got data from API
      if (dataSource !== "fallback") {
        const today = new Date().toDateString()
        todayEntries = allEntries.filter((entry: any) => {
          const entryDate = new Date(entry.entryTime || entry.entry_time).toDateString()
          return entryDate === today
        })
      }

      console.log("📊 Raw data:", {
        source: dataSource,
        allEntries: allEntries.length,
        todayEntries: todayEntries.length,
        todayEntriesData: todayEntries,
        students: studentsData.length
      })

      // Debug: Show sample entry data
      if (allEntries.length > 0) {
        console.log("📝 Sample entry:", allEntries[0])
      }
      if (todayEntries.length > 0) {
        console.log("📅 Sample today entry:", todayEntries[0])
      }

      const entryCount = todayEntries.filter((e: any) => e.status === 'entry').length
      const exitCount = todayEntries.filter((e: any) => e.status === 'exit').length

      setStats({
        totalStudents: studentsData.length,
        todayEntries: entryCount,
        todayExits: exitCount,
        totalEntries: allEntries.length,
      })

      setDataSource(dataSource)
      setLastUpdated(new Date())
      console.log("✅ Stats refreshed:", {
        source: dataSource,
        totalStudents: studentsData.length,
        todayEntries: entryCount,
        todayExits: exitCount,
        totalActivity: entryCount + exitCount,
        allEntries: allEntries.length
      })
    } catch (error) {
      console.error("❌ Error refreshing stats:", error)
    }
  }

  // Auto-reload only stats every 5 seconds (not full page)
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      refreshStats() // Only refresh stats, not full page
    }, 5000) // 5 seconds

    return () => clearInterval(interval)
  }, [isAuthenticated])

  const checkDatabaseConnection = async () => {
    try {
      // Check if we can connect to MongoDB via API
      const studentsRes = await fetch('/api/students')
      const entriesRes = await fetch('/api/entries')

      if (studentsRes.ok && entriesRes.ok) {
        const students = await studentsRes.json()
        const entries = await entriesRes.json()
        setDatabaseConnected(true)
        setStorageInfo({
          mode: "MongoDB Cloud",
          studentsCount: students.length,
          entriesCount: entries.length
        })
        console.log("✅ MongoDB connection verified")
      } else {
        throw new Error("API not responding")
      }
    } catch (error) {
      console.log("⚠️ MongoDB not available, using local storage")
      setDatabaseConnected(false)
      const storageInfo = await dbStore.getStorageInfo()
      setStorageInfo(storageInfo)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)

      // Load students from local database (for admin management)
      const studentsData = await dbStore.getStudents()
      setStudents(studentsData)

      // Load stats from cardstation if available
      await refreshStats()

      const storageInfo = await dbStore.getStorageInfo()
      setStorageInfo(storageInfo)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadData() // Full page refresh
  }



  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminLoggedIn")
      localStorage.removeItem("adminUsername")
    }
    router.push("/")
  }

  // Filter students based on search query
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.application_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.phone.includes(searchQuery)
  )

  // Handle image file selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (JPG, PNG, GIF, etc.)")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB")
      return
    }

    setImageFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setImagePreview(result)
      setNewStudent({ ...newStudent, image: result })
    }
    reader.readAsDataURL(file)
  }

  // Remove selected image
  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setNewStudent({ ...newStudent, image: "" })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Take photo using camera
  const takePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })

      // Create a video element to capture the stream
      const video = document.createElement("video")
      video.srcObject = stream
      video.autoplay = true

      // Create a modal or popup to show camera feed
      const modal = document.createElement("div")
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      `

      const container = document.createElement("div")
      container.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
      `

      const canvas = document.createElement("canvas")
      const captureBtn = document.createElement("button")
      captureBtn.textContent = "Capture Photo"
      captureBtn.style.cssText = `
        background: #3b82f6;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        margin: 10px;
        cursor: pointer;
      `

      const cancelBtn = document.createElement("button")
      cancelBtn.textContent = "Cancel"
      cancelBtn.style.cssText = `
        background: #6b7280;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        margin: 10px;
        cursor: pointer;
      `

      container.appendChild(video)
      container.appendChild(document.createElement("br"))
      container.appendChild(captureBtn)
      container.appendChild(cancelBtn)
      modal.appendChild(container)
      document.body.appendChild(modal)

      // Capture photo
      captureBtn.onclick = () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d")
        ctx?.drawImage(video, 0, 0)

        const imageData = canvas.toDataURL("image/jpeg", 0.8)
        setImagePreview(imageData)
        setNewStudent({ ...newStudent, image: imageData })

        // Stop camera and close modal
        stream.getTracks().forEach((track) => track.stop())
        document.body.removeChild(modal)
      }

      // Cancel
      cancelBtn.onclick = () => {
        stream.getTracks().forEach((track) => track.stop())
        document.body.removeChild(modal)
      }
    } catch (error) {
      alert("Camera access denied or not available")
    }
  }

  const validateForm = () => {
    if (!newStudent.name.trim()) {
      alert("Student name is required")
      return false
    }
    if (!newStudent.phone.trim()) {
      alert("Phone number is required")
      return false
    }
    if (newStudent.phone.length !== 10 || !/^\d+$/.test(newStudent.phone)) {
      alert("Phone number must be exactly 10 digits")
      return false
    }
    if (!newStudent.class) {
      alert("Class selection is required")
      return false
    }
    if (!newStudent.image) {
      alert("Student photo is required. Please upload an image or take a photo.")
      return false
    }
    return true
  }

  const handleAddStudent = async () => {
    if (!validateForm()) return

    // Check if phone number already exists
    const existingStudent = students.find((s) => s.phone === newStudent.phone)
    if (existingStudent) {
      alert("Phone number already exists!")
      return
    }

    setLoading(true)
    try {
      const applicationNumber = dbStore.generateApplicationNumber()
      const student = await dbStore.addStudent({
        ...newStudent,
        application_number: applicationNumber,
        image_url: newStudent.image, // Store base64 image
      })

      await loadData()
      resetForm()

      alert(
        `Student Added Successfully!\n\nName: ${student.name}\nApplication Number: ${applicationNumber}\nPhone: ${student.phone}\n\nPlease provide Application Number and Phone Number to the student for login.\n\nData saved in ${storageInfo.mode} storage.`,
      )
    } catch (error) {
      alert("Error adding student. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student)
    setNewStudent({
      name: student.name,
      phone: student.phone,
      email: student.email || "",
      class: student.class,
      department: student.department || "",
      schedule: student.schedule || "",
      image: student.image_url || "",
    })
    setImagePreview(student.image_url || null)
    setShowAddForm(false)
  }

  const handleUpdateStudent = async () => {
    if (!validateForm() || !editingStudent) return

    // Check if phone number already exists (excluding current student)
    const existingStudent = students.find((s) => s.phone === newStudent.phone && s.id !== editingStudent.id)
    if (existingStudent) {
      alert("Phone number already exists!")
      return
    }

    setLoading(true)
    try {
      await dbStore.updateStudent(editingStudent.id, {
        name: newStudent.name,
        phone: newStudent.phone,
        email: newStudent.email || null,
        class: newStudent.class,
        department: newStudent.department || null,
        schedule: newStudent.schedule || null,
        image_url: newStudent.image,
      })

      await loadData()
      resetForm()
      alert(`Student updated successfully!\n\nData saved in ${storageInfo.mode} storage.`)
    } catch (error) {
      alert("Error updating student. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStudent = async (student: Student) => {
    try {
      // First, get the student's entry history to show in confirmation
      const studentEntries = await dbStore.getStudentEntries(student.id)
      const entryCount = studentEntries.length

      const confirmMessage = `⚠️ DELETE STUDENT CONFIRMATION ⚠️\n\nStudent: ${student.name}\nApplication Number: ${student.application_number}\nPhone: ${student.phone}\n\n📊 DATA TO BE DELETED:\n• Student profile and photo\n• ${entryCount} entry/exit records\n• All associated data\n\n❌ This action cannot be undone!\n\nAre you sure you want to permanently delete this student and all their data?`

      if (confirm(confirmMessage)) {
        setLoading(true)

        // Delete all student entries first
        if (entryCount > 0) {
          console.log(`🗑️ Deleting ${entryCount} entries for student ${student.name}...`)
          const deletedCount = await dbStore.deleteAllStudentEntries(student.id)
          console.log(`✅ Deleted ${deletedCount} entries`)
        }

        // Then delete the student
        console.log(`🗑️ Deleting student ${student.name}...`)
        await dbStore.deleteStudent(student.id)
        console.log(`✅ Student deleted`)

        await loadData()
        alert(`✅ STUDENT DELETED SUCCESSFULLY!\n\n👤 Student: ${student.name}\n📱 Application Number: ${student.application_number}\n📊 Deleted Data:\n• Student profile\n• ${entryCount} entry/exit records\n\n💾 Data updated in ${storageInfo.mode} storage.`)
      }
    } catch (error) {
      console.error("Error deleting student:", error)
      alert(`❌ Error deleting student!\n\nFailed to delete ${student.name}.\nPlease try again or contact technical support.`)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(`${type}-${text}`)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      alert("Failed to copy to clipboard")
    }
  }

  const resetForm = () => {
    setNewStudent({
      name: "",
      phone: "",
      email: "",
      class: "",
      department: "",
      schedule: "",
      image: "",
    })
    setImagePreview(null)
    setImageFile(null)
    setShowAddForm(false)
    setEditingStudent(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  const totalStudents = students.length

  // Replace the following with your actual attendance/logs array if available
  // For demonstration, using an empty array as placeholder
  const logs: { type: string; timestamp: string }[] = [] // Replace with actual logs source

  const todaysEntries = logs.filter(
    (e) => e.type === "entry" && e.timestamp.slice(0, 10) === today,
  ).length
  const todaysExits = logs.filter(
    (e) => e.type === "exit" && e.timestamp.slice(0, 10) === today,
  ).length
  const totalEntries = logs.filter((e) => e.type === "entry").length
  const remainingStudents = totalStudents - todaysExits

  if (!isAuthenticated) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto space-y-3 sm:space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl">Admin Panel</CardTitle>
                <CardDescription className="text-sm sm:text-base lg:text-lg">
                  Student Management System - {storageInfo.mode} Storage
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleRefresh} variant="outline" disabled={loading} size="sm" className="w-full sm:w-auto">
                  <RefreshCw className={`mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 ${loading ? "animate-spin" : ""}`} />
                  <span className="text-xs sm:text-sm">Refresh</span>
                </Button>
                <Button onClick={handleLogout} variant="outline" size="sm" className="w-full sm:w-auto">
                  <LogOut className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">Logout</span>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Storage Status Alert */}
        <Alert className={databaseConnected ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
          <Database className={`h-4 w-4 ${databaseConnected ? "text-green-600" : "text-yellow-600"}`} />
          <AlertDescription className={databaseConnected ? "text-green-800" : "text-yellow-800"}>
            <strong>{storageInfo.mode} Storage Active:</strong>{" "}
            {databaseConnected
              ? "Data syncs across all devices automatically"
              : `Data saved locally on this device (${storageInfo.studentsCount} students, ${storageInfo.entriesCount} entries)`}
          </AlertDescription>
        </Alert>

        {/* Stats - 4 Cards Layout with Auto-reload */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Students Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">
                {stats.totalStudents}
              </div>
              <div className="text-sm sm:text-base font-medium text-blue-700">
                Total Students
              </div>
              <div className="text-xs text-blue-500 mt-1">
                Registered
              </div>
            </CardContent>
          </Card>

          {/* Total Entries Card */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-2">
                {stats.todayEntries}
              </div>
              <div className="text-sm sm:text-base font-medium text-green-700">
                Total Entries
              </div>
              <div className="text-xs text-green-500 mt-1">
                Today
              </div>
            </CardContent>
          </Card>

          {/* Total Exits Card */}
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold text-red-600 mb-2">
                {stats.todayExits}
              </div>
              <div className="text-sm sm:text-base font-medium text-red-700">
                Total Exits
              </div>
              <div className="text-xs text-red-500 mt-1">
                Today
              </div>
            </CardContent>
          </Card>

          {/* Total Activity Card */}
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-3xl sm:text-4xl font-bold text-purple-600 mb-2">
                {stats.todayEntries + stats.todayExits}
              </div>
              <div className="text-sm sm:text-base font-medium text-purple-700">
                Total Activity
              </div>
              <div className="text-xs text-purple-500 mt-1">
                Today
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Auto-reload Indicator with Manual Refresh */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Auto-refreshing every 5 seconds</span>
            <span className={`text-xs px-2 py-1 rounded ${
              dataSource === 'mongodb'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {dataSource === 'mongodb' ? '�️ Shared MongoDB' : '💾 Local Fallback'}
            </span>
            {lastUpdated && (
              <span className="text-xs text-gray-400">
                • {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>

        </div>

        {/* Add Student Button */}
        {!showAddForm && !editingStudent && (
          <Card>
            <CardContent className="p-6">
              <Button onClick={() => setShowAddForm(true)} className="w-full h-16 text-lg" disabled={loading}>
                <UserPlus className="mr-2 h-6 w-6" />
                Add New Student
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Student Form */}
        {(showAddForm || editingStudent) && (
          <Card>
            <CardHeader>
              <CardTitle>{editingStudent ? "Edit Student" : "Add New Student"}</CardTitle>
              <CardDescription>
                {editingStudent ? "Update student information" : "Fill required fields to register a new student"} -
                Data will be saved in {storageInfo.mode} storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Student Photo Upload Section */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Student Photo *</Label>

                {/* Image Preview */}
                {imagePreview ? (
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Student preview"
                        className="w-32 h-32 rounded-full border-4 border-blue-200 object-cover"
                      />
                      <Button
                        onClick={removeImage}
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-green-600">✅ Photo uploaded successfully</p>
                      <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                        <Upload className="mr-2 h-4 w-4" />
                        Change Photo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <ImageIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">Upload student photo (Required)</p>
                    <div className="flex justify-center space-x-4">
                      <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Photo
                      </Button>
                      <Button onClick={takePhoto} variant="outline">
                        <Camera className="mr-2 h-4 w-4" />
                        Take Photo
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Supported formats: JPG, PNG, GIF (Max 5MB)</p>
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              <Separator />

              {/* Student Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Student Name *</Label>
                  <Input
                    id="name"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    placeholder="Enter full name"
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                    placeholder="10-digit phone number"
                    maxLength={10}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    placeholder="student@example.com"
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="class">Class *</Label>
                  <Select
                    value={newStudent.class}
                    onValueChange={(value) => setNewStudent({ ...newStudent, class: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10th-A">10th A</SelectItem>
                      <SelectItem value="10th-B">10th B</SelectItem>
                      <SelectItem value="10th-C">10th C</SelectItem>
                      <SelectItem value="11th-A">11th A</SelectItem>
                      <SelectItem value="11th-B">11th B</SelectItem>
                      <SelectItem value="11th-C">11th C</SelectItem>
                      <SelectItem value="12th-A">12th A</SelectItem>
                      <SelectItem value="12th-B">12th B</SelectItem>
                      <SelectItem value="12th-C">12th C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={newStudent.department}
                    onValueChange={(value) => setNewStudent({ ...newStudent, department: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="Commerce">Commerce</SelectItem>
                      <SelectItem value="Arts">Arts</SelectItem>
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="schedule">Time Schedule</Label>
                  <Select
                    value={newStudent.schedule}
                    onValueChange={(value) => setNewStudent({ ...newStudent, schedule: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Morning Shift (8:00 AM - 2:00 PM)">
                        Morning Shift (8:00 AM - 2:00 PM)
                      </SelectItem>
                      <SelectItem value="Afternoon Shift (2:00 PM - 8:00 PM)">
                        Afternoon Shift (2:00 PM - 8:00 PM)
                      </SelectItem>
                      <SelectItem value="Full Day (8:00 AM - 4:00 PM)">Full Day (8:00 AM - 4:00 PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                {editingStudent ? (
                  <Button onClick={handleUpdateStudent} className="flex-1" disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? "Updating..." : "Update Student"}
                  </Button>
                ) : (
                  <Button onClick={handleAddStudent} className="flex-1" disabled={loading}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {loading ? "Adding..." : "Add Student"}
                  </Button>
                )}
                <Button onClick={resetForm} variant="outline" className="flex-1 bg-transparent" disabled={loading}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Students List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">
                  Registered Students ({filteredStudents.length}{searchQuery && ` of ${students.length}`})
                </CardTitle>
                <CardDescription className="text-sm">
                  All registered students with their login credentials - Stored in {storageInfo.mode} storage
                </CardDescription>
              </div>
              <div className="w-full sm:w-72">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 text-sm"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-xl text-gray-500 mb-2">No students registered yet</p>
                <p className="text-gray-400">Click "Add New Student" to get started</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-xl text-gray-500 mb-2">No students found</p>
                <p className="text-gray-400">Try adjusting your search terms</p>
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery("")}
                  className="mt-4"
                >
                  Clear Search
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border gap-3 sm:gap-0">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <img
                        src={student.image_url || "/placeholder.svg?height=60&width=60"}
                        alt={student.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-gray-200 object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base sm:text-lg truncate">{student.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {student.class} {student.department && `- ${student.department}`}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">{student.phone}</p>
                        {student.email && <p className="text-xs text-gray-400 truncate">{student.email}</p>}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      {/* Login Credentials */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            App: {student.application_number}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(student.application_number, "app")}
                            className="h-6 w-6 p-0"
                          >
                            {copiedText === `app-${student.application_number}` ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Phone: {student.phone}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(student.phone, "phone")}
                            className="h-6 w-6 p-0"
                          >
                            {copiedText === `phone-${student.phone}` ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 justify-end sm:justify-start">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditStudent(student)}
                          disabled={loading}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteStudent(student)}
                          disabled={loading}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Instructions - {storageInfo.mode} Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-blue-700 mb-2">Required Fields:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>✅ Student Name (Full name required)</li>
                  <li>✅ Phone Number (10 digits, unique)</li>
                  <li>✅ Class Selection (from dropdown)</li>
                  <li>✅ Student Photo (Upload or camera)</li>
                  <li>📝 Email (Optional)</li>
                  <li>📝 Department (Optional)</li>
                  <li>📝 Schedule (Optional)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-green-700 mb-2">Photo Requirements:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>📸 Clear face photo required</li>
                  <li>📸 JPG, PNG, GIF formats supported</li>
                  <li>📸 Maximum file size: 5MB</li>
                  <li>📸 Upload from device or take with camera</li>
                  <li>📸 Used for face verification at station</li>
                  <li>📸 Can be changed during editing</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label, color }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6 flex items-center">
      <span className={`text-${color}-500 text-3xl mr-4`}>{icon}</span>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-gray-600">{label}</div>
      </div>
    </div>
  );
}

const UserIcon = () => <Users className="h-6 w-6 text-blue-600" />
const EntryIcon = () => <Activity className="h-6 w-6 text-green-600" />
const ExitIcon = () => <X className="h-6 w-6 text-red-600" />
const TotalIcon = () => <Database className="h-6 w-6 text-purple-600" />
const RemainIcon = () => <Badge className="h-6 w-6 text-orange-600" />

