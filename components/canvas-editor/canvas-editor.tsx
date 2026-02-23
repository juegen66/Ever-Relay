"use client"

import type { CanvasProject } from "@/lib/api/modules/canvas"

import { Editor } from "./components/editor"

export interface SaveCanvasContentResult {
  project?: CanvasProject
  conflictExpectedVersion?: number
  error?: string
}

interface CanvasEditorProps {
  project: CanvasProject
  onBackToHub: () => void
  onSaveContent: (
    projectId: string,
    contentJson: Record<string, unknown>,
    contentVersion: number
  ) => Promise<SaveCanvasContentResult>
}

export function CanvasEditor({ project, onBackToHub, onSaveContent }: CanvasEditorProps) {
  return (
    <Editor
      project={project}
      onBackToHub={onBackToHub}
      onSaveContent={onSaveContent}
    />
  )
}
