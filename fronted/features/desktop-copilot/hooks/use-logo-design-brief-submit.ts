"use client"

import { useCallback } from "react"

import { useDesktopAgentStore } from "@/lib/stores/desktop-agent-store"
import { dispatchBrandBriefToCopilot } from "@/shared/copilot/brand-brief"

export interface BrandBriefFormData {
  brandName: string
  industryDomain?: string
  targetAudience?: string
  coreValues?: string
  toneModernTraditional?: string
  toneProfessionalFriendly?: string
  toneMinimalRich?: string
  toneSteadyEnergetic?: string
  toneNotes?: string
  preferredColors?: string
  avoidColors?: string
  avoidElements?: string
  logoStyleReferences?: string
  usageScenarios?: string
  additionalNotes?: string
}

function formatBrandBriefForCopilot(data: BrandBriefFormData): string {
  const lines: string[] = [
    "I want to design a brand logo. Here is the brand brief:",
    "",
    `**Brand Name**: ${data.brandName}`,
  ]
  if (data.industryDomain) lines.push(`**Industry / Domain**: ${data.industryDomain}`)
  if (data.targetAudience) lines.push(`**Target Audience**: ${data.targetAudience}`)
  if (data.coreValues) lines.push(`**Core Brand Values**: ${data.coreValues}`)

  const toneLines = [
    data.toneModernTraditional
      ? `Modern vs Traditional: ${data.toneModernTraditional}`
      : null,
    data.toneProfessionalFriendly
      ? `Professional vs Friendly: ${data.toneProfessionalFriendly}`
      : null,
    data.toneMinimalRich ? `Minimal vs Rich: ${data.toneMinimalRich}` : null,
    data.toneSteadyEnergetic
      ? `Steady vs Energetic: ${data.toneSteadyEnergetic}`
      : null,
  ].filter(Boolean)
  if (toneLines.length > 0) {
    lines.push(`**Brand Tone**: ${toneLines.join(" | ")}`)
  }
  if (data.toneNotes) lines.push(`**Tone Notes**: ${data.toneNotes}`)

  if (data.preferredColors) lines.push(`**Preferred Colors**: ${data.preferredColors}`)
  if (data.avoidColors) lines.push(`**Colors to Avoid**: ${data.avoidColors}`)
  if (data.avoidElements) lines.push(`**Elements to Avoid**: ${data.avoidElements}`)
  if (data.logoStyleReferences) lines.push(`**Logo Style References**: ${data.logoStyleReferences}`)
  if (data.usageScenarios) lines.push(`**Usage Scenarios**: ${data.usageScenarios}`)
  if (data.additionalNotes) lines.push(`**Additional Notes**: ${data.additionalNotes}`)
  return lines.join("\n")
}

/**
 * Hook for brand questionnaire form. When user submits, it routes the request
 * to logo copilot in silent mode. The logo agent decides whether to open sidebar
 * for clarification (open_logo_sidebar) or trigger confirm_logo_brief directly.
 */
export function useLogoDesignBriefSubmit() {
  const setCopilotSidebarOpen = useDesktopAgentStore((state) => state.setCopilotSidebarOpen)
  const setCopilotAgentMode = useDesktopAgentStore((state) => state.setCopilotAgentMode)

  const submitBrief = useCallback(
    (formData: BrandBriefFormData) => {
      setCopilotAgentMode("logo")
      // Start in silent mode: only open sidebar when logo agent explicitly asks for clarification.
      setCopilotSidebarOpen(false)
      const message = formatBrandBriefForCopilot(formData)
      window.requestAnimationFrame(() => {
        dispatchBrandBriefToCopilot({ message })
      })
    },
    [setCopilotAgentMode, setCopilotSidebarOpen]
  )

  return { submitBrief }
}
