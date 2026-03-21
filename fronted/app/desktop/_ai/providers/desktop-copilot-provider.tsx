"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"

import { CopilotKit, useCopilotChatInternal } from "@copilotkit/react-core"
import { CopilotSidebar, useChatContext } from "@copilotkit/react-ui"
import { X } from "lucide-react"
import { usePathname } from "next/navigation"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { BrandBriefInjector } from "@/features/desktop-copilot/components/brand-brief-injector"
import { CodingPromptEventBridge } from "@/features/desktop-copilot/components/coding-prompt-event-bridge"
import { CodingPromptInjector } from "@/features/desktop-copilot/components/coding-prompt-injector"
import { HandoffMetadataInjector } from "@/features/desktop-copilot/components/handoff-metadata-injector"
import { PredictionActionInjector } from "@/features/desktop-copilot/components/prediction-action-injector"
import { CopilotToolsRegistry } from "@/features/desktop-copilot/tools/use-register-copilot-tools"
import {
  shouldCarryOverAgentMessages,
  toStructuredCloneableMessages,
} from "@/lib/copilot/agent-message-carryover"
import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"
import { useDesktopWindowStore } from "@/lib/stores/desktop-window-store"
import {
  CANVAS_COPILOT_AGENT,
  CODING_COPILOT_AGENT,
  DESKTOP_COPILOT_AGENT,
  DESKTOP_COPILOT_ENDPOINT,
  LOGO_COPILOT_AGENT,
} from "@/shared/copilot/constants"

import { DESKTOP_COPILOT_INSTRUCTIONS, DESKTOP_COPILOT_LABELS } from "../copilot-config"
import { DesktopAgentContextProvider } from "./desktop-agent-context-provider"
import { useStartNewCopilotChat } from "../hooks/use-start-new-copilot-chat"
import { BuildProgressPanel } from "../ui/build-progress-panel"

import type { Message } from "@copilotkit/shared"

function resolveActiveAgent(mode: ReturnType<typeof useDesktopAgentStore.getState>["copilotAgentMode"]) {
  if (mode === "canvas") {
    return CANVAS_COPILOT_AGENT
  }

  if (mode === "logo") {
    return LOGO_COPILOT_AGENT
  }

  if (mode === "coding") {
    return CODING_COPILOT_AGENT
  }

  return DESKTOP_COPILOT_AGENT
}

function DesktopCopilotHeader() {
  const { labels } = useChatContext()
  const startNewChat = useStartNewCopilotChat()
  const setCopilotSidebarOpen = useDesktopAgentStore((state) => state.setCopilotSidebarOpen)
  const activeCodingApp = useDesktopAgentStore((state) => state.activeCodingApp)
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)

  const handleConfirmNewChat = () => {
    setShowNewChatDialog(false)
    startNewChat()
  }

  return (
    <div className="copilotKitHeader">
      <div className="flex min-w-0 flex-col">
        <div>{labels.title}</div>
        {activeCodingApp && (
          <div className="truncate text-[11px] font-medium uppercase tracking-[0.08em] text-emerald-700">
            {activeCodingApp.name}
          </div>
        )}
      </div>
      <div className="copilotKitHeaderControls">
        <Button size="sm" variant="outline" onClick={() => setShowNewChatDialog(true)}>
          {activeCodingApp ? "Main Chat" : "New Chat"}
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

      <AlertDialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {activeCodingApp ? "Switch to Main Chat" : "Start New Chat"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activeCodingApp
                ? `Leave ${activeCodingApp.name} and return to the main desktop copilot chat?`
                : "This will clear the current conversation view and start a fresh chat session."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmNewChat}>
              {activeCodingApp ? "Switch" : "New Chat"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
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
      <button
        onClick={() => setCopilotSidebarOpen(true)}
        className="group relative flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-[13px] font-medium text-white/90 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-white/35 hover:bg-black/55 hover:text-white hover:shadow-xl active:scale-[0.97]"
      >
        <span>Copilot</span>
        <kbd className="ml-1 hidden rounded border border-white/15 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white/50 sm:inline-block">
          ⌘K
        </kbd>
      </button>
    </div>
  )
}

interface DesktopCopilotProviderProps {
  desktop: ReactNode
  children: ReactNode
}

/**
 * Keeps the CopilotSidebar's internal open state in sync with our zustand
 * store. Must be rendered inside <CopilotSidebar> so it has access to the
 * ChatContext.  This replaces the old `key={copilotSidebarOpen ? … : …}`
 * approach which caused a full remount — destroying in-flight streaming
 * messages whenever the sidebar toggled (especially during agent handoffs).
 */
function SidebarOpenSync() {
  const { open, setOpen } = useChatContext()
  const copilotSidebarOpen = useDesktopAgentStore((state) => state.copilotSidebarOpen)

  useEffect(() => {
    if (copilotSidebarOpen !== open) {
      setOpen(copilotSidebarOpen)
    }
  }, [copilotSidebarOpen, open, setOpen])

  return null
}

function AgentMessageCarryoverSync() {
  const { agent, setMessages, threadId } = useCopilotChatInternal({})
  const pendingHandoff = useDesktopAgentStore((state) => state.pendingHandoff)
  const copilotThreadId = useDesktopAgentStore((state) => state.copilotThreadId)
  const snapshotRef = useRef<{
    agentId: string | null
    threadId: string | null
    messages: Message[]
  }>({
    agentId: null,
    threadId: null,
    messages: [],
  })

  useEffect(() => {
    const previousSnapshot = snapshotRef.current
    const rawMessages = agent?.messages ?? []
    const nextSnapshot = {
      agentId: agent?.agentId ?? null,
      threadId: threadId ?? null,
      messages: toStructuredCloneableMessages(rawMessages),
    }

    const isHandoffInProgress =
      pendingHandoff?.status === "switching" &&
      pendingHandoff.threadId === copilotThreadId

    if (shouldCarryOverAgentMessages(previousSnapshot, nextSnapshot, { isHandoffInProgress })) {
      setMessages(previousSnapshot.messages)
      snapshotRef.current = {
        ...nextSnapshot,
        messages: previousSnapshot.messages,
      }
      return
    }

    snapshotRef.current = nextSnapshot
  }, [agent?.agentId, agent?.messages, copilotThreadId, pendingHandoff, setMessages, threadId])

  return null
}

/**
 * Blocks user input in the CopilotSidebar while an agent handoff or copilot
 * dispatch is in progress.  Without this guard there is a race window where
 * the user can submit a message before React re-renders with the updated
 * `agent.isRunning` flag, causing two concurrent `runAgent` calls whose
 * streamed responses get interleaved and produce JSON-parse errors.
 *
 * The guard injects a global `<style>` that disables pointer-events and
 * keyboard input on the sidebar's textarea / send-button for the duration
 * of the transition.
 */
function HandoffTransitionGuard() {
  const pendingHandoff = useDesktopAgentStore((state) => state.pendingHandoff)
  const pendingCopilotDispatch = useDesktopAgentStore((state) => state.pendingCopilotDispatch)
  const isTransitioning = !!pendingHandoff || !!pendingCopilotDispatch

  useEffect(() => {
    if (!isTransitioning) return

    const sidebar = document.querySelector<HTMLElement>("[data-copilot-sidebar]")
    if (!sidebar) return

    const textarea = sidebar.querySelector<HTMLTextAreaElement>("textarea")
    const sendButtons = sidebar.querySelectorAll<HTMLButtonElement>(
      "[data-layout] button"
    )

    if (textarea) {
      textarea.dataset.prevDisabled = String(textarea.disabled)
      textarea.disabled = true
    }

    sendButtons.forEach((btn) => {
      btn.dataset.prevDisabled = String(btn.disabled)
      btn.disabled = true
    })

    return () => {
      if (textarea) {
        textarea.disabled = textarea.dataset.prevDisabled === "true"
        delete textarea.dataset.prevDisabled
      }

      sendButtons.forEach((btn) => {
        btn.disabled = btn.dataset.prevDisabled === "true"
        delete btn.dataset.prevDisabled
      })
    }
  }, [isTransitioning])

  return null
}

function DesktopCopilotBridge({ desktop, children }: DesktopCopilotProviderProps) {
  const pathname = usePathname()
  const isDesktopRootRoute = pathname === "/desktop"
  const copilotAgentMode = useDesktopAgentStore((state) => state.copilotAgentMode)
  const activeAgent = resolveActiveAgent(copilotAgentMode)
  const copilotSidebarOpen = useDesktopAgentStore((state) => state.copilotSidebarOpen)
  const setCopilotSidebarOpen = useDesktopAgentStore((state) => state.setCopilotSidebarOpen)
  const fitWindowsToViewport = useDesktopWindowStore((state) => state.fitWindowsToViewport)

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
        defaultOpen={copilotSidebarOpen}
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
        <SidebarOpenSync />
        <HandoffTransitionGuard />
        <CopilotToolsRegistry agentId={activeAgent} />
        <DesktopAgentContextProvider />
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
  const setCopilotSidebarOpen = useDesktopAgentStore((state) => state.setCopilotSidebarOpen)
  const activeAgent = resolveActiveAgent(copilotAgentMode)

  useEffect(() => {
    return () => {
      if (useDesktopAgentStore.getState().copilotSidebarOpen) {
        setCopilotSidebarOpen(false)
      }
    }
  }, [setCopilotSidebarOpen])

  return (
    <>
      <CodingPromptEventBridge />
      <CopilotKit
        key={copilotThreadId}
        runtimeUrl={DESKTOP_COPILOT_ENDPOINT}
        credentials="include"
        agent={activeAgent}
        threadId={copilotThreadId}
        showDevConsole={process.env.NODE_ENV !== "production"}
      >
        <BrandBriefInjector />
        <CodingPromptInjector />
        <AgentMessageCarryoverSync />
        <HandoffMetadataInjector />
        <PredictionActionInjector />
        <DesktopCopilotBridge desktop={desktop}>{children}</DesktopCopilotBridge>
      </CopilotKit>
    </>
  )
}
