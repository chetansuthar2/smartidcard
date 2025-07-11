"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserCog, User, LogIn, AlertCircle, Shield, Smartphone } from "lucide-react"
import { dbStore } from "@/lib/database-store"

export default function LoginPage() {
  const [adminCredentials, setAdminCredentials] = useState({
    username: "",
    password: "",
  })
  const [studentCredentials, setStudentCredentials] = useState({
    applicationNumber: "",
    phone: "",
  })
  const [adminError, setAdminError] = useState("")
  const [studentError, setStudentError] = useState("")
  const [adminLoading, setAdminLoading] = useState(false)
  const [studentLoading, setStudentLoading] = useState(false)
  const router = useRouter()

  // Admin Login Handler
  const handleAdminLogin = async () => {
    setAdminError("")
    setAdminLoading(true)

    if (!adminCredentials.username || !adminCredentials.password) {
      setAdminError("Please enter both username and password")
      setAdminLoading(false)
      return
    }

    try {
      const isAuthenticated = await dbStore.authenticateAdmin(adminCredentials.username, adminCredentials.password)

      if (isAuthenticated) {
        // Store admin session
        if (typeof window !== "undefined") {
          localStorage.setItem("adminLoggedIn", "true")
          localStorage.setItem("adminUsername", adminCredentials.username)
        }
        router.push("/admin")
      } else {
        setAdminError("Invalid username or password")
      }
    } catch (error) {
      setAdminError("Login failed. Please try again.")
    } finally {
      setAdminLoading(false)
    }
  }

  // Student Login Handler
  const handleStudentLogin = async () => {
    setStudentError("")
    setStudentLoading(true)

    if (!studentCredentials.applicationNumber || !studentCredentials.phone) {
      setStudentError("Please fill both Application Number and Phone Number")
      setStudentLoading(false)
      return
    }

    try {
      const student = await dbStore.getStudentByAppAndPhone(
        studentCredentials.applicationNumber,
        studentCredentials.phone,
      )

      if (student) {
        // Store student session
        if (typeof window !== "undefined") {
          localStorage.setItem("studentLoggedIn", "true")
          localStorage.setItem("studentId", student.id)
          localStorage.setItem("studentAppNumber", student.application_number)
        }
        router.push("/student")
      } else {
        const studentByApp = await dbStore.getStudentByAppNumber(studentCredentials.applicationNumber)
        if (studentByApp) {
          setStudentError(`Application Number found but phone number doesn't match. Expected: ${studentByApp.phone}`)
        } else {
          setStudentError(
            `Application Number "${studentCredentials.applicationNumber}" not found. Please check with admin.`,
          )
        }
      }
    } catch (error) {
      setStudentError("Login failed. Please try again.")
    } finally {
      setStudentLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent, type: "admin" | "student") => {
    if (e.key === "Enter") {
      if (type === "admin") {
        handleAdminLogin()
      } else {
        handleStudentLogin()
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto space-y-6 pt-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-4 rounded-full">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-blue-800">Smart ID Card System</h1>
          <p className="text-gray-600">Complete Student Management & Entry System</p>
        </div>

        {/* Login Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">System Login</CardTitle>
            <CardDescription className="text-center">Choose your login type to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="admin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  Admin
                </TabsTrigger>
                <TabsTrigger value="student" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Student
                </TabsTrigger>
              </TabsList>

              {/* Admin Login Tab */}
              <TabsContent value="admin" className="space-y-4 mt-6">
                <div className="text-center mb-4">
                  <UserCog className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <h3 className="font-semibold text-blue-700">Admin Login</h3>
                  <p className="text-sm text-gray-600">Manage students and system settings</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="admin-username">Username</Label>
                    <Input
                      id="admin-username"
                      value={adminCredentials.username}
                      onChange={(e) => setAdminCredentials({ ...adminCredentials, username: e.target.value })}
                      placeholder="Enter admin username"
                      onKeyPress={(e) => handleKeyPress(e, "admin")}
                      disabled={adminLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin-password">Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      value={adminCredentials.password}
                      onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
                      placeholder="Enter admin password"
                      onKeyPress={(e) => handleKeyPress(e, "admin")}
                      disabled={adminLoading}
                    />
                  </div>

                  {adminError && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">{adminError}</AlertDescription>
                    </Alert>
                  )}

                  <Button onClick={handleAdminLogin} className="w-full" disabled={adminLoading}>
                    <LogIn className="mr-2 h-4 w-4" />
                    {adminLoading ? "Logging in..." : "Login as Admin"}
                  </Button>
                </div>

                {/* Admin Demo Credentials */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-700 mb-1">Demo Credentials:</p>
                  <p className="text-xs text-blue-600">
                    Username: <strong>admin</strong>
                  </p>
                  <p className="text-xs text-blue-600">
                    Password: <strong>admin123</strong>
                  </p>
                </div>
              </TabsContent>

              {/* Student Login Tab */}
              <TabsContent value="student" className="space-y-4 mt-6">
                <div className="text-center mb-4">
                  <User className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <h3 className="font-semibold text-green-700">Student Login</h3>
                  <p className="text-sm text-gray-600">Access your digital ID card and history</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="student-app">Application Number</Label>
                    <Input
                      id="student-app"
                      value={studentCredentials.applicationNumber}
                      onChange={(e) =>
                        setStudentCredentials({ ...studentCredentials, applicationNumber: e.target.value })
                      }
                      placeholder="e.g: APP20241234"
                      onKeyPress={(e) => handleKeyPress(e, "student")}
                      disabled={studentLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="student-phone">Phone Number</Label>
                    <Input
                      id="student-phone"
                      value={studentCredentials.phone}
                      onChange={(e) => setStudentCredentials({ ...studentCredentials, phone: e.target.value })}
                      placeholder="e.g: 9876543210"
                      maxLength={10}
                      onKeyPress={(e) => handleKeyPress(e, "student")}
                      disabled={studentLoading}
                    />
                  </div>

                  {studentError && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">{studentError}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleStudentLogin}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={studentLoading}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    {studentLoading ? "Logging in..." : "Login as Student"}
                  </Button>
                </div>

                {/* Student Login Info */}
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-700 mb-1">Login Information:</p>
                  <p className="text-xs text-green-600">• Get Application Number from Admin</p>
                  <p className="text-xs text-green-600">• Use your registered phone number</p>
                  <p className="text-xs text-green-600">• Both details must match exactly</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* System Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">System Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <UserCog className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Admin Panel</p>
                  <p className="text-xs text-gray-600">Student registration & management</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Smartphone className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Student App</p>
                  <p className="text-xs text-gray-600">Digital ID card & entry history</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Start Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-blue-600">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium">Admin Setup</p>
                  <p className="text-xs text-gray-600">Login as admin → Add students → Generate credentials</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-green-600">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium">Student Access</p>
                  <p className="text-xs text-gray-600">Login with App Number + Phone → View digital ID card</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
