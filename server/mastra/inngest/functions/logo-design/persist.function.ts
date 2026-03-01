import { createStep } from "@mastra/inngest"
import { inngest } from "@/server/mastra/inngest/client"
import { LOGO_DESIGN_FAILED_EVENT } from "@/server/mastra/inngest/events"
import { renderSvgToPng } from "@/server/mastra/tools/render"
import { type LogoAssetType } from "@/server/db/schema"
import { logoDesignService } from "@/server/modules/logo-design/logo-design.service"
import {
  logoDesignPersistOutputSchema,
  logoDesignPosterOutputSchema,
} from "./schemas"
import { errorToMessage } from "./utils"

type PersistableAsset = {
  assetType: LogoAssetType
  contentText: string
  mimeType: string
  width?: number
  height?: number
  sizeBytes?: number
  metadata?: Record<string, unknown>
}

const REQUIRED_SVG_ASSET_TYPES: LogoAssetType[] = [
  "logo_svg_full",
  "logo_svg_icon",
  "logo_svg_wordmark",
  "poster_svg",
]

export const persistStep = createStep({
  id: "logo_persist",
  description: "Persist all logo design outputs to assets table",
  inputSchema: logoDesignPosterOutputSchema,
  outputSchema: logoDesignPersistOutputSchema,
  execute: async ({ inputData }) => {
    try {
      await logoDesignService.markStage(inputData.runId, "persisting")

      const existingAssets = await logoDesignService.listAssetsByRunId(inputData.runId)
      const existingTypes = new Set(existingAssets.map((asset) => asset.assetType))
      const assets: PersistableAsset[] = []

      const pushAsset = (asset: PersistableAsset) => {
        if (existingTypes.has(asset.assetType)) {
          return
        }
        assets.push(asset)
      }

      pushAsset({
        assetType: "logo_svg_full",
        contentText: inputData.brandOutput.logoSvg.full,
        mimeType: "image/svg+xml",
        metadata: {
          conceptName: inputData.brandOutput.conceptName,
          rationaleMd: inputData.brandOutput.rationaleMd,
        },
      })

      pushAsset({
        assetType: "logo_svg_icon",
        contentText: inputData.brandOutput.logoSvg.icon,
        mimeType: "image/svg+xml",
        metadata: {
          conceptName: inputData.brandOutput.conceptName,
          rationaleMd: inputData.brandOutput.rationaleMd,
        },
      })

      pushAsset({
        assetType: "logo_svg_wordmark",
        contentText: inputData.brandOutput.logoSvg.wordmark,
        mimeType: "image/svg+xml",
        metadata: {
          conceptName: inputData.brandOutput.conceptName,
          rationaleMd: inputData.brandOutput.rationaleMd,
        },
      })

      pushAsset({
        assetType: "poster_svg",
        contentText: inputData.posterOutput.posterSvg,
        mimeType: "image/svg+xml",
        metadata: {
          conceptName: inputData.brandOutput.conceptName,
          rationaleMd:
            inputData.posterOutput.rationaleMd ?? inputData.brandOutput.rationaleMd,
        },
      })

      if (!existingTypes.has("logo_png")) {
        const logoPng = await renderSvgToPng({
          svg: inputData.brandOutput.logoSvg.full,
          width: 1024,
          height: 1024,
        })

        if (logoPng.ok) {
          pushAsset({
            assetType: "logo_png",
            contentText: logoPng.pngDataUrl,
            mimeType: "image/png",
            width: logoPng.width,
            height: logoPng.height,
            sizeBytes: logoPng.sizeBytes,
            metadata: {
              conceptName: inputData.brandOutput.conceptName,
            },
          })
        }
      }

      if (!existingTypes.has("poster_png")) {
        const posterPng = await renderSvgToPng({
          svg: inputData.posterOutput.posterSvg,
          width: 1200,
          height: 1600,
        })

        if (posterPng.ok) {
          pushAsset({
            assetType: "poster_png",
            contentText: posterPng.pngDataUrl,
            mimeType: "image/png",
            width: posterPng.width,
            height: posterPng.height,
            sizeBytes: posterPng.sizeBytes,
            metadata: {
              conceptName: inputData.brandOutput.conceptName,
            },
          })
        }
      }

      if (typeof inputData.brandOutput.brandGuidelines === "string") {
        pushAsset({
          assetType: "brand_guidelines",
          contentText: inputData.brandOutput.brandGuidelines,
          mimeType: "text/markdown",
        })
      }

      if (typeof inputData.posterOutput.philosophyMd === "string") {
        pushAsset({
          assetType: "design_philosophy",
          contentText: inputData.posterOutput.philosophyMd,
          mimeType: "text/markdown",
        })
      }

      const finalTypes = new Set<LogoAssetType>([
        ...existingTypes,
        ...assets.map((asset) => asset.assetType),
      ])
      const missingRequiredAssets = REQUIRED_SVG_ASSET_TYPES.filter(
        (type) => !finalTypes.has(type)
      )

      if (missingRequiredAssets.length > 0) {
        throw new Error(
          `Missing required assets: ${missingRequiredAssets.join(", ")}`
        )
      }

      for (const asset of assets) {
        await logoDesignService.createAsset({
          runId: inputData.runId,
          userId: inputData.userId,
          assetType: asset.assetType,
          contentText: asset.contentText,
          mimeType: asset.mimeType,
          width: asset.width ?? null,
          height: asset.height ?? null,
          sizeBytes: asset.sizeBytes ?? null,
          metadata: asset.metadata ?? {},
        })
      }

      await logoDesignService.markCompleted(inputData.runId, {
        brand: inputData.brandOutput,
        poster: inputData.posterOutput,
      })

      return {
        runId: inputData.runId,
        userId: inputData.userId,
        prompt: inputData.prompt,
        planText: inputData.planText,
        planJson: inputData.planJson,
        brandOutput: inputData.brandOutput,
        posterOutput: inputData.posterOutput,
      }
    } catch (error) {
      const message = errorToMessage(error)
      await logoDesignService.markFailed(inputData.runId, message)
      await inngest.send({
        name: LOGO_DESIGN_FAILED_EVENT,
        data: { runId: inputData.runId, userId: inputData.userId, error: message },
      })
      throw error
    }
  },
})
