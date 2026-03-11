"use client"

import { useCallback } from "react"

import { useRouter } from "next/navigation"

import { BootScreen } from "@/components/desktop-shell/boot-screen"
import type { DesktopUser } from "@/lib/auth-user"
import { useUserStore } from "@/lib/stores/user-store"

interface LoginScreenProps {
  callbackURL: string
}

export function LoginScreen({ callbackURL }: LoginScreenProps) {
  const router = useRouter()
  const setCurrentUser = useUserStore((state) => state.setCurrentUser)

  const handleComplete = useCallback(
    (user: DesktopUser) => {
      setCurrentUser(user)
      router.replace(callbackURL)
    },
    [callbackURL, router, setCurrentUser]
  )

  return <BootScreen onComplete={handleComplete} callbackURL={callbackURL} />
}
