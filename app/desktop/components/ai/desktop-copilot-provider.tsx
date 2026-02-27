"use client"

import { useCallback, useEffect, type ReactNode } from "react"
import { MessageSquare, X } from "lucide-react"

import { useCopilotChat, CopilotKit } from "@copilotkit/react-core"
import { CopilotSidebar, useChatContext } from "@copilotkit/react-ui"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  DESKTOP_COPILOT_AGENT,
  DESKTOP_COPILOT_ENDPOINT,
} from "@/shared/copilot/constants"
import { useDesktopCopilotTools } from "@/features/desktop-copilot/hooks/use-desktop-copilot-tools"
import { useDesktopWindowStore } from "@/lib/stores/desktop-window-store"
import { useDesktopUIStore } from "@/lib/stores/desktop-ui-store"
import { DESKTOP_COPILOT_INSTRUCTIONS, DESKTOP_COPILOT_LABELS } from "./copilot-config"
import { BuildProgressPanel } from "./build-progress-panel"

function DesktopCopilotHeader() {
  const { setOpen, labels } = useChatContext()
  const { reset, stopGeneration, isLoading } = useCopilotChat()

  const handleClearCurrentChat = () => {
    const shouldClear = window.confirm("Clear current chat history?")
    if (!shouldClear) {
      return
    }

    if (isLoading) {
      stopGeneration()
    }

    reset()
  }

  return (
    <div className="copilotKitHeader">
      <div>{labels.title}</div>
      <div className="copilotKitHeaderControls">
        <Button size="sm" variant="outline" onClick={handleClearCurrentChat}>
          Clear
        </Button>
        <Button size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label="Close Copilot sidebar">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function DesktopCopilotOpenButton() {
  const { open, setOpen } = useChatContext()
  const pathname = usePathname()
  const isDesktopRootRoute = pathname === "/desktop"

  if (open || !isDesktopRootRoute) {
    return null
  }

  return (
    <div className="fixed right-4 top-8 z-[10006]">
      <Button size="sm" onClick={() => setOpen(true)}>
        <MessageSquare className="h-4 w-4" />
        Copilot
      </Button>
    </div>
  )
}

interface DesktopCopilotProviderProps {
  desktop: ReactNode
  children: ReactNode
}

function DesktopCopilotBridge({ desktop, children }: DesktopCopilotProviderProps) {
  const pathname = usePathname()
  const isDesktopRootRoute = pathname === "/desktop"
  useDesktopCopilotTools()
  const setCopilotSidebarOpen = useDesktopUIStore((state) => state.setCopilotSidebarOpen)
  const fitWindowsToViewport = useDesktopWindowStore((state) => state.fitWindowsToViewport)

  useEffect(() => {
    setCopilotSidebarOpen(false)
    return () => setCopilotSidebarOpen(false)
  }, [setCopilotSidebarOpen])

  useEffect(() => {
    if (!isDesktopRootRoute) {
      setCopilotSidebarOpen(false)
      fitWindowsToViewport()
    }
  }, [fitWindowsToViewport, isDesktopRootRoute, setCopilotSidebarOpen])

  const handleSidebarOpenChange = useCallback((open: boolean) => {
    setCopilotSidebarOpen(open)
    fitWindowsToViewport()
  }, [fitWindowsToViewport, setCopilotSidebarOpen])

  return (
    <>
      <CopilotSidebar
        labels={DESKTOP_COPILOT_LABELS}
        className="text-sm"
        shortcut={isDesktopRootRoute ? "k" : undefined}
        clickOutsideToClose={false}
        hitEscapeToClose
        Button={DesktopCopilotOpenButton}
        onSetOpen={handleSidebarOpenChange}
        Header={DesktopCopilotHeader}
        instructions={DESKTOP_COPILOT_INSTRUCTIONS}
      >
        {desktop}
      </CopilotSidebar>
      <BuildProgressPanel />
      {children}
    </>
  )
}

export function DesktopCopilotProvider({ desktop, children }: DesktopCopilotProviderProps) {
  return (
    <CopilotKit
      runtimeUrl={DESKTOP_COPILOT_ENDPOINT}
      credentials="include"
      agent={DESKTOP_COPILOT_AGENT}
      showDevConsole={process.env.NODE_ENV !== "production"}
    >
      <DesktopCopilotBridge desktop={desktop}>{children}</DesktopCopilotBridge>
    </CopilotKit>
  )
}
