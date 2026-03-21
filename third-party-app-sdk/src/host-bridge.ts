import {
  THIRD_PARTY_RPC_CHANNEL,
  type ThirdPartyRpcEnvelope,
  type ThirdPartyToolDescriptor,
} from "./types"

export interface CloudOSHostBridgeOptions {
  appInstanceId: string
  /** Parent origin for postMessage when known; default "*". */
  targetOrigin?: string
}

type ToolHandler = (args: Record<string, unknown>) => unknown | Promise<unknown>

/**
 * Browser-side SDK: run inside the iframe, talk to CloudOS parent via postMessage.
 */
export class CloudOSHostBridge {
  private readonly appInstanceId: string
  private readonly targetOrigin: string
  private readonly handlers = new Map<string, ToolHandler>()
  private readonly boundMessage: (event: MessageEvent) => void

  constructor(options: CloudOSHostBridgeOptions) {
    if (!options.appInstanceId) {
      throw new Error("CloudOSHostBridge: appInstanceId is required")
    }
    this.appInstanceId = options.appInstanceId
    this.targetOrigin = options.targetOrigin ?? "*"
    this.boundMessage = this.onMessage.bind(this)
    if (typeof window !== "undefined") {
      window.addEventListener("message", this.boundMessage)
    }
  }

  destroy(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("message", this.boundMessage)
    }
    this.handlers.clear()
  }

  onTool(name: string, handler: ToolHandler): void {
    this.handlers.set(name, handler)
  }

  registerTools(tools: ThirdPartyToolDescriptor[]): void {
    this.postToParent({
      channel: THIRD_PARTY_RPC_CHANNEL,
      v: 1,
      type: "register",
      appInstanceId: this.appInstanceId,
      payload: { tools },
    })
  }

  signalReady(): void {
    this.postToParent({
      channel: THIRD_PARTY_RPC_CHANNEL,
      v: 1,
      type: "ready",
      appInstanceId: this.appInstanceId,
      payload: {},
    })
  }

  static resolveAppInstanceIdFromLocation(): string | null {
    if (typeof window === "undefined") return null
    try {
      const q = new URLSearchParams(window.location.search)
      const id = q.get("cloudosWindowId")
      return id && id.length > 0 ? id : null
    } catch {
      return null
    }
  }

  private postToParent(envelope: ThirdPartyRpcEnvelope): void {
    if (typeof window === "undefined" || !window.parent) return
    window.parent.postMessage(envelope, this.targetOrigin)
  }

  private onMessage(event: MessageEvent): void {
    const data = event.data as ThirdPartyRpcEnvelope | undefined
    if (!data || data.channel !== THIRD_PARTY_RPC_CHANNEL || data.v !== 1) return
    if (data.appInstanceId !== this.appInstanceId) return
    if (data.type !== "call") return

    const payload = data.payload as {
      callId?: string
      toolName?: string
      args?: Record<string, unknown>
    }
    const callId = typeof payload.callId === "string" ? payload.callId : ""
    const toolName = typeof payload.toolName === "string" ? payload.toolName : ""
    const args =
      payload.args && typeof payload.args === "object" && !Array.isArray(payload.args)
        ? payload.args
        : {}

    const reply = (ok: boolean, result: unknown, error?: string) => {
      const p = ok
        ? { callId, ok: true as const, result }
        : { callId, ok: false as const, error: error ?? "error" }
      this.postToParent({
        channel: THIRD_PARTY_RPC_CHANNEL,
        v: 1,
        type: "result",
        appInstanceId: this.appInstanceId,
        payload: p,
      })
    }

    const handler = this.handlers.get(toolName)
    if (!handler) {
      reply(false, undefined, `Unknown tool: ${toolName}`)
      return
    }

    void Promise.resolve(handler(args))
      .then((res) => {
        reply(true, res, undefined)
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err)
        reply(false, undefined, msg)
      })
  }
}
