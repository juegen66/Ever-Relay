"use client"

import { useCallback } from "react"
import { useDesktopUIStore } from "@/lib/stores/desktop-ui-store"
import { dispatchBrandBriefToCopilot } from "@/shared/copilot/brand-brief"

export interface BrandBriefFormData {
  brandName: string
  industry?: string
  targetAudience?: string
  brandValues?: string
  brandPersonality?: string
  colorPreferences?: string
  avoidColors?: string
  stylePreference?: string
  additionalNotes?: string
}

function formatBrandBriefForCopilot(data: BrandBriefFormData): string {
  const lines: string[] = [
    "我想设计一个品牌 Logo，以下是品牌简报：",
    "",
    `**品牌名称**: ${data.brandName}`,
  ]
  if (data.industry) lines.push(`**行业领域**: ${data.industry}`)
  if (data.targetAudience) lines.push(`**目标受众**: ${data.targetAudience}`)
  if (data.brandValues) lines.push(`**品牌价值观**: ${data.brandValues}`)
  if (data.brandPersonality) lines.push(`**品牌个性**: ${data.brandPersonality}`)
  if (data.colorPreferences) lines.push(`**颜色偏好**: ${data.colorPreferences}`)
  if (data.avoidColors) lines.push(`**要避免的颜色**: ${data.avoidColors}`)
  if (data.stylePreference) lines.push(`**风格偏好**: ${data.stylePreference}`)
  if (data.additionalNotes) lines.push(`**补充说明**: ${data.additionalNotes}`)
  return lines.join("\n")
}

/**
 * Hook for brand questionnaire form. When user submits, it routes the request
 * to logo copilot in silent mode. The logo agent decides whether to open sidebar
 * for clarification (open_logo_sidebar) or trigger confirm_logo_brief directly.
 */
export function useLogoDesignBriefSubmit() {
  const setCopilotSidebarOpen = useDesktopUIStore((state) => state.setCopilotSidebarOpen)
  const setCopilotAgentMode = useDesktopUIStore((state) => state.setCopilotAgentMode)

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
