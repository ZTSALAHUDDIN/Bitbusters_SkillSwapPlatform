import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getAuthUser } from "@/lib/middleware"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid request ID" }, { status: 400 })
    }

    const body = await request.json()
    const { status, responseMessage } = body

    if (!["accepted", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const result = await db.collection("requests").updateOne(
      {
        _id: new ObjectId(params.id),
        recipientId: new ObjectId(authUser.userId),
        status: "pending",
      },
      {
        $set: {
          status,
          responseMessage: responseMessage?.trim() || "",
          respondedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Request not found or already responded" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid request ID" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const result = await db.collection("requests").deleteOne({
      _id: new ObjectId(params.id),
      $or: [{ senderId: new ObjectId(authUser.userId) }, { recipientId: new ObjectId(authUser.userId) }],
      status: "pending",
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Request not found or cannot be deleted" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
