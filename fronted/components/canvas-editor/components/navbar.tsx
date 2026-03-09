"use client"

import { ArrowLeft, Download, Redo2, Save, Undo2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { TooltipComponent } from "./tooltip"

import type { EditorType } from "../hooks/use-Editor"
import type { ActiveTools } from "../types"

interface NavbarProps {
  activeTool: ActiveTools
  onToolChange: (tool: ActiveTools) => void
  editor: EditorType | null
  canUndo: boolean
  canRedo: boolean
  projectTitle: string
  saveState: "idle" | "saving" | "saved" | "error" | "conflict"
  saveMessage?: string
  onBackToHub: () => void
  onManualSave: () => void
  compact?: boolean
}

function getSaveStateText(state: NavbarProps["saveState"], message?: string) {
  if (message) return message

  switch (state) {
    case "saving":
      return "Saving..."
    case "saved":
      return "Saved"
    case "error":
      return "Save failed"
    case "conflict":
      return "Version conflict"
    case "idle":
    default:
      return "Idle"
  }
}

export function Navbar({
  activeTool,
  onToolChange,
  editor,
  canUndo,
  canRedo,
  projectTitle,
  saveState,
  saveMessage,
  onBackToHub,
  onManualSave,
  compact = false,
}: NavbarProps) {
  const handleExportPng = () => {
    editor?.exportAsPng()
  }

  const handleExportJpeg = () => {
    editor?.exportAsJpeg()
  }

  const handleExportSvg = () => {
    editor?.exportAsSvg()
  }

  const handleExportJson = () => {
    editor?.exportAsJson()
  }

  const saveStateText = getSaveStateText(saveState, saveMessage)

  return (
    <nav className={`flex w-full items-center border-b border-black/5 bg-white/80 text-neutral-900 shadow-sm backdrop-blur-xl saturate-150 ${compact ? "h-14 gap-x-2 px-3" : "h-[68px] gap-x-3 px-4"}`}>
      <Button
        variant="outline"
        className="border-black/10 bg-white/70 text-neutral-900 hover:bg-black/5"
        onClick={onBackToHub}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Projects
      </Button>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-neutral-900">{projectTitle}</p>
        <p className="text-xs text-neutral-500">Canvas Editor</p>
      </div>

      <TooltipComponent activeTool={activeTool} onToolChange={onToolChange} />

      <div className="flex items-center gap-x-2">
        <Button
          variant="outline"
          size="icon"
          title="Undo"
          disabled={!editor || !canUndo}
          className="border-black/10 bg-white/70 text-neutral-900 hover:bg-black/5 disabled:opacity-40"
          onClick={() => {
            void editor?.undo()
          }}
        >
          <Undo2 className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          title="Redo"
          disabled={!editor || !canRedo}
          className="border-black/10 bg-white/70 text-neutral-900 hover:bg-black/5 disabled:opacity-40"
          onClick={() => {
            void editor?.redo()
          }}
        >
          <Redo2 className="size-4" />
        </Button>
        <Button
          variant="default"
          title="Save"
          className="bg-[#0058d0] text-white hover:bg-[#0045a6]"
          onClick={onManualSave}
          disabled={!editor || saveState === "saving"}
        >
          <Save className="mr-2 size-4" />
          Save
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-x-3">
        <span className="rounded-full border border-black/10 bg-white/60 px-2 py-1 text-xs text-neutral-600">
          {saveStateText}
        </span>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              title="Export"
              disabled={!editor}
              className="border-black/10 bg-white/70 text-neutral-900 hover:bg-black/5 disabled:opacity-40"
            >
              <Download className="mr-2 size-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-[2147483647] border-black/10 bg-white/90 text-neutral-900 shadow-lg shadow-black/5 backdrop-blur-xl">
            <DropdownMenuItem onSelect={handleExportPng} className="focus:bg-black/5 focus:text-neutral-900">
              Export as PNG
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleExportJpeg} className="focus:bg-black/5 focus:text-neutral-900">
              Export as JPEG
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleExportSvg} className="focus:bg-black/5 focus:text-neutral-900">
              Export as SVG
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleExportJson} className="focus:bg-black/5 focus:text-neutral-900">
              Export as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
