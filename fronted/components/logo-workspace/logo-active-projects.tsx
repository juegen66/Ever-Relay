"use client"

import { Plus } from "lucide-react"
import Image from "next/image"

import { cn } from "@/lib/utils"

import type { LogoWorkspaceProjectCard } from "./types"

interface LogoActiveProjectsProps {
  loading: boolean
  projects: LogoWorkspaceProjectCard[]
  selectedRunId: string | null
  onCreate: () => void
  onSelect: (runId: string) => void
}

const STATUS_STYLES: Record<string, string> = {
  complete: "border-emerald-200/70 bg-emerald-50/85 text-emerald-700",
  failed: "border-rose-200/80 bg-rose-50/90 text-rose-700",
  running: "border-sky-200/80 bg-sky-50/90 text-sky-700",
  queued: "border-amber-200/80 bg-amber-50/90 text-amber-700",
}

function getStatusClass(status: string) {
  return STATUS_STYLES[status] ?? "border-slate-200/70 bg-slate-50/90 text-slate-600"
}

export function LogoActiveProjects({
  loading,
  projects,
  selectedRunId,
  onCreate,
  onSelect,
}: LogoActiveProjectsProps) {
  return (
    <section className="rounded-2xl border border-white/60 bg-white/34 p-5 shadow-[0_14px_36px_rgba(24,42,70,0.14),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[31px] font-semibold tracking-tight text-[#1f3556]">Active Projects</h2>
          <p className="mt-1 text-[13px] text-[#5f6f88]">
            Continue working on current logo systems or spin up a new concept.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={onCreate}
          className="group relative flex min-h-[150px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#8aa6c9]/60 bg-[linear-gradient(160deg,rgba(255,255,255,0.8)_0%,rgba(236,245,255,0.7)_100%)] px-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_22px_rgba(31,53,88,0.12)] transition hover:border-[#5d80ac]/70 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_30px_rgba(31,53,88,0.18)]"
        >
          <div className="pointer-events-none absolute -top-10 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full bg-[#d2e6ff] blur-2xl transition group-hover:bg-[#b5d5ff]" />
          <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white text-[#425c7f] shadow-[0_8px_18px_rgba(35,59,94,0.18)]">
            <Plus className="h-4 w-4" />
          </div>
          <div className="relative z-10 mt-4 text-[15px] font-semibold text-[#294469]">Create New Project</div>
          <div className="relative z-10 mt-1 text-[11px] font-medium text-[#6c7e99]">Start from a fresh brand brief</div>
        </button>

        {loading
          ? [0, 1, 2].map((item) => (
              <div
                key={item}
                className="min-h-[150px] animate-pulse rounded-2xl border border-white/65 bg-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
              />
            ))
          : projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => onSelect(project.id)}
                className={cn(
                  "group relative min-h-[150px] overflow-hidden rounded-2xl border px-4 pb-3 pt-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_8px_22px_rgba(31,53,88,0.12)] transition",
                  selectedRunId === project.id
                    ? "border-[#5c81ad]/80 bg-[linear-gradient(165deg,rgba(255,255,255,0.88)_0%,rgba(236,246,255,0.84)_100%)]"
                    : "border-white/65 bg-[linear-gradient(165deg,rgba(255,255,255,0.75)_0%,rgba(244,249,255,0.7)_100%)] hover:-translate-y-0.5 hover:border-[#88a8cf]/70 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_30px_rgba(31,53,88,0.18)]"
                )}
              >
                <div className="pointer-events-none absolute -top-10 right-0 h-24 w-24 rounded-full bg-[#d7e8ff]/70 blur-2xl" />

                <div className="relative mb-3 flex items-start justify-between gap-2">
                  <div className="relative flex h-[62px] w-[62px] items-center justify-center overflow-hidden rounded-xl border border-white/90 bg-white/80 text-[24px] font-semibold text-[#294469] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_20px_rgba(35,59,94,0.12)]">
                    {project.previewImageUrl ? (
                      <Image
                        src={project.previewImageUrl}
                        alt={`${project.title} preview`}
                        fill
                        className="object-contain p-1.5"
                        unoptimized
                      />
                    ) : (
                      project.title.slice(0, 1).toUpperCase()
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]",
                        getStatusClass(project.status)
                      )}
                    >
                      {project.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#61728d]">
                      {project.stageLabel}
                    </span>
                  </div>
                </div>

                <div className="truncate text-[18px] font-semibold tracking-tight text-[#243f65]">{project.title}</div>
                <div className="mt-0.5 truncate text-[12px] font-medium text-[#6880a3]">{project.subtitle}</div>
              </button>
            ))}
      </div>
    </section>
  )
}
