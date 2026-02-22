"use client"

import { useCallback, useEffect, useRef } from "react"
import { useEditor } from "../hooks/use-Editor"
import * as fabric from "fabric"
import { useState } from "react"
import { useAutoResize } from "../hooks/use-auto-resize"
import { Navbar } from "./navbar"
import { Sidebar } from "./sidebar"
import { ShapesSidebar } from "./shapesiedebar"
import Toolbar from "./Toolbar"
import { Footer } from "./Footer"
import { ActiveTools } from "../types"
import { useCanvasEvents } from "../hooks/use-canvas-events"
import { FillColorSidebar } from "./fillcolor-sidebar"
import { StrokeColorSidebar } from "./strokecolor-sidebar"
import { TextSidebar } from "./textsidebar"
import { StrokeStyleSidebar } from "./stroke-style-sidebar"
import { BackgroundColorSidebar } from "./backgroundcolor-sidebar"
import { OpacitySidebar } from "./opacity-sidebar"





export const Editor = () => {
  const { init, editor, canUndo, canRedo } = useEditor()

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null)
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null)
  const [selectedObjects, setSelectedObjects] = useState<fabric.Object[]>([])

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
    if (!canvasRef.current) return

    const nextCanvas = new fabric.Canvas(canvasRef.current as HTMLCanvasElement, {
      controlsAboveOverlay: true,
      preserveObjectStacking: true,
    })

    setCanvas(nextCanvas)
    setContainerEl(containerRef.current)

    const cleanup = init({
      containerRef: containerRef,
      canvasRef: nextCanvas,
    })

    return () => {
      if (cleanup) cleanup()
      nextCanvas.dispose()
      setCanvas(null)
    }
  }, [init])

  return (
        <div className="canvas-theme flex h-full min-h-0 flex-col bg-background text-foreground">
            <Navbar
                activeTool={activeTool}
                onToolChange={onToolChange}
                editor={editor}
                canUndo={canUndo}
                canRedo={canRedo}
            />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar activeTool={activeTool} onToolChange={onToolChange} />
                <ShapesSidebar activeTool={activeTool} onToolChange={onToolChange} editor={editor} />
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
                <main className="flex flex-1 flex-col overflow-hidden border-l border-border bg-secondary/40">
                    <Toolbar
                        activeTool={activeTool}
                        onToolChange={onToolChange}
                        editor={editor}
                        hasSelection={selectedObjects.length > 0}
                    />
                    <div className="flex flex-1 overflow-auto bg-secondary/50 p-6 min-h-0">
                        <div className="flex h-full w-full items-center justify-center">
                            <div
                                ref={containerRef}
                                className="relative h-full min-h-[360px] w-full max-w-6xl"
                            >
                                <canvas ref={canvasRef} className="block h-full w-full" />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
  )
}
