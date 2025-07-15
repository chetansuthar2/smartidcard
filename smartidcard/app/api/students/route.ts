import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest) {
  try {
    console.log("📡 GET /api/students - Starting request")

    if (!clientPromise) {
      console.error("❌ MongoDB client not available")
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const url = new URL(req.url)
    const appNumber = url.searchParams.get("application_number")
    const phone = url.searchParams.get("phone")

    console.log("🔍 Query params:", { appNumber, phone })

    const client = await clientPromise
    if (!client) {
      console.error("❌ Failed to connect to MongoDB")
      return NextResponse.json({ error: "Database connection failed" }, { status: 503 })
    }

    const db = client.db("idcard")
    const students = db.collection("students")

    const query: any = {}
    if (appNumber) query.application_number = appNumber
    if (phone) query.phone = phone

    console.log("🔍 MongoDB query:", query)
    const results = await students.find(query).sort({ created_at: -1 }).toArray()
    console.log("📊 Found students:", results.length)

    const data = results.map((s) => ({
      ...s,
      id: s._id.toString(),
    }))

    console.log("✅ GET /api/students - Success")
    return NextResponse.json(data)
  } catch (error) {
    console.error("❌ GET /api/students error:", error)
    return NextResponse.json({
      error: "Failed to fetch students",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("Received body:", body)
    const client = await clientPromise
    const db = client.db("idcard")
    const students = db.collection("students")

    const newStudent = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await students.insertOne(newStudent)
    console.log("Insert result:", result)
    return NextResponse.json({ ...newStudent, id: result.insertedId.toString() }, { status: 201 })
  } catch (error) {
    console.error("POST /api/students error:", error)
    return NextResponse.json({ error: "Failed to add student" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json()
    console.log("PUT /api/students - ID:", id)
    console.log("PUT /api/students - Updates:", updates)

    if (!id) {
      console.error("PUT /api/students - Missing ID")
      return NextResponse.json({ error: "Missing student ID" }, { status: 400 })
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      console.error("PUT /api/students - Invalid ObjectId format:", id)
      return NextResponse.json({ error: "Invalid student ID format" }, { status: 400 })
    }

    const client = await clientPromise
    if (!client) {
      console.error("PUT /api/students - Database connection failed")
      return NextResponse.json({ error: "Database connection failed" }, { status: 503 })
    }

    const db = client.db("idcard")
    const students = db.collection("students")

    // First check if student exists
    const existingStudent = await students.findOne({ _id: new ObjectId(id) })
    if (!existingStudent) {
      console.error("PUT /api/students - Student not found:", id)
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Update the student
    const updateData = {
      ...updates,
      updatedAt: new Date()
    }

    const result = await students.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    )

    console.log("PUT /api/students - Update result:", result ? "Success" : "Failed")

    if (!result) {
      console.error("PUT /api/students - Update operation failed")
      return NextResponse.json({ error: "Update operation failed" }, { status: 500 })
    }

    // MongoDB driver version compatibility - check both result and result.value
    const updatedStudent = result.value || result

    if (!updatedStudent) {
      console.error("PUT /api/students - No updated document returned")
      return NextResponse.json({ error: "Update failed - no document returned" }, { status: 500 })
    }

    console.log("PUT /api/students - Success:", updatedStudent._id)

    // Ensure proper response format
    const responseData = {
      ...updatedStudent,
      id: updatedStudent._id.toString(),
      // Ensure date fields are properly formatted
      createdAt: updatedStudent.createdAt || updatedStudent.created_at,
      updatedAt: updatedStudent.updatedAt || updatedStudent.updated_at
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("PUT /api/students error:", error)
    return NextResponse.json({
      error: "Failed to update student",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    console.log("🗑️ DELETE request received for student ID:", id)

    if (!id) {
      console.error("❌ Missing student ID in delete request")
      return NextResponse.json({ error: "Missing id" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("idcard")
    const students = db.collection("students")
    const entries = db.collection("entry_logs")

    // First, delete all entry/exit history for this student
    console.log("🗑️ Deleting all entries for student ID:", id)
    const entriesDeleteResult = await entries.deleteMany({ student_id: id })
    console.log(`📊 Deleted ${entriesDeleteResult.deletedCount} entry records`)

    // Then delete the student
    console.log("🔍 Attempting to delete student with ID:", id)
    const studentDeleteResult = await students.deleteOne({ _id: new ObjectId(id) })
    console.log("📊 Student delete result:", studentDeleteResult)

    if (studentDeleteResult.deletedCount === 0) {
      console.error("❌ Student not found with ID:", id)
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    console.log("✅ Student and all associated data deleted successfully:", id)
    return NextResponse.json({
      success: true,
      deletedEntries: entriesDeleteResult.deletedCount,
      message: `Student deleted along with ${entriesDeleteResult.deletedCount} entry records`
    })
  } catch (error) {
    console.error("❌ Error deleting student:", error)
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 })
  }
}