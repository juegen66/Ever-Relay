import { DesktopCopilotProvider } from "@/app/desktop/components/ai/desktop-copilot-provider"
import { Desktop } from "@/app/desktop/components/macos/desktop"

export default function DesktopPage() {
  return (
    <DesktopCopilotProvider>
      <Desktop />
    </DesktopCopilotProvider>
  )
}
