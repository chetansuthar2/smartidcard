import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const appNumber = url.searchParams.get("application_number")
    const phone = url.searchParams.get("phone")
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
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
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
    const client = await clientPromise
    const db = client.db("smartidcard")
    const students = db.collection("students")

    const result = await students.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: "after" }
    )
    if (!result || !result.value) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }
    const updated = result.value
    return NextResponse.json({ ...updated, id: updated._id.toString() })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const client = await clientPromise
    const db = client.db("smartidcard")
    const students = db.collection("students")

    const result = await students.deleteOne({ _id: new ObjectId(id) })
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 })
  }
}