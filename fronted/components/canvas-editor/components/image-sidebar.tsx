"use client"

import { type ChangeEvent, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ActiveTools } from "../types"
import { EditorType } from "../hooks/use-Editor"
import { ToolSidebarClose } from "./tool-sidebar-close"
import { imageProcessingApi } from "@/lib/api/modules/image-processing"

interface ImageSidebarProps {
    activeTool: ActiveTools
    onToolChange: (tool: ActiveTools) => void
    editor: EditorType | null
}

export const ImageSidebar = ({
    activeTool,
    onToolChange,
    editor,
}: ImageSidebarProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [fileName, setFileName] = useState<string>("")
    const [isImporting, setIsImporting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [shouldRemoveBackground, setShouldRemoveBackground] = useState(false)

    if (activeTool !== "Images") {
        return null
    }

    const handleClose = () => {
        onToolChange("Select")
    }

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith("image/")) {
            setError("Only image files are supported")
            return
        }

        const reader = new FileReader()
        reader.onload = () => {
            const result = reader.result
            if (typeof result !== "string") {
                setError("Unable to read image file")
                return
            }
            setPreviewUrl(result)
            setFileName(file.name)
            setError(null)
        }
        reader.onerror = () => {
            setError("Unable to read image file")
        }
        reader.readAsDataURL(file)
    }

    const handleConfirmImport = async () => {
        if (!previewUrl || !editor || isImporting) return
        setIsImporting(true)
        setError(null)
        try {
            let imageToImport = previewUrl
            if (shouldRemoveBackground) {
                const processed = await imageProcessingApi.removeBackground(previewUrl)
                imageToImport = processed.imageDataUrl
            }

            await editor.addImageFromDataUrl(imageToImport)
            onToolChange("Select")
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to import image"
            setError(message)
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <aside className="relative z-20 flex h-full min-h-0 w-72 shrink-0 flex-col gap-y-4 border-r border-black/5 bg-white/80 shadow-sm backdrop-blur-xl saturate-150">
            <ScrollArea className="h-full p-4">
                <div className="flex flex-col gap-y-4">
                    <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Import Image
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    <Button
                        type="button"
                        variant="outline"
                        className="border-black/10 bg-white/70 text-neutral-900 hover:bg-black/5"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Choose from device
                    </Button>

                    <div className="flex h-48 items-center justify-center overflow-hidden rounded-md border border-black/10 bg-white/70">
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Selected preview"
                                className="h-full w-full object-contain"
                            />
                        ) : (
                            <span className="px-4 text-center text-xs text-muted-foreground">
                                Select an image to preview before importing
                            </span>
                        )}
                    </div>

                    {fileName && (
                        <p className="truncate text-xs text-neutral-600" title={fileName}>
                            {fileName}
                        </p>
                    )}

                    <label className="flex items-center gap-2 text-xs text-neutral-700">
                        <input
                            type="checkbox"
                            checked={shouldRemoveBackground}
                            onChange={(event) => setShouldRemoveBackground(event.target.checked)}
                            className="h-4 w-4 rounded border-black/20 text-[#0058d0] focus:ring-[#0058d0]/30"
                        />
                        Remove image background before import
                    </label>

                    {error && (
                        <p className="text-xs text-red-500">{error}</p>
                    )}

                    <Button
                        type="button"
                        onClick={() => void handleConfirmImport()}
                        disabled={!previewUrl || !editor || isImporting}
                        className="bg-[#0058d0] text-white hover:bg-[#0045a6]"
                    >
                        {isImporting
                            ? (shouldRemoveBackground ? "Removing background..." : "Importing...")
                            : "Confirm Import"}
                    </Button>
                </div>
            </ScrollArea>
            <ToolSidebarClose onClose={handleClose} />
        </aside>
    )
}
