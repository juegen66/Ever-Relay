"use client"

import { create } from "zustand"

import type { ThirdPartyAppManifest, ThirdPartyToolDefinition } from "./types"
import { thirdPartyAppIdFromSlug } from "./types"

/** Runtime registration for one iframe instance (one window). */
export interface ThirdPartyIframeRegistration {
  windowId: string
  appId: string
  slug: string
  tools: ThirdPartyToolDefinition[]
  ready: boolean
  updatedAt: number
}

export interface ThirdPartyBridgeHandle {
  invoke: (
    toolName: string,
    args: Record<string, unknown>
  ) => Promise<{ ok: true; result: unknown } | { ok: false; error: string }>
}

const manifestsBySlug = new Map<string, ThirdPartyAppManifest>()

function seedBuiltInManifests() {
  const demo: ThirdPartyAppManifest = {
    slug: "demo_weather",
    displayName: "Demo Weather",
    description: "Sample third-party app using CloudOS iframe RPC (local demo).",
    source: {
      type: "url",
      url: "/third-party-apps/demo-weather/index.html",
    },
    defaultSize: { w: 420, h: 520 },
    allowedOrigins: [],
  }
  manifestsBySlug.set(demo.slug, demo)
}

seedBuiltInManifests()

interface ThirdPartyAppRegistryState {
  /** slug → manifest */
  manifests: Record<string, ThirdPartyAppManifest>
  /** windowId → registration */
  iframeRegistrations: Record<string, ThirdPartyIframeRegistration>
  /** windowId → bridge (set by host component) */
  bridges: Record<string, ThirdPartyBridgeHandle>
  registerManifest: (manifest: ThirdPartyAppManifest) => void
  unregisterManifest: (slug: string) => void
  getManifest: (slug: string) => ThirdPartyAppManifest | undefined
  listManifests: () => ThirdPartyAppManifest[]
  setIframeRegistration: (registration: ThirdPartyIframeRegistration | null) => void
  clearIframeRegistration: (windowId: string) => void
  setBridge: (windowId: string, bridge: ThirdPartyBridgeHandle | null) => void
  getBridgeForWindow: (windowId: string) => ThirdPartyBridgeHandle | undefined
  getRegistrationForWindow: (windowId: string) => ThirdPartyIframeRegistration | undefined
}

export const useThirdPartyAppRegistry = create<ThirdPartyAppRegistryState>((set, get) => {
  const initialManifests: Record<string, ThirdPartyAppManifest> = {}
  for (const m of manifestsBySlug.values()) {
    initialManifests[m.slug] = m
  }

  return {
    manifests: initialManifests,
    iframeRegistrations: {},
    bridges: {},

    registerManifest: (manifest) =>
      set((state) => ({
        manifests: { ...state.manifests, [manifest.slug]: manifest },
      })),

    unregisterManifest: (slug) =>
      set((state) => {
        const next = { ...state.manifests }
        delete next[slug]
        return { manifests: next }
      }),

    getManifest: (slug) => get().manifests[slug],

    listManifests: () => Object.values(get().manifests),

    setIframeRegistration: (registration) =>
      set((state) => {
        if (!registration) return state
        return {
          iframeRegistrations: {
            ...state.iframeRegistrations,
            [registration.windowId]: registration,
          },
        }
      }),

    clearIframeRegistration: (windowId) =>
      set((state) => {
        const next = { ...state.iframeRegistrations }
        delete next[windowId]
        const bridges = { ...state.bridges }
        delete bridges[windowId]
        return { iframeRegistrations: next, bridges }
      }),

    setBridge: (windowId, bridge) =>
      set((state) => {
        const bridges = { ...state.bridges }
        if (bridge) bridges[windowId] = bridge
        else delete bridges[windowId]
        return { bridges }
      }),

    getBridgeForWindow: (windowId) => get().bridges[windowId],

    getRegistrationForWindow: (windowId) => get().iframeRegistrations[windowId],
  }
})

export function getThirdPartyAppIdForSlug(slug: string): string {
  return thirdPartyAppIdFromSlug(slug)
}
