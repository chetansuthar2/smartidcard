import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const appNumber = url.searchParams.get("application_number")
    const phone = url.searchParams.get("phone")

    if (!clientPromise) {
      // MongoDB not available, return empty array
      console.log("MongoDB not available, returning empty students array")
      return NextResponse.json([])
    }

    const client = await clientPromise
    const db = client.db("idcard")
    const students = db.collection("students")

    const query: any = {}
    if (appNumber) query.application_number = appNumber
    if (phone) query.phone = phone

    const results = await students.find(query).sort({ createdAt: -1 }).toArray()
    const data = results.map((s) => ({
      ...s,
      id: s._id.toString(),
    }))
    return NextResponse.json(data)
  } catch (error) {
    console.error("GET /api/students error:", error)
    // Return empty array instead of error for better UX
    return NextResponse.json([])
  }
}

// Cardstation only needs to READ student data for validation
// Admin functions (POST, PUT, DELETE) are handled by smartidcard app

