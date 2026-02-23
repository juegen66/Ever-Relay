"use client"

import { useCallback, useState } from "react"

import { CanvasEditor, type SaveCanvasContentResult } from "@/components/canvas-editor/canvas-editor"
import { ProjectsHub } from "@/components/canvas-manager"
import type { CanvasProject } from "@/lib/api/modules/canvas"
import { useCanvasProjectsStore } from "@/lib/stores/canvas-projects-store"

export function CanvasApp() {
  const [mode, setMode] = useState<"hub" | "editor">("hub")
  const [activeProject, setActiveProject] = useState<CanvasProject | null>(null)

  const fetchProjects = useCanvasProjectsStore((state) => state.fetchProjects)
  const loadProjectById = useCanvasProjectsStore((state) => state.loadProjectById)
  const saveProjectContent = useCanvasProjectsStore((state) => state.saveProjectContent)

  const handleOpenProject = useCallback(
    async (projectId: string) => {
      const project = await loadProjectById(projectId)
      if (!project) return

      setActiveProject(project)
      setMode("editor")
    },
    [loadProjectById]
  )

  const handleBackToHub = useCallback(() => {
    setMode("hub")
    void fetchProjects()
  }, [fetchProjects])

  const handleSaveContent = useCallback(
    async (projectId: string, contentJson: Record<string, unknown>, contentVersion: number): Promise<SaveCanvasContentResult> => {
      return saveProjectContent(projectId, contentJson, contentVersion)
    },
    [saveProjectContent]
  )

  return (
    <div className="h-full min-h-0">
      {mode === "hub" || !activeProject ? (
        <ProjectsHub onOpenProject={handleOpenProject} />
      ) : (
        <CanvasEditor
          project={activeProject}
          onBackToHub={handleBackToHub}
          onSaveContent={handleSaveContent}
        />
      )}
    </div>
  )
}
