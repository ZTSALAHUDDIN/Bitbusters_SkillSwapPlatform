"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function AuthPage() {
  const { login, signup, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [tab, setTab] = useState<"login" | "signup">("login")
  const [loginFields, setLoginFields] = useState({ email: "", password: "" })
  const [signupFields, setSignupFields] = useState({ name: "", email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (user) {
      const returnUrl = searchParams.get("returnUrl") || "/"
      router.push(returnUrl)
    }
  }, [user, router, searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { email, password } = loginFields
    if (!email || !password) return setError("Please fill in all fields")
    setError("")
    setLoading(true)

    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const { name, email, password } = signupFields
    if (!name || !email || !password) return setError("Please fill in all fields")
    if (password.length < 6) return setError("Password must be at least 6 characters")

    setError("")
    setLoading(true)

    try {
      await signup(email, password, name)
    } catch (err: any) {
      setError(err.message || "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  if (user) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p>Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-purple-700 hover:text-purple-800">
            SkillSwap
          </Link>
          <p className="mt-1 text-purple-500">Join our community of learners & sharers</p>
        </div>

        <Card className="shadow-lg border border-purple-200 bg-white">
          <CardHeader>
            <CardTitle className="text-center text-purple-800">Welcome</CardTitle>
            <CardDescription className="text-center text-purple-500">
              Sign in or create a new account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={tab} onValueChange={(val) => { setTab(val as "login" | "signup"); setError("") }}>
              <TabsList className="grid w-full grid-cols-2 bg-purple-100">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      autoFocus
                      type="email"
                      value={loginFields.email}
                      onChange={(e) =>
                        setLoginFields((p) => ({ ...p, email: e.target.value }))
                      }
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={loginFields.password}
                      onChange={(e) =>
                        setLoginFields((p) => ({ ...p, password: e.target.value }))
                      }
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      autoFocus
                      type="text"
                      value={signupFields.name}
                      onChange={(e) =>
                        setSignupFields((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={signupFields.email}
                      onChange={(e) =>
                        setSignupFields((p) => ({ ...p, email: e.target.value }))
                      }
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={signupFields.password}
                      onChange={(e) =>
                        setSignupFields((p) => ({ ...p, password: e.target.value }))
                      }
                      placeholder="At least 6 characters"
                      required
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Signing up...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}