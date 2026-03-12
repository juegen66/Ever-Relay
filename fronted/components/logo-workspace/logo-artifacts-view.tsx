"use client"

import { ArrowLeft, ArrowUpRight, Loader2, RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { logoDesignApi } from "@/lib/api/modules/logo-design"
import type { LogoDesignAsset, LogoDesignRun } from "@/shared/contracts/logo-design"

interface LogoArtifactsViewProps {
  run: LogoDesignRun | null
  assets: LogoDesignAsset[]
  loading: boolean
  refreshing: boolean
  onBack: () => void
  onRefresh: () => void
  onImportToCanvas?: (asset: LogoDesignAsset) => void
  importingAssetId?: string | null
  importError?: string | null
}

type ArtifactSet = {
  full: LogoDesignAsset | null
  icon: LogoDesignAsset | null
  wordmark: LogoDesignAsset | null
  poster: LogoDesignAsset | null
}

type ArtifactMetadata = {
  conceptName: string
  logoRationale: string
  posterRationale: string
  philosophy: string
  headingFont: string
  bodyFont: string
  primaryColor: string
  secondaryColor: string
  neutralColor: string
}

type ArtifactDisplayVariant = "framed" | "clean"

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

function buildArtifactSet(assets: LogoDesignAsset[]): ArtifactSet {
  const byType = new Map(assets.map((asset) => [asset.assetType, asset]))
  return {
    full: byType.get("logo_svg_full") ?? null,
    icon: byType.get("logo_svg_icon") ?? null,
    wordmark: byType.get("logo_svg_wordmark") ?? null,
    poster: byType.get("poster_svg") ?? null,
  }
}

function buildArtifactMetadata(run: LogoDesignRun | null): ArtifactMetadata {
  const result = asRecord(run?.resultJson)
  const brand = asRecord(result?.brand)
  const poster = asRecord(result?.poster)

  const brandSource =
    brand && (asString(brand.conceptName) || asString(brand.rationaleMd))
      ? brand
      : firstRecord(brand?.variants) ?? firstRecord(brand?.logoVariants) ?? firstRecord(brand?.concepts)

  const posterSource =
    poster && (asString(poster.rationaleMd) || asString(poster.posterSvg))
      ? poster
      : firstRecord(poster?.variants) ?? firstRecord(poster?.posterVariants) ?? firstRecord(poster?.posters)

  const colorPalette = asRecord(brand?.colorPalette) ?? asRecord(brandSource?.colorPalette)
  const typography = asRecord(brand?.typography) ?? asRecord(brandSource?.typography)

  return {
    conceptName:
      asString(brandSource?.conceptName) ??
      asString(brandSource?.name) ??
      asString(brandSource?.title) ??
      "Abstract Speed",
    logoRationale:
      asString(brandSource?.rationaleMd) ??
      asString(brandSource?.rationale) ??
      asString(brandSource?.description) ??
      "This mark distills startup momentum into a compact geometric language built for digital products.",
    posterRationale:
      asString(posterSource?.rationaleMd) ??
      asString(posterSource?.rationale) ??
      asString(posterSource?.description) ??
      "The poster translates the logo system into an editorial composition with hierarchy and contrast.",
    philosophy:
      asString(poster?.philosophyMd) ??
      asString(poster?.philosophy) ??
      asString(poster?.designPhilosophy) ??
      "Clarity first, energy always. Every shape supports speed, recognition, and consistency.",
    headingFont:
      asString(typography?.headingFont) ??
      asString(typography?.displayFont) ??
      "Plus Jakarta Sans",
    bodyFont:
      asString(typography?.bodyFont) ??
      asString(typography?.supportFont) ??
      "Inter",
    primaryColor: asString(colorPalette?.primary) ?? "#5F5BE6",
    secondaryColor: asString(colorPalette?.secondary) ?? "#1F232B",
    neutralColor: asString(colorPalette?.neutral) ?? "#F2F3F7",
  }
}

function ArtifactCard({
  title,
  subtitle,
  badge,
  asset,
  runId,
  selected = false,
  displayVariant = "framed",
  onImportToCanvas,
  importingAssetId,
}: {
  title: string
  subtitle: string
  badge?: string
  asset: LogoDesignAsset | null
  runId: string
  selected?: boolean
  displayVariant?: ArtifactDisplayVariant
  onImportToCanvas?: (asset: LogoDesignAsset) => void
  importingAssetId?: string | null
}) {
  const isImporting = asset != null && importingAssetId === asset.id
  const mediaContainerClass =
    displayVariant === "clean"
      ? "mx-auto mt-8 flex h-[172px] w-full items-center justify-center overflow-hidden"
      : "mx-auto mt-8 flex h-[136px] w-[136px] items-center justify-center overflow-hidden rounded-[14px] border border-black/10 bg-[#f3f4f7]"

  return (
    <article
      className={`relative rounded-[28px] bg-[#fcfcfc] p-5 ${
        selected ? "border-2 border-[#44474f]" : "border border-[#e6e7eb]"
      }`}
    >
      {badge ? (
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#151821] px-5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white">
          {badge}
        </div>
      ) : null}

      <div className={`${mediaContainerClass} relative`}>
        {asset ? (
          // eslint-disable-next-line @next/next/no-img-element -- auth API requires browser cookies; next/image server fetch causes 401
          <img
            src={logoDesignApi.getAssetUrl(runId, asset.id)}
            alt={title}
            className={`absolute inset-0 size-full object-contain ${displayVariant === "framed" ? "p-1.5" : ""}`}
          />
        ) : (
          <span className="px-3 text-center text-[11px] text-[#8b8f98]">Missing asset</span>
        )}
      </div>

      <div className="mt-8 flex items-end justify-between">
        <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[#22252d]">{title}</p>
        <p className={`text-[11px] ${selected ? "text-[#5f5be6]" : "text-[#9ca0a8]"}`}>{subtitle}</p>
      </div>

      {onImportToCanvas && (
        <button
          type="button"
          disabled={!asset || isImporting}
          onClick={() => asset && onImportToCanvas(asset)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-[#d8dbe3] bg-transparent px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5f5be6] transition-all duration-200 ease-out hover:-translate-y-px hover:border-[#5f5be6] hover:bg-[#f0f0ff] hover:shadow-[0_4px_12px_rgba(95,91,230,0.1)] disabled:pointer-events-none disabled:opacity-40"
        >
          {isImporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ArrowUpRight className="h-3.5 w-3.5" />
          )}
          Open in Canvas
        </button>
      )}
    </article>
  )
}

function PosterEditorialPreview({
  asset,
  runId,
  onImportToCanvas,
  importingAssetId,
}: {
  asset: LogoDesignAsset | null
  runId: string
  onImportToCanvas?: (asset: LogoDesignAsset) => void
  importingAssetId?: string | null
}) {
  const isImporting = asset != null && importingAssetId === asset.id

  return (
    <div className="mt-10 flex flex-1 flex-col">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#8b8e96]">Poster Composition</p>
          <p className="mt-1 text-[12px] text-[#6f7382]">Embedded artifact preview</p>
        </div>
        <div className="flex items-center gap-2">
          {onImportToCanvas && (
            <button
              type="button"
              disabled={!asset || isImporting}
              onClick={() => asset && onImportToCanvas(asset)}
              className="flex items-center gap-1.5 rounded-full border border-[#d8dbe3] bg-transparent px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5f5be6] transition-all duration-200 ease-out hover:-translate-y-px hover:border-[#5f5be6] hover:bg-[#f0f0ff] hover:shadow-[0_4px_12px_rgba(95,91,230,0.1)] disabled:pointer-events-none disabled:opacity-40"
            >
              {isImporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowUpRight className="h-3.5 w-3.5" />
              )}
              Open in Canvas
            </button>
          )}
          <div className="rounded-full border border-[#d8dbe3] bg-white/80 px-3 py-1 text-[11px] font-medium text-[#6f7382]">
            1 / 1
          </div>
        </div>
      </div>

      <div className="relative flex min-h-[320px] flex-1 items-center justify-center overflow-hidden rounded-[28px] border border-[#dfe2ea] bg-[linear-gradient(180deg,#f8f8f5_0%,#f0f2f6_100%)] p-4 shadow-[0_20px_45px_rgba(31,35,43,0.08)] md:min-h-[420px] md:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(95,91,230,0.12),_transparent_48%)]" />
        <div className="absolute inset-[14px] rounded-[22px] border border-white/70" />

        {asset ? (
          // eslint-disable-next-line @next/next/no-img-element -- auth API requires browser cookies; next/image server fetch causes 401
          <img
            src={logoDesignApi.getAssetUrl(runId, asset.id)}
            alt="Poster"
            className="relative z-10 size-full object-contain"
          />
        ) : (
          <div className="relative z-10 max-w-[260px] text-center">
            <p className="text-sm font-medium text-[#505664]">Poster asset is not available for this run.</p>
            <p className="mt-2 text-xs leading-5 text-[#868c98]">Once generated, the poster will appear here as the visual anchor for this concept.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function LogoArtifactsView({
  run,
  assets,
  loading,
  refreshing,
  onBack,
  onRefresh,
  onImportToCanvas,
  importingAssetId,
  importError,
}: LogoArtifactsViewProps) {
  if (loading && !run) {
    return (
      <main className="min-h-full bg-[#f5f5f4] px-5 py-6 md:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-[1180px] flex-col">
          <div className="mb-6">
            <Button type="button" variant="ghost" className="h-9 gap-2 px-3 text-[#4f5563]" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          <div className="flex flex-1 items-center justify-center">
            <div className="rounded-[20px] border border-black/10 bg-white px-8 py-7 text-center shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f3f8]">
                <Loader2 className="h-5 w-5 animate-spin text-[#5f5be6]" />
              </div>
              <p className="mt-4 text-sm font-medium text-[#2e3340]">Loading artifacts...</p>
              <p className="mt-1 text-xs text-[#8a90a0]">Preparing logo icons and poster preview</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!run) {
    return (
      <div className="p-6">
        <Button type="button" variant="ghost" className="mb-4 gap-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Back to Workspace
        </Button>
        <div className="rounded-sm border border-dashed border-black/20 bg-white px-4 py-8 text-sm text-[#7f838c]">
          No project selected. Choose a project from Workspace and open Artifacts view.
        </div>
      </div>
    )
  }

  const artifactSet = buildArtifactSet(assets)
  const metadata = buildArtifactMetadata(run)

  return (
    <main className="min-h-full bg-[#f5f5f4] px-5 py-6 md:px-8">
      <div className="mx-auto max-w-[1180px]">
        {importError ? (
          <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {importError}
          </div>
        ) : null}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" className="h-9 gap-2 px-3 text-[#4f5563]" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {loading ? (
              <span className="text-xs text-[#8f95a0]">Loading latest assets...</span>
            ) : (
              <span className="text-xs text-[#8f95a0]">Run ID: {run.id.slice(0, 8)}</span>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            className="h-9 gap-2 border border-[#d6d9e1] bg-white px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#5f5be6] hover:bg-[#f7f8ff]"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Concepts
          </Button>
        </div>

        <div className="mb-7">
          <p className="text-[50px] leading-none text-[#27282d]" style={{ fontFamily: "Georgia, Times, serif", fontStyle: "italic" }}>
            Generated Artifacts
          </p>
          <p className="mt-2 text-[13px] text-[#70737d]">
            Brief: &quot;{run.prompt.replace(/\s+/g, " ").trim()}&quot;
          </p>
        </div>

        <section className="grid gap-5 md:grid-cols-3">
          <ArtifactCard
            title="VARIANT ALPHA"
            subtitle="Full Mark"
            asset={artifactSet.full}
            runId={run.id}
            displayVariant="clean"
            onImportToCanvas={onImportToCanvas}
            importingAssetId={importingAssetId}
          />
          <ArtifactCard
            title={metadata.conceptName.toUpperCase()}
            subtitle="Primary Selection"
            badge="Primary Selection"
            selected
            asset={artifactSet.icon}
            runId={run.id}
            displayVariant="framed"
            onImportToCanvas={onImportToCanvas}
            importingAssetId={importingAssetId}
          />
          <ArtifactCard
            title="WORDMARK"
            subtitle="Brand Signature"
            asset={artifactSet.wordmark}
            runId={run.id}
            displayVariant="clean"
            onImportToCanvas={onImportToCanvas}
            importingAssetId={importingAssetId}
          />
        </section>

        <section className="mt-8 grid gap-0 overflow-hidden rounded-[30px] border border-[#e4e5e8] bg-[#fbfbfc] md:grid-cols-[1.15fr_0.85fr]">
          <div className="border-b border-[#eaebef] px-8 py-10 md:flex md:h-full md:flex-col md:border-b-0 md:border-r">
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[#5f5be6]">Editorial Perspective</p>
            <h2 className="mt-6 text-[52px] leading-[0.98] text-[#21242a]" style={{ fontFamily: "Georgia, Times, serif" }}>
              The Rationale
              <br />
              Behind{" "}
              <span className="italic text-[#5f5be6]">
                {metadata.conceptName}
                <span className="text-[#5f5be6]">.</span>
              </span>
            </h2>
            <p className="mt-8 whitespace-pre-wrap text-[22px] leading-[1.42] text-[#252831]" style={{ fontFamily: "Georgia, Times, serif" }}>
              {metadata.logoRationale}
            </p>

            <PosterEditorialPreview asset={artifactSet.poster} runId={run.id} onImportToCanvas={onImportToCanvas} importingAssetId={importingAssetId} />

            <p className="mt-6 whitespace-pre-wrap text-[18px] leading-[1.56] text-[#8a8e99]" style={{ fontFamily: "Georgia, Times, serif" }}>
              {metadata.posterRationale}
            </p>
          </div>

          <div className="px-8 py-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[#8b8e96]">Element Breakdown</p>

            <div className="mt-8">
              <h3 className="text-[30px] italic text-[#2e323a]" style={{ fontFamily: "Georgia, Times, serif" }}>
                Typography
              </h3>
              <div className="mt-4 rounded-[20px] bg-[#f0f3fb] p-5">
                <p className="text-[28px] font-semibold leading-none text-[#191b20]">{metadata.headingFont}</p>
                <p className="mt-2 text-[13px] font-semibold tracking-[0.08em] text-[#5f5be6]">{metadata.bodyFont.toUpperCase()}</p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-[30px] italic text-[#2e323a]" style={{ fontFamily: "Georgia, Times, serif" }}>
                Color Palette
              </h3>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 rounded-[16px] border border-[#e6e7ed] bg-white p-3">
                  <div className="h-11 w-11 rounded-[10px]" style={{ backgroundColor: metadata.primaryColor }} />
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#2b2e36]">Primary</p>
                    <p className="text-[11px] text-[#8a8e99]">{metadata.primaryColor}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-[16px] border border-[#e6e7ed] bg-white p-3">
                  <div className="h-11 w-11 rounded-[10px]" style={{ backgroundColor: metadata.secondaryColor }} />
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#2b2e36]">Secondary</p>
                    <p className="text-[11px] text-[#8a8e99]">{metadata.secondaryColor}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-[16px] border border-[#e6e7ed] bg-white p-3">
                  <div className="h-11 w-11 rounded-[10px]" style={{ backgroundColor: metadata.neutralColor }} />
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#2b2e36]">Neutral</p>
                    <p className="text-[11px] text-[#8a8e99]">{metadata.neutralColor}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-[30px] italic text-[#2e323a]" style={{ fontFamily: "Georgia, Times, serif" }}>
                Implementation
              </h3>
              <div className="mt-3 inline-flex rounded-full bg-[#f6eaec] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#cf647f]">
                App Preview Ready
              </div>
              <p className="mt-4 whitespace-pre-wrap text-[13px] leading-6 text-[#707682]">{metadata.philosophy}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
