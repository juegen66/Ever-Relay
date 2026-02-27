import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { db } from "@/server/core/database"
import { userSandboxes } from "@/server/db/schema"

export type UserSandboxBinding = typeof userSandboxes.$inferSelect

function createSandboxId() {
  return `cloudos-${randomUUID()}`
}

export class SandboxBindingsService {
  async getByUserId(userId: string) {
    return db.query.userSandboxes.findFirst({
      where: eq(userSandboxes.userId, userId),
    })
  }

  async touch(userId: string) {
    const [updated] = await db
      .update(userSandboxes)
      .set({
        updatedAt: new Date(),
        lastUsedAt: new Date(),
      })
      .where(eq(userSandboxes.userId, userId))
      .returning()

    return updated
  }

  async getOrCreateByUserId(userId: string): Promise<UserSandboxBinding> {
    const existing = await this.getByUserId(userId)
    if (existing) {
      return (await this.touch(userId)) ?? existing
    }

    const [created] = await db
      .insert(userSandboxes)
      .values({
        userId,
        sandboxId: createSandboxId(),
        provider: "e2b",
      })
      .onConflictDoNothing()
      .returning()

    if (created) {
      return created
    }

    const latest = await this.getByUserId(userId)
    if (!latest) {
      throw new Error(`Failed to create sandbox binding for user ${userId}`)
    }

    return (await this.touch(userId)) ?? latest
  }
}

export const sandboxBindingsService = new SandboxBindingsService()
