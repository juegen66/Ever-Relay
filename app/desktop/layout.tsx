import type { ReactNode } from "react"

import { DesktopCopilotProvider } from "@/app/desktop/components/ai/desktop-copilot-provider"
import { Desktop } from "@/app/desktop/components/macos/desktop"

interface DesktopLayoutProps {
  children: ReactNode
  chat: ReactNode
}

export default function DesktopLayout({ children, chat }: DesktopLayoutProps) {
  return (
    <DesktopCopilotProvider desktop={<Desktop />}>
      {children}
      {chat}
    </DesktopCopilotProvider>
  )
}
