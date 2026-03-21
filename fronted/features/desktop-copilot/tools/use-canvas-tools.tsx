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

import {
  ADD_SVG_TO_CANVAS_PARAMS,
  OPEN_CANVAS_PROJECT_PARAMS,
  toErrorMessage,
  toolErr,
  toolOk,
  toolRetryLater,
} from "./types"

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
        return toolErr("projectId or projectName is required")
      }

      const hasVisibleCanvasWindow = readWindowsFromCache().some((windowState) => {
        return windowState.appId === "canvas" && !windowState.minimized
      })

      if (!hasVisibleCanvasWindow) {
        openApp("canvas")
      }

      const ready = await waitForCanvasSessionReady(hasVisibleCanvasWindow ? 1200 : 3500)
      if (!ready) {
        return toolRetryLater(
          hasVisibleCanvasWindow
            ? "Canvas app is not ready yet."
            : "Canvas app was opened and is still loading before open_canvas_project can run.",
          {},
          {
            nextAction: "wait_for_canvas_ready",
          }
        )
      }

      const result = await openCanvasProjectInSession({
        projectId: projectId || undefined,
        projectName: projectName || undefined,
      })

      if (!result.ok) {
        return toolErr(result.error, {
          ...(result.candidates !== undefined ? { candidates: result.candidates } : {}),
        })
      }

      return toolOk(
        `Succeeded: canvas project is open in the editor (projectId ${result.projectId}).`,
        {
          projectId: result.projectId,
          mode: "editor" as const,
        }
      )
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
        return toolErr("prompt is required")
      }

      if (scale !== undefined && (!Number.isFinite(scale) || scale < 0.1 || scale > 4)) {
        return toolErr("scale must be a number between 0.1 and 4")
      }

      const hasVisibleCanvasWindow = readWindowsFromCache().some((windowState) => {
        return windowState.appId === "canvas" && !windowState.minimized
      })

      if (!hasVisibleCanvasWindow) {
        openApp("canvas")
      }

      const ready = await waitForCanvasSessionReady(hasVisibleCanvasWindow ? 1200 : 3500)
      if (!ready) {
        return toolRetryLater(
          hasVisibleCanvasWindow
            ? "Canvas app is not ready yet."
            : "Canvas app was opened and is still loading before add_svg_to_canvas can run.",
          {},
          {
            nextAction: "wait_for_canvas_ready",
          }
        )
      }

      const activeProjectId = getActiveCanvasProjectId()
      if (!activeProjectId) {
        return toolErr(
          "No active canvas project. Call open_canvas_project first.",
          {},
          {
            nextAction: "open_canvas_project",
          }
        )
      }

      if (width !== undefined && (width < 120 || width > 2400)) {
        return toolErr("width must be between 120 and 2400")
      }

      if (height !== undefined && (height < 120 || height > 2400)) {
        return toolErr("height must be between 120 and 2400")
      }

      let preparedSvg: Awaited<ReturnType<typeof canvasApi.generateSvg>>
      try {
        preparedSvg = await canvasApi.generateSvg({
          prompt,
          width,
          height,
        })
      } catch (error) {
        return toolErr(toErrorMessage(error))
      }

      const inserted = await insertSvgIntoActiveCanvasSession({
        svg: preparedSvg.svg,
        scale,
      })

      if (!inserted.ok) {
        return toolErr(inserted.error)
      }

      return toolOk(
        `Succeeded: generated SVG was inserted into the active canvas (projectId ${inserted.projectId}, ${inserted.insertedObjectCount} object(s)).`,
        {
          projectId: inserted.projectId,
          insertedObjectCount: inserted.insertedObjectCount,
          generatedWidth: preparedSvg.width,
          generatedHeight: preparedSvg.height,
          generatedAt: preparedSvg.generatedAt,
        }
      )
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
