import { useEffect, useRef } from "react"

import * as fabric from "fabric"

import { type EditorType } from "./use-Editor"


interface UseCanvasEventsProps {
    canvas: fabric.Canvas | null;
    setSelectedObjects: React.Dispatch<React.SetStateAction<fabric.Object[]>>;
    selectedObjects: fabric.Object[];
    editor: EditorType | null;
}


export const useCanvasEvents = ({ canvas, setSelectedObjects, selectedObjects, editor }: UseCanvasEventsProps) => {
    // 使用 useRef 存储剪贴板数据，避免不必要的重新渲染
    const clipboardRef = useRef<fabric.Object[]>([])
    // 使用 useRef 存储最新的 selectedObjects，以便在事件处理函数中访问
    const selectedObjectsRef = useRef<fabric.Object[]>([])

    // 同步更新 ref
    useEffect(() => {
        selectedObjectsRef.current = selectedObjects
    }, [selectedObjects])

    useEffect(() => {
        if (!canvas) return;

        const handleCopy = (event: ClipboardEvent) => {
            const currentSelected = selectedObjectsRef.current
            if (currentSelected.length === 0) return
            event.preventDefault()
            // 将选中的对象克隆并存储到剪贴板
            clipboardRef.current = currentSelected.map(obj => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return (obj as any).clone() as fabric.Object
            })
        }

        const handlePaste = (event: ClipboardEvent) => {
            if (clipboardRef.current.length === 0) return
            event.preventDefault()
            // 从剪贴板粘贴对象
            editor?.pasteObjects(clipboardRef.current)
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null
            const isTypingTarget =
                !!target &&
                (target.closest("input, textarea, [contenteditable='true']") !== null ||
                    target.isContentEditable)
            if (isTypingTarget) {
                return
            }

            const activeObject = canvas.getActiveObject()
            const isTextEditing = activeObject instanceof fabric.IText && activeObject.isEditing
            if (isTextEditing) {
                return
            }

            const isMod = event.metaKey || event.ctrlKey
            if (!isMod) {
                return
            }

            const key = event.key.toLowerCase()
            const isUndo = key === "z" && !event.shiftKey
            const isRedo = (key === "z" && event.shiftKey) || key === "y"

            if (isUndo) {
                event.preventDefault()
                void editor?.undo()
                return
            }

            if (isRedo) {
                event.preventDefault()
                void editor?.redo()
            }
        }

        window.addEventListener("copy", handleCopy)
        window.addEventListener("paste", handlePaste)
        window.addEventListener("keydown", handleKeyDown)

        canvas.on("selection:created", (event) => {
            setSelectedObjects(event.selected ?? []);
        });

        canvas.on("selection:updated", (event) => {
            setSelectedObjects(event.selected ?? []);
        });

        canvas.on("selection:cleared", () => {
            setSelectedObjects([]);
        });

        return () => {
            window.removeEventListener("copy", handleCopy)
            window.removeEventListener("paste", handlePaste)
            window.removeEventListener("keydown", handleKeyDown)
            canvas.off("selection:updated");
            canvas.off("selection:cleared");
            canvas.off("selection:created");
        };
    }, [canvas, setSelectedObjects, editor]);

}
