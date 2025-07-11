"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserCog, LogIn, Home, AlertCircle } from "lucide-react"
import { dbStore } from "@/lib/database-store"
import Link from "next/link"

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    setError("")
    setLoading(true)

    if (!credentials.username || !credentials.password) {
      setError("Please enter both username and password")
      setLoading(false)
      return
    }

    try {
      const isAuthenticated = await dbStore.authenticateAdmin(credentials.username, credentials.password)

      if (isAuthenticated) {
        // Store admin session
        if (typeof window !== "undefined") {
          localStorage.setItem("adminLoggedIn", "true")
          localStorage.setItem("adminUsername", credentials.username)
        }
        router.push("/admin")
      } else {
        setError("Invalid username or password")
      }
    } catch (error) {
      setError("Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6 pt-20">
        <Card>
          <CardHeader className="text-center">
            <UserCog className="h-12 w-12 mx-auto text-blue-600" />
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>Enter your admin credentials to access the panel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                placeholder="Enter username"
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                placeholder="Enter password"
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleLogin} className="w-full" disabled={loading}>
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? "Logging in..." : "Login"}
            </Button>

            <Link href="/">
              <Button variant="outline" className="w-full bg-transparent">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Demo Credentials</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <strong>Username:</strong> admin
            </p>
            <p>
              <strong>Password:</strong> admin123
            </p>
            <p className="text-gray-600 mt-2">Use these credentials to access the admin panel</p>

            <Alert className="border-blue-200 bg-blue-50 mt-4">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                System works with or without database connection. Demo mode available if database is not configured.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
