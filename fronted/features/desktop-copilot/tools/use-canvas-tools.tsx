"use client"

import { useCallback } from "react"

import { useFrontendTool } from "@copilotkit/react-core"

import { canvasApi } from "@/lib/api/modules/canvas"
import {
  getActiveCanvasProjectId,
  insertSvgIntoActiveCanvasSession,
  openCanvasProjectInSession,
  waitForCanvasSessionReady,
} from "@/lib/canvas-session"
import { useDesktopWindowStore } from "@/lib/stores/desktop-window-store"

import { ADD_SVG_TO_CANVAS_PARAMS, OPEN_CANVAS_PROJECT_PARAMS, toErrorMessage } from "./types"

export function useCanvasTools() {
  const openApp = useDesktopWindowStore((state) => state.openApp)

  const readWindowsFromCache = useCallback(() => {
    return useDesktopWindowStore.getState().windows
  }, [])

  const openCanvasProject = useCallback(
    async (args: { projectId?: string; projectName?: string }) => {
      const projectId = typeof args.projectId === "string" ? args.projectId.trim() : ""
      const projectName = typeof args.projectName === "string" ? args.projectName.trim() : ""

      if (!projectId && !projectName) {
        return {
          ok: false,
          error: "projectId or projectName is required",
        }
      }

      const hasVisibleCanvasWindow = readWindowsFromCache().some((windowState) => {
        return windowState.appId === "canvas" && !windowState.minimized
      })

      if (!hasVisibleCanvasWindow) {
        openApp("canvas")
      }

      const ready = await waitForCanvasSessionReady(hasVisibleCanvasWindow ? 1200 : 3500)
      if (!ready) {
        return {
          ok: false,
          error: hasVisibleCanvasWindow
            ? "Canvas app is not ready yet. Please retry shortly."
            : "Canvas app opened. Please wait for it to load, then retry open_canvas_project.",
        }
      }

      const result = await openCanvasProjectInSession({
        projectId: projectId || undefined,
        projectName: projectName || undefined,
      })

      if (!result.ok) {
        return {
          ok: false,
          error: result.error,
          candidates: result.candidates,
        }
      }

      return {
        ok: true,
        projectId: result.projectId,
        mode: "editor",
      }
    },
    [openApp, readWindowsFromCache]
  )

  const addSvgToCanvas = useCallback(
    async (args: { prompt?: string; scale?: number; width?: number; height?: number }) => {
      const prompt = typeof args.prompt === "string" ? args.prompt.trim() : ""
      const scale = typeof args.scale === "number" ? args.scale : undefined
      const width = typeof args.width === "number" ? Math.trunc(args.width) : undefined
      const height = typeof args.height === "number" ? Math.trunc(args.height) : undefined

      if (!prompt) {
        return {
          ok: false,
          error: "prompt is required",
        }
      }

      if (scale !== undefined && (!Number.isFinite(scale) || scale < 0.1 || scale > 4)) {
        return {
          ok: false,
          error: "scale must be a number between 0.1 and 4",
        }
      }

      const hasVisibleCanvasWindow = readWindowsFromCache().some((windowState) => {
        return windowState.appId === "canvas" && !windowState.minimized
      })

      if (!hasVisibleCanvasWindow) {
        openApp("canvas")
      }

      const ready = await waitForCanvasSessionReady(hasVisibleCanvasWindow ? 1200 : 3500)
      if (!ready) {
        return {
          ok: false,
          error: hasVisibleCanvasWindow
            ? "Canvas app is not ready yet. Please retry shortly."
            : "Canvas app opened. Please wait for it to load, then call open_canvas_project before add_svg_to_canvas.",
        }
      }

      const activeProjectId = getActiveCanvasProjectId()
      if (!activeProjectId) {
        return {
          ok: false,
          error: "No active canvas project. Call open_canvas_project first.",
        }
      }

      if (width !== undefined && (width < 120 || width > 2400)) {
        return {
          ok: false,
          error: "width must be between 120 and 2400",
        }
      }

      if (height !== undefined && (height < 120 || height > 2400)) {
        return {
          ok: false,
          error: "height must be between 120 and 2400",
        }
      }

      let preparedSvg: Awaited<ReturnType<typeof canvasApi.generateSvg>>
      try {
        preparedSvg = await canvasApi.generateSvg({
          prompt,
          width,
          height,
        })
      } catch (error) {
        return {
          ok: false,
          error: toErrorMessage(error),
        }
      }

      const inserted = await insertSvgIntoActiveCanvasSession({
        svg: preparedSvg.svg,
        scale,
      })

      if (!inserted.ok) {
        return inserted
      }

      return {
        ok: true,
        projectId: inserted.projectId,
        insertedObjectCount: inserted.insertedObjectCount,
        generatedWidth: preparedSvg.width,
        generatedHeight: preparedSvg.height,
        generatedAt: preparedSvg.generatedAt,
      }
    },
    [openApp, readWindowsFromCache]
  )

  useFrontendTool(
    {
      name: "open_canvas_project",
      description: "Open Canvas app and navigate to a specific project by id or name.",
      parameters: OPEN_CANVAS_PROJECT_PARAMS,
      handler: async (args) => {
        return openCanvasProject({
          projectId: typeof args.projectId === "string" ? args.projectId : undefined,
          projectName: typeof args.projectName === "string" ? args.projectName : undefined,
        })
      },
    },
    [openCanvasProject]
  )

  useFrontendTool(
    {
      name: "add_svg_to_canvas",
      description: "Generate SVG via backend and insert it into the currently opened canvas project.",
      parameters: ADD_SVG_TO_CANVAS_PARAMS,
      handler: async (args) => {
        return addSvgToCanvas({
          prompt: typeof args.prompt === "string" ? args.prompt : undefined,
          scale: typeof args.scale === "number" ? args.scale : undefined,
          width: typeof args.width === "number" ? args.width : undefined,
          height: typeof args.height === "number" ? args.height : undefined,
        })
      },
    },
    [addSvgToCanvas]
  )
}
