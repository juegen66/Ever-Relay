"use client"

import { create } from "zustand"

import { thirdPartyAppIdFromSlug } from "./types"

import type { ThirdPartyAppManifest, ThirdPartyToolDefinition } from "./types"

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

function createInitialManifestsRecord() {
  return {}
}

interface ThirdPartyAppRegistryState {
  /** slug → manifest */
  manifests: Record<string, ThirdPartyAppManifest>
  /** windowId → registration */
  iframeRegistrations: Record<string, ThirdPartyIframeRegistration>
  /** windowId → bridge (set by host component) */
  bridges: Record<string, ThirdPartyBridgeHandle>
  registerManifest: (manifest: ThirdPartyAppManifest) => void
  unregisterManifest: (slug: string) => void
  syncManagedManifests: (manifests: ThirdPartyAppManifest[]) => void
  getManifest: (slug: string) => ThirdPartyAppManifest | undefined
  listManifests: () => ThirdPartyAppManifest[]
  setIframeRegistration: (registration: ThirdPartyIframeRegistration | null) => void
  clearIframeRegistration: (windowId: string) => void
  setBridge: (windowId: string, bridge: ThirdPartyBridgeHandle | null) => void
  getBridgeForWindow: (windowId: string) => ThirdPartyBridgeHandle | undefined
  getRegistrationForWindow: (windowId: string) => ThirdPartyIframeRegistration | undefined
}

export const useThirdPartyAppRegistry = create<ThirdPartyAppRegistryState>((set, get) => {
  return {
    manifests: createInitialManifestsRecord(),
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

    syncManagedManifests: (manifests) =>
      set(() => {
        const next: Record<string, ThirdPartyAppManifest> = createInitialManifestsRecord()
        for (const manifest of manifests) {
          next[manifest.slug] = manifest
        }
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
