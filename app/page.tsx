"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { UserCard } from "@/components/user-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { User } from "@/types"

export default function HomePage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [availability, setAvailability] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null)
  const [error, setError] = useState("")
  const router = useRouter()
  const USERS_PER_PAGE = 12

  const fetchUsers = async (isNewSearch = false) => {
    setLoading(true)
    setError("")

    try {
      let q = query(
        collection(db, "users"),
        where("isPublic", "==", true),
        where("isBanned", "==", false),
        orderBy("createdAt", "desc"),
        limit(USERS_PER_PAGE),
      )

      if (availability !== "all") {
        q = query(
          collection(db, "users"),
          where("isPublic", "==", true),
          where("isBanned", "==", false),
          where("availability", "==", availability),
          orderBy("createdAt", "desc"),
          limit(USERS_PER_PAGE),
        )
      }

      if (!isNewSearch && lastDoc && currentPage > 1) {
        q = query(q, startAfter(lastDoc))
      }

      const querySnapshot = await getDocs(q)
      const fetchedUsers: User[] = []

      querySnapshot.forEach((doc) => {
        const userData = doc.data() as User
        if (
          !search ||
          userData.name.toLowerCase().includes(search.toLowerCase()) ||
          userData.skillsOffered.some((skill) => skill.toLowerCase().includes(search.toLowerCase())) ||
          userData.skillsWanted.some((skill) => skill.toLowerCase().includes(search.toLowerCase()))
        ) {
          fetchedUsers.push(userData)
        }
      })

      if (isNewSearch || currentPage === 1) {
        setUsers(fetchedUsers)
      } else {
        setUsers((prev) => [...prev, ...fetchedUsers])
      }

      setHasMore(querySnapshot.docs.length === USERS_PER_PAGE)
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1] || null)
    } catch (error) {
      console.error("Error fetching users:", error)
      setError("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
    setLastDoc(null)
    fetchUsers(true)
  }, [search, availability])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    setLastDoc(null)
    fetchUsers(true)
  }

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setCurrentPage((prev) => prev + 1)
      fetchUsers(false)
    }
  }

  const handleRequest = (userId: string) => {
    router.push(`/request/${userId}`)
  }

  return (
    <div className="min-h-screen bg-[#F8F4FF]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-purple-900 mb-2">Find Skills to Swap</h1>
          <p className="text-lg text-purple-600">Connect with others to exchange knowledge and learn new skills</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
                <Input
                  placeholder="Search skills (e.g., Photoshop, Guitar, Cooking)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                Search
              </Button>
            </form>

            <Select value={availability} onValueChange={setAvailability}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading && users.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-2 text-purple-600">Loading users...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-8">
              <h3 className="text-xl font-semibold text-purple-900 mb-2">No users found</h3>
              <p className="text-purple-600 mb-4">
                {search || availability !== "all"
                  ? "Try adjusting your search criteria"
                  : "Be the first to join our community!"}
              </p>
              {search || availability !== "all" ? (
                <Button
                  onClick={() => {
                    setSearch("")
                    setAvailability("all")
                    setCurrentPage(1)
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {users.map((user) => (
                <UserCard key={user.uid} user={user} onRequest={handleRequest} />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center">
                <Button onClick={handleLoadMore} disabled={loading} variant="outline" className="bg-white">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}