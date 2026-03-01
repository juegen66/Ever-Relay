"use client"

import { Grid2x2, List, Search, RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

interface LogoWorkspaceHeaderProps {
  onRefresh: () => void
  refreshing: boolean
}

export function LogoWorkspaceHeader({ onRefresh, refreshing }: LogoWorkspaceHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(247,251,255,0.42)_100%)] px-5 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/70 bg-[linear-gradient(145deg,#1f2f50_10%,#4f6d98_100%)] text-[12px] font-semibold tracking-wide text-white shadow-[0_10px_24px_rgba(15,30,54,0.35)]">
          LG
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#657286]">Logo Studio</div>
          <div className="text-[14px] font-semibold tracking-tight text-[#1d2f4b]">LogoAI Workspace</div>
        </div>

        <nav className="ml-2 flex items-center gap-1 rounded-full border border-white/70 bg-white/55 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <button
            type="button"
            className="rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-semibold text-[#1b304f] shadow-[0_3px_10px_rgba(28,48,79,0.14)]"
          >
            Workspace
          </button>
          <button
            type="button"
            className="rounded-full px-3 py-1.5 text-[12px] font-medium text-[#5c6980] transition hover:bg-white/60 hover:text-[#314563]"
          >
            Library
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full border border-white/70 bg-white/65 text-[#4d617f] shadow-[0_4px_14px_rgba(18,39,69,0.12)] hover:bg-white"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh logo runs"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full border border-white/70 bg-white/65 text-[#4d617f] shadow-[0_4px_14px_rgba(18,39,69,0.12)] hover:bg-white"
          aria-label="Grid view"
        >
          <Grid2x2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full border border-white/70 bg-white/65 text-[#4d617f] shadow-[0_4px_14px_rgba(18,39,69,0.12)] hover:bg-white"
          aria-label="List view"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full border border-white/70 bg-white/65 text-[#4d617f] shadow-[0_4px_14px_rgba(18,39,69,0.12)] hover:bg-white"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>
        <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-[linear-gradient(145deg,#e0d8c3_0%,#c8b89e_100%)] text-[11px] font-semibold text-[#5f523f] shadow-[0_6px_16px_rgba(62,53,38,0.2)]">
          Q
        </div>
      </div>
    </header>
  )
}
