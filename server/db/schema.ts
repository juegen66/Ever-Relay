import { pgTable, text, timestamp, integer, uuid } from "drizzle-orm/pg-core"

// App-level table sample. Keep better-auth owned tables managed by better-auth migrations.
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

// Desktop items (files and folders) for cloud file system
export const desktopItems = pgTable("desktop_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  itemType: text("item_type").notNull(), // folder | text | image | code | spreadsheet | generic
  parentId: uuid("parent_id"), // null = root desktop, otherwise folder id
  x: integer("x").notNull().default(100),
  y: integer("y").notNull().default(100),
  content: text("content"), // file content stored directly in DB, null for folders
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})
