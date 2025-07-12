"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2 } from "lucide-react"
import { doc, getDoc, addDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { User } from "@/types"

export default function RequestPage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [targetUser, setTargetUser] = useState<User | null>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    offeredSkill: "",
    wantedSkill: "",
    message: "",
  })

  useEffect(() => {
    if (!currentUser) {
      router.push("/auth")
      return
    }
    fetchUsers()
  }, [currentUser, params.id, router])

  const fetchUsers = async () => {
    if (!currentUser) return

    try {
      const targetUserDoc = await getDoc(doc(db, "users", params.id as string))
      const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid))

      if (targetUserDoc.exists() && currentUserDoc.exists()) {
        setTargetUser(targetUserDoc.data() as User)
        setCurrentUserProfile(currentUserDoc.data() as User)
      } else {
        setError("Failed to load user information")
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      setError("Failed to load user information")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !formData.offeredSkill || !formData.wantedSkill) return

    setSubmitting(true)
    setMessage("")
    setError("")

    try {
      const existingRequestQuery = query(
        collection(db, "requests"),
        where("senderId", "==", currentUser.uid),
        where("recipientId", "==", params.id),
        where("status", "==", "pending")
      )

      const existingRequests = await getDocs(existingRequestQuery)

      if (!existingRequests.empty) {
        setError("You already have a pending request with this user")
        return
      }

      await addDoc(collection(db, "requests"), {
        senderId: currentUser.uid,
        recipientId: params.id,
        offeredSkill: formData.offeredSkill,
        wantedSkill: formData.wantedSkill,
        message: formData.message,
        status: "pending",
        createdAt: new Date(),
        senderData: {
          name: currentUser.name,
          profilePhoto: currentUser.profilePhoto,
        },
        recipientData: {
          name: targetUser?.name,
          profilePhoto: targetUser?.profilePhoto,
        },
      })

      setMessage("Request sent successfully!")
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error) {
      console.error("Error sending request:", error)
      setError("Failed to send request")
    } finally {
      setSubmitting(false)
    }
  }

  if (!currentUser) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !targetUser || !currentUserProfile) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Unable to Load</h2>
              <p className="text-muted-foreground mb-6">
                {error || "User information could not be loaded"}
              </p>
              <Button onClick={() => router.push("/")} className="bg-primary hover:bg-primary/80">
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage
                  src={targetUser.profilePhoto || "/placeholder.svg?height=40&width=40"}
                  alt={targetUser.name}
                />
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  {targetUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>Send Skill Swap Request to {targetUser.name}</span>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="offeredSkill">Your Skill to Offer</Label>
                <Select
                  value={formData.offeredSkill}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, offeredSkill: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a skill you want to offer" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentUserProfile.skillsOffered.map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentUserProfile.skillsOffered.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    You need to add skills to your profile first.{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-primary"
                      onClick={() => router.push("/profile")}
                    >
                      Update Profile
                    </Button>
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="wantedSkill">Skill You Want from {targetUser.name}</Label>
                <Select
                  value={formData.wantedSkill}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, wantedSkill: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a skill you want to learn" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetUser.skillsOffered.map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Tell them why you'd like to swap skills..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, message: e.target.value }))
                  }
                  rows={4}
                />
              </div>

              {message && (
                <Alert className="border border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">
                    {message}
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={submitting || !formData.offeredSkill || !formData.wantedSkill}
                  className="flex-1 bg-primary hover:bg-primary/80 text-primary-foreground"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Request"
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}