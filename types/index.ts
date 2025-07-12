export interface User {
  uid: string
  email: string
  name: string
  profilePhoto?: string
  location?: string
  availability: "available" | "busy" | "unavailable"
  skillsOffered: string[]
  skillsWanted: string[]
  isPublic: boolean
  rating: number
  isAdmin: boolean
  isBanned: boolean
  createdAt: Date
  updatedAt?: Date
}

export interface SkillRequest {
  id: string
  senderId: string
  recipientId: string
  offeredSkill: string
  wantedSkill: string
  message: string
  status: "pending" | "accepted" | "rejected"
  responseMessage?: string
  createdAt: Date
  respondedAt?: Date
  senderData?: {
    name: string
    profilePhoto?: string
  }
  recipientData?: {
    name: string
    profilePhoto?: string
  }
}
