import { sql } from "drizzle-orm"
import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

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

export const CANVAS_PROJECT_STATUSES = ["draft", "published", "archived"] as const
export type CanvasProjectStatus = (typeof CANVAS_PROJECT_STATUSES)[number]

export const CANVAS_VISIBILITIES = ["private", "unlisted"] as const
export type CanvasVisibility = (typeof CANVAS_VISIBILITIES)[number]

export const canvasProjects = pgTable(
  "canvas_projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").$type<CanvasProjectStatus>().notNull().default("draft"),
    visibility: text("visibility").$type<CanvasVisibility>().notNull().default("private"),
    canvasWidth: integer("canvas_width").notNull().default(1200),
    canvasHeight: integer("canvas_height").notNull().default(800),
    thumbnailUrl: text("thumbnail_url"),
    contentJson: jsonb("content_json").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    contentVersion: integer("content_version").notNull().default(1),
    lastOpenedAt: timestamp("last_opened_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userUpdatedIdx: index("canvas_projects_user_updated_idx").on(table.userId, table.updatedAt),
    userStatusUpdatedIdx: index("canvas_projects_user_status_updated_idx").on(table.userId, table.status, table.updatedAt),
    userDeletedIdx: index("canvas_projects_user_deleted_idx").on(table.userId, table.deletedAt),
  })
)

export const canvasTags = pgTable(
  "canvas_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    color: text("color"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userNameUniqueIdx: uniqueIndex("canvas_tags_user_name_unique_idx").on(table.userId, table.name),
  })
)

export const canvasProjectTags = pgTable(
  "canvas_project_tags",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => canvasProjects.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => canvasTags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.projectId, table.tagId], name: "canvas_project_tags_pk" }),
    tagIdx: index("canvas_project_tags_tag_idx").on(table.tagId),
  })
)

export const canvasProjectAssets = pgTable(
  "canvas_project_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => canvasProjects.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    assetType: text("asset_type").notNull(),
    storageProvider: text("storage_provider").notNull().default("db"),
    storageKey: text("storage_key"),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    width: integer("width"),
    height: integer("height"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectCreatedIdx: index("canvas_project_assets_project_created_idx").on(table.projectId, table.createdAt),
    userCreatedIdx: index("canvas_project_assets_user_created_idx").on(table.userId, table.createdAt),
  })
)

export const canvasProjectActivityLogs = pgTable(
  "canvas_project_activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => canvasProjects.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectCreatedIdx: index("canvas_project_activity_logs_project_created_idx").on(table.projectId, table.createdAt),
  })
)
