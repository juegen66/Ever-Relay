import { redirect } from "next/navigation"

import { SilentTriggerTestPanel } from "@/app/desktop/components/ai/silent-trigger-test-panel"
import { DesktopAuthGate } from "@/app/desktop/components/macos/desktop-auth-gate"
import { getServerDesktopUser } from "@/server/lib/auth/get-server-desktop-user"

export default async function DesktopPage() {
  const currentUser = await getServerDesktopUser()
  if (!currentUser) {
    redirect(`/login?callbackURL=${encodeURIComponent("/desktop")}`)
  }

  return (
    <DesktopAuthGate user={currentUser}>
      <SilentTriggerTestPanel />
    </DesktopAuthGate>
  )
}
