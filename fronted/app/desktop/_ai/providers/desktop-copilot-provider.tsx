"use client"

import { useCallback, useEffect, type ReactNode } from "react"

import { CopilotKit } from "@copilotkit/react-core"
import { CopilotSidebar, useChatContext } from "@copilotkit/react-ui"
import { MessageSquare, X } from "lucide-react"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { BrandBriefInjector } from "@/features/desktop-copilot/components/brand-brief-injector"
import { CopilotToolsRegistry } from "@/features/desktop-copilot/tools/use-register-copilot-tools"
import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"
import { useDesktopWindowStore } from "@/lib/stores/desktop-window-store"
import {
  DESKTOP_COPILOT_AGENT,
  DESKTOP_COPILOT_ENDPOINT,
  LOGO_COPILOT_AGENT,
} from "@/shared/copilot/constants"

import { DESKTOP_COPILOT_INSTRUCTIONS, DESKTOP_COPILOT_LABELS } from "../copilot-config"
import { DesktopAgentContextProvider } from "./desktop-agent-context-provider"
import { useStartNewCopilotChat } from "../hooks/use-start-new-copilot-chat"
import { BuildProgressPanel } from "../ui/build-progress-panel"

function DesktopCopilotHeader() {
  const { labels } = useChatContext()
  const startNewChat = useStartNewCopilotChat()
  const setCopilotSidebarOpen = useDesktopAgentStore((state) => state.setCopilotSidebarOpen)

  const handleStartNewChat = () => {
    const shouldStartNewChat = window.confirm("Start a new chat? This clears the current conversation view.")
    if (!shouldStartNewChat) {
      return
    }

    startNewChat()
  }

  return (
    <div className="copilotKitHeader">
      <div>{labels.title}</div>
      <div className="copilotKitHeaderControls">
        <Button size="sm" variant="outline" onClick={handleStartNewChat}>
          New Chat
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setCopilotSidebarOpen(false)}
          aria-label="Close Copilot sidebar"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function SidebarOpenStateSync() {
  const { open, setOpen } = useChatContext()
  const desiredOpen = useDesktopAgentStore((state) => state.copilotSidebarOpen)

  useEffect(() => {
    if (open === desiredOpen) return
    setOpen(desiredOpen)
  }, [desiredOpen, open, setOpen])

  return null
}

function DesktopCopilotOpenButton() {
  const { open } = useChatContext()
  const pathname = usePathname()
  const isDesktopRootRoute = pathname === "/desktop"
  const setCopilotSidebarOpen = useDesktopAgentStore((state) => state.setCopilotSidebarOpen)

  if (open || !isDesktopRootRoute) {
    return null
  }

  return (
    <div className="fixed right-4 top-8 z-[10006]">
      <Button size="sm" onClick={() => setCopilotSidebarOpen(true)}>
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
  const copilotAgentMode = useDesktopAgentStore((state) => state.copilotAgentMode)
  const activeAgent = copilotAgentMode === "logo" ? LOGO_COPILOT_AGENT : DESKTOP_COPILOT_AGENT
  const copilotSidebarOpen = useDesktopAgentStore((state) => state.copilotSidebarOpen)
  const setCopilotSidebarOpen = useDesktopAgentStore((state) => state.setCopilotSidebarOpen)
  const fitWindowsToViewport = useDesktopWindowStore((state) => state.fitWindowsToViewport)

  useEffect(() => {
    if (useDesktopAgentStore.getState().copilotSidebarOpen) {
      setCopilotSidebarOpen(false)
    }

    return () => {
      if (useDesktopAgentStore.getState().copilotSidebarOpen) {
        setCopilotSidebarOpen(false)
      }
    }
  }, [setCopilotSidebarOpen])

  useEffect(() => {
    if (!isDesktopRootRoute) {
      if (useDesktopAgentStore.getState().copilotSidebarOpen) {
        setCopilotSidebarOpen(false)
      }
      fitWindowsToViewport()
    }
  }, [fitWindowsToViewport, isDesktopRootRoute, setCopilotSidebarOpen])

  useEffect(() => {
    fitWindowsToViewport()
  }, [copilotSidebarOpen, fitWindowsToViewport])

  const handleSidebarOpenChange = useCallback((open: boolean) => {
    if (useDesktopAgentStore.getState().copilotSidebarOpen === open) {
      return
    }

    setCopilotSidebarOpen(open)
  }, [setCopilotSidebarOpen])
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
        <CopilotToolsRegistry agentId={activeAgent} />
        <DesktopAgentContextProvider />
        <SidebarOpenStateSync />
        {desktop}
      </CopilotSidebar>
      <BuildProgressPanel />
      {children}
    </>
  )
}

export function DesktopCopilotProvider({ desktop, children }: DesktopCopilotProviderProps) {
  const copilotAgentMode = useDesktopAgentStore((state) => state.copilotAgentMode)
  const copilotThreadId = useDesktopAgentStore((state) => state.copilotThreadId)
  const activeAgent = copilotAgentMode === "logo" ? LOGO_COPILOT_AGENT : DESKTOP_COPILOT_AGENT

  return (
    <CopilotKit
      runtimeUrl={DESKTOP_COPILOT_ENDPOINT}
      credentials="include"
      agent={activeAgent}
      threadId={copilotThreadId}
      showDevConsole={process.env.NODE_ENV !== "production"}
    >
      <BrandBriefInjector />
      <DesktopCopilotBridge desktop={desktop}>{children}</DesktopCopilotBridge>
    </CopilotKit>
  )
}
