import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const studentId = searchParams.get('studentId')

    if (!clientPromise) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const client = await clientPromise
    if (!client) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 503 })
    }

    const db = client.db("idcard")
    const entries = db.collection("entry_logs")

    let query: any = {}

    if (studentId) {
      query.student_id = studentId
    }

    if (date) {
      const targetDate = new Date(date)
      targetDate.setHours(0, 0, 0, 0)
      const nextDate = new Date(targetDate)
      nextDate.setDate(nextDate.getDate() + 1)

      query.entry_time = {
        $gte: targetDate,
        $lt: nextDate
      }
    }

    const results = await entries.find(query).sort({ entry_time: -1 }).toArray()
    const data = results.map((e) => ({
      ...e,
      id: e._id.toString(),
    }))

    console.log(`✅ Fetched ${data.length} entries from MongoDB`)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching entries:", error)
    return NextResponse.json(
      { error: "Failed to fetch entries" },
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
    
    if (!id) {
      return NextResponse.json(
        { error: "Entry ID is required" },
        { status: 400 }
      )
    }
    
    await dbStore.deleteEntry(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting entry:", error)
    return NextResponse.json(
      { error: "Failed to delete entry" },
      { status: 500 }
    )
  }
}
