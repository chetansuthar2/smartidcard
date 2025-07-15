import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(req: NextRequest) {
  try {
    console.log("🧪 Testing database connection...")
    
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI not found in environment")
      return NextResponse.json({ 
        success: false, 
        error: "MONGODB_URI not configured",
        env: process.env.NODE_ENV
      })
    }

    console.log("🔗 MongoDB URI found, attempting connection...")
    
    if (!clientPromise) {
      console.error("❌ MongoDB client promise not available")
      return NextResponse.json({ 
        success: false, 
        error: "MongoDB client not initialized"
      })
    }

    const client = await clientPromise
    if (!client) {
      console.error("❌ Failed to get MongoDB client")
      return NextResponse.json({ 
        success: false, 
        error: "Failed to connect to MongoDB"
      })
    }

    console.log("✅ MongoDB client connected, testing database...")
    
    const db = client.db("idcard")
    const students = db.collection("students")
    const entries = db.collection("entry_logs")

    // Test collections
    const studentCount = await students.countDocuments()
    const entryCount = await entries.countDocuments()

    console.log("📊 Database stats:", { studentCount, entryCount })

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      stats: {
        students: studentCount,
        entries: entryCount
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("❌ Database test failed:", error)
    return NextResponse.json({
      success: false,
      error: "Database connection failed",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
