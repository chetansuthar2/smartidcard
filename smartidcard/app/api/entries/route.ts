import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    console.log("📡 GET /api/entries - Starting request")

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const studentId = searchParams.get('studentId')

    console.log("🔍 Query params:", { date, studentId })

    // Quick database availability check
    if (!clientPromise) {
      console.error("❌ MongoDB client not available")
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Set a timeout for database operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timeout')), 8000) // 8 second timeout
    })

    const dbOperation = async () => {
      const client = await clientPromise
      if (!client) {
        throw new Error("Failed to connect to MongoDB")
      }

      const db = client.db("idcard")
      const entries = db.collection("entry_logs")

      let query: any = {}

      if (studentId) {
        // Support multiple student ID formats
        query.$or = [
          { student_id: studentId },
          { application_number: studentId },
          { student_name: { $regex: studentId, $options: 'i' } }
        ]
        console.log("🎯 Student-specific query for:", studentId)
      }

      if (date) {
        // Parse date in local timezone to avoid timezone issues
        const [year, month, day] = date.split('-').map(Number)
        const targetDate = new Date(year, month - 1, day, 0, 0, 0, 0)
        const nextDate = new Date(year, month - 1, day + 1, 0, 0, 0, 0)

        query.entry_time = {
          $gte: targetDate,
          $lt: nextDate
        }
      }

      console.log("🔍 MongoDB query:", JSON.stringify(query, null, 2))

      // Use limit to prevent large result sets
      const limit = studentId ? 100 : 50 // More results for specific student, fewer for general query
      const results = await entries.find(query)
        .sort({ entry_time: -1 })
        .limit(limit)
        .toArray()

      return results
    }

    // Race between database operation and timeout
    const results = await Promise.race([dbOperation(), timeoutPromise]) as any[]

    const processingTime = Date.now() - startTime
    console.log(`📊 Found ${results.length} entries in ${processingTime}ms`)

    const data = results.map((e) => ({
      ...e,
      id: e._id.toString(),
    }))

    console.log(`✅ GET /api/entries - Success, returning ${data.length} entries`)
    return NextResponse.json(data)

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`❌ GET /api/entries error after ${processingTime}ms:`, error)

    // Return appropriate error based on the type
    if (error instanceof Error && error.message.includes('timeout')) {
      return NextResponse.json(
        {
          error: "Database operation timeout",
          details: "The request took too long to process. Please try again.",
          timeout: true
        },
        { status: 408 } // Request Timeout
      )
    }

    return NextResponse.json(
      {
        error: "Failed to fetch entries",
        details: error instanceof Error ? error.message : "Unknown error",
        timeout: false
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, student_name, application_number, status, face_match_score } = body
    
    const entry = await dbStore.recordEntry({
      student_id,
      student_name,
      application_number,
      status,
      face_match_score,
      entryTime: new Date(),
    })
    
    return NextResponse.json(entry)
  } catch (error) {
    console.error("Error recording entry:", error)
    return NextResponse.json(
      { error: "Failed to record entry" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const studentId = searchParams.get('student_id')

    if (!id && !studentId) {
      return NextResponse.json(
        { error: "Entry ID or Student ID is required" },
        { status: 400 }
      )
    }

    if (studentId) {
      // Delete all entries for a student
      console.log("🗑️ Deleting all entries for student:", studentId)
      const deletedCount = await dbStore.deleteAllStudentEntries(studentId)
      console.log(`✅ Deleted ${deletedCount} entries for student ${studentId}`)
      return NextResponse.json({
        success: true,
        deletedCount,
        message: `Deleted ${deletedCount} entries for student`
      })
    } else {
      // Delete single entry
      await dbStore.deleteEntry(id!)
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error("Error deleting entry:", error)
    return NextResponse.json(
      { error: "Failed to delete entry" },
      { status: 500 }
    )
  }
}
