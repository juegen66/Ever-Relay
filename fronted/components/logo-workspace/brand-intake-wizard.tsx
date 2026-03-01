"use client"

import { useCallback, useEffect, useRef } from "react"
import {
  Briefcase,
  Building2,
  Cpu,
  Diamond,
  GraduationCap,
  HeartPulse,
  Landmark,
  LayoutGrid,
  Rocket,
  Shirt,
  Utensils,
} from "lucide-react"

import type { BriefState } from "@/components/logo-workspace/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const AUDIENCE_OPTIONS = [
  {
    id: "Startups & Gen Z",
    description: "Dynamic, bold, and forward-thinking consumers aged 18-25.",
    icon: Rocket,
  },
  {
    id: "Corporate & B2B",
    description: "Professional services, reliability, and established enterprises.",
    icon: Briefcase,
  },
  {
    id: "Luxury & High-End",
    description: "Premium quality seekers, affluent lifestyle, and exclusivity.",
    icon: Diamond,
  },
] as const

const INDUSTRY_OPTIONS = [
  { id: "Technology", icon: Cpu },
  { id: "Food & Beverage", icon: Utensils },
  { id: "Fashion", icon: Shirt },
  { id: "Health", icon: HeartPulse },
  { id: "Finance", icon: Landmark },
  { id: "Real Estate", icon: Building2 },
  { id: "Education", icon: GraduationCap },
  { id: "Other", icon: LayoutGrid },
] as const

const COLOR_OPTIONS = [
  "#CD6A5C",
  "#D78A3E",
  "#DEC848",
  "#78BB6E",
  "#4C8560",
  "#84C2DF",
  "#576CD6",
  "#6357D1",
  "#7D67D9",
  "#C2649A",
  "#CF7B82",
  "#8B5E33",
  "#111216",
  "#7A8091",
] as const

interface BrandIntakeWizardProps {
  brief: BriefState
  step: number
  submitting: boolean
  onChangeBrief: (key: keyof BriefState, value: string) => void
  onBack: () => void
  onNext: () => void
  onFinish: () => void
  onExit: () => void
}

function parseAvoidColors(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export function BrandIntakeWizard({
  brief,
  step,
  submitting,
  onChangeBrief,
  onBack,
  onNext,
  onFinish,
  onExit,
}: BrandIntakeWizardProps) {
  const notesTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const selectedAvoidColors = parseAvoidColors(brief.avoidColors)

  const canContinue = (() => {
    if (step === 0) return brief.brandName.trim().length > 0
    if (step === 1) return brief.targetAudience.trim().length > 0
    if (step === 2) return brief.industry.trim().length > 0
    return true
  })()

  const handleContinue = () => {
    if (step < 4) {
      if (!canContinue) return
      onNext()
      return
    }
    onFinish()
  }

  const toggleAvoidColor = (color: string) => {
    const next = selectedAvoidColors.includes(color)
      ? selectedAvoidColors.filter((item) => item !== color)
      : [...selectedAvoidColors, color]

    onChangeBrief("avoidColors", next.join(", "))
  }

  const resizeNotesTextarea = useCallback(() => {
    const textarea = notesTextareaRef.current
    if (!textarea) return
    textarea.style.height = "0px"
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [])

  useEffect(() => {
    if (step !== 3) return
    resizeNotesTextarea()
  }, [brief.additionalNotes, resizeNotesTextarea, step])

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-[#f7f7f8] px-8 py-8">
      <div className="mx-auto max-w-[980px]">
        <div className="mb-10 flex items-center justify-center gap-2">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className={cn(
                "h-[2px] w-8 rounded-full bg-[#e5e5e5]",
                Math.min(step, 3) === index && "bg-[#313131]"
              )}
            />
          ))}
        </div>

        {step === 0 ? (
          <section className="pt-6 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#b3b3b3]">First, let's start with</div>
            <h1 className="mt-4 text-[78px] font-semibold leading-[0.98] tracking-[-0.02em] text-[#2c2f38]">Your Brand Name</h1>
            <div className="mx-auto mt-6 max-w-[560px] border-b border-black/10 pb-3">
              <input
                autoFocus
                value={brief.brandName}
                onChange={(event) => onChangeBrief("brandName", event.target.value)}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault()
                    handleContinue()
                  }
                }}
                placeholder="Type here..."
                className={cn(
                  "w-full bg-transparent text-center text-[52px] font-light tracking-[-0.02em] outline-none placeholder:text-[#d0d2d6]",
                  brief.brandName.trim() ? "text-[#3e4350]" : "text-[#c0c2c7]"
                )}
              />
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="pt-4 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#b3b3b3]">Targeting</div>
            <h1 className="mt-3 text-[70px] font-semibold leading-[0.98] tracking-[-0.02em] text-[#2c2f38]">Who is your audience?</h1>
            <div className="mt-7 grid grid-cols-3 gap-3">
              {AUDIENCE_OPTIONS.map((option) => {
                const Icon = option.icon
                const selected = brief.targetAudience === option.id

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onChangeBrief("targetAudience", option.id)}
                    className={cn(
                      "rounded-sm border px-4 py-7 text-center transition",
                      selected
                        ? "border-black/35 bg-white"
                        : "border-black/8 bg-[#f7f7f7] hover:border-black/20"
                    )}
                  >
                    <Icon className="mx-auto h-5 w-5 text-[#b1b3ba]" />
                    <div className="mt-4 text-[30px] font-semibold tracking-[-0.02em] text-[#3a3b43]">{option.id}</div>
                    <div className="mt-2 text-[13px] leading-5 text-[#9ca0a9]">{option.description}</div>
                  </button>
                )
              })}
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="pt-4 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#b3b3b3]">Step 02</div>
            <h1 className="mt-3 text-[70px] font-semibold leading-[0.98] tracking-[-0.02em] text-[#2c2f38]">Select Your Industry</h1>
            <div className="mt-8 grid grid-cols-4 gap-3">
              {INDUSTRY_OPTIONS.map((option) => {
                const Icon = option.icon
                const selected = brief.industry === option.id

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onChangeBrief("industry", option.id)}
                    className={cn(
                      "rounded-sm border px-2 py-8 text-center transition",
                      selected
                        ? "border-black/35 bg-white"
                        : "border-black/8 bg-[#f7f7f7] hover:border-black/20"
                    )}
                  >
                    <Icon className="mx-auto h-5 w-5 text-[#afb1b9]" />
                    <div className="mt-4 text-[28px] font-semibold tracking-[-0.02em] text-[#3a3b43]">{option.id}</div>
                  </button>
                )
              })}
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="pt-8 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#b3b3b3]">Optional details</div>
            <h1 className="mt-4 text-[72px] font-semibold leading-[0.98] tracking-[-0.02em] text-[#2c2f38]">Anything else to add?</h1>
            <p className="mx-auto mt-3 max-w-[760px] text-[16px] text-[#9aa0ad]">
              Add slogans, personality, references, constraints, or a full brand story.
            </p>
            <div className="mx-auto mt-6 max-w-[820px] rounded-2xl border border-black/10 bg-white px-7 py-6 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
              <textarea
                ref={notesTextareaRef}
                value={brief.additionalNotes}
                onChange={(event) => onChangeBrief("additionalNotes", event.target.value)}
                onInput={resizeNotesTextarea}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault()
                    handleContinue()
                  }
                }}
                placeholder="Slogan, details, or specific vibes..."
                rows={4}
                className="min-h-[180px] w-full resize-none overflow-hidden bg-transparent text-left text-[28px] font-light leading-[1.28] tracking-[-0.01em] text-[#3e4350] outline-none placeholder:text-[#c2c5cf]"
              />
            </div>
            <div className="mt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-[#b8bcc7]">
              Tip: Use Cmd/Ctrl + Enter to continue
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section className="pt-6 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#b3b3b3]">Step 04</div>
            <h1 className="mt-4 text-[70px] font-semibold leading-[0.98] tracking-[-0.02em] text-[#2c2f38]">Colors to Avoid?</h1>
            <p className="mt-2 text-[15px] text-[#9ea2ac]">Select colors that clash with your vision.</p>

            <div className="mx-auto mt-10 grid max-w-[520px] grid-cols-8 gap-x-5 gap-y-5">
              {COLOR_OPTIONS.map((color) => {
                const selected = selectedAvoidColors.includes(color)
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => toggleAvoidColor(color)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition",
                      selected ? "border-[#222] scale-105" : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={`Toggle avoid color ${color}`}
                  />
                )
              })}
            </div>
          </section>
        ) : null}

        <div className="mt-14 text-center">
          <div className="flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-full px-6 text-[13px] font-medium text-[#7f8086] hover:bg-black/5"
              onClick={step === 0 ? onExit : onBack}
              disabled={submitting}
            >
              {step === 0 ? "Back to Workspace" : "Back"}
            </Button>
            <Button
              type="button"
              onClick={handleContinue}
              disabled={submitting || (step < 4 && !canContinue)}
              className="h-11 min-w-[164px] rounded-full bg-[#10131c] px-7 text-[13px] font-semibold text-white hover:bg-[#1b1f2a]"
            >
              {submitting ? "Generating..." : step === 4 ? "Finish & Generate" : "Next Step ->"}
            </Button>
          </div>
          <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c1c2c6]">Press Enter to continue</div>
        </div>
      </div>
    </div>
  )
}
