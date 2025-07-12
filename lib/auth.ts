import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "./firebase"

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

export async function signUpUser(email: string, password: string, name: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  // Create user document in Firestore
  const userData: User = {
    uid: user.uid,
    email: user.email!,
    name: name.trim(),
    profilePhoto: "",
    location: "",
    availability: "available",
    skillsOffered: [],
    skillsWanted: [],
    isPublic: true,
    rating: 5,
    isAdmin: false,
    isBanned: false,
    createdAt: new Date(),
  }

  await setDoc(doc(db, "users", user.uid), userData)
  return { user, userData }
}

export async function signInUser(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  // Get user data from Firestore
  const userDoc = await getDoc(doc(db, "users", user.uid))
  if (!userDoc.exists()) {
    throw new Error("User data not found")
  }

  const userData = userDoc.data() as User
  if (userData.isBanned) {
    await signOut(auth)
    throw new Error("Your account has been banned")
  }

  return { user, userData }
}

export async function signOutUser() {
  await signOut(auth)
}

export async function getUserData(uid: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, "users", uid))
  if (!userDoc.exists()) {
    return null
  }
  return userDoc.data() as User
}
