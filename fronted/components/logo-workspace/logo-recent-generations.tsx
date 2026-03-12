"use client"

import { Box, Infinity, Leaf, Pentagon, Settings, Sparkles } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { LogoWorkspaceRecentItem } from "./types"

const ICONS = [Pentagon, Infinity, Leaf, Settings, Box, Sparkles] as const

interface LogoRecentGenerationsProps {
  items: LogoWorkspaceRecentItem[]
  selectedRunId: string | null
  loading: boolean
  showAll: boolean
  onToggleShowAll: () => void
  onSelect: (runId: string) => void
}

export function LogoRecentGenerations({
  items,
  selectedRunId,
  loading,
  showAll,
  onToggleShowAll,
  onSelect,
}: LogoRecentGenerationsProps) {
  const visibleItems = showAll ? items : items.slice(0, 6)

  return (
    <section className="mt-8 rounded-[30px] border border-[#e4e5e8] bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#8b8e96]">Quick Library</p>
          <h3 className="mt-3 text-[32px] font-semibold tracking-tight text-[#21242a]">Recent Generations</h3>
          <p className="mt-1 text-[13px] text-[#6f7382]">Quick access to your latest icon explorations.</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="h-8 rounded-full border border-[#e4e5e8] bg-[#f7f7f8] px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6f7382] hover:bg-white hover:text-[#252831]"
          onClick={onToggleShowAll}
        >
          {showAll ? "Show less" : "View all"}
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {loading
          ? [0, 1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="aspect-[1.45/1] animate-pulse rounded-[20px] border border-[#e4e5e8] bg-[#f7f7f8]"
              />
            ))
          : visibleItems.map((item, index) => {
              const Icon = ICONS[index % ICONS.length]
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    "group relative flex aspect-[1.45/1] flex-col items-center justify-center overflow-hidden rounded-[20px] border px-2 text-center transition",
                    selectedRunId === item.id
                      ? "border-[#5f5be6]/45 bg-[linear-gradient(180deg,#ffffff_0%,#f6f5ff_100%)]"
                      : "border-[#e4e5e8] bg-[linear-gradient(180deg,#ffffff_0%,#f7f7f8_100%)] hover:-translate-y-0.5 hover:border-[#cfd2da]"
                  )}
                >
                  <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(95,91,230,0.14),transparent)]" />
                  <div className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-md border border-[#e4e5e8] bg-[#f3f4f7]">
                    {item.previewImageUrl ? (
                      <Image
                        src={item.previewImageUrl}
                        alt={`${item.title} preview`}
                        fill
                        className="object-contain p-[2px]"
                        unoptimized
                      />
                    ) : (
                      <Icon className="h-4 w-4 text-[#7d8190]" />
                    )}
                  </div>
                  <span className="relative mt-2 max-w-full truncate text-[11px] font-medium text-[#4a4f5a]">{item.title}</span>
                  <span className="relative mt-0.5 max-w-full truncate text-[10px] text-[#8b8e96]">{item.stageLabel}</span>
                </button>
              )
            })}
      </div>
    </section>
  )
}
