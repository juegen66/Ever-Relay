"use client"

import { useMemo } from "react"

import { useFrontendTool } from "@copilotkit/react-core"

import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"
import { useDesktopWindowStore } from "@/lib/stores/desktop-window-store"
import { useThirdPartyAppRegistry } from "@/lib/third-party-app/registry"
import type { ThirdPartyToolDefinition } from "@/lib/third-party-app/types"
import { namespacedThirdPartyToolName } from "@/lib/third-party-app/types"

import { toErrorMessage, toolErr, toolOk } from "./types"

import type { ToolParameter } from "./types"

function jsonSchemaPropsToParameters(schema: unknown): ToolParameter[] {
  if (!schema || typeof schema !== "object") {
    return [
      {
        name: "payload",
        type: "object",
        description: "Optional arguments object for this tool.",
        required: false,
      },
    ]
  }

  const root = schema as Record<string, unknown>
  const props = root.properties
  if (!props || typeof props !== "object") {
    return [
      {
        name: "payload",
        type: "object",
        description: "Arguments for this tool.",
        required: false,
      },
    ]
  }

  const requiredList = Array.isArray(root.required)
    ? (root.required as unknown[]).filter((r): r is string => typeof r === "string")
    : []

  return Object.entries(props as Record<string, unknown>).map(([name, def]) => {
    const d = def as Record<string, unknown>
    const t = d.type
    let type: ToolParameter["type"] = "string"
    if (t === "number" || t === "integer") type = "number"
    else if (t === "boolean") type = "boolean"
    else if (t === "object") type = "object"
    else if (t === "array") type = "string[]"

    return {
      name,
      type,
      description: typeof d.description === "string" ? d.description : undefined,
      required: requiredList.includes(name),
    }
  })
}

function buildArgsFromHandlerInput(
  def: ThirdPartyToolDefinition,
  raw: Record<string, unknown>
): Record<string, unknown> {
  const params = jsonSchemaPropsToParameters(def.parameters)
  if (params.length === 1 && params[0].name === "payload") {
    const p = raw.payload
    if (p && typeof p === "object" && !Array.isArray(p)) {
      return p as Record<string, unknown>
    }
    return {}
  }
  const out: Record<string, unknown> = {}
  for (const p of params) {
    if (raw[p.name] !== undefined) {
      out[p.name] = raw[p.name]
    }
  }
  return out
}

function ThirdPartyDynamicTool(props: {
  windowId: string
  slug: string
  definition: ThirdPartyToolDefinition
}) {
  const { windowId, slug, definition } = props
  const copilotName = namespacedThirdPartyToolName(slug, definition.name)
  const parameters = useMemo(
    () => jsonSchemaPropsToParameters(definition.parameters),
    [definition.parameters]
  )

  useFrontendTool(
    {
      name: copilotName,
      description: definition.description || `Third-party tool ${definition.name}`,
      followUp: true,
      parameters,
      handler: async (args) => {
        const bridge = useThirdPartyAppRegistry.getState().getBridgeForWindow(windowId)
        if (!bridge) {
          return toolErr(
            "Third-party app is not connected (open and focus the app window)."
          )
        }
        try {
          const payload = buildArgsFromHandlerInput(definition, args as Record<string, unknown>)
          const result = await bridge.invoke(definition.name, payload)
          if (!result.ok) {
            return toolErr(result.error ?? "Third-party tool returned an error")
          }
          return toolOk(
            `Succeeded: third-party tool "${definition.name}" ran in the embedded app; see result for payload.`,
            { result: result.result }
          )
        } catch (e) {
          return toolErr(toErrorMessage(e))
        }
      },
    },
    [windowId, definition.name, definition.description, definition.parameters, copilotName, parameters]
  )

  return null
}

/**
 * Registers Copilot frontend tools for the focused third-party iframe (RPC).
 */
export function ThirdPartyToolsMount() {
  const thirdPartyWindowId = useDesktopAgentStore((s) => s.thirdPartyWindowId)
  const activeWindowId = useDesktopWindowStore((s) => s.activeWindowId)
  const resolvedWindowId = thirdPartyWindowId ?? activeWindowId
  const registration = useThirdPartyAppRegistry((s) =>
    resolvedWindowId ? s.iframeRegistrations[resolvedWindowId] : undefined
  )

  if (!resolvedWindowId || !registration?.ready || !registration.tools.length) {
    return null
  }

  return (
    <>
      {registration.tools.map((tool) => (
        <ThirdPartyDynamicTool
          key={`${registration.slug}:${tool.id}`}
          windowId={resolvedWindowId}
          slug={registration.slug}
          definition={tool}
        />
      ))}
    </>
  )
}
