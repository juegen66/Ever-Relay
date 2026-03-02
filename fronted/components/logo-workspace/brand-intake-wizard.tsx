"use client"

import type { KeyboardEvent } from "react"
import {
  Blocks,
  Briefcase,
  Building2,
  Cpu,
  LayoutGrid,
  Palette,
  PenTool,
  Sparkles,
  Store,
  UserCircle2,
  Users,
} from "lucide-react"

import type { BriefState } from "@/components/logo-workspace/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const BRAND_TYPE_OPTIONS = [
  { id: "Technology Company", icon: Cpu },
  { id: "Creative Studio", icon: PenTool },
  { id: "Personal Brand", icon: UserCircle2 },
  { id: "Consumer Product", icon: Store },
  { id: "Enterprise Service", icon: Building2 },
  { id: "Other", icon: LayoutGrid },
] as const

const AUDIENCE_OPTIONS = [
  { id: "Developers", icon: Blocks },
  { id: "Creative Professionals", icon: Sparkles },
  { id: "Enterprise Clients", icon: Briefcase },
  { id: "General Consumers", icon: Users },
  { id: "Niche Community", icon: UserCircle2 },
  { id: "Other", icon: LayoutGrid },
] as const

const TONE_AXES = [
  {
    key: "toneModernTraditional",
    label: "Modern vs Traditional",
    options: ["Modern", "Traditional"] as const,
  },
  {
    key: "toneProfessionalFriendly",
    label: "Professional vs Friendly",
    options: ["Professional", "Friendly"] as const,
  },
  {
    key: "toneMinimalRich",
    label: "Minimal vs Rich",
    options: ["Minimal", "Rich"] as const,
  },
  {
    key: "toneSteadyEnergetic",
    label: "Steady vs Energetic",
    options: ["Steady", "Energetic"] as const,
  },
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

function parseCommaList(value: string) {
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
  const selectedAvoidColors = parseCommaList(brief.avoidColors)

  const canContinue = (() => {
    if (step === 0) return brief.brandName.trim().length > 0
    if (step === 1) {
      return (
        brief.industryDomain.trim().length > 0 &&
        brief.targetAudience.trim().length > 0
      )
    }
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

  const handleShortcut = (
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault()
      handleContinue()
    }
  }

  const toggleAvoidColor = (color: string) => {
    const next = selectedAvoidColors.includes(color)
      ? selectedAvoidColors.filter((item) => item !== color)
      : [...selectedAvoidColors, color]
    onChangeBrief("avoidColors", next.join(", "))
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-[#f7f7f8] px-8 py-8">
      <div className="mx-auto max-w-[980px]">
        <div className="mb-10 flex items-center justify-center gap-2">
          {[0, 1, 2, 3, 4].map((index) => (
            <span
              key={index}
              className={cn(
                "h-[2px] w-8 rounded-full bg-[#e5e5e5]",
                Math.min(step, 4) === index && "bg-[#313131]"
              )}
            />
          ))}
        </div>

        {step === 0 ? (
          <section className="pt-6 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#b3b3b3]">
              Let&apos;s begin with
            </div>
            <h1 className="mt-4 text-[78px] font-semibold leading-[0.98] tracking-[-0.02em] text-[#2c2f38]">
              Your Brand Name
            </h1>
            <div className="mx-auto mt-6 max-w-[560px] border-b border-black/10 pb-3">
              <input
                autoFocus
                value={brief.brandName}
                onChange={(event) => onChangeBrief("brandName", event.target.value)}
                onKeyDown={handleShortcut}
                placeholder="Type your brand name..."
                className={cn(
                  "w-full bg-transparent text-center text-[52px] font-light tracking-[-0.02em] outline-none placeholder:text-[#d0d2d6]",
                  brief.brandName.trim() ? "text-[#3e4350]" : "text-[#c0c2c7]"
                )}
              />
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="pt-2">
            <div className="text-center">
              <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#b3b3b3]">
                Step 01
              </div>
              <h1 className="mt-3 text-[60px] font-semibold leading-[0.98] tracking-[-0.02em] text-[#2c2f38]">
                Brand Foundation
              </h1>
            </div>

            <div className="mt-7 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-black/10 bg-white p-6">
                <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#8d93a2]">
                  Industry / Domain
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {BRAND_TYPE_OPTIONS.map((option) => {
                    const Icon = option.icon
                    const selected = brief.industryDomain === option.id

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => onChangeBrief("industryDomain", option.id)}
                        className={cn(
                          "rounded-md border px-3 py-3 text-left transition",
                          selected
                            ? "border-black/35 bg-[#fafafa]"
                            : "border-black/10 bg-white hover:border-black/25"
                        )}
                      >
                        <Icon className="h-4 w-4 text-[#9197a5]" />
                        <div className="mt-2 text-[13px] font-medium text-[#2f3340]">{option.id}</div>
                      </button>
                    )
                  })}
                </div>
                <input
                  value={brief.industryDomain}
                  onChange={(event) => onChangeBrief("industryDomain", event.target.value)}
                  onKeyDown={handleShortcut}
                  placeholder="Or type a more specific brand type..."
                  className="mt-4 h-10 w-full rounded-md border border-black/10 bg-[#fafbfc] px-3 text-[13px] text-[#2f3340] outline-none placeholder:text-[#a6adbc] focus:border-black/25"
                />
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-6">
                <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#8d93a2]">
                  Target Audience
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {AUDIENCE_OPTIONS.map((option) => {
                    const Icon = option.icon
                    const selected = brief.targetAudience === option.id

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => onChangeBrief("targetAudience", option.id)}
                        className={cn(
                          "rounded-md border px-3 py-3 text-left transition",
                          selected
                            ? "border-black/35 bg-[#fafafa]"
                            : "border-black/10 bg-white hover:border-black/25"
                        )}
                      >
                        <Icon className="h-4 w-4 text-[#9197a5]" />
                        <div className="mt-2 text-[13px] font-medium text-[#2f3340]">{option.id}</div>
                      </button>
                    )
                  })}
                </div>
                <input
                  value={brief.targetAudience}
                  onChange={(event) => onChangeBrief("targetAudience", event.target.value)}
                  onKeyDown={handleShortcut}
                  placeholder="Or describe your main audience..."
                  className="mt-4 h-10 w-full rounded-md border border-black/10 bg-[#fafbfc] px-3 text-[13px] text-[#2f3340] outline-none placeholder:text-[#a6adbc] focus:border-black/25"
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6">
              <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#8d93a2]">
                Core Brand Values
              </div>
              <textarea
                value={brief.coreValues}
                onChange={(event) => onChangeBrief("coreValues", event.target.value)}
                onKeyDown={handleShortcut}
                placeholder="Innovation, reliability, minimalism, trust, energy..."
                rows={4}
                className="mt-3 min-h-[120px] w-full rounded-md border border-black/10 bg-[#fafbfc] px-4 py-3 text-[14px] leading-6 text-[#2f3340] outline-none placeholder:text-[#a6adbc] focus:border-black/25"
              />
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="pt-4">
            <div className="text-center">
              <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#b3b3b3]">
                Step 02
              </div>
              <h1 className="mt-3 text-[60px] font-semibold leading-[0.98] tracking-[-0.02em] text-[#2c2f38]">
                Brand Tone
              </h1>
            </div>

            <div className="mx-auto mt-8 max-w-[860px] space-y-4">
              {TONE_AXES.map((axis) => {
                const selected = brief[axis.key]

                return (
                  <div
                    key={axis.key}
                    className="rounded-xl border border-black/10 bg-white px-5 py-4"
                  >
                    <div className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#8d93a2]">
                      {axis.label}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {axis.options.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => onChangeBrief(axis.key, option)}
                          className={cn(
                            "rounded-md border px-4 py-3 text-[14px] font-medium transition",
                            selected === option
                              ? "border-black/35 bg-[#f7f7f8] text-[#262a35]"
                              : "border-black/10 bg-white text-[#838a99] hover:border-black/25"
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mx-auto mt-6 max-w-[860px] rounded-xl border border-black/10 bg-white p-5">
              <div className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#8d93a2]">
                Tone Notes (Optional)
              </div>
              <textarea
                value={brief.toneNotes}
                onChange={(event) => onChangeBrief("toneNotes", event.target.value)}
                onKeyDown={handleShortcut}
                placeholder="Add nuance if your tone sits between both sides..."
                rows={3}
                className="mt-3 min-h-[100px] w-full rounded-md border border-black/10 bg-[#fafbfc] px-4 py-3 text-[14px] leading-6 text-[#2f3340] outline-none placeholder:text-[#a6adbc] focus:border-black/25"
              />
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="pt-4">
            <div className="text-center">
              <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#b3b3b3]">
                Step 03
              </div>
              <h1 className="mt-3 text-[58px] font-semibold leading-[0.98] tracking-[-0.02em] text-[#2c2f38]">
                Design Preferences
              </h1>
            </div>

            <div className="mx-auto mt-8 max-w-[860px] space-y-4">
              <div className="rounded-xl border border-black/10 bg-white p-5">
                <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.16em] text-[#8d93a2]">
                  <Palette className="h-4 w-4 text-[#8d93a2]" />
                  Preferred Colors
                </div>
                <textarea
                  value={brief.preferredColors}
                  onChange={(event) => onChangeBrief("preferredColors", event.target.value)}
                  onKeyDown={handleShortcut}
                  placeholder="Examples: deep navy, warm orange, monochrome black/white..."
                  rows={3}
                  className="mt-3 min-h-[100px] w-full rounded-md border border-black/10 bg-[#fafbfc] px-4 py-3 text-[14px] leading-6 text-[#2f3340] outline-none placeholder:text-[#a6adbc] focus:border-black/25"
                />
              </div>

              <div className="rounded-xl border border-black/10 bg-white p-5">
                <div className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#8d93a2]">
                  Colors to Avoid
                </div>
                <div className="mt-4 grid grid-cols-7 gap-3">
                  {COLOR_OPTIONS.map((color) => {
                    const selected = selectedAvoidColors.includes(color)
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => toggleAvoidColor(color)}
                        className={cn(
                          "h-8 w-8 rounded-full border-2 transition",
                          selected
                            ? "scale-105 border-[#222]"
                            : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={`Toggle avoid color ${color}`}
                      />
                    )
                  })}
                </div>
                <input
                  value={brief.avoidColors}
                  onChange={(event) => onChangeBrief("avoidColors", event.target.value)}
                  onKeyDown={handleShortcut}
                  placeholder="Type colors to avoid, separated by commas..."
                  className="mt-4 h-10 w-full rounded-md border border-black/10 bg-[#fafbfc] px-3 text-[13px] text-[#2f3340] outline-none placeholder:text-[#a6adbc] focus:border-black/25"
                />
              </div>

              <div className="rounded-xl border border-black/10 bg-white p-5">
                <div className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#8d93a2]">
                  Elements to Avoid
                </div>
                <textarea
                  value={brief.avoidElements}
                  onChange={(event) => onChangeBrief("avoidElements", event.target.value)}
                  onKeyDown={handleShortcut}
                  placeholder="Examples: mascots, heavy gradients, serif typography, abstract symbols..."
                  rows={3}
                  className="mt-3 min-h-[100px] w-full rounded-md border border-black/10 bg-[#fafbfc] px-4 py-3 text-[14px] leading-6 text-[#2f3340] outline-none placeholder:text-[#a6adbc] focus:border-black/25"
                />
              </div>

              <div className="rounded-xl border border-black/10 bg-white p-5">
                <div className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#8d93a2]">
                  Logo Style References
                </div>
                <textarea
                  value={brief.logoStyleReferences}
                  onChange={(event) => onChangeBrief("logoStyleReferences", event.target.value)}
                  onKeyDown={handleShortcut}
                  placeholder="Share reference styles, keywords, or existing logos you like..."
                  rows={3}
                  className="mt-3 min-h-[100px] w-full rounded-md border border-black/10 bg-[#fafbfc] px-4 py-3 text-[14px] leading-6 text-[#2f3340] outline-none placeholder:text-[#a6adbc] focus:border-black/25"
                />
              </div>
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section className="pt-4">
            <div className="text-center">
              <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#b3b3b3]">
                Step 04
              </div>
              <h1 className="mt-3 text-[58px] font-semibold leading-[0.98] tracking-[-0.02em] text-[#2c2f38]">
                Usage & Deliverables
              </h1>
            </div>

            <div className="mx-auto mt-8 max-w-[860px] space-y-4">
              <div className="rounded-xl border border-black/10 bg-white p-5">
                <div className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#8d93a2]">
                  Primary Usage Scenarios
                </div>
                <textarea
                  value={brief.usageScenarios}
                  onChange={(event) => onChangeBrief("usageScenarios", event.target.value)}
                  onKeyDown={handleShortcut}
                  placeholder="Website, app icon, social media, business card, print packaging..."
                  rows={3}
                  className="mt-3 min-h-[100px] w-full rounded-md border border-black/10 bg-[#fafbfc] px-4 py-3 text-[14px] leading-6 text-[#2f3340] outline-none placeholder:text-[#a6adbc] focus:border-black/25"
                />
              </div>

              <div className="rounded-xl border border-black/10 bg-white p-5">
                <div className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#8d93a2]">
                  Additional Context (Optional)
                </div>
                <textarea
                  value={brief.additionalNotes}
                  onChange={(event) => onChangeBrief("additionalNotes", event.target.value)}
                  onKeyDown={handleShortcut}
                  placeholder="Any final requirements, constraints, or expectations..."
                  rows={3}
                  className="mt-3 min-h-[100px] w-full rounded-md border border-black/10 bg-[#fafbfc] px-4 py-3 text-[14px] leading-6 text-[#2f3340] outline-none placeholder:text-[#a6adbc] focus:border-black/25"
                />
              </div>

              <div className="rounded-xl border border-black/10 bg-white p-6">
                <div className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#8d93a2]">
                  You Will Receive
                </div>
                <div className="mt-4 space-y-2 text-[14px] text-[#4a5060]">
                  <p>1. Logo design (icon + wordmark combination)</p>
                  <p>2. Brand color palette</p>
                  <p>3. Typography system</p>
                  <p>4. Brand usage guidelines</p>
                </div>
              </div>
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
          <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c1c2c6]">
            Press Cmd/Ctrl + Enter to continue
          </div>
        </div>
      </div>
    </div>
  )
}
