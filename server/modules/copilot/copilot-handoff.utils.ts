import type { CopilotHandoffMessage } from "@/shared/contracts/copilot-handoff"

export function toSafeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

export function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => Boolean(item))
}

export function mergeStringList(base: string[], patch: unknown): string[] {
  const patchList = toStringList(patch)
  if (patchList.length === 0) return base
  return [...new Set([...base, ...patchList])]
}

export function truncateText(input: string, maxChars: number): string {
  if (input.length <= maxChars) return input
  return `${input.slice(0, Math.max(0, maxChars - 3))}...`
}

export function inferTask(messages: CopilotHandoffMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message?.role !== "user") continue
    if (!message.content) continue
    return truncateText(message.content, 240)
  }
  return "Continue the current task with focused context."
}

const TOOL_RESULT_MAX_CHARS = 300

export function formatMessageForDigest(
  message: CopilotHandoffMessage,
  index: number
): string {
  const label = message.role.toUpperCase()
  const content =
    message.role === "tool"
      ? truncateText(message.content, TOOL_RESULT_MAX_CHARS)
      : message.content
  return `${index + 1}. ${label}: ${content}`
}
