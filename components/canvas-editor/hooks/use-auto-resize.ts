import { useEffect, useCallback } from "react"
import * as fabric from "fabric"

interface UseAutoResizeProps {
    container: HTMLDivElement | null
    canvas: fabric.Canvas | null
}

export const useAutoResize = ({ container, canvas }: UseAutoResizeProps) => {

    const updateCanvasSize = useCallback(() => {
        if (!container || !canvas) return

        const containerWidth = container.offsetWidth
        const containerHeight = container.offsetHeight

        if (containerWidth > 0 && containerHeight > 0) {
            canvas.setWidth(containerWidth)
            canvas.setHeight(containerHeight)

            const workspace = canvas
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

            if (workspace) {
                canvas.centerObject(workspace)
                workspace.setCoords()

                const clipPath = canvas.clipPath instanceof fabric.Rect
                    ? canvas.clipPath
                    : new fabric.Rect({
                        width: workspace.width ?? 0,
                        height: workspace.height ?? 0,
                        left: workspace.left ?? 0,
                        top: workspace.top ?? 0,
                        absolutePositioned: true,
                        evented: false,
                        selectable: false,
                    })

                canvas.clipPath = clipPath
                clipPath.set({
                    width: workspace.width ?? 0,
                    height: workspace.height ?? 0,
                    left: workspace.left ?? 0,
                    top: workspace.top ?? 0,
                })
                clipPath.setCoords()
            }

            canvas.renderAll()
        }
    }, [container, canvas])

    useEffect(() => {
        if (!container || !canvas) return

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

        window.addEventListener("resize", handleWindowResize)

        return () => {
            resizeObserver.disconnect()
            window.removeEventListener("resize", handleWindowResize)
        }
    }, [canvas, container, updateCanvasSize])
}
