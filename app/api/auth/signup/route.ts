import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { hashPassword, generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 })
    }

    // Create new user
    const hashedPassword = await hashPassword(password)
    const newUser = {
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      profilePhoto: "",
      location: "",
      availability: "available" as const,
      skillsOffered: [],
      skillsWanted: [],
      isPublic: true,
      rating: 5,
      isAdmin: false,
      isBanned: false,
      createdAt: new Date(),
    }

    const result = await db.collection("users").insertOne(newUser)
    const token = generateToken(result.insertedId.toString())

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: result.insertedId.toString(),
        email: newUser.email,
        name: newUser.name,
        isAdmin: newUser.isAdmin,
      },
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
