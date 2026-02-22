'use client'

import { Logo } from "./logo"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { TooltipComponent } from "./tooltip"
import { Undo2, Redo2, Save, Download } from "lucide-react"
import { ActiveTools } from "../types"
import { EditorType } from "../hooks/use-Editor"


interface NavbarProps {
    activeTool: ActiveTools;
    onToolChange: (tool: ActiveTools) => void;
    editor: EditorType | null;
    canUndo: boolean;
    canRedo: boolean;
}

export const Navbar = ({ activeTool, onToolChange, editor, canUndo, canRedo }: NavbarProps) => {
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

    return (
        <nav className="w-full flex items-center p-4 h-[68px] border-b gap-x-8 lg:pl-[34px] bg-[#f6f1e6] border-[#8fa889] text-[#2f4f2f]">
            <Logo />

            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="border-[#8fa889] bg-[#f6f1e6] text-[#2f4f2f] hover:bg-[#ece6d8]"
                    >
                        Open
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="z-[2147483647] border-[#8fa889] bg-[#f6f1e6] text-[#2f4f2f]">
                    <DropdownMenuItem className="focus:bg-[#e8efdf] focus:text-[#2f4f2f]">
                        <div className="flex items-center gap-x-2">
                            <div className="size-8 rounded-full bg-[#e8efdf]"></div>
                            <div className="flex flex-col">
                                <p className="text-sm font-medium">User Name</p>
                                <p className="text-xs text-[#4f664f]">user@example.com</p>
                            </div>
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-[#e8efdf] focus:text-[#2f4f2f]">Item 2</DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-[#e8efdf] focus:text-[#2f4f2f]">Item 3</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <TooltipComponent activeTool={activeTool} onToolChange={onToolChange} />

            <div className="flex items-center gap-x-2">
                <Button
                    variant="outline"
                    size="icon"
                    title="Undo"
                    disabled={!editor || !canUndo}
                    className="border-[#8fa889] bg-[#f6f1e6] text-[#2f4f2f] hover:bg-[#ece6d8] disabled:opacity-40"
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
                    className="border-[#8fa889] bg-[#f6f1e6] text-[#2f4f2f] hover:bg-[#ece6d8] disabled:opacity-40"
                    onClick={() => {
                        void editor?.redo()
                    }}
                >
                    <Redo2 className="size-4" />
                </Button>
                <Button
                    variant="default"
                    size="icon"
                    title="Save"
                    className="bg-[#5f7d5f] text-[#f6f1e6] hover:bg-[#4e694e]"
                >
                    <Save className="size-4" />
                </Button>
            </div>

            <div className="ml-auto flex items-center gap-x-2">
                <span className="text-sm font-medium">Export</span>
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            title="Export"
                            disabled={!editor}
                            className="border-[#8fa889] bg-[#f6f1e6] text-[#2f4f2f] hover:bg-[#ece6d8] disabled:opacity-40"
                        >
                            <Download className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-[2147483647] border-[#8fa889] bg-[#f6f1e6] text-[#2f4f2f]">
                        <DropdownMenuItem onSelect={handleExportPng} className="focus:bg-[#e8efdf] focus:text-[#2f4f2f]">
                            Export as PNG
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleExportJpeg} className="focus:bg-[#e8efdf] focus:text-[#2f4f2f]">
                            Export as JPEG
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleExportSvg} className="focus:bg-[#e8efdf] focus:text-[#2f4f2f]">
                            Export as SVG
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleExportJson} className="focus:bg-[#e8efdf] focus:text-[#2f4f2f]">
                            Export as JSON
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>


        </nav>
    )
}
