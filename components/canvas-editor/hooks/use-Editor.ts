import { useCallback, useState } from "react"
import * as fabric from "fabric"
import { useMemo, useRef } from "react"
import {
    CIRCLE_OPTION,
    RECTANGLE_OPTION,
    TRIANGLE_OPTION,
    DIAMOND_POINTS,
    STAR_POINTS,
    HEART_PATH,
    FILL_COLORS,
    STROKE_COLORS,
    STROKE_WIDTH,
    type StrokeStyle,
    TEXT_OPTION,
    TEXT_PRESETS,
    DEFAULT_TEXT_VALUE,
    type TextPresetId,
} from "../types"

interface InitProps {
    containerRef: React.RefObject<HTMLDivElement | null>
    canvasRef: fabric.Canvas
}

interface BuildEditorConfig {
    getWorkspace: () => fabric.Rect | null
    recordHistory: () => void
    undo: () => Promise<void>
    redo: () => Promise<void>
    canUndo: () => boolean
    canRedo: () => boolean
}

const HISTORY_LIMIT = 50

const getExportFileName = (ext: "png" | "jpg" | "svg" | "json") => {
    const date = new Date()
    const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}${String(date.getSeconds()).padStart(2, "0")}`
    return `canvas-${stamp}.${ext}`
}

const downloadDataUrl = (dataUrl: string, fileName: string) => {
    const link = document.createElement("a")
    link.href = dataUrl
    link.download = fileName
    link.rel = "noopener"
    link.style.display = "none"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

const downloadTextBlob = (content: string, type: string, fileName: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    link.rel = "noopener"
    link.style.display = "none"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 0)
}



const centerObjectInWorkspace = (object: fabric.Object, workspace: fabric.Rect) => {
    const { x, y } = workspace.getCenterPoint()
    object.set({
        originX: "center",
        originY: "center",
        left: x,
        top: y,
    })
    object.setCoords()
}

const getObjectRole = (object: fabric.Object): string | undefined => {
    const data = (object as fabric.Object & { data?: { role?: unknown } }).data
    return typeof data?.role === "string" ? data.role : undefined
}

const findWorkspaceObject = (canvas: fabric.Canvas): fabric.Rect | null => {
    const candidate = canvas
        .getObjects()
        .find((object) => getObjectRole(object) === "workspace")
    return candidate instanceof fabric.Rect ? candidate : null
}

const createWorkspaceClipPath = (workspace: fabric.Rect) => {
    return new fabric.Rect({
        width: workspace.width ?? 0,
        height: workspace.height ?? 0,
        left: workspace.left ?? 0,
        top: workspace.top ?? 0,
        absolutePositioned: true,
        evented: false,
        selectable: false,
    })
}

const buildEditor = (canvas: fabric.Canvas, config: BuildEditorConfig) => {
    const getWorkspace = () => config.getWorkspace()
    const getExportBounds = () => {
        const workspace = getWorkspace()
        if (!workspace) {
            return {
                left: 0,
                top: 0,
                width: Math.max(1, canvas.getWidth()),
                height: Math.max(1, canvas.getHeight()),
            }
        }
        const bounds = workspace.getBoundingRect()
        return {
            left: bounds.left,
            top: bounds.top,
            width: Math.max(1, bounds.width),
            height: Math.max(1, bounds.height),
        }
    }

    const addObject = (createObject: () => fabric.Object) => {
        const workspace = getWorkspace()
        if (!workspace) {
            console.warn("Workspace is not ready yet.")
            return
        }

        const object = createObject()
        centerObjectInWorkspace(object, workspace)
        canvas.add(object)
        canvas.setActiveObject(object)
        canvas.requestRenderAll()
        config.recordHistory()
    }

    const getTargets = (): fabric.Object[] => {
        const activeObjects = canvas.getActiveObjects()
        if (activeObjects.length > 0) {
            return activeObjects
        }
        const activeObject = canvas.getActiveObject()
        return activeObject ? [activeObject] : []
    }

    const applyToTargets = (updater: (object: fabric.Object) => void) => {
        const targets = getTargets()
        if (targets.length === 0) {
            return
        }
        targets.forEach(updater)
        canvas.requestRenderAll()
        config.recordHistory()
    }

    const styleToDashArray = (style: StrokeStyle): number[] | undefined => {
        switch (style) {
            case "dashed":
                return [12, 6]
            case "dotted":
                return [2, 4]
            case "solid":
            default:
                return undefined
        }
    }

    const isTextObject = (
        object: fabric.Object,
    ): object is fabric.IText | fabric.Text | fabric.Textbox => {
        if (object instanceof fabric.IText || object instanceof fabric.Text) {
            return true
        }
        return typeof fabric.Textbox !== "undefined" && object instanceof fabric.Textbox
    }

    const applyToTextTargets = (
        updater: (object: fabric.IText | fabric.Text | fabric.Textbox) => void,
        { reflow = false }: { reflow?: boolean } = {},
    ) => {
        const targets = getTargets().filter(isTextObject)
        if (targets.length === 0) {
            return
        }
        targets.forEach((target) => {
            updater(target)
            if (reflow && "initDimensions" in target && typeof target.initDimensions === "function") {
                target.initDimensions()
            }
        })
        canvas.requestRenderAll()
        config.recordHistory()
    }

    type ITextCtorOptions = NonNullable<ConstructorParameters<typeof fabric.IText>[1]>

    const createTextObject = (
        text: string,
        overrides: Partial<ITextCtorOptions> = {},
    ) => {
        const options = {
            ...TEXT_OPTION,
            ...overrides,
        } as ITextCtorOptions
        return new fabric.IText(text, options)
    }

    const addTextPreset = (presetId: TextPresetId) => {
        const preset = TEXT_PRESETS[presetId]
        const { label: _label, text, ...style } = preset
        addObject(() => createTextObject(text, style as Partial<ITextCtorOptions>))
    }

    return {

        copeobjects: (objects: fabric.Object[] | any[]) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            if (objects.length === 0) return
            objects.forEach((object) => {
                const newObject = object.clone()
                addObject(() => newObject as unknown as fabric.Object)
            })
        },
        pasteObjects: (objects: fabric.Object[] | any[]) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            if (objects.length === 0) return
            const workspace = getWorkspace()
            if (!workspace) return
            const pastedObjects: fabric.Object[] = []
            objects.forEach((object) => {
                const newObject = object.clone()
                centerObjectInWorkspace(newObject as fabric.Object, workspace)
                canvas.add(newObject as fabric.Object)
                pastedObjects.push(newObject as fabric.Object)
            })
            if (pastedObjects.length > 0) {
                if (pastedObjects.length === 1) {
                    canvas.setActiveObject(pastedObjects[0])
                } else {
                    const selection = new fabric.ActiveSelection(pastedObjects, {
                        canvas: canvas,
                    })
                    canvas.setActiveObject(selection)
                }
            }
            canvas.requestRenderAll()
            config.recordHistory()
        },
        addText: () => {
            addObject(() => createTextObject(DEFAULT_TEXT_VALUE))
        },
        addHeadingText: () => {
            addTextPreset("Heading")
        },
        addSubheadingText: () => {
            addTextPreset("Subheading")
        },
        addBodyText: () => {
            addTextPreset("Body")
        },
        addCircle: () => {
            addObject(() => new fabric.Circle({ ...CIRCLE_OPTION }))
        },
        addRectangle: () => {
            addObject(() => new fabric.Rect({ ...RECTANGLE_OPTION }))
        },
        addTriangle: () => {
            addObject(() => new fabric.Triangle({ ...TRIANGLE_OPTION }))
        },
        addDiamond: () => {
            addObject(() => new fabric.Polygon(DIAMOND_POINTS.map(({ x, y }) => ({ x, y })), {
                fill: FILL_COLORS,
                stroke: STROKE_COLORS,
                strokeWidth: STROKE_WIDTH,
            }))
        },
        addStar: () => {
            addObject(() => new fabric.Polygon(STAR_POINTS.map(({ x, y }) => ({ x, y })), {
                fill: FILL_COLORS,
                stroke: STROKE_COLORS,
                strokeWidth: STROKE_WIDTH,
            }))
        },
        addHeart: () => {
            addObject(() => new fabric.Path(HEART_PATH, {
                fill: FILL_COLORS,
                stroke: STROKE_COLORS,
                strokeWidth: STROKE_WIDTH,
                originX: "center",
                originY: "center",
            }))
        },
        setFillColor: (color: string) => {
            applyToTargets((object) => {
                object.set("fill", color)
            })
        },
        setStrokeColor: (color: string) => {
            applyToTargets((object) => {
                object.set("stroke", color)
            })
        },
        setStrokeWidth: (width: number) => {
            applyToTargets((object) => {
                object.set("strokeWidth", width)
            })
        },
        setStrokeStyle: (style: StrokeStyle) => {
            const dashArray = styleToDashArray(style)
            applyToTargets((object) => {
                object.set("strokeDashArray", dashArray)
            })
        },
        setOpacity: (opacity: number) => {
            applyToTargets((object) => {
                object.set("opacity", opacity)
            })
        },
        setTextFontFamily: (fontFamily: string) => {
            applyToTextTargets((object) => {
                object.set("fontFamily", fontFamily)
            }, { reflow: true })
        },
        setTextFontSize: (fontSize: number) => {
            applyToTextTargets((object) => {
                object.set("fontSize", fontSize)
            }, { reflow: true })
        },
        setTextFontWeight: (fontWeight: string) => {
            applyToTextTargets((object) => {
                object.set("fontWeight", fontWeight)
            }, { reflow: true })
        },
        setTextFontStyle: (fontStyle: "normal" | "italic") => {
            applyToTextTargets((object) => {
                object.set("fontStyle", fontStyle)
            }, { reflow: true })
        },
        setTextUnderline: (underline: boolean) => {
            applyToTextTargets((object) => {
                object.set("underline", underline)
            })
        },
        setTextAlign: (textAlign: "left" | "center" | "right" | "justify") => {
            applyToTextTargets((object) => {
                object.set("textAlign", textAlign)
            }, { reflow: true })
        },
        setTextFill: (fill: string) => {
            applyToTextTargets((object) => {
                object.set("fill", fill)
            })
        },
        setTextBackgroundColor: (color?: string) => {
            applyToTextTargets((object) => {
                object.set("textBackgroundColor", color && color.length > 0 ? color : undefined)
            })
        },
        setTextLineHeight: (lineHeight: number) => {
            applyToTextTargets((object) => {
                object.set("lineHeight", lineHeight)
            }, { reflow: true })
        },
        setTextCharSpacing: (charSpacing: number) => {
            applyToTextTargets((object) => {
                object.set("charSpacing", charSpacing)
            }, { reflow: true })
        },
        transformTextCase: (mode: "none" | "upper" | "lower" | "title") => {
            applyToTextTargets((object) => {
                const text = object.text ?? ""
                switch (mode) {
                    case "upper":
                        object.set("text", text.toUpperCase())
                        break
                    case "lower":
                        object.set("text", text.toLowerCase())
                        break
                    case "title":
                        object.set("text", text.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
                        break
                    case "none":
                    default:
                        object.set("text", text)
                        break
                }
            }, { reflow: true })
        },
        clearCanvas: () => {
            const objects = canvas.getObjects()
                .filter((object) => getObjectRole(object) !== "workspace")
            if (objects.length === 0) {
                return
            }
            objects.forEach((object) => {
                canvas.remove(object)
            })
            canvas.discardActiveObject()
            canvas.requestRenderAll()
            config.recordHistory()
        },
        getWorkspaceBackground: (): string | undefined => {
            const workspace = getWorkspace()
            if (!workspace) return undefined
            const fill = workspace.get("fill")
            return typeof fill === "string" ? fill : undefined
        },
        setWorkspaceBackground: (color: string) => {
            const workspace = getWorkspace()
            if (!workspace) return
            workspace.set("fill", color)
            canvas.requestRenderAll()
            config.recordHistory()
        },
        bringForward: () => {
            const targets = getTargets()
            if (targets.length === 0) return

            const movableTargets = targets
                .filter((obj) => getObjectRole(obj) !== "workspace")
                .sort((a, b) => canvas.getObjects().indexOf(b) - canvas.getObjects().indexOf(a))
            if (movableTargets.length === 0) return

            let moved = false
            movableTargets.forEach((obj) => {
                const objects = canvas.getObjects()
                const currentIndex = objects.indexOf(obj)
                const maxIndex = objects.length - 1
                if (currentIndex < 0 || currentIndex >= maxIndex) return
                moved = canvas.moveObjectTo(obj, currentIndex + 1) || moved
            })
            if (!moved) return
            canvas.requestRenderAll()
            config.recordHistory()
        },
        sendBackward: () => {
            const targets = getTargets()
            if (targets.length === 0) return

            const movableTargets = targets
                .filter((obj) => getObjectRole(obj) !== "workspace")
                .sort((a, b) => canvas.getObjects().indexOf(a) - canvas.getObjects().indexOf(b))
            if (movableTargets.length === 0) return

            let moved = false
            movableTargets.forEach((obj) => {
                const objects = canvas.getObjects()
                const currentIndex = objects.indexOf(obj)
                if (currentIndex <= 1) return
                moved = canvas.moveObjectTo(obj, currentIndex - 1) || moved
            })
            if (!moved) return
            canvas.requestRenderAll()
            config.recordHistory()
        },
        undo: config.undo,
        redo: config.redo,
        canUndo: config.canUndo,
        canRedo: config.canRedo,
        exportAsPng: () => {
            const { left, top, width, height } = getExportBounds()
            const dataUrl = canvas.toDataURL({
                format: "png",
                left,
                top,
                width,
                height,
                multiplier: 2,
            })
            downloadDataUrl(dataUrl, getExportFileName("png"))
        },
        exportAsJpeg: () => {
            const { left, top, width, height } = getExportBounds()
            const dataUrl = canvas.toDataURL({
                format: "jpeg",
                quality: 0.92,
                left,
                top,
                width,
                height,
                multiplier: 2,
            })
            downloadDataUrl(dataUrl, getExportFileName("jpg"))
        },
        exportAsSvg: () => {
            const { left, top, width, height } = getExportBounds()
            const svg = canvas.toSVG({
                width: String(width),
                height: String(height),
                viewBox: {
                    x: left,
                    y: top,
                    width,
                    height,
                },
            })
            downloadTextBlob(svg, "image/svg+xml;charset=utf-8", getExportFileName("svg"))
        },
        exportAsJson: () => {
            const json = JSON.stringify(canvas.toObject(["data"]), null, 2)
            downloadTextBlob(json, "application/json;charset=utf-8", getExportFileName("json"))
        },
    }
}

export type EditorType = ReturnType<typeof buildEditor>

export const useEditor = () => {

    const [canvas, setCanvas] = useState<fabric.Canvas | null>(null)
    const [container, setContainer] = useState<HTMLDivElement | null>(null)
    const [workspace, setWorkspace] = useState<fabric.Rect | null>(null)
    const workspaceRef = useRef<fabric.Rect | null>(null)

    const historyRef = useRef<string[]>([])
    const redoRef = useRef<string[]>([])
    const isRestoringRef = useRef(false)
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)

    const [fillColor, setFillColor] = useState<string>(FILL_COLORS)
    const [strokeColor, setStrokeColor] = useState<string>(STROKE_COLORS)
    const [strokeWidth, setStrokeWidth] = useState<number>(STROKE_WIDTH)

    const syncHistoryFlags = useCallback(() => {
        setCanUndo(historyRef.current.length > 1)
        setCanRedo(redoRef.current.length > 0)
    }, [])

    const serializeCanvas = useCallback((targetCanvas: fabric.Canvas) => {
        return JSON.stringify(targetCanvas.toObject(["data"]))
    }, [])

    const pushHistorySnapshot = useCallback((targetCanvas: fabric.Canvas) => {
        if (isRestoringRef.current) {
            return
        }
        const snapshot = serializeCanvas(targetCanvas)
        const stack = historyRef.current
        if (stack[stack.length - 1] === snapshot) {
            return
        }

        stack.push(snapshot)
        if (stack.length > HISTORY_LIMIT) {
            stack.splice(0, stack.length - HISTORY_LIMIT)
        }
        redoRef.current = []
        syncHistoryFlags()
    }, [serializeCanvas, syncHistoryFlags])

    const applyWorkspaceAfterRestore = useCallback((targetCanvas: fabric.Canvas) => {
        const workspaceObject = findWorkspaceObject(targetCanvas)
        if (!workspaceObject) {
            workspaceRef.current = null
            setWorkspace(null)
            targetCanvas.clipPath = undefined
            return
        }

        const existingData = (workspaceObject as fabric.Object & { data?: Record<string, unknown> }).data
        workspaceObject.set({
            selectable: false,
            evented: false,
            data: { ...(existingData ?? {}), role: "workspace" },
        })
        targetCanvas.moveObjectTo(workspaceObject, 0)
        workspaceObject.setCoords()

        const clipPath = createWorkspaceClipPath(workspaceObject)
        targetCanvas.clipPath = clipPath

        workspaceRef.current = workspaceObject
        setWorkspace(workspaceObject)
    }, [])

    const restoreSnapshot = useCallback(async (targetCanvas: fabric.Canvas, snapshot: string) => {
        isRestoringRef.current = true
        try {
            await targetCanvas.loadFromJSON(snapshot)
            applyWorkspaceAfterRestore(targetCanvas)
            targetCanvas.discardActiveObject()
            targetCanvas.requestRenderAll()
        } finally {
            isRestoringRef.current = false
        }
    }, [applyWorkspaceAfterRestore])

    const undo = useCallback(async () => {
        if (!canvas || isRestoringRef.current) {
            return
        }
        if (historyRef.current.length <= 1) {
            return
        }

        const current = historyRef.current.pop()
        if (!current) {
            return
        }
        redoRef.current.push(current)
        const previous = historyRef.current[historyRef.current.length - 1]
        syncHistoryFlags()
        if (!previous) {
            return
        }
        await restoreSnapshot(canvas, previous)
        syncHistoryFlags()
    }, [canvas, restoreSnapshot, syncHistoryFlags])

    const redo = useCallback(async () => {
        if (!canvas || isRestoringRef.current) {
            return
        }

        const next = redoRef.current.pop()
        if (!next) {
            return
        }

        historyRef.current.push(next)
        syncHistoryFlags()
        await restoreSnapshot(canvas, next)
        syncHistoryFlags()
    }, [canvas, restoreSnapshot, syncHistoryFlags])

    const init = useCallback(({ containerRef, canvasRef }: InitProps) => {
        historyRef.current = []
        redoRef.current = []
        syncHistoryFlags()

        const updateCanvasSize = () => {
            if (containerRef.current) {
                canvasRef.setWidth(containerRef.current.offsetWidth || 0)
                canvasRef.setHeight(containerRef.current.offsetHeight || 0)
            }
        }

        setCanvas(canvasRef)
        setContainer(containerRef.current)

        updateCanvasSize()

        const workspaceRect = new fabric.Rect({
            left: 50,
            top: 50,
            width: 595,
            height: 842,
            fill: "#f6f1e6",
            stroke: "#ccc",
            selectable: false,
            evented: false,
            data: { role: "workspace" }
        })
        canvasRef.add(workspaceRect)
        canvasRef.moveObjectTo(workspaceRect, 0)
        workspaceRef.current = workspaceRect

        canvasRef.clipPath = createWorkspaceClipPath(workspaceRect)

        const alignWorkspace = () => {
            const currentWorkspace = workspaceRef.current
            if (!currentWorkspace) {
                return
            }
            canvasRef.centerObject(currentWorkspace)
            currentWorkspace.setCoords()
            const currentClipPath = canvasRef.clipPath instanceof fabric.Rect
                ? canvasRef.clipPath
                : createWorkspaceClipPath(currentWorkspace)
            canvasRef.clipPath = currentClipPath
            currentClipPath.set({
                width: currentWorkspace.width ?? 0,
                height: currentWorkspace.height ?? 0,
                left: currentWorkspace.left,
                top: currentWorkspace.top,
            })
            currentClipPath.setCoords()
            canvasRef.requestRenderAll()
        }

        alignWorkspace()
        setWorkspace(workspaceRect)
        pushHistorySnapshot(canvasRef)

        const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

        const keepObjectInsideWorkspace = (target: fabric.Object) => {
            const currentWorkspace = workspaceRef.current
            if (!currentWorkspace || target === currentWorkspace) return
            if (getObjectRole(target) === "workspace") return

            const workspaceBounds = currentWorkspace.getBoundingRect()
            const objectBounds = target.getBoundingRect()

            if (workspaceBounds.width === 0 || workspaceBounds.height === 0) return

            const maxLeft = workspaceBounds.left + workspaceBounds.width - objectBounds.width
            const maxTop = workspaceBounds.top + workspaceBounds.height - objectBounds.height

            const constrainedLeft = clamp(objectBounds.left, workspaceBounds.left, maxLeft)
            const constrainedTop = clamp(objectBounds.top, workspaceBounds.top, maxTop)

            const deltaX = constrainedLeft - objectBounds.left
            const deltaY = constrainedTop - objectBounds.top

            if (deltaX !== 0 || deltaY !== 0) {
                target.set({
                    left: (target.left ?? 0) + deltaX,
                    top: (target.top ?? 0) + deltaY,
                })
                target.setCoords()
                canvasRef.requestRenderAll()
            }
        }

        const handleObjectMoving = (event: { target?: fabric.Object }) => {
            const target = event.target
            if (!target) return

            if (target.type === "activeSelection" && target instanceof fabric.ActiveSelection) {
                target.getObjects().forEach(keepObjectInsideWorkspace)
            } else {
                keepObjectInsideWorkspace(target)
            }
        }

        const handleObjectModified = () => pushHistorySnapshot(canvasRef)
        const handleTextChanged = () => pushHistorySnapshot(canvasRef)

        canvasRef.on("object:moving", handleObjectMoving)
        canvasRef.on("object:modified", handleObjectModified)
        canvasRef.on("text:changed", handleTextChanged)

        const handleResize = () => {
            updateCanvasSize()
            alignWorkspace()
        }

        window.addEventListener("resize", handleResize)

        return () => {
            canvasRef.off("object:moving", handleObjectMoving)
            canvasRef.off("object:modified", handleObjectModified)
            canvasRef.off("text:changed", handleTextChanged)
            canvasRef.clipPath = undefined
            canvasRef.remove(workspaceRect)
            workspaceRef.current = null
            setWorkspace(null)
            window.removeEventListener("resize", handleResize)
        }
    }, [pushHistorySnapshot, syncHistoryFlags])

    const editor = useMemo(() => {
        if (canvas && workspace) {
            return buildEditor(canvas as fabric.Canvas, {
                getWorkspace: () => workspaceRef.current,
                recordHistory: () => pushHistorySnapshot(canvas),
                undo,
                redo,
                canUndo: () => historyRef.current.length > 1,
                canRedo: () => redoRef.current.length > 0,
            })
        }
        return null
    }, [canvas, workspace, pushHistorySnapshot, redo, undo])





    return {
        init,
        editor,
        canUndo,
        canRedo,
    }
}
