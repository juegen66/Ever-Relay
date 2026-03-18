import { redirect } from "next/navigation"

import { DesktopAuthGate } from "@/app/desktop/_macos/desktop-auth-gate"
import { NoChatbotDashboard } from "@/app/desktop/_no-chatbot/no-chatbot-dashboard"
import { getServerDesktopUser } from "@/server/lib/auth/get-server-desktop-user"

export default async function InterceptedDesktopNoChatbotPage() {
  const currentUser = await getServerDesktopUser()
  if (!currentUser) {
    redirect(`/login?callbackURL=${encodeURIComponent("/desktop/no-chatbot")}`)
  }

  return (
    <DesktopAuthGate user={currentUser}>
      <NoChatbotDashboard />
    </DesktopAuthGate>
  )
}
