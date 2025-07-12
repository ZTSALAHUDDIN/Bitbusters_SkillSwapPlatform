import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getAuthUser } from "@/lib/middleware"

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const client = await clientPromise
    const db = client.db("skillswap")

    const adminUser = await db.collection("users").findOne({ _id: new ObjectId(authUser.userId) })
    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Store announcement in database
    await db.collection("announcements").insertOne({
      message,
      createdBy: new ObjectId(authUser.userId),
      createdAt: new Date(),
    })

    // In a real app, you would send notifications to all users here
    // For now, we'll just return success

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Create announcement error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
