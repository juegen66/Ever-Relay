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
    <section className="rounded-[30px] border border-[#e4e5e8] bg-white p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#8b8e96]">Workspace Overview</p>
          <h2 className="mt-3 text-[32px] font-semibold tracking-tight text-[#21242a]">Active Projects</h2>
          <p className="mt-1 text-[13px] text-[#6f7382]">
            Continue working on current logo systems or spin up a new concept.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={onCreate}
          className="group relative flex min-h-[150px] flex-col items-center justify-center overflow-hidden rounded-[24px] border border-dashed border-[#d5d8df] bg-[linear-gradient(180deg,#fcfcfc_0%,#f4f5f7_100%)] px-4 text-center transition hover:border-[#bfc4d0] hover:bg-[linear-gradient(180deg,#ffffff_0%,#f1f2f6_100%)]"
        >
          <div className="pointer-events-none absolute inset-x-8 top-4 h-px bg-[linear-gradient(90deg,transparent,rgba(95,91,230,0.18),transparent)]" />
          <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-[#d8dbe3] bg-white text-[#5f5be6]">
            <Plus className="h-4 w-4" />
          </div>
          <div className="relative z-10 mt-4 text-[15px] font-semibold text-[#252831]">Create New Project</div>
          <div className="relative z-10 mt-1 text-[11px] font-medium text-[#8a8e99]">Start from a fresh brand brief</div>
        </button>

        {loading
          ? [0, 1, 2].map((item) => (
              <div
                key={item}
                className="min-h-[150px] animate-pulse rounded-[24px] border border-[#e4e5e8] bg-[#f7f7f8]"
              />
            ))
          : projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => onSelect(project.id)}
                className={cn(
                  "group relative min-h-[150px] overflow-hidden rounded-[24px] border px-4 pb-3 pt-3 text-left transition",
                  selectedRunId === project.id
                    ? "border-[#5f5be6]/45 bg-[linear-gradient(180deg,#ffffff_0%,#f6f5ff_100%)]"
                    : "border-[#e4e5e8] bg-[linear-gradient(180deg,#ffffff_0%,#f7f7f8_100%)] hover:-translate-y-0.5 hover:border-[#cfd2da]"
                )}
              >
                <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(95,91,230,0.14),transparent)]" />

                <div className="relative mb-3 flex items-start justify-between gap-2">
                  <div className="relative flex h-[62px] w-[62px] items-center justify-center overflow-hidden rounded-[18px] border border-[#e4e5e8] bg-[#f3f4f7] text-[24px] font-semibold text-[#252831]">
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
                    <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#8b8e96]">
                      {project.stageLabel}
                    </span>
                  </div>
                </div>

                <div className="truncate text-[18px] font-semibold tracking-tight text-[#21242a]">{project.title}</div>
                <div className="mt-0.5 truncate text-[12px] font-medium text-[#6f7382]">{project.subtitle}</div>
              </button>
            ))}
      </div>
    </section>
  )
}
