"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { useQueryClient } from "@tanstack/react-query"

import {
  CanvasEditor,
  type EditorType,
  type SaveCanvasContentResult,
} from "@/components/canvas-editor"
import { ProjectsHub } from "@/components/canvas-manager"
import { canvasApi } from "@/lib/api/modules/canvas"
import {
  registerCanvasSession,
  unregisterCanvasSession,
  type CanvasSession,
  type CanvasProjectCandidate,
} from "@/lib/canvas-session"
import {
  canvasQueryKeys,
  useCanvasProjectQuery,
  useUpdateCanvasProjectContentMutation,
} from "@/lib/query/canvas"

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return fallback
}

export function CanvasApp() {
  const [mode, setMode] = useState<"hub" | "editor">("hub")
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const activeEditorRef = useRef<EditorType | null>(null)
  const activeEditorProjectIdRef = useRef<string | null>(null)
  const queryClient = useQueryClient()
  const projectQuery = useCanvasProjectQuery({
    projectId: activeProjectId,
    enabled: mode === "editor",
  })
  const updateContentMutation = useUpdateCanvasProjectContentMutation()

  const handleOpenProject = useCallback(
    async (projectId: string) => {
      setActiveProjectId(projectId)
      setMode("editor")
    },
    []
  )

  const openProjectById = useCallback<CanvasSession["openProjectById"]>(async (projectId) => {
    const normalizedProjectId = projectId.trim()
    if (!normalizedProjectId) {
      return {
        ok: false,
        error: "projectId is required",
      }
    }

    try {
      await canvasApi.getProject(normalizedProjectId, false)
    } catch (error) {
      return {
        ok: false,
        error: toErrorMessage(error, `Canvas project not found: ${normalizedProjectId}`),
      }
    }

    setActiveProjectId(normalizedProjectId)
    setMode("editor")
    return { ok: true }
  }, [])

  const findProjectByName = useCallback<CanvasSession["findProjectByName"]>(async (projectName) => {
    const normalizedProjectName = projectName.trim()
    if (!normalizedProjectName) {
      return {
        ok: false,
        error: "projectName is required",
      }
    }

    const normalizedQuery = normalizedProjectName.toLowerCase()
    const toCandidate = (project: { id: string; title: string }): CanvasProjectCandidate => ({
      id: project.id,
      title: project.title,
    })

    try {
      const result = await canvasApi.listProjects({
        q: normalizedProjectName,
        includeDeleted: false,
        deletedOnly: false,
        sort: "updated",
        order: "desc",
        limit: 50,
      })

      if (result.items.length === 0) {
        return {
          ok: false,
          error: `No canvas project found by name: ${normalizedProjectName}`,
        }
      }

      const exactMatches = result.items.filter((project) => {
        return project.title.trim().toLowerCase() === normalizedQuery
      })

      if (exactMatches.length === 1) {
        return {
          ok: true,
          projectId: exactMatches[0].id,
        }
      }

      if (exactMatches.length > 1) {
        return {
          ok: false,
          error: `Multiple projects found with name "${normalizedProjectName}"`,
          candidates: exactMatches.slice(0, 10).map(toCandidate),
        }
      }

      const partialMatches = result.items.filter((project) => {
        return project.title.trim().toLowerCase().includes(normalizedQuery)
      })

      if (partialMatches.length === 1) {
        return {
          ok: true,
          projectId: partialMatches[0].id,
        }
      }

      if (partialMatches.length > 1) {
        return {
          ok: false,
          error: `Multiple projects match "${normalizedProjectName}"`,
          candidates: partialMatches.slice(0, 10).map(toCandidate),
        }
      }

      if (result.items.length === 1) {
        return {
          ok: true,
          projectId: result.items[0].id,
        }
      }

      return {
        ok: false,
        error: `No unique canvas project match for "${normalizedProjectName}"`,
        candidates: result.items.slice(0, 10).map(toCandidate),
      }
    } catch (error) {
      return {
        ok: false,
        error: toErrorMessage(error, "Failed to search canvas projects"),
      }
    }
  }, [])

  const handleEditorApiChange = useCallback((projectId: string, nextEditor: EditorType | null) => {
    if (nextEditor) {
      activeEditorRef.current = nextEditor
      activeEditorProjectIdRef.current = projectId
      return
    }

    if (activeEditorProjectIdRef.current === projectId) {
      activeEditorRef.current = null
      activeEditorProjectIdRef.current = null
    }
  }, [])

  const getActiveProjectId = useCallback(() => {
    return activeProjectId
  }, [activeProjectId])

  const insertSvg = useCallback<CanvasSession["insertSvg"]>(async ({ svg, scale }) => {
    if (!activeProjectId || mode !== "editor") {
      return {
        ok: false,
        error: "No active canvas project in editor mode. Call open_canvas_project first.",
      }
    }

    if (!activeEditorRef.current || activeEditorProjectIdRef.current !== activeProjectId) {
      return {
        ok: false,
        error: "Canvas editor is not ready yet",
      }
    }

    return activeEditorRef.current.addSvgFromString(svg, {
      scale,
    }).then((result) => {
      if (!result.ok) {
        return result
      }

      return {
        ok: true,
        projectId: activeProjectId,
        insertedObjectCount: result.insertedObjectCount,
      }
    })
  }, [activeProjectId, mode])

  useEffect(() => {
    const session: CanvasSession = {
      openProjectById,
      findProjectByName,
      getActiveProjectId,
      insertSvg,
    }

    registerCanvasSession(session)
    return () => unregisterCanvasSession(session)
  }, [findProjectByName, getActiveProjectId, insertSvg, openProjectById])

  const handleBackToHub = useCallback(() => {
    setMode("hub")
    setActiveProjectId(null)
    void queryClient.invalidateQueries({ queryKey: canvasQueryKeys.projectsAll })
  }, [queryClient])

  const handleSaveContent = useCallback(
    async (projectId: string, contentJson: Record<string, unknown>, contentVersion: number): Promise<SaveCanvasContentResult> => {
      try {
        const result = await updateContentMutation.mutateAsync({
          id: projectId,
          params: { contentJson, contentVersion },
        })

        if (result.project || result.conflictExpectedVersion !== undefined) {
          return result
        }

        return { error: "Failed to save project" }
      } catch (error) {
        return { error: toErrorMessage(error, "Failed to save project") }
      }
    },
    [updateContentMutation]
  )

  if (mode === "hub" || !activeProjectId) {
    return (
      <div className="h-full min-h-0">
        <ProjectsHub onOpenProject={handleOpenProject} />
      </div>
    )
  }

  if (projectQuery.isPending) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center text-sm text-neutral-500">
        Loading project...
      </div>
    )
  }

  if (!projectQuery.data) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-neutral-600">
          {toErrorMessage(projectQuery.error, "Failed to load project")}
        </p>
        <button
          type="button"
          className="rounded-md border border-black/10 px-3 py-1.5 text-xs text-neutral-700 hover:bg-black/5"
          onClick={handleBackToHub}
        >
          Back to Projects
        </button>
      </div>
    )
  }

  return (
    <div className="h-full min-h-0">
      <CanvasEditor
        project={projectQuery.data}
        onBackToHub={handleBackToHub}
        onSaveContent={handleSaveContent}
        onEditorApiChange={handleEditorApiChange}
      />
    </div>
  )
}
