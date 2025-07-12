"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Trash2, Send, Inbox, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { SkillRequest } from "@/types"

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<SkillRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user) {
      router.push("/auth")
      return
    }

    const recipientQuery = query(
      collection(db, "requests"),
      where("recipientId", "==", user.uid),
      orderBy("createdAt", "desc")
    )

    const senderQuery = query(
      collection(db, "requests"),
      where("senderId", "==", user.uid),
      orderBy("createdAt", "desc")
    )

    const unsubscribe1 = onSnapshot(recipientQuery, (recipientSnap) => {
      const recipientRequests: SkillRequest[] = []
      recipientSnap.forEach((doc) => recipientRequests.push({ id: doc.id, ...doc.data() } as SkillRequest))

      const unsubscribe2 = onSnapshot(senderQuery, (senderSnap) => {
        const senderRequests: SkillRequest[] = []
        senderSnap.forEach((doc) => senderRequests.push({ id: doc.id, ...doc.data() } as SkillRequest))

        const combined = [...recipientRequests, ...senderRequests]
        const unique = combined.filter((r, i, arr) => i === arr.findIndex((x) => x.id === r.id))

        setRequests(unique)
        setLoading(false)
      })

      return () => unsubscribe2()
    })

    return () => unsubscribe1()
  }, [user, router])

  const handleResponse = async (requestId: string, status: "accepted" | "rejected", message: string) => {
    if (!user) return
    try {
      await updateDoc(doc(db, "requests", requestId), {
        status,
        responseMessage: message,
        respondedAt: new Date(),
      })
    } catch (err) {
      console.error("Error responding to request:", err)
      setError("Failed to respond to request")
    }
  }

  const handleDelete = async (requestId: string) => {
    if (!user) return
    try {
      await deleteDoc(doc(db, "requests", requestId))
    } catch (err) {
      console.error("Error deleting request:", err)
      setError("Failed to delete request")
    }
  }

  if (!user) return null
  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading requests...</span>
          </div>
        </div>
      </div>
    )
  }

  const received = requests.filter((r) => r.recipientId === user.uid)
  const sent = requests.filter((r) => r.senderId === user.uid)

  const RequestCard = ({ request, isReceived }: { request: SkillRequest; isReceived: boolean }) => {
    const otherUser = isReceived ? request.senderData : request.recipientData
    const [isResponding, setIsResponding] = useState(false)
    const [localMessage, setLocalMessage] = useState("")

    if (!otherUser) return null

    return (
      <Card className="mb-4 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={otherUser.profilePhoto || "/placeholder.svg"} alt={otherUser.name} />
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  {otherUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{otherUser.name}</h3>
                <p className="text-sm text-muted-foreground">{new Date(request.createdAt.toDate()).toLocaleDateString()}</p>
              </div>
            </div>
            <Badge
              variant={request.status === "accepted" ? "default" : request.status === "rejected" ? "destructive" : "secondary"}
            >
              {request.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">{isReceived ? "They offer" : "You offered"}</Label>
              <Badge variant="outline" className="block w-fit mt-1">
                {request.offeredSkill}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium">
                {isReceived ? "You teach" : "You want to learn"}
              </Label>
              <Badge variant="outline" className="block w-fit mt-1">
                {request.wantedSkill}
              </Badge>
            </div>
          </div>

          {request.message && (
            <div>
              <Label className="text-sm font-medium">Message</Label>
              <p className="text-sm text-muted-foreground mt-1 p-3 bg-secondary rounded">{request.message}</p>
            </div>
          )}

          {request.responseMessage && (
            <div>
              <Label className="text-sm font-medium">Response</Label>
              <p className="text-sm text-muted-foreground mt-1 p-3 bg-secondary rounded">{request.responseMessage}</p>
            </div>
          )}

          {isReceived && request.status === "pending" && (
            <div className="space-y-3">
              {isResponding && (
                <div>
                  <Label htmlFor="response">Response Message (Optional)</Label>
                  <Textarea
                    id={`response-${request.id}`}
                    value={localMessage}
                    onChange={(e) => setLocalMessage(e.target.value)}
                    placeholder="Add a message with your response..."
                    rows={3}
                  />
                </div>
              )}

              <div className="flex space-x-2">
                {!isResponding ? (
                  <Button onClick={() => setIsResponding(true)} variant="outline">
                    Respond
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => handleResponse(request.id, "accepted", localMessage)} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" /> Accept
                    </Button>
                    <Button onClick={() => handleResponse(request.id, "rejected", localMessage)} variant="destructive">
                      <XCircle className="h-4 w-4 mr-2" /> Reject
                    </Button>
                    <Button onClick={() => { setIsResponding(false); setLocalMessage("") }} variant="outline">
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {request.status === "pending" && (
            <div className="flex justify-end">
              <Button onClick={() => handleDelete(request.id)} variant="outline" size="sm" className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Skill Swap Dashboard</h1>

        {error && <div className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-6"><p className="text-destructive">{error}</p></div>}

        <Tabs defaultValue="received" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received" className="flex items-center">
              <Inbox className="h-4 w-4 mr-2" /> Received ({received.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center">
              <Send className="h-4 w-4 mr-2" /> Sent ({sent.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-6">
            {received.length === 0 ? (
              <Card><CardContent className="text-center py-12"><Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-medium mb-2">No requests received</h3><p className="text-muted-foreground">When others request skill swaps from you, they'll appear here.</p></CardContent></Card>
            ) : (
              <>{received.map((r) => <RequestCard key={r.id} request={r} isReceived />)}</>
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-6">
            {sent.length === 0 ? (
              <Card><CardContent className="text-center py-12"><Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-medium mb-2">No requests sent</h3><p className="text-muted-foreground mb-4">Start by browsing users and requesting skill swaps.</p><Button onClick={() => router.push("/")} className="bg-primary hover:bg-primary/80">Browse Users</Button></CardContent></Card>
            ) : (
              <>{sent.map((r) => <RequestCard key={r.id} request={r} isReceived={false} />)}</>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}