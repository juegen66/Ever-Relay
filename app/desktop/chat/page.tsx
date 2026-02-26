import { redirect } from "next/navigation"

import { FullscreenCopilotChat } from "@/app/desktop/components/ai/fullscreen-copilot-chat"
import { DesktopAuthGate } from "@/app/desktop/components/macos/desktop-auth-gate"
import { getServerDesktopUser } from "@/server/lib/auth/get-server-desktop-user"

export default async function DesktopChatPage() {
  const currentUser = await getServerDesktopUser()
  if (!currentUser) {
    redirect(`/login?callbackURL=${encodeURIComponent("/desktop/chat")}`)
  }

  return (
    <DesktopAuthGate user={currentUser}>
      <FullscreenCopilotChat />
    </DesktopAuthGate>
  )
}
