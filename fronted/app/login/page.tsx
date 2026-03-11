import { redirect } from "next/navigation"

import { normalizeCallbackURL } from "@/lib/auth/callback-url"
import { getServerDesktopUser } from "@/server/lib/auth/get-server-desktop-user"

import { LoginScreen } from "./_components/login-screen"

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams
  const callbackURLValue = resolvedSearchParams.callbackURL
  const callbackURL = Array.isArray(callbackURLValue)
    ? callbackURLValue[0]
    : callbackURLValue
  const normalizedCallbackURL = normalizeCallbackURL(callbackURL)
  const currentUser = await getServerDesktopUser()

  if (currentUser) {
    redirect(normalizedCallbackURL)
  }

  return <LoginScreen callbackURL={normalizedCallbackURL} />
}
