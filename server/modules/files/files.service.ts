import { eq, and } from "drizzle-orm"

import type {
  CreateFileParams,
  FileItemType,
  UpdateFileParams,
} from "@/shared/contracts/files"
import { db } from "@/server/core/database"
import { desktopItems } from "@/server/db/schema"

export type DesktopItemType = FileItemType
export type CreateItemInput = CreateFileParams & { userId: string }
export type UpdateItemInput = UpdateFileParams

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
  async getFileContent(id: string, userId: string): Promise<string | null> {
    const item = await this.getItemById(id, userId)
    if (!item) return null

    return item.content ?? ""
  }

  /**
   * Update file content in database
   */
  async updateFileContent(id: string, userId: string, content: string): Promise<boolean> {
    const item = await this.getItemById(id, userId)
    if (!item) return false

    const encoder = new TextEncoder()
    const size = encoder.encode(content).byteLength

    await db
      .update(desktopItems)
      .set({ content, fileSize: size, updatedAt: new Date() })
      .where(and(eq(desktopItems.id, id), eq(desktopItems.userId, userId)))

    return true
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
