"use client"

import { useEffect, useState } from "react"

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Circle,
  Cog,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"

import { queueDesktopPredictionRun } from "@/app/desktop/_ai/lib/prediction-control"
import { Button } from "@/components/ui/button"
import { useWorkingMemory } from "@/hooks/use-working-memory"
import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"
import { usePredictionStore } from "@/lib/stores/prediction-store"
import type { WorkingMemoryState } from "@/shared/contracts/working-memory"
import { dispatchPredictionActionToCopilot } from "@/shared/copilot/prediction-action"

type WorkflowStep = {
  id: number
  title: string
  subtitle: string
}

const NAV_ITEMS = ["Dashboard", "Tasks", "Files"] as const

const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 0, title: "Data Import", subtitle: "Validated input files" },
  { id: 1, title: "Analysis", subtitle: "Running Models" },
  { id: 2, title: "Generate PDF", subtitle: "Waiting for output" },
]

function getTimeGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good Morning"
  if (hour < 18) return "Good Afternoon"
  return "Good Evening"
}

function getWelcomeMessage(state: WorkingMemoryState | null) {
  if (!state) return "Let\u2019s continue where you left off."

  if (state.currentFocus) {
    return `Pick up where you left off \u2014 ${state.currentFocus}.`
  }

  if (state.pendingTasks && state.pendingTasks.length > 0) {
    return `You have ${state.pendingTasks.length} pending task${state.pendingTasks.length > 1 ? "s" : ""} waiting.`
  }

  if (state.activeProjects && state.activeProjects.length > 0) {
    const active = state.activeProjects.filter((p) => p.status === "in-progress" || p.status === "进行中")
    if (active.length > 0) {
      return `${active[0].name} is still in progress.`
    }
  }

  if (state.userName) {
    return `Welcome back, ${state.userName}.`
  }

  return "Let\u2019s continue where you left off."
}

function formatTimeSince(ts: number | null) {
  if (!ts) return "Never"
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 10) return "Updated just now"
  if (diff < 60) return `Updated ${diff}s ago`
  if (diff < 3600) return `Updated ${Math.floor(diff / 60)}m ago`
  return `Updated ${Math.floor(diff / 3600)}h ago`
}

export function NoChatbotDashboard() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<(typeof NAV_ITEMS)[number]>("Dashboard")
  const [activeSuggestion, setActiveSuggestion] = useState(0)
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null)

  const { state: workingMemory } = useWorkingMemory()

  const silentRunning = useDesktopAgentStore((state) => state.silentRunning)
  const silentStatus = useDesktopAgentStore((state) => state.silentStatus)
  const predictions = usePredictionStore((state) => state.predictions)
  const suggestions = usePredictionStore((state) => state.suggestions)
  const lastUpdated = usePredictionStore((state) => state.lastUpdated)
  const isLoading = usePredictionStore((state) => state.isLoading)

  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  useEffect(() => {
    if (!triggerMessage) {
      return
    }

    const timeout = window.setTimeout(() => {
      setTriggerMessage(null)
    }, 3000)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [triggerMessage])

  const handleTriggerWorkflow = () => {
    void queueDesktopPredictionRun({ force: true }).then((result) => {
      if (result === "started") {
        setTriggerMessage("Prediction workflow started. Results will appear here shortly.")
        return
      }

      if (result === "restarted") {
        setTriggerMessage("Prediction workflow restarted with a fresh thread.")
        return
      }

      if (result === "running" || silentRunning || isLoading) {
        setTriggerMessage("Prediction workflow is already running.")
        return
      }

      setTriggerMessage("Prediction trigger skipped. Try again in a moment.")
    })
  }

  if (!mounted) {
    return null
  }

  const hasPredictions = predictions.length > 0
  const hasSuggestions = suggestions.length > 0
  const activeStep = isLoading ? 1 : hasPredictions || hasSuggestions ? 2 : 0
  const workflowStatus = isLoading
    ? "Analyzing desktop activity"
    : hasPredictions || hasSuggestions
      ? "Prediction results ready"
      : "Ready"

  return createPortal(
    <div
      className="fixed inset-0 z-[10020] flex h-screen w-full flex-col overflow-hidden px-3 pb-6 pt-3 sm:px-4 sm:pb-8 sm:pt-4"
      style={{
        backgroundImage: "url(/images/wallpaper.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 mb-2">
        <button
          className="inline-flex items-center gap-2 rounded-md border border-white/35 bg-white/20 px-2.5 py-1.5 text-[12px] font-medium text-white transition hover:bg-white/30"
          onClick={() => router.push("/desktop")}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Desktop
        </button>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 justify-center">
        <div className="h-full min-h-0 w-full sm:w-2/3">
          <div className="h-full overflow-auto rounded-[18px] border border-black/10 bg-[#f2f3f5] shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
            <header className="flex h-[62px] items-center justify-between border-b border-black/10 bg-[#f8f8f9] px-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-black" />
              <span className="text-[18px] font-semibold text-[#101010]">EverRelay</span>
            </div>
            <nav className="flex items-center gap-4">
              {NAV_ITEMS.map((item) => {
                const active = activeTab === item
                return (
                  <button
                    key={item}
                    onClick={() => setActiveTab(item)}
                    className={`text-[13px] transition ${
                      active ? "font-semibold text-[#212121]" : "font-medium text-[#7a7a7a] hover:text-[#4f4f4f]"
                    }`}
                  >
                    {item}
                  </button>
                )
              })}
            </nav>
          </div>
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#8f8f8f]">Brand Information Input</div>
        </header>

            <main className="space-y-6 px-8 py-7">
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#a2a2a2]">{getTimeGreeting()}</p>
            <h1 className="mt-2 text-[49px] font-medium leading-[1.05] text-[#202020]">{getWelcomeMessage(workingMemory)}</h1>
            {workingMemory?.pendingTasks && workingMemory.pendingTasks.length > 0 && !workingMemory.currentFocus && (
              <div className="mt-4 flex flex-wrap gap-2">
                {workingMemory.pendingTasks.slice(0, 3).map((task, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-black/10 bg-white px-3 py-1 text-[12px] font-medium text-[#666]"
                  >
                    {task}
                  </span>
                ))}
                {workingMemory.pendingTasks.length > 3 && (
                  <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[12px] font-medium text-[#999]">
                    +{workingMemory.pendingTasks.length - 3} more
                  </span>
                )}
              </div>
            )}
          </section>

          {/* Predicted Next Steps */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#242424]">
                <Circle className="h-4 w-4 fill-[#131313] text-[#131313]" />
                Predicted Next Steps
              </div>
              <div className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-medium text-[#919191]">
                {isLoading ? "Analyzing..." : formatTimeSince(lastUpdated)}
              </div>
            </div>

            {isLoading && !hasPredictions ? (
              <div className="flex items-center justify-center rounded-[26px] border border-black/10 bg-white p-12 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-[#919191]" />
                  <p className="text-[15px] text-[#919191]">AI is analyzing your activity...</p>
                </div>
              </div>
            ) : hasPredictions ? (
              <div className="grid grid-cols-2 gap-5">
                {predictions.slice(0, 2).map((pred, index) => (
                  <article key={pred.id} className="rounded-[26px] border border-black/10 bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
                    <div className="mb-6 flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3f4f7] text-[#3e3e3e]">
                        <BarChart3 className="h-5 w-5" />
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${
                          pred.confidence >= 90
                            ? "bg-[#ecf8ec] text-[#5a985a]"
                            : pred.confidence >= 70
                              ? "bg-[#fef9ec] text-[#9a8a5a]"
                              : "bg-[#f4f4f4] text-[#888]"
                        }`}
                      >
                        {pred.confidence}% Confidence
                      </span>
                    </div>
                    <h2 className="text-[40px] font-medium leading-[1.05] text-[#1f1f1f]">{pred.title}</h2>
                    <p className="mt-3 max-w-[92%] text-[18px] leading-[1.45] text-[#8a8a8a]">
                      {pred.description}
                    </p>
                    <div className="mt-7 flex items-center justify-between">
                      {pred.estimatedTime ? (
                        <p className="text-[14px] text-[#aaaaaa]">Estimated: {pred.estimatedTime}</p>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="h-5 w-5 rounded-full bg-[#ececef]" />
                          <span className="h-5 w-5 rounded-full bg-[#d9d9de]" />
                        </div>
                      )}
                      <Button
                        className={`h-12 rounded-[14px] px-8 text-[15px] font-medium ${
                          index === 0
                            ? "bg-black text-white hover:bg-black/90"
                            : "border-black/10 bg-white text-[#2f2f2f] hover:bg-[#f8f8f8]"
                        }`}
                        variant={index === 0 ? "default" : "outline"}
                        onClick={() => {
                          dispatchPredictionActionToCopilot({
                            message: `Please help me with: ${pred.title}\n\n${pred.description}`,
                          })
                          router.push("/desktop")
                        }}
                      >
                        {pred.actionLabel ?? "Start"}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-[26px] border border-black/10 bg-white p-12 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
                <p className="text-[15px] text-[#919191]">
                  No predictions yet. Trigger a prediction run to generate events and confidence scores.
                </p>
                <Button
                  className="mt-5 h-11 rounded-[14px] px-6 text-[14px] font-medium"
                  onClick={handleTriggerWorkflow}
                  disabled={silentStatus === "stopping"}
                >
                  {isLoading ? "Analyzing..." : "Trigger Workflow"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </section>

          {/* Improvement Layer + Active Workflow */}
          <section className="space-y-3 pb-2">
            <div className="grid grid-cols-[320px_1fr] items-center gap-5">
              <div className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#242424]">
                <Sparkles className="h-4 w-4" />
                Improvement Layer
              </div>
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#242424]">
                  <Zap className="h-4 w-4" />
                  Active Workflow
                </div>
                <p className="text-[11px] font-medium text-[#9a9a9a]">{workflowStatus}</p>
              </div>
            </div>

            <div className="grid grid-cols-[320px_1fr] gap-5">
              <div className="rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
                {isLoading && !hasSuggestions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#919191]" />
                  </div>
                ) : hasSuggestions ? (
                  <>
                    {suggestions.map((sug, index) => (
                      <button
                        key={sug.id}
                        onClick={() => setActiveSuggestion(index)}
                        className={`${index > 0 ? "mt-2" : ""} w-full rounded-2xl border px-4 py-4 text-left transition ${
                          activeSuggestion === index ? "border-black/20 bg-[#f8f8f8]" : "border-transparent hover:border-black/10 hover:bg-[#f8f8f8]"
                        }`}
                      >
                        <p className="text-[24px] font-medium leading-[1.2] text-[#262626]">{sug.title}</p>
                        <p className="mt-2 text-[15px] leading-[1.4] text-[#9a9a9a]">{sug.description}</p>
                      </button>
                    ))}
                    <button
                      className="mt-5 h-12 w-full rounded-2xl border border-black/10 bg-[#f7f7f7] text-[12px] font-semibold uppercase tracking-[0.06em] text-[#929292] transition hover:bg-[#f1f1f1]"
                      onClick={() => {
                        const selected = suggestions[activeSuggestion]
                        if (!selected) return
                        dispatchPredictionActionToCopilot({
                          message: `Please help me with this suggestion: ${selected.title}\n\n${selected.description}`,
                        })
                        router.push("/desktop")
                      }}
                    >
                      Apply selected suggestion
                    </button>
                  </>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-[13px] text-[#919191]">No suggestions yet.</p>
                  </div>
                )}
              </div>

              <div className="flex min-h-[360px] items-center justify-center rounded-[24px] border border-black/10 bg-white p-8 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
                <div className="w-full max-w-[760px]">
                  {triggerMessage && (
                    <div className="mb-6 rounded-2xl border border-black/10 bg-[#f8f8f8] px-4 py-3 text-[13px] text-[#666]">
                      {triggerMessage}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    {WORKFLOW_STEPS.map((step, index) => {
                      const complete = step.id < activeStep
                      const active = step.id === activeStep
                      return (
                        <div key={step.id} className="flex flex-1 items-center">
                          <button
                            onClick={() => setActiveStep(step.id)}
                            className="group flex min-w-[120px] flex-col items-center text-center"
                          >
                            <span
                              className={`flex h-12 w-12 items-center justify-center rounded-full border transition ${
                                active
                                  ? "border-black text-black shadow-[0_0_0_6px_rgba(0,0,0,0.04)]"
                                  : complete
                                    ? "border-[#d3d3d3] text-[#6f6f6f]"
                                    : "border-[#e2e2e2] text-[#c3c3c3] group-hover:border-[#d2d2d2]"
                              }`}
                            >
                              {complete ? <CheckCircle2 className="h-5 w-5" /> : active ? <Cog className="h-5 w-5" /> : <Circle className="h-4 w-4" />}
                            </span>
                            <p className={`mt-4 text-[16px] font-medium ${active ? "text-[#222]" : "text-[#a4a4a4]"}`}>{step.title}</p>
                            <p className={`mt-1 text-[13px] ${active ? "text-[#727272]" : "text-[#b8b8b8]"}`}>{step.subtitle}</p>
                          </button>
                          {index < WORKFLOW_STEPS.length - 1 ? (
                            <div className="mx-3 h-px flex-1 bg-[#e8e8e8]" />
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>
            </main>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
