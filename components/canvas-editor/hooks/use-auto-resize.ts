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
                    return dataRole === "workspace" || (obj.type === "rect" && obj.fill === "#f6f1e6")
                })

            if (workspace) {
                canvas.centerObject(workspace)
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
