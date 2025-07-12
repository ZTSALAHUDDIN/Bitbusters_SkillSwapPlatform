"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Users, MessageSquare, Ban, Shield, Download, Search, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { collection, query, onSnapshot, doc, updateDoc, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { User, SkillRequest } from "@/types"

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [requests, setRequests] = useState<SkillRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user) {
      router.push("/auth")
      return
    }
    if (!user.isAdmin) {
      router.push("/")
      return
    }

    // Set up real-time listeners
    const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"))
    const requestsQuery = query(collection(db, "requests"), orderBy("createdAt", "desc"))

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const fetchedUsers: User[] = []
      snapshot.forEach((doc) => {
        fetchedUsers.push(doc.data() as User)
      })
      setUsers(fetchedUsers)
    })

    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      const fetchedRequests: SkillRequest[] = []
      snapshot.forEach((doc) => {
        fetchedRequests.push({ id: doc.id, ...doc.data() } as SkillRequest)
      })
      setRequests(fetchedRequests)
      setLoading(false)
    })

    return () => {
      unsubscribeUsers()
      unsubscribeRequests()
    }
  }, [user, router])

  const handleBanUser = async (userId: string, ban: boolean) => {
    if (!user) return

    try {
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, {
        isBanned: ban,
        updatedAt: new Date(),
      })

      setMessage(`User ${ban ? "banned" : "unbanned"} successfully`)
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Error updating user:", error)
      setError("Failed to update user status")
    }
  }

  const downloadReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      totalUsers: users.length,
      activeUsers: users.filter((u) => !u.isBanned).length,
      bannedUsers: users.filter((u) => u.isBanned).length,
      totalRequests: requests.length,
      pendingRequests: requests.filter((r) => r.status === "pending").length,
      acceptedRequests: requests.filter((r) => r.status === "accepted").length,
      rejectedRequests: requests.filter((r) => r.status === "rejected").length,
      users: users.map((u) => ({
        name: u.name,
        email: u.email,
        skillsOffered: u.skillsOffered.length,
        skillsWanted: u.skillsWanted.length,
        status: u.isBanned ? "Banned" : "Active",
        joinDate: new Date(u.createdAt.toDate()).toLocaleDateString(),
      })),
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `skillswap-report-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!user || !user.isAdmin) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading admin data...</span>
          </div>
        </div>
      </div>
    )
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => !u.isBanned).length,
    bannedUsers: users.filter((u) => u.isBanned).length,
    totalRequests: requests.length,
    pendingRequests: requests.filter((r) => r.status === "pending").length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Button onClick={downloadReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>

        {message && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold">{stats.activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Ban className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Banned Users</p>
                  <p className="text-2xl font-bold">{stats.bannedUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold">{stats.totalRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">{stats.pendingRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="requests">Request Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.uid} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage
                            src={user.profilePhoto || "/placeholder.svg?height=40&width=40"}
                            alt={user.name}
                          />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{user.name}</h3>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <div className="flex space-x-2 mt-1">
                            <Badge variant="outline">{user.skillsOffered.length} offered</Badge>
                            <Badge variant="outline">{user.skillsWanted.length} wanted</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={user.isBanned ? "destructive" : "default"}>
                          {user.isBanned ? "Banned" : "Active"}
                        </Badge>
                        <Button
                          onClick={() => handleBanUser(user.uid, !user.isBanned)}
                          variant={user.isBanned ? "default" : "destructive"}
                          size="sm"
                        >
                          {user.isBanned ? "Unban" : "Ban"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Request Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {requests.slice(0, 10).map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {request.senderData?.name || "Unknown"} → {request.recipientData?.name || "Unknown"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {request.offeredSkill} for {request.wantedSkill}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(request.createdAt.toDate()).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            request.status === "accepted"
                              ? "default"
                              : request.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                          className={
                            request.status === "accepted"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : request.status === "rejected"
                                ? "bg-red-100 text-red-800 border-red-200"
                                : "bg-yellow-100 text-yellow-800 border-yellow-200"
                          }
                        >
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
