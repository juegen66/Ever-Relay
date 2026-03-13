"use client"

import { useEffect, useMemo, useState } from "react"

import {
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  FileCode2,
  Loader2,
  MessageSquare,
  Plus,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useCodingProjectSubmit } from "@/features/desktop-copilot/hooks/use-coding-project-submit"
import { codingRunsApi } from "@/lib/api/modules/coding-runs"
import { useCodingAppsStore } from "@/lib/stores/coding-apps-store"
import {
  useCodingWorkspaceStore,
  type CodingWorkspaceEntry,
  type CodingWorkspacePhase,
} from "@/lib/stores/coding-workspace-store"
import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"
import { cn } from "@/lib/utils"

type ViewMode = "home" | "workspace"

const PHASE_META: Record<
  CodingWorkspacePhase,
  {
    label: string
    tone: string
    chip: string
  }
> = {
  reviewing_request: {
    label: "Reviewing request",
    tone: "Analyzing the first request and deciding whether follow-up questions are needed.",
    chip: "bg-[#f4ede3] text-[#7a5b2f]",
  },
  needs_clarification: {
    label: "Needs clarification",
    tone: "Open the sidebar and answer the follow-up questions so the plan can be finalized.",
    chip: "bg-[#fff1de] text-[#a35c11]",
  },
  ready_for_confirmation: {
    label: "Ready for confirmation",
    tone: "The final implementation report is ready in the sidebar and is waiting for explicit approval.",
    chip: "bg-[#e7f3ea] text-[#236041]",
  },
  workflow_running: {
    label: "Workflow running",
    tone: "The confirmed report is executing in the project sandbox.",
    chip: "bg-[#e8eef9] text-[#315c98]",
  },
  workflow_completed: {
    label: "Workflow completed",
    tone: "The latest workflow finished. Open the sidebar to review the result summary.",
    chip: "bg-[#edf5e6] text-[#3f6b2a]",
  },
  workflow_failed: {
    label: "Workflow failed",
    tone: "The latest workflow failed. Open the sidebar to inspect the report and retry.",
    chip: "bg-[#fae8e3] text-[#9a3d2c]",
  },
}

function formatLastOpenedAt(value: string | null) {
  if (!value) {
    return "Never opened"
  }

  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) {
    return "Unknown"
  }

  const diffMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000))
  if (diffMinutes < 1) {
    return "Opened just now"
  }
  if (diffMinutes < 60) {
    return `Opened ${diffMinutes}m ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `Opened ${diffHours}h ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  return `Opened ${diffDays}d ago`
}

function summarizePrompt(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim()
  if (!normalized) {
    return fallback
  }

  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized
}

function formatRunStage(stage: string | null) {
  if (!stage) {
    return "No workflow run yet"
  }

  return stage
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function getPhaseMeta(entry: CodingWorkspaceEntry | null) {
  if (!entry) {
    return {
      label: "Project ready",
      tone: "Open the sidebar to continue shaping or executing this project.",
      chip: "bg-white/70 text-[#5e564b]",
    }
  }

  return PHASE_META[entry.phase]
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return "Unknown error"
}

export function VibecodingApp() {
  const apps = useCodingAppsStore((state) => state.apps)
  const loading = useCodingAppsStore((state) => state.loading)
  const error = useCodingAppsStore((state) => state.error)
  const loadApps = useCodingAppsStore((state) => state.loadApps)
  const activateApp = useCodingAppsStore((state) => state.activateApp)

  const activeCodingApp = useDesktopAgentStore((state) => state.activeCodingApp)
  const setCopilotSidebarOpen = useDesktopAgentStore((state) => state.setCopilotSidebarOpen)
  const workspaceEntries = useCodingWorkspaceStore((state) => state.entries)
  const syncRunState = useCodingWorkspaceStore((state) => state.syncRunState)
  const { submitProject } = useCodingProjectSubmit()

  const [viewMode, setViewMode] = useState<ViewMode>(activeCodingApp ? "workspace" : "home")
  const [prompt, setPrompt] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void loadApps()
  }, [loadApps])

  useEffect(() => {
    if (!activeCodingApp) {
      setViewMode("home")
    }
  }, [activeCodingApp])

  const activeWorkspaceEntry = activeCodingApp ? workspaceEntries[activeCodingApp.id] ?? null : null
  const activePhaseMeta = getPhaseMeta(activeWorkspaceEntry)

  useEffect(() => {
    if (
      !activeCodingApp ||
      !activeWorkspaceEntry?.runId ||
      activeWorkspaceEntry.phase !== "workflow_running"
    ) {
      return
    }

    let cancelled = false

    const syncActiveRun = async () => {
      try {
        const run = await codingRunsApi.getRun(activeWorkspaceEntry.runId as string)
        if (cancelled) {
          return
        }

        syncRunState({
          appId: activeCodingApp.id,
          runId: run.id,
          stage: run.stage,
          status: run.status,
        })
      } catch {}
    }

    void syncActiveRun()
    const interval = window.setInterval(() => {
      void syncActiveRun()
    }, 4000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [
    activeCodingApp,
    activeWorkspaceEntry?.phase,
    activeWorkspaceEntry?.runId,
    syncRunState,
  ])

  const projects = useMemo(
    () =>
      apps.map((app) => ({
        ...app,
        workspace: workspaceEntries[app.id] ?? null,
      })),
    [apps, workspaceEntries]
  )

  const handleSubmit = async () => {
    const nextPrompt = prompt.trim()
    if (!nextPrompt || submitting) {
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      await submitProject(nextPrompt)
      setPrompt("")
      setViewMode("workspace")
    } catch (error) {
      setSubmitError(toErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const handleActivateProject = async (appId: string) => {
    try {
      await activateApp(appId)
      setViewMode("workspace")
      setSubmitError(null)
    } catch (error) {
      setSubmitError(toErrorMessage(error))
    }
  }

  const activePrompt = summarizePrompt(
    activeWorkspaceEntry?.lastPrompt ?? activeCodingApp?.description,
    "No original request saved for this project yet."
  )

  return (
    <div className="h-full overflow-auto bg-[#efe7dc] text-[#1d1a17]">
      <div className="relative min-h-full overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(248,246,241,0.95)_0%,rgba(223,216,248,0.72)_24%,rgba(230,173,154,0.76)_68%,rgba(196,106,79,0.82)_100%)]" />
        <div className="pointer-events-none absolute inset-x-[-12%] top-[-18%] h-[54%] rounded-full bg-[radial-gradient(circle,rgba(176,199,255,0.7)_0%,rgba(176,199,255,0)_70%)] blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-18%] right-[-8%] h-[48%] w-[34%] rounded-full bg-[radial-gradient(circle,rgba(255,232,189,0.5)_0%,rgba(255,232,189,0)_70%)] blur-3xl" />

        <div className="relative z-10 mx-auto flex min-h-full max-w-7xl flex-col px-5 pb-5 pt-5">
          {viewMode === "workspace" && activeCodingApp ? (
            <section className="flex min-h-full flex-1 flex-col">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  className="h-10 rounded-full border border-white/45 bg-white/35 px-4 text-[#4b4338] hover:bg-white/55"
                  onClick={() => setViewMode("home")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  All projects
                </Button>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6d6357]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Active project
                </div>
              </div>

              <div className="grid flex-1 items-center gap-6 py-8 lg:grid-cols-[minmax(0,1.1fr)_380px]">
                <div className="max-w-3xl">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#6f6559]">
                    Vibecoding Workspace
                  </p>
                  <h1 className="mt-4 font-serif text-[44px] leading-[0.98] tracking-[-0.04em] text-[#1e1812] sm:text-[60px]">
                    {activeCodingApp.name}
                  </h1>
                  <p className="mt-5 max-w-2xl text-[16px] leading-8 text-[#52483e]">
                    {activePrompt}
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-[#61584d]">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/45 px-3 py-1.5">
                      <Clock3 className="h-4 w-4" />
                      {formatLastOpenedAt(activeCodingApp.lastOpenedAt)}
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/45 px-3 py-1.5">
                      <FileCode2 className="h-4 w-4" />
                      {formatRunStage(activeWorkspaceEntry?.runStage ?? null)}
                    </div>
                  </div>
                </div>

                <div className="rounded-[30px] border border-white/55 bg-[rgba(249,244,236,0.84)] p-6 shadow-[0_24px_70px_rgba(61,44,28,0.12)] backdrop-blur-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#7a6f62]">
                        Current phase
                      </p>
                      <h2 className="mt-3 text-[30px] font-semibold leading-[1.05] text-[#201a15]">
                        {activePhaseMeta.label}
                      </h2>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                        activePhaseMeta.chip
                      )}
                    >
                      {activePhaseMeta.label}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-[#5e5447]">
                    {activeWorkspaceEntry?.summary ?? activePhaseMeta.tone}
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="rounded-[22px] border border-white/70 bg-white/65 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7c6b]">
                        Original request
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#4f463c]">
                        {summarizePrompt(activeCodingApp.description, "No request captured.")}
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-white/70 bg-white/65 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7c6b]">
                        Latest workflow
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#4f463c]">
                        Stage: {formatRunStage(activeWorkspaceEntry?.runStage ?? null)}
                        <br />
                        Status: {activeWorkspaceEntry?.runStatus ?? "No run yet"}
                      </p>
                    </div>
                  </div>

                  <Button
                    className="mt-6 h-12 w-full rounded-2xl bg-[#1f1a14] text-white hover:bg-[#332920]"
                    onClick={() => setCopilotSidebarOpen(true)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Open sidebar
                  </Button>
                </div>
              </div>
            </section>
          ) : (
            <>
              <section className="flex min-h-[58vh] flex-col items-center justify-center px-2 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/40 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6c645b]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Vibecoding
                </div>
                <h1 className="mt-7 max-w-4xl font-serif text-[44px] leading-[0.96] tracking-[-0.05em] text-[#1b1612] sm:text-[64px]">
                  Start with one sentence.
                </h1>
                <p className="mt-4 max-w-2xl text-[16px] leading-8 text-[#564d43]">
                  Describe what you want to build. We&apos;ll create a new project immediately,
                  then continue through the right sidebar only when clarification or confirmation
                  is needed.
                </p>

                <div className="mt-8 w-full max-w-3xl rounded-[30px] border border-white/55 bg-[rgba(248,243,235,0.88)] p-4 shadow-[0_26px_80px_rgba(71,48,30,0.14)] backdrop-blur-xl">
                  <Textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Ask Vibecoding to build a responsive marketing site, a docs app, an AI dashboard..."
                    className="min-h-[132px] resize-none border-0 bg-transparent px-3 py-3 text-[17px] leading-8 text-[#231c16] shadow-none placeholder:text-[#827768] focus-visible:ring-0"
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                        event.preventDefault()
                        void handleSubmit()
                      }
                    }}
                  />

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#d9cfc2] px-2 pt-4">
                    <div className="inline-flex items-center gap-2 text-sm text-[#6c645b]">
                      <Plus className="h-4 w-4" />
                      New project
                    </div>
                    <Button
                      className="h-11 rounded-full bg-[#1f1a14] px-5 text-white hover:bg-[#342920]"
                      disabled={submitting || !prompt.trim()}
                      onClick={() => void handleSubmit()}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating project
                        </>
                      ) : (
                        <>
                          Create project
                          <ArrowUpRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>

                  {submitError && (
                    <div className="mt-3 rounded-2xl border border-[#e0b0a5] bg-[#fff0ec] px-4 py-3 text-left text-sm text-[#9a4437]">
                      {submitError}
                    </div>
                  )}
                </div>
              </section>

              <section className="mt-auto rounded-[32px] border border-white/55 bg-[rgba(248,243,235,0.9)] p-5 shadow-[0_24px_70px_rgba(61,44,28,0.12)] backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#847664]">
                      My projects
                    </p>
                    <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-[#201a15]">
                      Pick up where you left off.
                    </h2>
                  </div>
                  <div className="rounded-full border border-white/55 bg-white/55 px-3 py-1 text-sm text-[#61584d]">
                    {loading ? "Refreshing..." : `${projects.length} projects`}
                  </div>
                </div>

                {error && (
                  <div className="mt-4 rounded-2xl border border-[#e0b0a5] bg-[#fff0ec] px-4 py-3 text-sm text-[#9a4437]">
                    {error}
                  </div>
                )}

                {loading && !projects.length ? (
                  <div className="mt-5 flex items-center justify-center rounded-[26px] border border-dashed border-[#d3c8bb] bg-white/45 px-6 py-12 text-[#665c50]">
                    <div className="inline-flex items-center gap-3 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading projects
                    </div>
                  </div>
                ) : !projects.length ? (
                  <div className="mt-5 rounded-[26px] border border-dashed border-[#d3c8bb] bg-white/45 px-6 py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[#1f1a14] text-white">
                      <FileCode2 className="h-6 w-6" />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-[#231c16]">
                      No projects yet
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[#665c50]">
                      Start with one request above. A fresh coding project will be created
                      immediately and the sidebar will take over only when needed.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4 lg:grid-cols-3">
                    {projects.map((app) => {
                      const phaseMeta = getPhaseMeta(app.workspace)
                      const isActive = activeCodingApp?.id === app.id

                      return (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => void handleActivateProject(app.id)}
                          className={cn(
                            "rounded-[26px] border p-5 text-left transition-all",
                            isActive
                              ? "border-[#d4b194] bg-[#fff7f1] shadow-[0_18px_44px_rgba(109,74,44,0.12)]"
                              : "border-white/65 bg-white/60 hover:border-[#dbc0ab] hover:bg-[#fff8f1]"
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-lg font-semibold text-[#201a15]">{app.name}</p>
                              <p className="mt-2 text-sm leading-7 text-[#5d5448]">
                                {summarizePrompt(
                                  app.workspace?.lastPrompt ?? app.description,
                                  "Open this project to continue in the sidebar."
                                )}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
                                phaseMeta.chip
                              )}
                            >
                              {phaseMeta.label}
                            </span>
                          </div>

                          <div className="mt-5 flex items-center justify-between text-sm text-[#6d6357]">
                            <span>{formatLastOpenedAt(app.lastOpenedAt)}</span>
                            <span className="inline-flex items-center gap-1 font-medium text-[#2d261f]">
                              Open
                              <ArrowUpRight className="h-4 w-4" />
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
