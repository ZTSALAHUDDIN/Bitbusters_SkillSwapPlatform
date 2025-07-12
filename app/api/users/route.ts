import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import {
  collection,
  query,
  where,
  getDocs,
  limit as limitFn,
  startAfter,
  orderBy,
} from "firebase/firestore"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.toLowerCase() || ""
    const availability = searchParams.get("availability") || "all"
    const page = Number(searchParams.get("page") || "1")
    const itemsPerPage = 12

    const usersRef = collection(db, "users")

    const constraints: any[] = []

    // Filter for public users only
    constraints.push(where("isPublic", "==", true))

    // Filter by availability if selected
    if (availability !== "all") {
      constraints.push(where("availability", "==", availability))
    }

    // Firestore can't OR across multiple fields directly, so do client-side filter
    constraints.push(orderBy("name_lowercase"))

    const q = query(usersRef, ...constraints)

    const snapshot = await getDocs(q)

    let users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Client-side search on lowercased fields
    if (search) {
      users = users.filter((user) =>
        (user.skillsOffered_lowercase || []).includes(search) ||
        (user.skillsWanted_lowercase || []).includes(search) ||
        (user.name_lowercase || "").includes(search)
      )
    }

    // Pagination (simple client-side for now)
    const paginatedUsers = users.slice((page - 1) * itemsPerPage, page * itemsPerPage)

    return NextResponse.json({
      success: true,
      users: paginatedUsers,
      pagination: {
        page,
        total: users.length,
        pages: Math.ceil(users.length / itemsPerPage),
      },
    })
  } catch (error) {
    console.error("Firestore user fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}