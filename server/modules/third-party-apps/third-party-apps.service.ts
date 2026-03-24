import { and, desc, eq } from "drizzle-orm"

import { db } from "@/server/core/database"
import { thirdPartyAppConfig } from "@/server/db/schema"

type ThirdPartyAppConfigRecord = typeof thirdPartyAppConfig.$inferSelect

function deriveAllowedOrigins(websiteUrl: string | null | undefined) {
  if (!websiteUrl) return []
  return [new URL(websiteUrl).origin]
}

export class ThirdPartyAppsService {
  async listAppsByUser(userId: string) {
    return db.query.thirdPartyAppConfig.findMany({
      where: and(eq(thirdPartyAppConfig.userId, userId), eq(thirdPartyAppConfig.isActive, true)),
      orderBy: [desc(thirdPartyAppConfig.updatedAt)],
    })
  }

  async getAppBySlugForUser(
    userId: string,
    appSlug: string,
    options?: { includeInactive?: boolean }
  ) {
    const whereClause = options?.includeInactive
      ? and(eq(thirdPartyAppConfig.userId, userId), eq(thirdPartyAppConfig.appSlug, appSlug))
      : and(
          eq(thirdPartyAppConfig.userId, userId),
          eq(thirdPartyAppConfig.appSlug, appSlug),
          eq(thirdPartyAppConfig.isActive, true)
        )

    return db.query.thirdPartyAppConfig.findFirst({
      where: whereClause,
    })
  }

  async createApp(input: {
    userId: string
    appSlug: string
    displayName: string
  }): Promise<ThirdPartyAppConfigRecord> {
    const appSlug = input.appSlug.trim()
    const displayName = input.displayName.trim()
    const existing = await this.getAppBySlugForUser(input.userId, appSlug, {
      includeInactive: true,
    })

    if (existing?.isActive) {
      throw new Error("A third-party app with this slug already exists")
    }

    if (existing && !existing.isActive) {
      const [reactivated] = await db
        .update(thirdPartyAppConfig)
        .set({
          displayName,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(
          and(eq(thirdPartyAppConfig.userId, input.userId), eq(thirdPartyAppConfig.appSlug, appSlug))
        )
        .returning()

      if (reactivated) {
        return reactivated
      }
    }

    const [app] = await db
      .insert(thirdPartyAppConfig)
      .values({
        userId: input.userId,
        appSlug,
        displayName,
        websiteUrl: null,
        allowedOrigins: [],
        isActive: true,
      })
      .onConflictDoNothing()
      .returning()

    if (app) {
      return app
    }

    throw new Error("Failed to create third-party app")
  }

  async updateApp(input: {
    userId: string
    appSlug: string
    displayName?: string
    websiteUrl?: string
    metadata?: Record<string, unknown>
  }): Promise<ThirdPartyAppConfigRecord | null> {
    const existing = await this.getAppBySlugForUser(input.userId, input.appSlug)
    if (!existing) {
      return null
    }

    const nextWebsiteUrl = input.websiteUrl?.trim() ?? existing.websiteUrl
    const [app] = await db
      .update(thirdPartyAppConfig)
      .set({
        displayName: input.displayName?.trim() ?? existing.displayName,
        websiteUrl: nextWebsiteUrl,
        allowedOrigins: deriveAllowedOrigins(nextWebsiteUrl),
        metadata: input.metadata ?? existing.metadata,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(thirdPartyAppConfig.userId, input.userId),
          eq(thirdPartyAppConfig.appSlug, input.appSlug)
        )
      )
      .returning()

    return app ?? null
  }

  async deactivateApp(userId: string, appSlug: string) {
    const [app] = await db
      .update(thirdPartyAppConfig)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(thirdPartyAppConfig.userId, userId),
          eq(thirdPartyAppConfig.appSlug, appSlug)
        )
      )
      .returning()

    return app ?? null
  }
}

export const thirdPartyAppsService = new ThirdPartyAppsService()
