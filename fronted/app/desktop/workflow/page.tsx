import { redirect } from "next/navigation"

import { DesktopAuthGate } from "@/app/desktop/components/macos/desktop-auth-gate"
import { WorkflowDashboard } from "@/app/desktop/components/workflow/workflow-dashboard"
import { getServerDesktopUser } from "@/server/lib/auth/get-server-desktop-user"

export default async function DesktopWorkflowPage() {
  const currentUser = await getServerDesktopUser()
  if (!currentUser) {
    redirect(`/login?callbackURL=${encodeURIComponent("/desktop/workflow")}`)
  }

  return (
    <DesktopAuthGate user={currentUser}>
      <WorkflowDashboard />
    </DesktopAuthGate>
  )
}
