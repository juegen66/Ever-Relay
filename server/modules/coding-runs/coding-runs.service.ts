import { and, desc, eq, inArray } from "drizzle-orm"

import { db } from "@/server/core/database"
import { workflowRuns } from "@/server/db/schema"
import { codingAppsService } from "@/server/modules/coding-apps/coding-apps.service"
import type { CodingReport } from "@/shared/contracts/coding-runs"

type CodingRunRecord = typeof workflowRuns.$inferSelect
type WorkflowRunStage = CodingRunRecord["stage"]
type WorkflowRunStatus = CodingRunRecord["status"]

interface CreateCodingRunInput {
  id: string
  userId: string
  appId: string
  report: CodingReport
}

interface UpdateCodingRunInput {
  stage?: WorkflowRunStage
  status?: WorkflowRunStatus
  planJson?: Record<string, unknown> | null
  resultJson?: Record<string, unknown> | null
  error?: string | null
}

const ACTIVE_STATUSES: WorkflowRunStatus[] = ["queued", "running"]

export class CodingRunsService {
  async createRun(input: CreateCodingRunInput) {
    const app = await codingAppsService.getAppByIdForUser(input.appId, input.userId)
    if (!app) {
      throw new Error(`Coding app not found: ${input.appId}`)
    }

    const [run] = await db
      .insert(workflowRuns)
      .values({
        id: input.id,
        userId: input.userId,
        projectId: input.appId,
        workflowType: "coding-agent",
        prompt: input.report.goal,
        stage: "queued",
        status: "running",
        planJson: {
          report: input.report,
        },
      })
      .returning()

    return run
  }

  async getRunById(id: string) {
    return db.query.workflowRuns.findFirst({
      where: and(eq(workflowRuns.id, id), eq(workflowRuns.workflowType, "coding-agent")),
    })
  }

  async getRunByIdForUser(id: string, userId: string) {
    return db.query.workflowRuns.findFirst({
      where: and(
        eq(workflowRuns.id, id),
        eq(workflowRuns.userId, userId),
        eq(workflowRuns.workflowType, "coding-agent")
      ),
    })
  }

  async listRecentRunsByUser(userId: string, limit = 20) {
    return db.query.workflowRuns.findMany({
      where: and(
        eq(workflowRuns.userId, userId),
        eq(workflowRuns.workflowType, "coding-agent")
      ),
      orderBy: [desc(workflowRuns.createdAt)],
      limit,
    })
  }

  async countActiveRunsByUser(userId: string) {
    const runs = await db.query.workflowRuns.findMany({
      where: and(
        eq(workflowRuns.userId, userId),
        eq(workflowRuns.workflowType, "coding-agent"),
        inArray(workflowRuns.status, ACTIVE_STATUSES)
      ),
      columns: {
        id: true,
      },
    })

    return runs.length
  }

  async updateRun(id: string, input: UpdateCodingRunInput) {
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
      .where(
        and(eq(workflowRuns.id, id), eq(workflowRuns.workflowType, "coding-agent"))
      )
      .returning()

    return updated
  }

  async markStage(id: string, stage: WorkflowRunStage) {
    return this.updateRun(id, {
      stage,
      status: stage === "failed" ? "failed" : "running",
    })
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
}

export const codingRunsService = new CodingRunsService()
