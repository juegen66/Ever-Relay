"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import type { WindowState } from "@/lib/desktop/types"
import { IframeRpcBridge } from "@/lib/third-party-app/iframe-rpc-bridge"
import { useThirdPartyAppRegistry } from "@/lib/third-party-app/registry"
import type { ThirdPartyToolDefinition } from "@/lib/third-party-app/types"
import { thirdPartySlugFromAppId } from "@/lib/third-party-app/types"

interface ThirdPartyAppProps {
  windowState: WindowState
}

export function ThirdPartyApp({ windowState }: ThirdPartyAppProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const bridgeRef = useRef<IframeRpcBridge | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const slug = thirdPartySlugFromAppId(windowState.appId)
  const manifest = useThirdPartyAppRegistry((s) => (slug ? s.manifests[slug] : undefined))
  const setIframeRegistration = useThirdPartyAppRegistry((s) => s.setIframeRegistration)
  const clearIframeRegistration = useThirdPartyAppRegistry((s) => s.clearIframeRegistration)
  const setBridge = useThirdPartyAppRegistry((s) => s.setBridge)

  const syncRegistration = useCallback(
    (tools: ThirdPartyToolDefinition[], ready: boolean) => {
      if (!slug) return
      setIframeRegistration({
        windowId: windowState.id,
        appId: windowState.appId,
        slug,
        tools,
        ready,
        updatedAt: Date.now(),
      })
    },
    [setIframeRegistration, slug, windowState.appId, windowState.id]
  )

  useEffect(() => {
    if (!slug || !manifest) return

    const iframe = iframeRef.current
    if (!iframe) return

    const allowedOrigins =
      manifest.allowedOrigins && manifest.allowedOrigins.length > 0
        ? manifest.allowedOrigins
        : []

    const bridge = new IframeRpcBridge({
      iframe,
      appInstanceId: windowState.id,
      slug,
      allowedOrigins,
      onReady: () => {
        syncRegistration([], true)
      },
      onToolsRegistered: (tools) => {
        syncRegistration(tools, true)
      },
      onTeardown: () => {
        setBridge(windowState.id, null)
        clearIframeRegistration(windowState.id)
      },
    })

    bridgeRef.current = bridge
    setBridge(windowState.id, bridge.getHandle())

    return () => {
      bridge.dispose()
      bridgeRef.current = null
    }
  }, [
    clearIframeRegistration,
    manifest,
    setBridge,
    slug,
    syncRegistration,
    windowState.id,
  ])

  if (!slug || !manifest) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-100 p-4 text-center text-sm text-zinc-600">
        Unknown third-party app
        {!slug ? " (invalid id)" : ` (no manifest for ${slug})`}
      </div>
    )
  }

  const sandboxTokens = ["allow-scripts", "allow-forms", "allow-modals"]
  if (manifest.sandboxExtra) {
    for (const token of manifest.sandboxExtra.split(/\s+/)) {
      if (token && !sandboxTokens.includes(token)) sandboxTokens.push(token)
    }
  }
  const sandbox = sandboxTokens.join(" ")

  return (
    <div className="flex h-full flex-col bg-white">
      {loadError ? (
        <div className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {loadError}
        </div>
      ) : null}
      <div className="relative min-h-0 flex-1">
        {manifest.source.type === "url" ? (
          <iframe
            ref={iframeRef}
            title={manifest.displayName}
            src={(() => {
              const base = manifest.source.url
              const sep = base.includes("?") ? "&" : "?"
              return `${base}${sep}cloudosWindowId=${encodeURIComponent(windowState.id)}`
            })()}
            sandbox={sandbox}
            className="block h-full w-full border-0"
            onError={() => setLoadError("Failed to load iframe (check URL and CSP).")}
          />
        ) : (
          <iframe
            ref={iframeRef}
            title={manifest.displayName}
            srcDoc={manifest.source.html}
            sandbox={sandbox}
            className="block h-full w-full border-0"
            onError={() => setLoadError("Failed to render embedded HTML.")}
          />
        )}
      </div>
    </div>
  )
}
