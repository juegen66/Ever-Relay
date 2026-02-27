"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Circle,
  Cog,
  FileArchive,
  Sparkles,
  Zap,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

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

export function WorkflowDashboard() {
  const router = useRouter()
  const timeoutRef = useRef<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<(typeof NAV_ITEMS)[number]>("Dashboard")
  const [activeSuggestion, setActiveSuggestion] = useState(0)
  const [activeStep, setActiveStep] = useState(1)
  const [isExecuting, setIsExecuting] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleExecute = () => {
    setIsExecuting(true)
    setActiveStep(1)
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = window.setTimeout(() => {
      setActiveStep((prev) => (prev < 2 ? prev + 1 : 2))
      setIsExecuting(false)
      timeoutRef.current = null
    }, 1000)
  }

  if (!mounted) {
    return null
  }

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
              <span className="text-[18px] font-semibold text-[#101010]">CloudOS</span>
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#a2a2a2]">Good Afternoon</p>
            <h1 className="mt-2 text-[49px] font-medium leading-[1.05] text-[#202020]">Let&apos;s continue where you left off.</h1>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#242424]">
                <Circle className="h-4 w-4 fill-[#131313] text-[#131313]" />
                Predicted Next Steps
              </div>
              <div className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-medium text-[#919191]">
                Updated just now
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <article className="rounded-[26px] border border-black/10 bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3f4f7] text-[#3e3e3e]">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-[#ecf8ec] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5a985a]">
                    98% Confidence
                  </span>
                </div>
                <h2 className="text-[40px] font-medium leading-[1.05] text-[#1f1f1f]">Q3 Financial Report</h2>
                <p className="mt-3 max-w-[92%] text-[18px] leading-[1.45] text-[#8a8a8a]">
                  You viewed the Q2 data yesterday. The system has pre-compiled Q3 projections based on new CSV uploads.
                </p>
                <div className="mt-7 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-full bg-[#ececef]" />
                    <span className="h-5 w-5 rounded-full bg-[#d9d9de]" />
                  </div>
                  <Button
                    className="h-12 rounded-[14px] bg-black px-8 text-[15px] font-medium text-white hover:bg-black/90"
                    onClick={handleExecute}
                  >
                    {isExecuting ? "Executing..." : "Execute"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </article>

              <article className="rounded-[26px] border border-black/10 bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3f4f7] text-[#3e3e3e]">
                    <FileArchive className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-[#f4f4f4] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#888]">
                    84% Confidence
                  </span>
                </div>
                <h2 className="text-[40px] font-medium leading-[1.05] text-[#1f1f1f]">Archive Project Alpha</h2>
                <p className="mt-3 max-w-[92%] text-[18px] leading-[1.45] text-[#8a8a8a]">
                  Project Alpha deliverables were marked &quot;Final&quot; 2 hours ago. Suggest archiving to cold storage.
                </p>
                <div className="mt-7 flex items-center justify-between">
                  <p className="text-[14px] text-[#aaaaaa]">Estimated time: 45s</p>
                  <Button
                    variant="outline"
                    className="h-12 rounded-[14px] border-black/10 bg-white px-8 text-[15px] font-medium text-[#2f2f2f] hover:bg-[#f8f8f8]"
                    onClick={() => setActiveSuggestion(1)}
                  >
                    Review
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            </div>
          </section>

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
                <p className="text-[11px] font-medium text-[#9a9a9a]">{isExecuting ? "Executing: Marketing Analysis" : "Ready"}</p>
              </div>
            </div>

            <div className="grid grid-cols-[320px_1fr] gap-5">
              <div className="rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
                <button
                  onClick={() => setActiveSuggestion(0)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    activeSuggestion === 0 ? "border-black/20 bg-[#f8f8f8]" : "border-transparent hover:border-black/10 hover:bg-[#f8f8f8]"
                  }`}
                >
                  <p className="text-[24px] font-medium leading-[1.2] text-[#262626]">Refine Document Structure</p>
                  <p className="mt-2 text-[15px] leading-[1.4] text-[#9a9a9a]">Detected inconsistent heading levels in &apos;Meeting Notes&apos;.</p>
                </button>
                <button
                  onClick={() => setActiveSuggestion(1)}
                  className={`mt-2 w-full rounded-2xl border px-4 py-4 text-left transition ${
                    activeSuggestion === 1 ? "border-black/20 bg-[#f8f8f8]" : "border-transparent hover:border-black/10 hover:bg-[#f8f8f8]"
                  }`}
                >
                  <p className="text-[24px] font-medium leading-[1.2] text-[#262626]">Draft Reply</p>
                  <p className="mt-2 text-[15px] leading-[1.4] text-[#9a9a9a]">Sarah is waiting for approval on the budget. One click draft.</p>
                </button>
                <button className="mt-5 h-12 w-full rounded-2xl border border-black/10 bg-[#f7f7f7] text-[12px] font-semibold uppercase tracking-[0.06em] text-[#929292] transition hover:bg-[#f1f1f1]">
                  View all 5 suggestions
                </button>
              </div>

              <div className="flex min-h-[360px] items-center justify-center rounded-[24px] border border-black/10 bg-white p-8 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
                <div className="w-full max-w-[760px]">
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
