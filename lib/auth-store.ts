"use client"

export interface User {
  username: string
  email: string
  passwordHash: string
  createdAt: string
  avatar: string
}

const USERS_KEY = "macos_web_users"
const CURRENT_USER_KEY = "macos_web_current_user"

const AVATAR_COLORS = [
  "from-blue-400 to-indigo-500",
  "from-pink-400 to-rose-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-violet-400 to-purple-500",
  "from-cyan-400 to-sky-500",
]

// Simple hash (not cryptographic - for demo only)
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return hash.toString(36)
}

export function getUsers(): User[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function registerUser(
  username: string,
  email: string,
  password: string
): { success: boolean; error?: string } {
  const users = getUsers()

  if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, error: "Username already exists" }
  }
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: "Email already registered" }
  }

  const newUser: User = {
    username,
    email,
    passwordHash: simpleHash(password),
    createdAt: new Date().toISOString(),
    avatar: AVATAR_COLORS[users.length % AVATAR_COLORS.length],
  }

  saveUsers([...users, newUser])
  return { success: true }
}

export function loginUser(
  username: string,
  password: string
): { success: boolean; user?: User; error?: string } {
  const users = getUsers()
  const user = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  )
  if (!user) {
    return { success: false, error: "User not found" }
  }
  if (user.passwordHash !== simpleHash(password)) {
    return { success: false, error: "Incorrect password" }
  }
  setCurrentUser(user)
  return { success: true, user }
}

export function setCurrentUser(user: User) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY)
}

export function hasAnyUsers(): boolean {
  return getUsers().length > 0
}
