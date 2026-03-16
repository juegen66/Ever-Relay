"use client"

import { create } from "zustand"

import { codingAppsApi } from "@/lib/api/modules/coding-apps"
import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"
import type { CodingApp, CreateCodingAppParams } from "@/shared/contracts/coding-apps"

interface CodingAppsStore {
  apps: CodingApp[]
  loading: boolean
  submitting: boolean
  error: string | null
  loadApps: () => Promise<CodingApp[]>
  createApp: (params: CreateCodingAppParams) => Promise<CodingApp>
  activateApp: (appId: string) => Promise<CodingApp>
  syncApp: (app: CodingApp) => void
  clearError: () => void
}

function upsertApps(apps: CodingApp[], nextApp: CodingApp) {
  return [nextApp, ...apps.filter((app) => app.id !== nextApp.id)]
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return "Unknown error"
}

export const useCodingAppsStore = create<CodingAppsStore>((set) => ({
  apps: [],
  loading: false,
  submitting: false,
  error: null,
  loadApps: async () => {
    set({ loading: true, error: null })

    try {
      const apps = await codingAppsApi.listApps()
      const { activeCodingApp, clearActiveCodingApp, syncActiveCodingApp } =
        useDesktopAgentStore.getState()

      if (activeCodingApp) {
        const matched = apps.find((app) => app.id === activeCodingApp.id)
        if (matched) {
          syncActiveCodingApp(matched)
        } else {
          clearActiveCodingApp()
        }
      }

      set({ apps, loading: false })
      return apps
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, error: message })
      throw error
    }
  },
  createApp: async (params) => {
    set({ submitting: true, error: null })

    try {
      const app = await codingAppsApi.createApp(params)
      set((state) => ({
        apps: upsertApps(state.apps, app),
        submitting: false,
      }))
      useDesktopAgentStore.getState().setActiveCodingApp(app)
      return app
    } catch (error) {
      const message = toErrorMessage(error)
      set({ submitting: false, error: message })
      throw error
    }
  },
  activateApp: async (appId) => {
    set({ submitting: true, error: null })

    try {
      const app = await codingAppsApi.activateApp(appId)
      set((state) => ({
        apps: upsertApps(state.apps, app),
        submitting: false,
      }))
      useDesktopAgentStore.getState().setActiveCodingApp(app)
      return app
    } catch (error) {
      const message = toErrorMessage(error)
      set({ submitting: false, error: message })
      throw error
    }
  },
  syncApp: (app) => {
    set((state) => ({
      apps: upsertApps(state.apps, app),
    }))

    const { activeCodingApp, syncActiveCodingApp } = useDesktopAgentStore.getState()
    if (activeCodingApp?.id === app.id) {
      syncActiveCodingApp(app)
    }
  },
  clearError: () => set({ error: null }),
}))
