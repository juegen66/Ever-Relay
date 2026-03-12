"use client"

import { Grid2x2, List, Search, RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

interface LogoWorkspaceHeaderProps {
  onRefresh: () => void
  refreshing: boolean
}

export function LogoWorkspaceHeader({ onRefresh, refreshing }: LogoWorkspaceHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[#e4e5e8] bg-white px-5">
      <div className="flex items-center gap-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#1d2028]/10 bg-[#151821] text-[12px] font-semibold tracking-wide text-white">
          LG
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#8b8e96]">Logo Studio</div>
          <div className="text-[14px] font-semibold tracking-tight text-[#21242a]">LogoAI Workspace</div>
        </div>

        <nav className="ml-2 flex items-center gap-1 rounded-full border border-[#e4e5e8] bg-[#f7f7f8] p-1">
          <button
            type="button"
            className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#5f5be6]"
          >
            Workspace
          </button>
          <button
            type="button"
            className="rounded-full px-3 py-1.5 text-[12px] font-medium text-[#6f7382] transition hover:bg-white hover:text-[#252831]"
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
          className="h-8 w-8 rounded-full border border-[#e4e5e8] bg-[#f7f7f8] text-[#6f7382] hover:bg-white hover:text-[#252831]"
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
          className="h-8 w-8 rounded-full border border-[#e4e5e8] bg-[#f7f7f8] text-[#6f7382] hover:bg-white hover:text-[#252831]"
          aria-label="Grid view"
        >
          <Grid2x2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full border border-[#e4e5e8] bg-[#f7f7f8] text-[#6f7382] hover:bg-white hover:text-[#252831]"
          aria-label="List view"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full border border-[#e4e5e8] bg-[#f7f7f8] text-[#6f7382] hover:bg-white hover:text-[#252831]"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>
        <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-[#d7d9e0] bg-[#f1ece3] text-[11px] font-semibold text-[#6d6251]">
          Q
        </div>
      </div>
    </header>
  )
}
