import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getAuthUser } from "@/lib/middleware"

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { recipientId, offeredSkill, wantedSkill, message } = body

    if (!recipientId || !offeredSkill || !wantedSkill) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!ObjectId.isValid(recipientId)) {
      return NextResponse.json({ error: "Invalid recipient ID" }, { status: 400 })
    }

    if (authUser.userId === recipientId) {
      return NextResponse.json({ error: "Cannot send request to yourself" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if recipient exists
    const recipient = await db.collection("users").findOne({ _id: new ObjectId(recipientId) })
    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 })
    }

    // Check for existing pending request
    const existingRequest = await db.collection("requests").findOne({
      senderId: new ObjectId(authUser.userId),
      recipientId: new ObjectId(recipientId),
      status: "pending",
    })

    if (existingRequest) {
      return NextResponse.json({ error: "You already have a pending request with this user" }, { status: 400 })
    }

    const newRequest = {
      senderId: new ObjectId(authUser.userId),
      recipientId: new ObjectId(recipientId),
      offeredSkill: offeredSkill.trim(),
      wantedSkill: wantedSkill.trim(),
      message: message?.trim() || "",
      status: "pending" as const,
      createdAt: new Date(),
    }

    const result = await db.collection("requests").insertOne(newRequest)

    return NextResponse.json({
      success: true,
      requestId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Create request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const requests = await db
      .collection("requests")
      .aggregate([
        {
          $match: {
            $or: [{ senderId: new ObjectId(authUser.userId) }, { recipientId: new ObjectId(authUser.userId) }],
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "senderId",
            foreignField: "_id",
            as: "sender",
            pipeline: [{ $project: { name: 1, profilePhoto: 1 } }],
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "recipientId",
            foreignField: "_id",
            as: "recipient",
            pipeline: [{ $project: { name: 1, profilePhoto: 1 } }],
          },
        },
        {
          $unwind: "$sender",
        },
        {
          $unwind: "$recipient",
        },
        {
          $sort: { createdAt: -1 },
        },
      ])
      .toArray()

    return NextResponse.json({
      success: true,
      requests: requests.map((req) => ({
        ...req,
        _id: req._id.toString(),
        senderId: req.senderId.toString(),
        recipientId: req.recipientId.toString(),
        sender: {
          ...req.sender,
          _id: req.sender._id.toString(),
        },
        recipient: {
          ...req.recipient,
          _id: req.recipient._id.toString(),
        },
      })),
    })
  } catch (error) {
    console.error("Get requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
