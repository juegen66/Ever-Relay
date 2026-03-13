import { randomUUID } from "node:crypto"

import { and, desc, eq } from "drizzle-orm"

import { db } from "@/server/core/database"
import { codingApps } from "@/server/db/schema"

type CodingAppRecord = typeof codingApps.$inferSelect

interface CreateCodingAppInput {
  userId: string
  name: string
  description?: string | null
}

function createSandboxId() {
  return `cloudos-coding-app-${randomUUID()}`
}

function createThreadId() {
  return randomUUID()
}

export class CodingAppsService {
  async createApp(input: CreateCodingAppInput) {
    const [app] = await db
      .insert(codingApps)
      .values({
        userId: input.userId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        sandboxId: createSandboxId(),
        threadId: createThreadId(),
        status: "active",
        lastOpenedAt: new Date(),
      })
      .returning()

    return app
  }

  async listAppsByUser(userId: string) {
    return db.query.codingApps.findMany({
      where: and(eq(codingApps.userId, userId), eq(codingApps.status, "active")),
      orderBy: [desc(codingApps.updatedAt)],
    })
  }

  async getAppByIdForUser(id: string, userId: string) {
    return db.query.codingApps.findFirst({
      where: and(eq(codingApps.id, id), eq(codingApps.userId, userId)),
    })
  }

  async markOpened(id: string, userId: string): Promise<CodingAppRecord | null> {
    const [app] = await db
      .update(codingApps)
      .set({
        lastOpenedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(codingApps.id, id), eq(codingApps.userId, userId)))
      .returning()

    return app ?? null
  }
}

export const codingAppsService = new CodingAppsService()
