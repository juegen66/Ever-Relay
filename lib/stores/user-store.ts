"use client"

import { create } from "zustand"
import type { DesktopUser } from "@/lib/auth-user"

interface UserStore {
  currentUser: DesktopUser | null
  setCurrentUser: (user: DesktopUser) => void
  clearCurrentUser: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  clearCurrentUser: () => set({ currentUser: null }),
}))
