import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(req: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db("idcard")
    const students = db.collection("students")

    // Check how many students don't have address field
    const studentsWithoutAddress = await students.countDocuments({
      address: { $exists: false }
    })

    console.log(`Found ${studentsWithoutAddress} students without address field`)

    if (studentsWithoutAddress > 0) {
      // Add address field to all students who don't have it
      const result = await students.updateMany(
        { address: { $exists: false } },
        { 
          $set: { 
            address: null,
            updatedAt: new Date()
          } 
        }
      )

      console.log(`Updated ${result.modifiedCount} students with address field`)
      
      return NextResponse.json({ 
        success: true, 
        message: `Updated ${result.modifiedCount} students with address field`,
        studentsUpdated: result.modifiedCount
      })
    } else {
      return NextResponse.json({ 
        success: true, 
        message: 'All students already have address field',
        studentsUpdated: 0
      })
    }

  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to migrate address field" 
    }, { status: 500 })
  }
}
