"use client"

import { useEffect, type ReactNode } from "react"

import type { DesktopUser } from "@/lib/auth-user"
import { useUserStore } from "@/lib/stores/user-store"

interface DesktopAuthGateProps {
  children: ReactNode
  user: DesktopUser
}

export function DesktopAuthGate({ children, user }: DesktopAuthGateProps) {
  const setCurrentUser = useUserStore((state) => state.setCurrentUser)

  useEffect(() => {
    setCurrentUser(user)
  }, [setCurrentUser, user])

  return <>{children}</>
}
