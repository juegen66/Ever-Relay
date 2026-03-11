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
    <section className="mt-8 rounded-2xl border border-white/60 bg-white/30 p-5 shadow-[0_14px_36px_rgba(24,42,70,0.13),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[31px] font-semibold tracking-tight text-[#1f3556]">Recent Generations</h3>
          <p className="mt-1 text-[13px] text-[#5f6f88]">Quick access to your latest icon explorations.</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="h-8 rounded-full border border-white/70 bg-white/60 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#48628b] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_6px_16px_rgba(24,42,70,0.1)] hover:bg-white hover:text-[#2f4c76]"
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
                className="aspect-[1.45/1] animate-pulse rounded-xl border border-white/70 bg-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
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
                    "group relative flex aspect-[1.45/1] flex-col items-center justify-center overflow-hidden rounded-xl border px-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_8px_18px_rgba(23,41,68,0.1)] transition",
                    selectedRunId === item.id
                      ? "border-[#5c81ad]/80 bg-[linear-gradient(165deg,rgba(255,255,255,0.9)_0%,rgba(234,245,255,0.85)_100%)]"
                      : "border-white/70 bg-[linear-gradient(165deg,rgba(255,255,255,0.78)_0%,rgba(245,250,255,0.74)_100%)] hover:-translate-y-0.5 hover:border-[#86a7ce]/70 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_22px_rgba(23,41,68,0.14)]"
                  )}
                >
                  <div className="pointer-events-none absolute -top-8 right-1 h-16 w-16 rounded-full bg-[#d6e7ff]/70 blur-2xl" />
                  <div className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-md border border-white/90 bg-white/80 shadow-[0_4px_12px_rgba(23,41,68,0.12)]">
                    {item.previewImageUrl ? (
                      <Image
                        src={item.previewImageUrl}
                        alt={`${item.title} preview`}
                        fill
                        className="object-contain p-[2px]"
                        unoptimized
                      />
                    ) : (
                      <Icon className="h-4 w-4 text-[#7087a6]" />
                    )}
                  </div>
                  <span className="relative mt-2 max-w-full truncate text-[11px] font-medium text-[#516786]">{item.title}</span>
                  <span className="relative mt-0.5 max-w-full truncate text-[10px] text-[#7f92ad]">{item.stageLabel}</span>
                </button>
              )
            })}
      </div>
    </section>
  )
}
