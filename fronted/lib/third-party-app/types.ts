/**
 * Third-party app integration: postMessage RPC protocol and manifests.
 * Message envelope uses a fixed channel to avoid collisions with other postMessage users.
 */

export const THIRD_PARTY_RPC_CHANNEL = "cloudos:third-party:rpc" as const

export const THIRD_PARTY_APP_PREFIX = "tp_" as const

export type ThirdPartyAppSource =
  | { type: "url"; url: string }
  | { type: "html"; html: string }

/** Manifest for a built-in third-party slot (registered in the host). */
export interface ThirdPartyAppManifest {
  /** Stable id without prefix, e.g. "weather" → app id tp_weather */
  slug: string
  displayName: string
  /** Short description for Copilot / docs */
  description?: string
  source: ThirdPartyAppSource
  /** Optional sandbox tokens beyond defaults (e.g. allow-same-origin for dev) */
  sandboxExtra?: string
  /** Allowed origins for postMessage when using url source; empty = same-origin only */
  allowedOrigins?: string[]
  /** Default iframe size */
  defaultSize?: { w: number; h: number }
}

/** Tool as advertised by the iframe (SDK → host). */
export interface ThirdPartyToolDefinition {
  /** Stable id within the iframe (unique per app) */
  id: string
  /** Exposed name without namespace; host prefixes with tp_<slug>_ */
  name: string
  description: string
  /** JSON Schema for parameters (object properties), or minimal Copilot-style shape */
  parameters?: Record<string, unknown>
}

export type ThirdPartyRpcType =
  | "ready"
  | "register"
  | "call"
  | "result"
  | "error"
  | "event"

export interface ThirdPartyRpcEnvelope {
  channel: typeof THIRD_PARTY_RPC_CHANNEL
  v: 1
  type: ThirdPartyRpcType
  appInstanceId: string
  payload: unknown
}

export interface ThirdPartyRpcReadyPayload {
  /** Optional app version string from iframe */
  version?: string
}

export interface ThirdPartyRpcRegisterPayload {
  tools: ThirdPartyToolDefinition[]
}

export interface ThirdPartyRpcCallPayload {
  callId: string
  toolName: string
  args: Record<string, unknown>
}

export interface ThirdPartyRpcResultPayload {
  callId: string
  ok: true
  result: unknown
}

export interface ThirdPartyRpcErrorPayload {
  callId: string
  ok: false
  error: string
  code?: string
}

export interface ThirdPartyRpcEventPayload {
  name: string
  data?: unknown
}

export function isThirdPartyAppId(appId: string): boolean {
  return appId.startsWith(THIRD_PARTY_APP_PREFIX)
}

export function thirdPartySlugFromAppId(appId: string): string | null {
  if (!isThirdPartyAppId(appId)) return null
  return appId.slice(THIRD_PARTY_APP_PREFIX.length) || null
}

export function thirdPartyAppIdFromSlug(slug: string): string {
  const s = slug.replace(/^tp_/, "").trim()
  return `${THIRD_PARTY_APP_PREFIX}${s}`
}

/** Between slug and tool name so slugs may contain single underscores (e.g. demo_weather). */
export const THIRD_PARTY_TOOL_SEP = "__" as const

export function namespacedThirdPartyToolName(slug: string, toolName: string): string {
  const safeSlug = slug.replace(/[^a-zA-Z0-9_]/g, "_")
  const safeTool = toolName.replace(/[^a-zA-Z0-9_]/g, "_")
  return `${THIRD_PARTY_APP_PREFIX}${safeSlug}${THIRD_PARTY_TOOL_SEP}${safeTool}`
}

export function parseNamespacedThirdPartyToolName(
  fullName: string
): { slug: string; toolName: string } | null {
  if (!fullName.startsWith(THIRD_PARTY_APP_PREFIX)) return null
  const rest = fullName.slice(THIRD_PARTY_APP_PREFIX.length)
  const idx = rest.indexOf(THIRD_PARTY_TOOL_SEP)
  if (idx <= 0) return null
  return {
    slug: rest.slice(0, idx),
    toolName: rest.slice(idx + THIRD_PARTY_TOOL_SEP.length),
  }
}
