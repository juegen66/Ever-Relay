import { and, desc, eq, inArray } from "drizzle-orm"

import { db } from "@/server/core/database"
import { workflowRuns } from "@/server/db/schema"

export type WorkflowRunRecord = typeof workflowRuns.$inferSelect

type WorkflowRunStage = WorkflowRunRecord["stage"]
type WorkflowRunStatus = WorkflowRunRecord["status"]

interface CreateWorkflowRunInput {
  id: string
  userId: string
  prompt: string
  projectId?: string | null
}

interface UpdateWorkflowRunInput {
  stage?: WorkflowRunStage
  status?: WorkflowRunStatus
  planJson?: Record<string, unknown> | null
  resultJson?: Record<string, unknown> | null
  error?: string | null
}

const ACTIVE_STATUSES: WorkflowRunStatus[] = ["queued", "running"]

export class BuildsService {
  async createRun(input: CreateWorkflowRunInput) {
    const [run] = await db
      .insert(workflowRuns)
      .values({
        id: input.id,
        userId: input.userId,
        prompt: input.prompt,
        projectId: input.projectId ?? null,
        workflowType: "app-build",
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
        eq(workflowRuns.workflowType, "app-build")
      ),
    })
  }

  async listRecentRunsByUser(userId: string, limit = 20) {
    return db.query.workflowRuns.findMany({
      where: and(
        eq(workflowRuns.userId, userId),
        eq(workflowRuns.workflowType, "app-build")
      ),
      orderBy: [desc(workflowRuns.createdAt)],
      limit,
    })
  }

  async countActiveRunsByUser(userId: string) {
    const runs = await db.query.workflowRuns.findMany({
      where: and(
        eq(workflowRuns.userId, userId),
        eq(workflowRuns.workflowType, "app-build"),
        inArray(workflowRuns.status, ACTIVE_STATUSES)
      ),
      columns: {
        id: true,
      },
    })

    return runs.length
  }

  async updateRun(id: string, input: UpdateWorkflowRunInput) {
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

export const buildsService = new BuildsService()
