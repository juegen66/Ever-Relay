import type { ReactNode } from "react"

import { DesktopCopilotProvider } from "@/app/desktop/_ai/providers/desktop-copilot-provider"
import { SilentCopilotRuntime } from "@/app/desktop/_ai/runtime/silent-copilot-runtime"
import { Desktop } from "@/app/desktop/_macos/desktop"

interface DesktopLayoutProps {
  children: ReactNode
  chat: ReactNode
  noChatbot: ReactNode
}

export default function DesktopLayout({ children, chat, noChatbot }: DesktopLayoutProps) {
  return (
    <DesktopCopilotProvider desktop={<Desktop />}>
      {children}
      {chat}
      {noChatbot}
      <SilentCopilotRuntime />
    </DesktopCopilotProvider>
  )
}
