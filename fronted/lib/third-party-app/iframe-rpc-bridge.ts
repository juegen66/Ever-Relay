"use client"

import {
  THIRD_PARTY_RPC_CHANNEL,
  type ThirdPartyRpcCallPayload,
  type ThirdPartyRpcEnvelope,
  type ThirdPartyRpcErrorPayload,
  type ThirdPartyRpcRegisterPayload,
  type ThirdPartyRpcResultPayload,
  type ThirdPartyToolDefinition,
} from "./types"

export interface IframeRpcBridgeOptions {
  iframe: HTMLIFrameElement
  /** Desktop window id (unique per AppWindow instance) */
  appInstanceId: string
  slug: string
  /**
   * Origins allowed for incoming messages. If empty, only same origin as `window.location.origin`.
   */
  allowedOrigins: string[]
  callTimeoutMs?: number
  onToolsRegistered?: (tools: ThirdPartyToolDefinition[]) => void
  onReady?: () => void
  onTeardown?: () => void
}

function isAllowedOrigin(origin: string, allowed: string[]): boolean {
  if (allowed.length === 0) {
    if (typeof window === "undefined") return false
    return origin === window.location.origin
  }
  return allowed.includes(origin) || allowed.includes("*")
}

function parseEnvelope(data: unknown): ThirdPartyRpcEnvelope | null {
  if (!data || typeof data !== "object") return null
  const o = data as Record<string, unknown>
  if (o.channel !== THIRD_PARTY_RPC_CHANNEL) return null
  if (o.v !== 1) return null
  if (typeof o.type !== "string") return null
  if (typeof o.appInstanceId !== "string") return null
  return o as unknown as ThirdPartyRpcEnvelope
}

function resolveTargetOrigin(iframe: HTMLIFrameElement, _allowedOrigins: string[]): string {
  try {
    const src = iframe.getAttribute("src")
    if (src && (src.startsWith("http://") || src.startsWith("https://"))) {
      return new URL(src).origin
    }
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return "*"
}

export class IframeRpcBridge {
  private readonly iframe: HTMLIFrameElement
  private readonly appInstanceId: string
  private readonly slug: string
  private readonly allowedOrigins: string[]
  private readonly callTimeoutMs: number
  private readonly onToolsRegistered?: (tools: ThirdPartyToolDefinition[]) => void
  private readonly onReady?: () => void
  private readonly onTeardown?: () => void

  private disposed = false
  private boundListener: (event: MessageEvent) => void
  private pending = new Map<
    string,
    {
      resolve: (v: { ok: true; result: unknown } | { ok: false; error: string }) => void
      timer: ReturnType<typeof setTimeout>
    }
  >()

  constructor(options: IframeRpcBridgeOptions) {
    this.iframe = options.iframe
    this.appInstanceId = options.appInstanceId
    this.slug = options.slug
    this.allowedOrigins = options.allowedOrigins
    this.callTimeoutMs = options.callTimeoutMs ?? 30_000
    this.onToolsRegistered = options.onToolsRegistered
    this.onReady = options.onReady
    this.onTeardown = options.onTeardown

    this.boundListener = this.handleMessage.bind(this)
    if (typeof window !== "undefined") {
      window.addEventListener("message", this.boundListener)
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    if (typeof window !== "undefined") {
      window.removeEventListener("message", this.boundListener)
    }
    for (const { timer, resolve } of this.pending.values()) {
      clearTimeout(timer)
      resolve({ ok: false, error: "Bridge disposed" })
    }
    this.pending.clear()
    this.onTeardown?.()
  }

  getHandle() {
    return {
      invoke: async (
        toolName: string,
        args: Record<string, unknown>
      ): Promise<{ ok: true; result: unknown } | { ok: false; error: string }> => {
        if (this.disposed) {
          return { ok: false, error: "Bridge disposed" }
        }
        const win = this.iframe.contentWindow
        if (!win) {
          return { ok: false, error: "Iframe has no content window" }
        }

        const callId =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `call-${Date.now()}-${Math.random().toString(16).slice(2)}`

        const envelope: ThirdPartyRpcEnvelope = {
          channel: THIRD_PARTY_RPC_CHANNEL,
          v: 1,
          type: "call",
          appInstanceId: this.appInstanceId,
          payload: {
            callId,
            toolName,
            args,
          } satisfies ThirdPartyRpcCallPayload,
        }

        const targetOrigin = resolveTargetOrigin(this.iframe, this.allowedOrigins)

        return new Promise((resolve) => {
          const timer = setTimeout(() => {
            this.pending.delete(callId)
            resolve({ ok: false, error: `Tool call timed out after ${this.callTimeoutMs}ms` })
          }, this.callTimeoutMs)

          this.pending.set(callId, { resolve, timer })
          try {
            win.postMessage(envelope, targetOrigin)
          } catch (e) {
            clearTimeout(timer)
            this.pending.delete(callId)
            resolve({
              ok: false,
              error: e instanceof Error ? e.message : "postMessage failed",
            })
          }
        })
      },
    }
  }

  private handleMessage(event: MessageEvent): void {
    if (this.disposed) return
    if (event.source !== this.iframe.contentWindow) return
    if (!isAllowedOrigin(event.origin, this.allowedOrigins)) return

    const env = parseEnvelope(event.data)
    if (!env || env.appInstanceId !== this.appInstanceId) return

    switch (env.type) {
      case "ready": {
        this.onReady?.()
        break
      }
      case "register": {
        const p = env.payload as ThirdPartyRpcRegisterPayload
        const tools = Array.isArray(p?.tools) ? p.tools : []
        this.onToolsRegistered?.(tools)
        break
      }
      case "result": {
        const p = env.payload as ThirdPartyRpcResultPayload | ThirdPartyRpcErrorPayload
        const callId = typeof p?.callId === "string" ? p.callId : ""
        const pending = callId ? this.pending.get(callId) : undefined
        if (!pending) break
        clearTimeout(pending.timer)
        this.pending.delete(callId)
        if (p.ok === false) {
          pending.resolve({ ok: false, error: typeof p.error === "string" ? p.error : "Unknown error" })
        } else {
          pending.resolve({ ok: true, result: p.result })
        }
        break
      }
      default:
        break
    }
  }
}
