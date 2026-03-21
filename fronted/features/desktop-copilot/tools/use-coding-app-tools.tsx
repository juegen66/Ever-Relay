"use client"

import { useCallback } from "react"

import { useFrontendTool } from "@copilotkit/react-core"

import { useCodingAppsStore } from "@/lib/stores/coding-apps-store"
import {
  useDesktopAgentStore,
  type ActiveCodingApp,
} from "@/lib/stores/desktop-agent-store"
import type { CodingApp } from "@/shared/contracts/coding-apps"

import {
  ACTIVATE_CODING_APP_PARAMS,
  CREATE_CODING_APP_PARAMS,
  toErrorMessage,
  toolErr,
  toolOk,
} from "./types"

type CodingAppSummary = Pick<
  CodingApp,
  "id" | "name" | "description" | "status" | "lastOpenedAt"
>

function formatCodingApp(app: CodingAppSummary | ActiveCodingApp) {
  return {
    id: app.id,
    name: app.name,
    description: app.description,
    status: app.status,
    lastOpenedAt: app.lastOpenedAt,
  }
}

function normalizeName(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

export function useCodingAppTools() {
  const loadApps = useCodingAppsStore((state) => state.loadApps)
  const createApp = useCodingAppsStore((state) => state.createApp)
  const activateApp = useCodingAppsStore((state) => state.activateApp)
  const activeCodingApp = useDesktopAgentStore((state) => state.activeCodingApp)
  const setCopilotSidebarOpen = useDesktopAgentStore((state) => state.setCopilotSidebarOpen)

  const listCodingApps = useCallback(async () => {
    try {
      const apps = await loadApps()
      const { activeCodingApp: nextActiveCodingApp } = useDesktopAgentStore.getState()

      return toolOk(`Succeeded: loaded ${apps.length} coding app(s).`, {
        count: apps.length,
        activeApp: nextActiveCodingApp ? formatCodingApp(nextActiveCodingApp) : null,
        apps: apps.map((app) => formatCodingApp(app)),
      })
    } catch (error) {
      return toolErr(toErrorMessage(error))
    }
  }, [loadApps])

  const createCodingApp = useCallback(
    async (args: { name?: string; description?: string }) => {
      const name = typeof args.name === "string" ? args.name.trim() : ""
      const description =
        typeof args.description === "string" && args.description.trim()
          ? args.description.trim()
          : undefined

      if (!name) {
        return toolErr("name is required")
      }

      try {
        const app = await createApp({
          name,
          ...(description ? { description } : {}),
        })

        setCopilotSidebarOpen(true)

        return toolOk(`Succeeded: created coding app "${app.name}" and opened the sidebar.`, {
          activeApp: formatCodingApp(app),
        })
      } catch (error) {
        return toolErr(toErrorMessage(error))
      }
    },
    [createApp, setCopilotSidebarOpen]
  )

  const getActiveCodingApp = useCallback(async () => {
    if (!activeCodingApp) {
      return toolOk("Succeeded: there is no active coding app bound to the sidebar right now.", {
        activeApp: null,
      })
    }

    return toolOk(
      `Succeeded: active coding app is "${activeCodingApp.name}" (${activeCodingApp.id}).`,
      {
        activeApp: formatCodingApp(activeCodingApp),
      }
    )
  }, [activeCodingApp])

  const activateCodingApp = useCallback(
    async (args: { appId?: string; name?: string }) => {
      const appId = typeof args.appId === "string" ? args.appId.trim() : ""
      const targetName = normalizeName(args.name)

      if (!appId && !targetName) {
        return toolErr("appId or name is required")
      }

      if (activeCodingApp?.id === appId) {
        setCopilotSidebarOpen(true)
        return toolOk("Succeeded: already active — no switch needed.", {
          skipped: true,
          activeApp: formatCodingApp(activeCodingApp),
        })
      }

      try {
        let nextAppId = appId

        if (!nextAppId) {
          const apps = await loadApps()
          const exactMatch = apps.find((app) => normalizeName(app.name) === targetName)
          const partialMatch =
            exactMatch ??
            apps.find((app) => normalizeName(app.name).includes(targetName))

          if (!partialMatch) {
            return toolErr(`Coding app not found: ${args.name ?? "unknown"}`, {
              candidates: apps.map((app) => ({ id: app.id, name: app.name })),
            })
          }

          nextAppId = partialMatch.id
        }

        const app = await activateApp(nextAppId)

        setCopilotSidebarOpen(true)

        return toolOk(`Succeeded: activated coding app "${app.name}" (${app.id}).`, {
          activeApp: formatCodingApp(app),
        })
      } catch (error) {
        return toolErr(toErrorMessage(error))
      }
    },
    [activateApp, activeCodingApp, loadApps, setCopilotSidebarOpen]
  )

  useFrontendTool(
    {
      name: "list_coding_apps",
      description: "List coding apps available to the current user.",
      parameters: [],
      handler: async () => listCodingApps(),
    },
    [listCodingApps]
  )

  useFrontendTool(
    {
      name: "create_coding_app",
      description:
        "Create a new coding app workspace, activate it, and bind the sidebar to that app thread.",
      parameters: CREATE_CODING_APP_PARAMS,
      handler: async (args) =>
        createCodingApp({
          name: typeof args.name === "string" ? args.name : undefined,
          description:
            typeof args.description === "string" ? args.description : undefined,
        }),
    },
    [createCodingApp]
  )

  useFrontendTool(
    {
      name: "get_active_coding_app",
      description: "Return the coding app currently bound to the sidebar thread, if any.",
      parameters: [],
      handler: async () => getActiveCodingApp(),
    },
    [getActiveCodingApp]
  )

  useFrontendTool(
    {
      name: "activate_coding_app",
      description:
        "Switch the sidebar into a specific coding app thread and make that app the active sandbox context.",
      parameters: ACTIVATE_CODING_APP_PARAMS,
      handler: async (args) =>
        activateCodingApp({
          appId: typeof args.appId === "string" ? args.appId : undefined,
          name: typeof args.name === "string" ? args.name : undefined,
        }),
    },
    [activateCodingApp]
  )
}
