import { and, desc, eq, inArray } from "drizzle-orm"
import { db } from "@/server/core/database"
import {
  logoDesignAssets,
  workflowRuns,
  type LogoAssetType,
  type WorkflowRunStage,
  type WorkflowRunStatus,
} from "@/server/db/schema"

export type LogoDesignRunRecord = typeof workflowRuns.$inferSelect
export type LogoDesignAssetRecord = typeof logoDesignAssets.$inferSelect

interface CreateLogoDesignRunInput {
  id: string
  userId: string
  prompt: string
  brandBrief?: Record<string, unknown> | null
}

interface UpdateLogoDesignRunInput {
  stage?: WorkflowRunStage
  status?: WorkflowRunStatus
  planJson?: Record<string, unknown> | null
  resultJson?: Record<string, unknown> | null
  error?: string | null
}

interface CreateLogoAssetInput {
  runId: string
  userId: string
  assetType: LogoAssetType
  contentText?: string | null
  storageKey?: string | null
  mimeType?: string | null
  sizeBytes?: number | null
  width?: number | null
  height?: number | null
  metadata?: Record<string, unknown>
}

export class LogoDesignService {
  async createRun(input: CreateLogoDesignRunInput) {
    const [run] = await db
      .insert(workflowRuns)
      .values({
        id: input.id,
        userId: input.userId,
        prompt: input.prompt,
        workflowType: "logo-design",
        brandBrief: input.brandBrief ?? null,
        stage: "queued",
        status: "running",
      })
      .returning()

    return run
  }

  async getRunById(id: string) {
    return db.query.workflowRuns.findFirst({
      where: eq(workflowRuns.id, id),
    })
  }

  async getRunByIdForUser(id: string, userId: string) {
    return db.query.workflowRuns.findFirst({
      where: and(
        eq(workflowRuns.id, id),
        eq(workflowRuns.userId, userId),
        eq(workflowRuns.workflowType, "logo-design")
      ),
    })
  }

  async countActiveLogoDesignRunsByUser(userId: string) {
    const runs = await db
      .select({ id: workflowRuns.id })
      .from(workflowRuns)
      .where(
        and(
          eq(workflowRuns.userId, userId),
          eq(workflowRuns.workflowType, "logo-design"),
          inArray(workflowRuns.status, ["queued", "running"])
        )
      )
    return runs.length
  }

  async listLogoDesignRunsByUser(userId: string, limit = 20) {
    return db.query.workflowRuns.findMany({
      where: and(
        eq(workflowRuns.userId, userId),
        eq(workflowRuns.workflowType, "logo-design")
      ),
      orderBy: [desc(workflowRuns.createdAt)],
      limit,
    })
  }

  async markStage(id: string, stage: WorkflowRunStage) {
    return this.updateRun(id, {
      stage,
      status: stage === "failed" ? "failed" : "running",
    })
  }

  async updateRun(id: string, input: UpdateLogoDesignRunInput) {
    const [updated] = await db
      .update(workflowRuns)
      .set({
        ...(input.stage !== undefined ? { stage: input.stage } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.planJson !== undefined ? { planJson: input.planJson } : {}),
        ...(input.resultJson !== undefined ? { resultJson: input.resultJson } : {}),
        ...(input.error !== undefined ? { error: input.error } : {}),
        updatedAt: new Date(),
      })
      .where(eq(workflowRuns.id, id))
      .returning()

    return updated
  }

  async markCompleted(id: string, resultJson?: Record<string, unknown>) {
    return this.updateRun(id, {
      stage: "complete",
      status: "completed",
      resultJson: resultJson ?? null,
      error: null,
    })
  }

  async markFailed(id: string, error: string) {
    return this.updateRun(id, {
      stage: "failed",
      status: "failed",
      error,
    })
  }

  async createAsset(input: CreateLogoAssetInput) {
    const [asset] = await db
      .insert(logoDesignAssets)
      .values({
        runId: input.runId,
        userId: input.userId,
        assetType: input.assetType,
        contentText: input.contentText ?? null,
        storageKey: input.storageKey ?? null,
        mimeType: input.mimeType ?? null,
        sizeBytes: input.sizeBytes ?? null,
        width: input.width ?? null,
        height: input.height ?? null,
        metadata: input.metadata ?? {},
      })
      .returning()

    return asset
  }

  async listAssetsByRunId(runId: string) {
    return db
      .select()
      .from(logoDesignAssets)
      .where(eq(logoDesignAssets.runId, runId))
      .orderBy(desc(logoDesignAssets.createdAt))
  }
}

export const logoDesignService = new LogoDesignService()
