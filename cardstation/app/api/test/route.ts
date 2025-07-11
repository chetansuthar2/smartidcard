import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(req: NextRequest) {
  try {
    console.log("Testing MongoDB connection...")
    
    if (!clientPromise) {
      return NextResponse.json({ 
        status: "error", 
        message: "MongoDB not configured",
        env: process.env.MONGODB_URI ? "URI exists" : "No URI"
      })
    }

    const client = await clientPromise
    if (!client) {
      return NextResponse.json({ 
        status: "error", 
        message: "MongoDB client failed to connect" 
      })
    }

    const db = client.db("idcard")
    const students = db.collection("students")
    const count = await students.countDocuments()
    
    return NextResponse.json({ 
      status: "success", 
      message: "MongoDB connected successfully",
      studentsCount: count,
      database: "idcard"
    })
  } catch (error) {
    console.error("MongoDB test error:", error)
    return NextResponse.json({ 
      status: "error", 
      message: "MongoDB connection failed",
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
}
