import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const studentId = url.searchParams.get("student_id")

    if (!clientPromise) {
      // MongoDB not available, return empty array - no test data
      console.log("MongoDB not available, returning empty entries array")
      return NextResponse.json([])
    }

    const client = await clientPromise
    if (!client) {
      return NextResponse.json([])
    }

    const db = client.db("idcard")
    const entries = db.collection("entry_logs")

    const query: any = {}
    if (studentId) query.student_id = studentId

    const results = await entries.find(query).sort({ entry_time: -1 }).toArray()
    const data = results.map((e) => ({
      ...e,
      id: e._id.toString(),
    }))
    return NextResponse.json(data)

    // MongoDB code commented out for testing - uncomment when MongoDB is available
    /*
    const client = await clientPromise
    if (!client) {
      return NextResponse.json([])
    }

    const db = client.db("idcard")
    const entries = db.collection("entry_logs")

    const query: any = {}
    if (studentId) query.student_id = studentId

    const results = await entries.find(query).sort({ entry_time: -1 }).toArray()
    const data = results.map((e) => ({
      ...e,
      id: e._id.toString(),
    }))
    return NextResponse.json(data)
    */
  } catch (error) {
    console.error("GET /api/entries error:", error)
    // Return empty array - no test data
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("Received entry body:", body)

    if (!clientPromise) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const client = await clientPromise
    if (!client) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 503 })
    }

    const db = client.db("idcard")
    const entries = db.collection("entry_logs")

    // Check if student is already inside (has entry today without exit)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingEntry = await entries.findOne({
      student_id: body.student_id,
      entry_time: {
        $gte: today,
        $lt: tomorrow
      },
      exit_time: null
    })

    if (existingEntry) {
      // Student is inside, mark exit
      const result = await entries.findOneAndUpdate(
        { _id: existingEntry._id },
        {
          $set: {
            exit_time: new Date(),
            status: "exit",
            updated_at: new Date()
          }
        },
        { returnDocument: "after" }
      )
      if (!result || !result.value) {
        return NextResponse.json({ error: "Failed to update entry" }, { status: 500 })
      }
      console.log("Exit recorded for student:", body.student_name)
      return NextResponse.json({ ...result.value, id: result.value._id.toString() })
    } else {
      // New entry with enhanced verification data
      const newEntry = {
        ...body,
        entry_time: new Date(),
        status: "entry",
        verified: true,
        verification_method: body.verification_method || "qr_and_face",
        face_match_score: body.face_match_score || null,
        qr_validated: body.qr_validated !== undefined ? body.qr_validated : true,
        verification_timestamp: body.verification_timestamp || new Date().toISOString(),
        station_id: body.station_id || "main_entrance",
        created_at: new Date(),
        updated_at: new Date(),
      }

      const result = await entries.insertOne(newEntry)
      console.log("Entry recorded for student:", body.student_name)
      return NextResponse.json({ ...newEntry, id: result.insertedId.toString() }, { status: 201 })
    }
  } catch (error) {
    console.error("POST /api/entries error:", error)
    return NextResponse.json({ error: "Failed to add entry" }, { status: 500 })
  }
}