import type { ReactNode } from "react"

import { DesktopCopilotProvider } from "@/app/desktop/_ai/providers/desktop-copilot-provider"
import { Desktop } from "@/app/desktop/_macos/desktop"

interface DesktopLayoutProps {
  children: ReactNode
  chat: ReactNode
  silent: ReactNode
  workflow: ReactNode
}

export default function DesktopLayout({ children, chat, silent, workflow }: DesktopLayoutProps) {
  return (
    <DesktopCopilotProvider desktop={<Desktop />}>
      {children}
      {chat}
      {silent}
      {workflow}
    </DesktopCopilotProvider>
  )
}
