"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { BrandIntakeWizard } from "@/components/logo-workspace/brand-intake-wizard"
import { LogoActiveProjects } from "@/components/logo-workspace/logo-active-projects"
import { LogoArtifactsView } from "@/components/logo-workspace/logo-artifacts-view"
import { LogoRecentGenerations } from "@/components/logo-workspace/logo-recent-generations"
import { LogoWorkspaceShell } from "@/components/logo-workspace/logo-workspace-shell"
import type {
  BriefState,
  LogoWorkspaceProjectCard,
  LogoWorkspaceRecentItem,
} from "@/components/logo-workspace/types"
import { useLogoDesignBriefSubmit } from "@/features/desktop-copilot/hooks/use-logo-design-brief-submit"
import { logoDesignApi } from "@/lib/api/modules/logo-design"
import type { LogoDesignAsset, LogoDesignRun } from "@/shared/contracts/logo-design"

const EMPTY_BRIEF: BriefState = {
  brandName: "",
  industryDomain: "",
  targetAudience: "",
  coreValues: "",
  toneModernTraditional: "",
  toneProfessionalFriendly: "",
  toneMinimalRich: "",
  toneSteadyEnergetic: "",
  toneNotes: "",
  preferredColors: "",
  avoidColors: "",
  avoidElements: "",
  logoStyleReferences: "",
  usageScenarios: "",
  additionalNotes: "",
}

const STAGE_LABELS: Record<string, string> = {
  queued: "Queued",
  planning: "Planning",
  brand_designing: "Brand Designing",
  poster_designing: "Poster Designing",
  persisting: "Persisting",
  complete: "Complete",
  failed: "Failed",
}

type AppViewMode = "workspace" | "wizard" | "artifacts"

function sortRunsByUpdatedAtDesc(runs: LogoDesignRun[]) {
  return [...runs].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
}

function formatEditedLabel(value: string) {
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) {
    return "Edited recently"
  }

  const diffMs = Date.now() - timestamp
  const minutes = Math.floor(diffMs / 60000)

  if (minutes < 1) return "Edited just now"
  if (minutes < 60) return `Edited ${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Edited ${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `Edited ${days}d ago`

  return `Edited ${new Date(timestamp).toLocaleDateString()}`
}

function extractBrandName(run: LogoDesignRun) {
  const brandBriefName =
    run.brandBrief && typeof run.brandBrief.brandName === "string"
      ? run.brandBrief.brandName.trim()
      : ""

  if (brandBriefName) {
    return brandBriefName
  }

  const match = run.prompt.match(/Brand:\s*(.+)/i)
  if (match && match[1]?.trim()) {
    return match[1].trim()
  }

  return "Untitled Brand"
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message : fallback
}

function asRecord(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function firstRecord(value: unknown) {
  if (!Array.isArray(value)) {
    return null
  }
  for (const item of value) {
    const record = asRecord(item)
    if (record) {
      return record
    }
  }
  return null
}

function svgToDataUrl(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function extractRunPreviewSvgDataUrl(run: LogoDesignRun) {
  const result = asRecord(run.resultJson)
  const brand = asRecord(result?.brand)
  if (!brand) {
    return undefined
  }

  const source =
    asString(brand.conceptName) || asRecord(brand.logoSvg)
      ? brand
      : firstRecord(brand.variants) ?? firstRecord(brand.logoVariants) ?? firstRecord(brand.concepts)

  if (!source) {
    return undefined
  }

  const logoSvg = asRecord(source.logoSvg ?? source.logo ?? source.svg)
  const iconSvg =
    asString(logoSvg?.icon) ??
    asString(logoSvg?.full) ??
    asString(source.logoSvg) ??
    asString(source.svg)

  if (!iconSvg || !iconSvg.includes("<svg")) {
    return undefined
  }

  return svgToDataUrl(iconSvg)
}

export function LogoStudioApp() {
  const { submitBrief } = useLogoDesignBriefSubmit()

  const [viewMode, setViewMode] = useState<AppViewMode>("workspace")
  const [wizardStep, setWizardStep] = useState(0)

  const [brief, setBrief] = useState<BriefState>({ ...EMPTY_BRIEF })
  const [runs, setRuns] = useState<LogoDesignRun[]>([])
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [selectedRun, setSelectedRun] = useState<LogoDesignRun | null>(null)
  const [assets, setAssets] = useState<LogoDesignAsset[]>([])

  const [loadingRuns, setLoadingRuns] = useState(false)
  const [loadingSelectedRun, setLoadingSelectedRun] = useState(false)
  const [runningAction, setRunningAction] = useState<"copilot" | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [showAllRecent, setShowAllRecent] = useState(false)

  const loadRuns = useCallback(async () => {
    setLoadingRuns(true)
    setError(null)

    try {
      const nextRuns = sortRunsByUpdatedAtDesc(await logoDesignApi.listDesigns())
      setRuns(nextRuns)

      setSelectedRunId((current) => {
        if (nextRuns.length === 0) return null
        if (current && nextRuns.some((run) => run.id === current)) return current
        return nextRuns[0].id
      })
    } catch (nextError) {
      setError(toErrorMessage(nextError, "Failed to load logo runs"))
    } finally {
      setLoadingRuns(false)
    }
  }, [])

  const loadSelectedRun = useCallback(async (runId: string) => {
    setLoadingSelectedRun(true)

    try {
      const [run, runAssets] = await Promise.all([
        logoDesignApi.getDesignStatus(runId),
        logoDesignApi.getAssets(runId),
      ])
      setSelectedRun(run)
      setAssets(runAssets)
    } catch (nextError) {
      setError(toErrorMessage(nextError, "Failed to load logo run details"))
    } finally {
      setLoadingSelectedRun(false)
    }
  }, [])

  useEffect(() => {
    void loadRuns()
  }, [loadRuns])

  useEffect(() => {
    if (!selectedRunId) {
      setSelectedRun(null)
      setAssets([])
      return
    }

    void loadSelectedRun(selectedRunId)
  }, [selectedRunId, loadSelectedRun])

  useEffect(() => {
    if (!selectedRun || !selectedRunId) return
    if (!(selectedRun.status === "running" || selectedRun.status === "queued")) return

    const timer = window.setInterval(() => {
      void loadSelectedRun(selectedRunId)
    }, 3000)

    return () => window.clearInterval(timer)
  }, [selectedRun, selectedRunId, loadSelectedRun])

  const activeProjects = useMemo<LogoWorkspaceProjectCard[]>(() => {
    return runs.slice(0, 3).map((run) => ({
      id: run.id,
      title: extractBrandName(run),
      subtitle: formatEditedLabel(run.updatedAt),
      stageLabel: STAGE_LABELS[run.stage] ?? run.stage,
      status: run.status,
      previewImageUrl: extractRunPreviewSvgDataUrl(run),
    }))
  }, [runs])

  const recentGenerations = useMemo<LogoWorkspaceRecentItem[]>(() => {
    return runs.map((run) => ({
      id: run.id,
      title: extractBrandName(run),
      subtitle: formatEditedLabel(run.updatedAt),
      stageLabel: STAGE_LABELS[run.stage] ?? run.stage,
      status: run.status,
      previewImageUrl: extractRunPreviewSvgDataUrl(run),
    }))
  }, [runs])

  const updateBrief = useCallback((key: keyof BriefState, value: string) => {
    setBrief((current) => ({
      ...current,
      [key]: value,
    }))
  }, [])

  const openWizard = useCallback(() => {
    setError(null)
    setBrief({ ...EMPTY_BRIEF })
    setWizardStep(0)
    setViewMode("wizard")
  }, [])

  const submitBriefToCopilot = useCallback(async (): Promise<boolean> => {
    const brandName = brief.brandName.trim()
    if (!brandName) {
      setError("Brand name is required.")
      setViewMode("wizard")
      setWizardStep(0)
      return false
    }

    setError(null)
    setRunningAction("copilot")

    try {
      submitBrief({
        brandName,
        industryDomain: brief.industryDomain.trim() || undefined,
        targetAudience: brief.targetAudience.trim() || undefined,
        coreValues: brief.coreValues.trim() || undefined,
        toneModernTraditional: brief.toneModernTraditional.trim() || undefined,
        toneProfessionalFriendly: brief.toneProfessionalFriendly.trim() || undefined,
        toneMinimalRich: brief.toneMinimalRich.trim() || undefined,
        toneSteadyEnergetic: brief.toneSteadyEnergetic.trim() || undefined,
        toneNotes: brief.toneNotes.trim() || undefined,
        preferredColors: brief.preferredColors.trim() || undefined,
        avoidColors: brief.avoidColors.trim() || undefined,
        avoidElements: brief.avoidElements.trim() || undefined,
        logoStyleReferences: brief.logoStyleReferences.trim() || undefined,
        usageScenarios: brief.usageScenarios.trim() || undefined,
        additionalNotes: brief.additionalNotes.trim() || undefined,
      })
      return true
    } catch (nextError) {
      setError(toErrorMessage(nextError, "Failed to submit brief to Copilot"))
      return false
    } finally {
      setRunningAction(null)
    }
  }, [brief, submitBrief])

  const handleWizardBack = useCallback(() => {
    setWizardStep((current) => Math.max(current - 1, 0))
  }, [])

  const handleWizardNext = useCallback(() => {
    setWizardStep((current) => Math.min(current + 1, 4))
  }, [])

  const handleWizardFinish = useCallback(async () => {
    const ok = await submitBriefToCopilot()
    if (!ok) return

    setViewMode("workspace")
    setWizardStep(0)
  }, [submitBriefToCopilot])

  const openArtifactsForRun = useCallback(
    (runId: string) => {
      setViewMode("artifacts")

      // Re-clicking the current run does not change selectedRunId, so trigger refresh explicitly.
      if (runId === selectedRunId) {
        void loadSelectedRun(runId)
        return
      }

      setLoadingSelectedRun(true)
      setSelectedRun(null)
      setAssets([])
      setSelectedRunId(runId)
    },
    [loadSelectedRun, selectedRunId]
  )

  const backToWorkspace = useCallback(() => {
    setViewMode("workspace")
  }, [])

  const refreshView = useCallback(() => {
    void loadRuns()
    if (selectedRunId) {
      void loadSelectedRun(selectedRunId)
    }
  }, [loadRuns, loadSelectedRun, selectedRunId])

  const workspaceMain = (
    <div className="px-5 pb-6 pt-4">
      {error ? (
        <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      <LogoActiveProjects
        loading={loadingRuns}
        projects={activeProjects}
        selectedRunId={selectedRunId}
        onCreate={openWizard}
        onSelect={openArtifactsForRun}
      />

      <LogoRecentGenerations
        items={recentGenerations}
        selectedRunId={selectedRunId}
        loading={loadingRuns}
        showAll={showAllRecent}
        onToggleShowAll={() => setShowAllRecent((current) => !current)}
        onSelect={openArtifactsForRun}
      />
    </div>
  )

  if (viewMode === "wizard") {
    return (
      <div className="h-full min-h-0">
        <BrandIntakeWizard
          brief={brief}
          step={wizardStep}
          submitting={runningAction !== null}
          onChangeBrief={updateBrief}
          onBack={handleWizardBack}
          onNext={handleWizardNext}
          onFinish={() => void handleWizardFinish()}
          onExit={() => setViewMode("workspace")}
        />
      </div>
    )
  }

  if (viewMode === "artifacts") {
    return (
      <LogoWorkspaceShell
        refreshing={loadingRuns}
        onRefresh={refreshView}
        hideHeader
        main={
          <LogoArtifactsView
            run={selectedRun}
            assets={assets}
            loading={loadingSelectedRun}
            refreshing={loadingRuns}
            onBack={backToWorkspace}
            onRefresh={refreshView}
          />
        }
        sidebar={null}
      />
    )
  }

  return (
    <LogoWorkspaceShell
      refreshing={loadingRuns}
      onRefresh={refreshView}
      main={workspaceMain}
      sidebar={null}
    />
  )
}
