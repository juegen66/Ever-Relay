import type { WindowState } from "@/lib/desktop/types"

export interface AgentTextDocumentRef {
  windowId: string
  fileId: string
  fileName: string
  isActive: boolean
}

export const MAX_AGENT_TEXT_DOCUMENTS = 3
export const ACTIVE_TEXT_CONTENT_MAX_CHARS = 6000
export const BACKGROUND_TEXT_CONTENT_MAX_CHARS = 2000
const AGENT_TEXT_TRUNCATION_SUFFIX = "\n\n[Truncated for agent context]"

export function selectOpenTextDocuments(
  windows: WindowState[],
  activeWindowId: string | null
): AgentTextDocumentRef[] {
  const uniqueByFile = new Map<string, AgentTextDocumentRef>()

  const ordered = [...windows].sort((left, right) => {
    if (left.id === activeWindowId) return -1
    if (right.id === activeWindowId) return 1
    return 0
  })

  for (const windowState of ordered) {
    if (
      windowState.appId !== "textedit" ||
      windowState.minimized ||
      !windowState.fileId
    ) {
      continue
    }

    if (uniqueByFile.has(windowState.fileId)) {
      continue
    }

    uniqueByFile.set(windowState.fileId, {
      windowId: windowState.id,
      fileId: windowState.fileId,
      fileName: windowState.fileName ?? "Untitled",
      isActive: windowState.id === activeWindowId,
    })

    if (uniqueByFile.size >= MAX_AGENT_TEXT_DOCUMENTS) {
      break
    }
  }

  return [...uniqueByFile.values()]
}

export function truncateTextForAgent(content: string, maxChars: number): string {
  if (content.length <= maxChars) {
    return content
  }

  const safeLength = Math.max(0, maxChars - AGENT_TEXT_TRUNCATION_SUFFIX.length)
  return `${content.slice(0, safeLength)}${AGENT_TEXT_TRUNCATION_SUFFIX}`
}
