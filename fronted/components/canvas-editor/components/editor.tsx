"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import * as fabric from "fabric"

import type { CanvasProject } from "@/lib/api/modules/canvas"

import { AiSidebar } from "./ai-sidebar"
import { BackgroundColorSidebar } from "./backgroundcolor-sidebar"
import { CanvasSizeSidebar } from "./canvas-size-sidebar"
import { FillColorSidebar } from "./fillcolor-sidebar"
import { Footer } from "./Footer"
import { ImageSidebar } from "./image-sidebar"
import { Navbar } from "./navbar"
import { OpacitySidebar } from "./opacity-sidebar"
import { SettingsSidebar } from "./settings-sidebar"
import { ShapesSidebar } from "./shapesiedebar"
import { Sidebar } from "./sidebar"
import { StrokeStyleSidebar } from "./stroke-style-sidebar"
import { StrokeColorSidebar } from "./strokecolor-sidebar"
import { TemplatesSidebar } from "./templates-sidebar"
import { TextSidebar } from "./textsidebar"
import Toolbar from "./Toolbar"
import { useAutoResize } from "../hooks/use-auto-resize"
import { useCanvasEvents } from "../hooks/use-canvas-events"
import { useEditor, type EditorType } from "../hooks/use-Editor"

import type { ActiveTools } from "../types"

interface SaveCanvasContentResult {
  project?: CanvasProject
  conflictExpectedVersion?: number
  error?: string
}

interface EditorProps {
  project: CanvasProject
  onBackToHub: () => void
  onSaveContent: (
    projectId: string,
    contentJson: Record<string, unknown>,
    contentVersion: number
  ) => Promise<SaveCanvasContentResult>
  onEditorApiChange?: (projectId: string, editor: EditorType | null) => void
}

const COMPACT_WIDTH_BREAKPOINT = 980
const COMPACT_HEIGHT_BREAKPOINT = 720
const COMPACT_SIDEBAR_WIDTH = 80

export const Editor = ({ project, onBackToHub, onSaveContent, onEditorApiChange }: EditorProps) => {
  const {
    init,
    editor,
    canUndo,
    canRedo,
    loadDocument,
    getDocumentSnapshot,
    getDocumentSnapshotString,
  } = useEditor()

  const containerRef = useRef<HTMLDivElement>(null)
  const editorRootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const projectVersionRef = useRef(project.contentVersion)
  const lastSavedSnapshotRef = useRef<string | null>(null)
  const isHydratingRef = useRef(false)
  const hydratedProjectRef = useRef<{ id: string; contentVersion: number } | null>(null)

  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null)
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null)
  const [selectedObjects, setSelectedObjects] = useState<fabric.Object[]>([])
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error" | "conflict">("idle")
  const [saveMessage, setSaveMessage] = useState<string | undefined>(undefined)
  const [isCompactWidth, setIsCompactWidth] = useState(false)
  const [isCompactHeight, setIsCompactHeight] = useState(false)

  useCanvasEvents({ canvas, setSelectedObjects, selectedObjects, editor })
  useAutoResize({ container: containerEl, canvas: canvas as fabric.Canvas })

  const [activeTool, setActiveTool] = useState<ActiveTools>("Templates")
  const onToolChange = useCallback((tool: ActiveTools) => {
    if (tool === "Select") {
      return setActiveTool("Select")
    }
    setActiveTool(tool)
  }, [])

  useEffect(() => {
    const root = editorRootRef.current
    if (!root) return

    const updateLayoutMode = (width: number, height: number) => {
      setIsCompactWidth(width < COMPACT_WIDTH_BREAKPOINT)
      setIsCompactHeight(height < COMPACT_HEIGHT_BREAKPOINT)
    }

    const measure = () => {
      updateLayoutMode(root.clientWidth, root.clientHeight)
    }

    measure()

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      updateLayoutMode(width, height)
    })

    resizeObserver.observe(root)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return

    const nextCanvas = new fabric.Canvas(canvasRef.current as HTMLCanvasElement, {
      controlsAboveOverlay: true,
      preserveObjectStacking: true,
    })

    setCanvas(nextCanvas)
    setContainerEl(containerRef.current)

    const cleanup = init({
      containerRef,
      canvasRef: nextCanvas,
    })

    return () => {
      if (cleanup) cleanup()
      nextCanvas.dispose()
      setCanvas(null)
    }
  }, [init])

  const performSave = useCallback(async () => {
    if (!editor) return
    if (isHydratingRef.current) return

    const contentJson = getDocumentSnapshot()
    if (!contentJson) {
      return
    }
    const contentString = JSON.stringify(contentJson)

    if (contentString === lastSavedSnapshotRef.current) {
      setSaveState((current) => (current === "saving" ? current : "saved"))
      return
    }

    setSaveState("saving")
    setSaveMessage(undefined)

    const result = await onSaveContent(project.id, contentJson, projectVersionRef.current)

    if (result.project) {
      projectVersionRef.current = result.project.contentVersion
      lastSavedSnapshotRef.current = contentString
      setSaveState("saved")
      setSaveMessage(undefined)
      return
    }

    if (result.conflictExpectedVersion !== undefined) {
      projectVersionRef.current = result.conflictExpectedVersion
      setSaveState("conflict")
      setSaveMessage(`Version conflict (latest v${result.conflictExpectedVersion})`)
      return
    }

    setSaveState("error")
    setSaveMessage(result.error ?? "Save failed")
  }, [editor, getDocumentSnapshot, onSaveContent, project.id])

  const scheduleSave = useCallback(() => {
    if (!editor || isHydratingRef.current) return

    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current)
    }

    saveDebounceRef.current = setTimeout(() => {
      void performSave()
      saveDebounceRef.current = null
    }, 1200)
  }, [editor, performSave])

  useEffect(() => {
    if (!canvas) return

    const shouldIgnore = (target?: fabric.Object) => {
      const role = (target as fabric.Object & { data?: { role?: unknown } } | undefined)?.data?.role
      return role === "workspace"
    }

    const handleCanvasMutation = (event?: { target?: fabric.Object }) => {
      if (shouldIgnore(event?.target)) {
        return
      }
      scheduleSave()
    }

    canvas.on("object:added", handleCanvasMutation)
    canvas.on("object:removed", handleCanvasMutation)
    canvas.on("object:modified", handleCanvasMutation)
    canvas.on("text:changed", handleCanvasMutation)

    return () => {
      canvas.off("object:added", handleCanvasMutation)
      canvas.off("object:removed", handleCanvasMutation)
      canvas.off("object:modified", handleCanvasMutation)
      canvas.off("text:changed", handleCanvasMutation)
    }
  }, [canvas, scheduleSave])

  useEffect(() => {
    if (!editor) return
    if (
      hydratedProjectRef.current &&
      hydratedProjectRef.current.id === project.id &&
      hydratedProjectRef.current.contentVersion === project.contentVersion
    ) {
      isHydratingRef.current = false
      return
    }

    let cancelled = false

    const hydrateProject = async () => {
      isHydratingRef.current = true
      projectVersionRef.current = project.contentVersion

      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current)
        saveDebounceRef.current = null
      }

      try {
        const hasContent = project.contentJson && Object.keys(project.contentJson).length > 0
        if (hasContent) {
          await loadDocument(project.contentJson)
        }

        if (cancelled) return

        const snapshot = getDocumentSnapshotString()
        lastSavedSnapshotRef.current = snapshot
        hydratedProjectRef.current = {
          id: project.id,
          contentVersion: project.contentVersion,
        }
        setSaveState("saved")
        setSaveMessage(undefined)
      } catch (error) {
        console.error("Failed to hydrate canvas project", error)
        if (cancelled) return
        setSaveState("error")
        setSaveMessage("Failed to load project content")
      } finally {
        if (!cancelled) {
          isHydratingRef.current = false
        }
      }
    }

    void hydrateProject()

    return () => {
      cancelled = true
    }
  }, [editor, getDocumentSnapshotString, loadDocument, project.contentJson, project.contentVersion, project.id])

  useEffect(() => {
    if (!onEditorApiChange) {
      return
    }

    onEditorApiChange(project.id, editor)
    return () => {
      onEditorApiChange(project.id, null)
    }
  }, [editor, onEditorApiChange, project.id])

  useEffect(() => {
    return () => {
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current)
        saveDebounceRef.current = null
      }
    }
  }, [])

  const handleBack = useCallback(() => {
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current)
      saveDebounceRef.current = null
    }

    if (!editor) {
      onBackToHub()
      return
    }

    void performSave().finally(() => {
      onBackToHub()
    })
  }, [editor, onBackToHub, performSave])

  const renderToolPanels = () => (
    <>
      <TemplatesSidebar activeTool={activeTool} onToolChange={onToolChange} editor={editor} />
      <ShapesSidebar activeTool={activeTool} onToolChange={onToolChange} editor={editor} />
      <ImageSidebar activeTool={activeTool} onToolChange={onToolChange} editor={editor} />
      <TextSidebar
        activeTool={activeTool}
        onToolChange={onToolChange}
        editor={editor}
        selectedObjects={selectedObjects}
      />
      <FillColorSidebar activeTool={activeTool} onToolChange={onToolChange} editor={editor} selectedObjects={selectedObjects} />
      <StrokeColorSidebar activeTool={activeTool} onToolChange={onToolChange} editor={editor} selectedObjects={selectedObjects} />
      <StrokeStyleSidebar activeTool={activeTool} onToolChange={onToolChange} editor={editor} selectedObjects={selectedObjects} />
      <BackgroundColorSidebar activeTool={activeTool} onToolChange={onToolChange} editor={editor} />
      <OpacitySidebar activeTool={activeTool} onToolChange={onToolChange} editor={editor} selectedObjects={selectedObjects} />
      <CanvasSizeSidebar activeTool={activeTool} onToolChange={onToolChange} editor={editor} />
      <AiSidebar activeTool={activeTool} onToolChange={onToolChange} />
      <SettingsSidebar activeTool={activeTool} onToolChange={onToolChange} />
    </>
  )

  return (
    <div ref={editorRootRef} className="flex h-full min-h-0 flex-col bg-neutral-100/70 text-neutral-900">
      <Navbar
        activeTool={activeTool}
        onToolChange={onToolChange}
        editor={editor}
        canUndo={canUndo}
        canRedo={canRedo}
        projectTitle={project.title}
        saveState={saveState}
        saveMessage={saveMessage}
        onBackToHub={handleBack}
        onManualSave={() => {
          void performSave()
        }}
        compact={isCompactHeight}
      />
      <div className="relative flex flex-1 overflow-hidden">
        <Sidebar activeTool={activeTool} onToolChange={onToolChange} compact={isCompactWidth} />
        {!isCompactWidth && renderToolPanels()}
        <main className="relative z-0 flex flex-1 flex-col overflow-hidden border-l border-black/5 bg-neutral-100/70">
          <Toolbar
            activeTool={activeTool}
            onToolChange={onToolChange}
            editor={editor}
            hasSelection={selectedObjects.length > 0}
            compact={isCompactHeight}
          />
          <div className={`flex min-h-0 flex-1 overflow-auto bg-neutral-200/40 ${isCompactHeight ? "p-3" : "p-6"}`}>
            <div className="flex h-full w-full items-center justify-center">
              <div
                ref={containerRef}
                className={`relative h-full w-full ${isCompactHeight ? "min-h-[220px]" : "min-h-[320px]"}`}
              >
                <canvas ref={canvasRef} className="block h-full w-full" />
              </div>
            </div>
          </div>
        </main>
        {isCompactWidth && (
          <div className="pointer-events-none absolute inset-y-0 z-40 flex" style={{ left: COMPACT_SIDEBAR_WIDTH }}>
            <div className="pointer-events-auto h-full min-h-0">{renderToolPanels()}</div>
          </div>
        )}
      </div>
      {!isCompactHeight && <Footer />}
    </div>
  )
}
