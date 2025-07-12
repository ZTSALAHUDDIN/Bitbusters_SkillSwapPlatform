import type { NextRequest } from "next/server"
import { verifyToken } from "./auth"

export function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.replace("Bearer ", "")
  return verifyToken(token)
}
