"use client"

import { useEffect, useMemo, useState } from "react"
import type * as fabric from "fabric"
import { ChromePicker, type ColorResult } from "react-color"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ActiveTools, TEXT_PRESETS, type TextPresetId } from "../types"
import { EditorType } from "../hooks/use-Editor"
import { ToolSidebarClose } from "./tool-sidebar-close"
import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Bold,
    CaseLower,
    CaseSensitive,
    CaseUpper,
    Highlighter,
    Italic,
    Palette,
    Text,
    Type,
    Underline,
} from "lucide-react"

interface TextSidebarProps {
    activeTool: ActiveTools
    onToolChange: (tool: ActiveTools) => void
    editor: EditorType | null
    selectedObjects: fabric.Object[]
}

type FabricTextInstance = fabric.IText | fabric.Text | fabric.Textbox

const FONT_FAMILIES = [
    "Inter",
    "Roboto",
    "Poppins",
    "Montserrat",
    "Lato",
    "Nunito",
    "Playfair Display",
    "Fira Sans",
    "Georgia",
    "Times New Roman",
    "Courier New",
]

const BACKGROUND_SWATCHES = [
    "rgba(0,0,0,0)",
    "rgba(0,0,0,0.08)",
    "rgba(17,24,39,0.12)",
    "#fde68a",
    "#fca5a5",
    "#bbf7d0",
    "#bfdbfe",
    "#e9d5ff",
]

const isTextObject = (object: fabric.Object): object is FabricTextInstance => {
    const type = object.type
    return type === "i-text" || type === "textbox" || type === "text"
}

const toRgbaString = (color: ColorResult["rgb"]) =>
    `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a ?? 1})`

const isBoldWeight = (weight: string) => {
    const numeric = Number(weight)
    if (!Number.isNaN(numeric)) {
        return numeric >= 600
    }
    return weight.toLowerCase() === "bold"
}

export const TextSidebar = ({
    activeTool,
    onToolChange,
    editor,
    selectedObjects,
}: TextSidebarProps) => {
    const selectedText = useMemo<FabricTextInstance | null>(() => {
        for (const object of selectedObjects) {
            if (isTextObject(object)) {
                return object as FabricTextInstance
            }
        }
        return null
    }, [selectedObjects])

    const [fontFamily, setFontFamily] = useState<string>(FONT_FAMILIES[0])
    const [fontSize, setFontSize] = useState<number>(32)
    const [fontWeight, setFontWeight] = useState<string>("600")
    const [fontStyle, setFontStyle] = useState<"normal" | "italic">("normal")
    const [underline, setUnderline] = useState<boolean>(false)
    const [textAlign, setTextAlign] = useState<"left" | "center" | "right" | "justify">("left")
    const [textColor, setTextColor] = useState<string>("#111827")
    const [backgroundColor, setBackgroundColor] = useState<string | undefined>(undefined)
    const [lineHeight, setLineHeight] = useState<number>(1.2)
    const [letterSpacing, setLetterSpacing] = useState<number>(0)

    useEffect(() => {
        if (!selectedText) {
            return
        }

        const nextFontFamily = selectedText.get("fontFamily")
        if (typeof nextFontFamily === "string" && nextFontFamily.length > 0) {
            setFontFamily(nextFontFamily)
        }

        const nextFontSize = selectedText.get("fontSize")
        if (typeof nextFontSize === "number") {
            setFontSize(Math.round(nextFontSize))
        }

        const nextFontWeight = selectedText.get("fontWeight")
        if (typeof nextFontWeight === "string" || typeof nextFontWeight === "number") {
            setFontWeight(String(nextFontWeight))
        } else {
            setFontWeight("400")
        }

        const nextFontStyle = selectedText.get("fontStyle")
        setFontStyle(nextFontStyle === "italic" ? "italic" : "normal")

        const isUnderline = selectedText.get("underline")
        setUnderline(Boolean(isUnderline))

        const nextAlign = selectedText.get("textAlign")
        if (nextAlign === "left" || nextAlign === "center" || nextAlign === "right" || nextAlign === "justify") {
            setTextAlign(nextAlign)
        }

        const fill = selectedText.get("fill")
        if (typeof fill === "string") {
            setTextColor(fill)
        }

        const bg = selectedText.get("textBackgroundColor")
        setBackgroundColor(typeof bg === "string" && bg.length > 0 ? bg : undefined)

        const nextLineHeight = selectedText.get("lineHeight")
        if (typeof nextLineHeight === "number") {
            setLineHeight(Number(nextLineHeight.toFixed(2)))
        }

        const nextCharSpacing = selectedText.get("charSpacing")
        if (typeof nextCharSpacing === "number") {
            setLetterSpacing(Math.round(nextCharSpacing / 10))
        } else {
            setLetterSpacing(0)
        }
    }, [selectedText])

    if (activeTool !== "Text") {
        return null
    }

    const handleClose = () => {
        onToolChange("Select")
    }

    const hasTextSelection = Boolean(selectedText)

    const handlePresetClick = (presetId: TextPresetId) => {
        if (!editor) return
        switch (presetId) {
            case "Heading":
                editor.addHeadingText()
                break
            case "Subheading":
                editor.addSubheadingText()
                break
            case "Body":
                editor.addBodyText()
                break
            default:
                editor.addText()
                break
        }
    }

    const handleFontFamilyChange = (value: string) => {
        setFontFamily(value)
        editor?.setTextFontFamily(value)
    }

    const handleFontSizeChange = (value: string) => {
        const numeric = Number(value)
        if (Number.isNaN(numeric)) return
        const clamped = Math.min(Math.max(numeric, 8), 320)
        setFontSize(clamped)
        editor?.setTextFontSize(clamped)
    }

    const handleLineHeightChange = (value: string) => {
        const numeric = Number(value)
        if (Number.isNaN(numeric)) return
        const clamped = Math.min(Math.max(numeric, 0.5), 3)
        setLineHeight(Number(clamped.toFixed(2)))
        editor?.setTextLineHeight(clamped)
    }

    const handleLetterSpacingChange = (value: string) => {
        const numeric = Number(value)
        if (Number.isNaN(numeric)) return
        const clamped = Math.min(Math.max(numeric, -10), 50)
        setLetterSpacing(clamped)
        editor?.setTextCharSpacing(Math.round(clamped * 10))
    }

    const handleTextColorChange = (color: ColorResult) => {
        const nextColor = toRgbaString(color.rgb)
        setTextColor(nextColor)
        editor?.setTextFill(nextColor)
    }

    const handleBackgroundSelect = (color: string) => {
        const nextColor = color === "rgba(0,0,0,0)" ? undefined : color
        setBackgroundColor(nextColor)
        editor?.setTextBackgroundColor(nextColor)
    }

    const toggleBold = () => {
        const nextWeight = isBoldWeight(fontWeight) ? "400" : "700"
        setFontWeight(nextWeight)
        editor?.setTextFontWeight(nextWeight)
    }

    const toggleItalic = () => {
        const nextStyle = fontStyle === "italic" ? "normal" : "italic"
        setFontStyle(nextStyle)
        editor?.setTextFontStyle(nextStyle)
    }

    const toggleUnderline = () => {
        const nextUnderline = !underline
        setUnderline(nextUnderline)
        editor?.setTextUnderline(nextUnderline)
    }

    const updateAlign = (align: "left" | "center" | "right" | "justify") => {
        setTextAlign(align)
        editor?.setTextAlign(align)
    }

    const applyCaseTransform = (mode: "upper" | "lower" | "title") => {
        editor?.transformTextCase(mode)
    }

    return (
        <aside className="relative flex h-full min-h-[calc(100vh-136px)] w-72 shrink-0 flex-col gap-y-4 border-r border-black/5 bg-white/80 shadow-sm backdrop-blur-xl saturate-150">
            <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-y-6">
                    <section className="flex flex-col gap-y-3">
                        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <span>Quick Add</span>
                            <Type className="size-4 text-muted-foreground/70" />
                        </div>
                        <Button
                            variant="default"
                            size="sm"
                            className="justify-between"
                            onClick={() => editor?.addText()}
                        >
                            <span className="flex items-center gap-2">
                                <Text className="size-4" />
                                Plain Text
                            </span>
                            <span className="text-xs font-normal text-white/70">New</span>
                        </Button>
                        <div className="grid grid-cols-1 gap-2">
                            {(Object.entries(TEXT_PRESETS) as Array<[TextPresetId, (typeof TEXT_PRESETS)[TextPresetId]]>).map(([id, preset]) => (
                                <Button
                                    key={id}
                                    variant="outline"
                                    size="sm"
                                    className="justify-between"
                                    onClick={() => handlePresetClick(id)}
                                >
                                    <span className="flex flex-col items-start">
                                        <span className="text-sm font-semibold leading-none">{preset.label}</span>
                                        <span className="text-[11px] font-medium uppercase text-muted-foreground">
                                            {preset.fontFamily} · {preset.fontSize}px
                                        </span>
                                    </span>
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                                        {preset.textAlign}
                                    </span>
                                </Button>
                            ))}
                        </div>
                    </section>

                    <section className="flex flex-col gap-y-3">
                        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <span>Selected Text</span>
                        </div>
                        {!hasTextSelection ? (
                            <p className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                                Select a text layer on the canvas to adjust typography, color, and spacing.
                            </p>
                        ) : (
                            <div className="flex flex-col gap-y-5">
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs font-medium uppercase text-muted-foreground">Font Family</span>
                                    <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select font" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {FONT_FAMILIES.map((font) => (
                                                <SelectItem key={font} value={font}>
                                                    {font}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <label className="flex flex-col gap-1">
                                        <span className="text-xs font-medium uppercase text-muted-foreground">Font Size</span>
                                        <input
                                            type="number"
                                            min={8}
                                            max={320}
                                            value={fontSize}
                                            onChange={(event) => handleFontSizeChange(event.target.value)}
                                            className="h-9 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="text-xs font-medium uppercase text-muted-foreground">Line Height</span>
                                        <input
                                            type="number"
                                            min={0.5}
                                            max={3}
                                            step={0.05}
                                            value={lineHeight}
                                            onChange={(event) => handleLineHeightChange(event.target.value)}
                                            className="h-9 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        />
                                    </label>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <Button
                                        type="button"
                                        variant={isBoldWeight(fontWeight) ? "default" : "outline"}
                                        size="icon"
                                        onClick={toggleBold}
                                    >
                                        <Bold className="size-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={fontStyle === "italic" ? "default" : "outline"}
                                        size="icon"
                                        onClick={toggleItalic}
                                    >
                                        <Italic className="size-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={underline ? "default" : "outline"}
                                        size="icon"
                                        onClick={toggleUnderline}
                                    >
                                        <Underline className="size-4" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-4 gap-2">
                                    <Button
                                        type="button"
                                        variant={textAlign === "left" ? "default" : "outline"}
                                        size="icon"
                                        onClick={() => updateAlign("left")}
                                        title="Align Left"
                                    >
                                        <AlignLeft className="size-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={textAlign === "center" ? "default" : "outline"}
                                        size="icon"
                                        onClick={() => updateAlign("center")}
                                        title="Align Center"
                                    >
                                        <AlignCenter className="size-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={textAlign === "right" ? "default" : "outline"}
                                        size="icon"
                                        onClick={() => updateAlign("right")}
                                        title="Align Right"
                                    >
                                        <AlignRight className="size-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={textAlign === "justify" ? "default" : "outline"}
                                        size="icon"
                                        onClick={() => updateAlign("justify")}
                                        title="Justify"
                                    >
                                        <AlignJustify className="size-4" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => applyCaseTransform("upper")}
                                        className="flex items-center gap-2"
                                    >
                                        <CaseUpper className="size-4" />
                                        Upper
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => applyCaseTransform("lower")}
                                        className="flex items-center gap-2"
                                    >
                                        <CaseLower className="size-4" />
                                        Lower
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => applyCaseTransform("title")}
                                        className="flex items-center gap-2"
                                    >
                                        <CaseSensitive className="size-4" />
                                        Title
                                    </Button>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <span className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                                        <Palette className="size-4 text-muted-foreground/70" />
                                        Font Color
                                    </span>
                                    <div className="overflow-hidden rounded-md border border-border/60">
                                        <ChromePicker
                                            disableAlpha={false}
                                            color={textColor}
                                            onChange={handleTextColorChange}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <span className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                                        <Highlighter className="size-4 text-muted-foreground/70" />
                                        Highlight
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {BACKGROUND_SWATCHES.map((swatch) => (
                                            <button
                                                key={swatch}
                                                type="button"
                                                onClick={() => handleBackgroundSelect(swatch)}
                                                className={`h-8 w-8 rounded-md border transition-transform duration-150 hover:scale-105 ${backgroundColor === swatch || (!backgroundColor && swatch === "rgba(0,0,0,0)") ? "border-primary shadow-sm" : "border-border"}`}
                                                style={{ background: swatch === "rgba(0,0,0,0)" ? "transparent" : swatch }}
                                                title={swatch === "rgba(0,0,0,0)" ? "None" : swatch}
                                            >
                                                {swatch === "rgba(0,0,0,0)" && (
                                                    <span className="block h-full w-full rounded-md border border-dashed border-muted-foreground/50" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <label className="flex flex-col gap-1">
                                    <span className="text-xs font-medium uppercase text-muted-foreground">Letter Spacing</span>
                                    <input
                                        type="range"
                                        min={-10}
                                        max={50}
                                        step={1}
                                        value={letterSpacing}
                                        onChange={(event) => handleLetterSpacingChange(event.target.value)}
                                    />
                                    <span className="text-xs text-muted-foreground">当前：{letterSpacing}px</span>
                                </label>
                            </div>
                        )}
                    </section>
                </div>
            </ScrollArea>
            <ToolSidebarClose onClose={handleClose} />
        </aside>
    )
}
