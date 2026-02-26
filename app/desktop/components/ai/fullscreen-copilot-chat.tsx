"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { CopilotChat } from "@copilotkit/react-ui"

import { Button } from "@/components/ui/button"
import {
  DESKTOP_COPILOT_INSTRUCTIONS,
  DESKTOP_COPILOT_LABELS,
} from "./copilot-config"

export function FullscreenCopilotChat() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[10020] flex h-screen w-full flex-col overflow-hidden px-3 pt-3 pb-6 sm:px-4 sm:pt-4 sm:pb-8"
      data-desktop-chat-overlay
      style={{
        backgroundImage: "url(/images/wallpaper.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/25" />

      <div className="relative z-10 mb-2">
        <Button
          size="sm"
          variant="secondary"
          className="h-8 border border-white/35 bg-white/20 text-white hover:bg-white/30"
          onClick={() => router.push("/desktop")}
        >
          <ArrowLeft className="h-4 w-4" />
          Desktop
        </Button>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 justify-center">
        <div className="h-full min-h-0 w-full sm:w-2/3">
          <CopilotChat
            labels={DESKTOP_COPILOT_LABELS}
            instructions={DESKTOP_COPILOT_INSTRUCTIONS}
            className="desktop-copilot-fullscreen h-full min-h-0 w-full text-sm"
          />
        </div>
      </div>
    </div>,
    document.body
  )
}
