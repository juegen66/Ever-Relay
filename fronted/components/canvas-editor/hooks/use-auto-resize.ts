import { useEffect, useCallback, useRef } from "react"
import * as fabric from "fabric"

interface UseAutoResizeProps {
    container: HTMLDivElement | null
    canvas: fabric.Canvas | null
}

const REGULAR_MARGIN_MAX = 48
const COMPACT_MARGIN_MAX = 28
const REGULAR_MARGIN_MIN = 16
const COMPACT_MARGIN_MIN = 10
const REGULAR_MARGIN_RATIO = 0.12
const COMPACT_MARGIN_RATIO = 0.08
const COMPACT_EDGE_THRESHOLD = 560

const findWorkspaceObject = (canvas: fabric.Canvas) => {
    return canvas
        .getObjects()
        .find((obj) => {
            const dataRole = (obj as fabric.Object & { data?: { role?: string } }).data?.role
            const fill = typeof obj.fill === "string" ? obj.fill : ""
            return (
                dataRole === "workspace" ||
                (obj.type === "rect" &&
                    (fill === "#ffffff" ||
                        fill === "rgba(255, 255, 255, 1)" ||
                        fill === "#f6f1e6" ||
                        fill === "rgba(246, 241, 230, 1)"))
            )
        })
}

export const useAutoResize = ({ container, canvas }: UseAutoResizeProps) => {
    const lastLayoutSignatureRef = useRef<string | null>(null)

    const updateCanvasSize = useCallback(() => {
        if (!container || !canvas) return

        const containerWidth = container.offsetWidth
        const containerHeight = container.offsetHeight

        if (containerWidth <= 0 || containerHeight <= 0) {
            return
        }

        const workspace = findWorkspaceObject(canvas)
        const workspaceRect = workspace instanceof fabric.Rect ? workspace : null

        const signature = workspaceRect
            ? [
                containerWidth,
                containerHeight,
                workspaceRect.left ?? 0,
                workspaceRect.top ?? 0,
                workspaceRect.width ?? 0,
                workspaceRect.height ?? 0,
                workspaceRect.scaleX ?? 1,
                workspaceRect.scaleY ?? 1,
            ].map((value) => Number(value).toFixed(2)).join("|")
            : `${containerWidth}|${containerHeight}|no-workspace`

        if (signature === lastLayoutSignatureRef.current) {
            return
        }

        lastLayoutSignatureRef.current = signature

        canvas.setWidth(containerWidth)
        canvas.setHeight(containerHeight)

        if (!workspaceRect) {
            canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
            canvas.requestRenderAll()
            return
        }

        const workspaceWidth = Math.max(1, (workspaceRect.width ?? 1) * (workspaceRect.scaleX ?? 1))
        const workspaceHeight = Math.max(1, (workspaceRect.height ?? 1) * (workspaceRect.scaleY ?? 1))
        const center = workspaceRect.getCenterPoint()

        const shortestEdge = Math.min(containerWidth, containerHeight)
        const isCompactLayout = shortestEdge < COMPACT_EDGE_THRESHOLD
        const marginRatio = isCompactLayout ? COMPACT_MARGIN_RATIO : REGULAR_MARGIN_RATIO
        const marginMax = isCompactLayout ? COMPACT_MARGIN_MAX : REGULAR_MARGIN_MAX
        const marginMin = isCompactLayout ? COMPACT_MARGIN_MIN : REGULAR_MARGIN_MIN

        const horizontalMargin = Math.max(marginMin, Math.min(marginMax, containerWidth * marginRatio))
        const verticalMargin = Math.max(marginMin, Math.min(marginMax, containerHeight * marginRatio))
        const availableWidth = Math.max(1, containerWidth - horizontalMargin * 2)
        const availableHeight = Math.max(1, containerHeight - verticalMargin * 2)

        const zoom = Math.max(0.05, Math.min(availableWidth / workspaceWidth, availableHeight / workspaceHeight))
        const translateX = (containerWidth / 2) - (center.x * zoom)
        const translateY = (containerHeight / 2) - (center.y * zoom)

        canvas.setViewportTransform([zoom, 0, 0, zoom, translateX, translateY])

        const clipPath = canvas.clipPath instanceof fabric.Rect
            ? canvas.clipPath
            : new fabric.Rect({
                width: workspaceRect.width ?? 0,
                height: workspaceRect.height ?? 0,
                left: workspaceRect.left ?? 0,
                top: workspaceRect.top ?? 0,
                evented: false,
                selectable: false,
            })

        canvas.clipPath = clipPath
        clipPath.set({
            width: workspaceRect.width ?? 0,
            height: workspaceRect.height ?? 0,
            left: workspaceRect.left ?? 0,
            top: workspaceRect.top ?? 0,
            absolutePositioned: false,
        })
        clipPath.setCoords()

        canvas.requestRenderAll()
    }, [container, canvas])

    useEffect(() => {
        if (!container || !canvas) return

        lastLayoutSignatureRef.current = null

        updateCanvasSize()

        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(() => {
                updateCanvasSize()
            })
        })

        resizeObserver.observe(container)

        const handleWindowResize = () => {
            requestAnimationFrame(() => {
                updateCanvasSize()
            })
        }

        const handleAfterRender = () => {
            updateCanvasSize()
        }

        window.addEventListener("resize", handleWindowResize)
        canvas.on("after:render", handleAfterRender)

        return () => {
            resizeObserver.disconnect()
            window.removeEventListener("resize", handleWindowResize)
            canvas.off("after:render", handleAfterRender)
        }
    }, [canvas, container, updateCanvasSize])
}
