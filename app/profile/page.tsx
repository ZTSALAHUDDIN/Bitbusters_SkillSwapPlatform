"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, Plus, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface ProfileData {
  name: string
  profilePhoto: string
  location: string
  availability: string
  skillsOffered: string[]
  skillsWanted: string[]
  isPublic: boolean
}

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    profilePhoto: "",
    location: "",
    availability: "available",
    skillsOffered: [],
    skillsWanted: [],
    isPublic: true,
  })
  const [newSkillOffered, setNewSkillOffered] = useState("")
  const [newSkillWanted, setNewSkillWanted] = useState("")

  useEffect(() => {
    if (!user) {
      router.push("/auth")
      return
    }

    setProfile({
      name: user.name || "",
      profilePhoto: user.profilePhoto || "",
      location: user.location || "",
      availability: user.availability || "available",
      skillsOffered: user.skillsOffered || [],
      skillsWanted: user.skillsWanted || [],
      isPublic: user.isPublic !== false,
    })
  }, [user, router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setMessage("")

    try {
      const userRef = doc(db, "users", user.uid)

      await updateDoc(userRef, {
        ...profile,
        name_lowercase: profile.name.toLowerCase(),
        skillsOffered_lowercase: profile.skillsOffered.map((s) => s.toLowerCase()),
        skillsWanted_lowercase: profile.skillsWanted.map((s) => s.toLowerCase()),
        updatedAt: new Date(),
      })

      const updatedDoc = await getDoc(userRef)
      const updatedData = updatedDoc.data()
      if (updatedData) {
        setProfile(updatedData as ProfileData)
      }

      setMessage("Profile updated successfully!")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Error updating profile:", error)
      setMessage("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const addSkillOffered = () => {
    const skill = newSkillOffered.trim()
    if (skill && !profile.skillsOffered.includes(skill)) {
      setProfile((prev) => ({
        ...prev,
        skillsOffered: [...prev.skillsOffered, skill],
      }))
      setNewSkillOffered("")
    }
  }

  const addSkillWanted = () => {
    const skill = newSkillWanted.trim()
    if (skill && !profile.skillsWanted.includes(skill)) {
      setProfile((prev) => ({
        ...prev,
        skillsWanted: [...prev.skillsWanted, skill],
      }))
      setNewSkillWanted("")
    }
  }

  const removeSkillOffered = (skill: string) => {
    setProfile((prev) => ({
      ...prev,
      skillsOffered: prev.skillsOffered.filter((s) => s !== skill),
    }))
  }

  const removeSkillWanted = (skill: string) => {
    setProfile((prev) => ({
      ...prev,
      skillsWanted: prev.skillsWanted.filter((s) => s !== skill),
    }))
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="shadow-lg border border-border bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-2xl">My Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="availability">Availability Status</Label>
                  <Select
                    value={profile.availability}
                    onValueChange={(value) => setProfile((prev) => ({ ...prev, availability: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="profilePhoto">Profile Photo URL</Label>
                <Input
                  id="profilePhoto"
                  type="url"
                  value={profile.profilePhoto}
                  onChange={(e) => setProfile((prev) => ({ ...prev, profilePhoto: e.target.value }))}
                  placeholder="https://example.com/photo.jpg"
                />
                {profile.profilePhoto && (
                  <img
                    src={profile.profilePhoto}
                    alt="Profile Preview"
                    className="mt-3 h-24 w-24 object-cover rounded-full border"
                  />
                )}
              </div>

              <div>
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  type="text"
                  value={profile.location}
                  onChange={(e) => setProfile((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="City, Country"
                />
              </div>

              <div>
                <Label className="text-base font-medium">Skills You Can Offer</Label>
                <div className="space-y-3 mt-2">
                  <div className="flex flex-wrap gap-2">
                    {profile.skillsOffered.map((skill) => (
                      <Badge key={skill} className="bg-accent text-accent-foreground border border-border">
                        {skill}
                        <X
                          onClick={() => removeSkillOffered(skill)}
                          className="ml-2 h-3 w-3 cursor-pointer hover:text-destructive"
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={newSkillOffered}
                      onChange={(e) => setNewSkillOffered(e.target.value)}
                      placeholder="Add a skill you can teach"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkillOffered())}
                    />
                    <Button type="button" onClick={addSkillOffered} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Skills You Want to Learn</Label>
                <div className="space-y-3 mt-2">
                  <div className="flex flex-wrap gap-2">
                    {profile.skillsWanted.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                        <X
                          onClick={() => removeSkillWanted(skill)}
                          className="ml-2 h-3 w-3 cursor-pointer hover:text-destructive"
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={newSkillWanted}
                      onChange={(e) => setNewSkillWanted(e.target.value)}
                      placeholder="Add a skill you want to learn"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkillWanted())}
                    />
                    <Button type="button" onClick={addSkillWanted} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
                <Switch
                  id="isPublic"
                  checked={profile.isPublic}
                  onCheckedChange={(checked) => setProfile((prev) => ({ ...prev, isPublic: checked }))}
                />
                <Label htmlFor="isPublic" className="text-sm text-muted-foreground">
                  Make my profile public (others can find and contact me)
                </Label>
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary hover:bg-primary/80 text-primary-foreground"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Profile"
                  )}
                </Button>
              </div>

              {message && (
                <Alert className={message.includes("success") ? "bg-muted border border-border" : ""}>
                  <AlertDescription className={message.includes("success") ? "text-green-700" : ""}>
                    {message}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}