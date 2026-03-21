import { eq, and, isNull } from "drizzle-orm"

import { db } from "@/server/core/database"
import { desktopItems } from "@/server/db/schema"
import type {
  CreateFileParams,
  FileItemType,
  UpdateFileContentBody,
  UpdateFileParams,
} from "@/shared/contracts/files"
import {
  normalizeDesktopItemName,
  normalizeDesktopItemParentId,
} from "@/shared/copilot/desktop-item-identity"

export type DesktopItemType = FileItemType
export type CreateItemInput = CreateFileParams & { userId: string }
export type UpdateItemInput = UpdateFileParams
export type UpdateFileContentInput = UpdateFileContentBody

type UpdateFileContentResult =
  | { ok: true; contentVersion: number }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "version_conflict"; expectedVersion?: number }

export class FilesService {
  /**
   * Get all desktop items for a user
   */
  async getItemsByUserId(userId: string) {
    return db.query.desktopItems.findMany({
      where: eq(desktopItems.userId, userId),
      orderBy: (items, { asc }) => [asc(items.createdAt)],
    })
  }

  /**
   * Get a single item by ID (with user ownership check)
   */
  async getItemById(id: string, userId: string) {
    return db.query.desktopItems.findFirst({
      where: and(eq(desktopItems.id, id), eq(desktopItems.userId, userId)),
    })
  }

  /**
   * Find an existing item by logical identity (name + type + parent)
   */
  async findItemByIdentity(input: {
    userId: string
    name: string
    itemType: DesktopItemType
    parentId?: string | null
  }) {
    const normalizedName = normalizeDesktopItemName(input.name)
    const normalizedParentId = normalizeDesktopItemParentId(input.parentId)

    const [item] = await db.query.desktopItems.findMany({
      where: and(
        eq(desktopItems.userId, input.userId),
        eq(desktopItems.name, normalizedName),
        eq(desktopItems.itemType, input.itemType),
        normalizedParentId === null
          ? isNull(desktopItems.parentId)
          : eq(desktopItems.parentId, normalizedParentId)
      ),
      orderBy: (items, { asc }) => [asc(items.createdAt)],
      limit: 1,
    })

    return item ?? null
  }

  /**
   * Create a new desktop item (file or folder)
   */
  async createItem(input: CreateItemInput) {
    const [item] = await db
      .insert(desktopItems)
      .values({
        userId: input.userId,
        name: input.name,
        itemType: input.itemType,
        parentId: input.parentId ?? null,
        x: input.x,
        y: input.y,
        content: input.content ?? null,
        fileSize: input.fileSize ?? null,
        mimeType: input.mimeType ?? null,
      })
      .returning()

    return item
  }

  /**
   * Update an existing item (rename, move position, move into folder)
   */
  async updateItem(id: string, userId: string, input: UpdateItemInput) {
    const [updated] = await db
      .update(desktopItems)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(eq(desktopItems.id, id), eq(desktopItems.userId, userId)))
      .returning()

    return updated
  }

  /**
   * Get file content from database
   */
  async getFileContent(
    id: string,
    userId: string
  ): Promise<{ content: string; contentVersion: number } | null> {
    const item = await this.getItemById(id, userId)
    if (!item) return null

    return {
      content: item.content ?? "",
      contentVersion: item.contentVersion,
    }
  }

  /**
   * Update file content in database
   */
  async updateFileContent(
    id: string,
    userId: string,
    input: UpdateFileContentInput
  ): Promise<UpdateFileContentResult> {
    const item = await this.getItemById(id, userId)
    if (!item) {
      return { ok: false, reason: "not_found" }
    }

    if (item.contentVersion !== input.contentVersion) {
      return {
        ok: false,
        reason: "version_conflict",
        expectedVersion: item.contentVersion,
      }
    }

    const encoder = new TextEncoder()
    const size = encoder.encode(input.content).byteLength

    const [updated] = await db
      .update(desktopItems)
      .set({
        content: input.content,
        fileSize: size,
        contentVersion: item.contentVersion + 1,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(desktopItems.id, id),
          eq(desktopItems.userId, userId),
          eq(desktopItems.contentVersion, input.contentVersion)
        )
      )
      .returning({ contentVersion: desktopItems.contentVersion })

    if (!updated) {
      const latest = await this.getItemById(id, userId)
      return {
        ok: false,
        reason: "version_conflict",
        expectedVersion: latest?.contentVersion,
      }
    }

    return { ok: true, contentVersion: updated.contentVersion }
  }

  /**
   * Delete an item
   * Also recursively deletes children if it's a folder
   */
  async deleteItem(id: string, userId: string): Promise<boolean> {
    const item = await this.getItemById(id, userId)
    if (!item) return false

    // If folder, recursively delete children
    if (item.itemType === "folder") {
      const children = await db.query.desktopItems.findMany({
        where: and(
          eq(desktopItems.parentId, id),
          eq(desktopItems.userId, userId)
        ),
      })

      for (const child of children) {
        await this.deleteItem(child.id, userId)
      }
    }

    // Delete from database
    await db
      .delete(desktopItems)
      .where(and(eq(desktopItems.id, id), eq(desktopItems.userId, userId)))

    return true
  }
}

export const filesService = new FilesService()
