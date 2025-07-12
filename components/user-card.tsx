"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, MapPin } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import type { User } from "@/types"

interface UserCardProps {
  user: User
  onRequest?: (userId: string) => void
}

export function UserCard({ user, onRequest }: UserCardProps) {
  const { user: currentUser } = useAuth()

  const handleRequest = () => {
    if (!currentUser) {
      window.location.href = "/auth"
      return
    }
    onRequest?.(user.uid)
  }

  return (
    <Card className="h-full hover:shadow-md transition-all duration-200 border-purple-200 bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.profilePhoto || "/placeholder.svg?height=48&width=48"} alt={user.name} />
            <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-purple-800 truncate">{user.name}</h3>
            {user.location && (
              <div className="flex items-center text-sm text-purple-400 mt-1">
                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{user.location}</span>
              </div>
            )}
            <div className="flex items-center mt-2">
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm ml-1 font-medium">{user.rating}</span>
              </div>
              <Badge
                variant={user.availability === "available" ? "default" : "secondary"}
                className={`ml-3 text-xs ${
                  user.availability === "available"
                    ? "bg-purple-100 text-purple-800 border-purple-200"
                    : "bg-gray-100 text-gray-800 border-gray-200"
                }`}
              >
                {user.availability}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-sm text-purple-600 mb-2">Skills Offered</h4>
          <div className="flex flex-wrap gap-1">
            {user.skillsOffered.length > 0 ? (
              <>
                {user.skillsOffered.slice(0, 3).map((skill, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                  >
                    {skill}
                  </Badge>
                ))}
                {user.skillsOffered.length > 3 && (
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                    +{user.skillsOffered.length - 3} more
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-xs text-gray-400">No skills listed</span>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-sm text-purple-600 mb-2">Skills Wanted</h4>
          <div className="flex flex-wrap gap-1">
            {user.skillsWanted.length > 0 ? (
              <>
                {user.skillsWanted.slice(0, 3).map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs bg-purple-100 text-purple-800 border-purple-200"
                  >
                    {skill}
                  </Badge>
                ))}
                {user.skillsWanted.length > 3 && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-purple-100 text-purple-800 border-purple-200"
                  >
                    +{user.skillsWanted.length - 3} more
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-xs text-gray-400">No skills listed</span>
            )}
          </div>
        </div>

        <div className="flex space-x-2 pt-2">
          <Link href={`/users/${user.uid}`} className="flex-1">
            <Button variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-50">
              View Profile
            </Button>
          </Link>
          <Button
            onClick={handleRequest}
            disabled={!currentUser || currentUser.uid === user.uid}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          >
            {!currentUser ? "Login to Request" : currentUser.uid === user.uid ? "Your Profile" : "Request"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}