export const THIRD_PARTY_RPC_CHANNEL = "cloudos:third-party:rpc" as const

export type ThirdPartyRpcType = "ready" | "register" | "call" | "result" | "error" | "event"

export interface ThirdPartyRpcEnvelope {
  channel: typeof THIRD_PARTY_RPC_CHANNEL
  v: 1
  type: ThirdPartyRpcType
  appInstanceId: string
  payload: unknown
}

export interface ThirdPartyToolDescriptor {
  id: string
  name: string
  description: string
  /** JSON Schema object (optional) */
  parameters?: Record<string, unknown>
}
