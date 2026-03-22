import { sql } from "drizzle-orm"
import {
  boolean,
  customType,
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
  contentVersion: integer("content_version").notNull().default(1),
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

export const WORKFLOW_RUN_STAGES = [
  "queued",
  "plan",
  "generate",
  "validate",
  "planning",
  "brand_designing",
  "poster_designing",
  "persisting",
  "complete",
  "failed",
] as const

export type WorkflowRunStage = (typeof WORKFLOW_RUN_STAGES)[number]

export const WORKFLOW_RUN_STATUSES = [
  "queued",
  "running",
  "completed",
  "failed",
] as const

export type WorkflowRunStatus = (typeof WORKFLOW_RUN_STATUSES)[number]

export const WORKFLOW_RUN_TYPES = ["app-build", "logo-design", "coding-agent"] as const
export type WorkflowRunType = (typeof WORKFLOW_RUN_TYPES)[number]

export const workflowRuns = pgTable(
  "workflow_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    projectId: text("project_id"),
    workflowType: text("workflow_type")
      .$type<WorkflowRunType>()
      .notNull()
      .default("app-build"),
    brandBrief: jsonb("brand_brief").$type<Record<string, unknown>>(),
    prompt: text("prompt").notNull(),
    stage: text("stage").$type<WorkflowRunStage>().notNull().default("queued"),
    status: text("status").$type<WorkflowRunStatus>().notNull().default("queued"),
    planJson: jsonb("plan_json").$type<Record<string, unknown>>(),
    resultJson: jsonb("result_json").$type<Record<string, unknown>>(),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userStatusIdx: index("workflow_runs_user_status_idx").on(table.userId, table.status),
    userCreatedIdx: index("workflow_runs_user_created_idx").on(table.userId, table.createdAt),
    workflowTypeIdx: index("workflow_runs_workflow_type_idx").on(table.workflowType),
  })
)

export const LOGO_ASSET_TYPES = [
  "logo_svg_full",
  "logo_svg_icon",
  "logo_svg_wordmark",
  "logo_png",
  "color_palette",
  "typography_spec",
  "brand_guidelines",
  "design_philosophy",
  "poster_svg",
  "poster_png",
] as const

export type LogoAssetType = (typeof LOGO_ASSET_TYPES)[number]

export const logoDesignAssets = pgTable(
  "logo_design_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => workflowRuns.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    assetType: text("asset_type").$type<LogoAssetType>().notNull(),

    contentText: text("content_text"),
    storageKey: text("storage_key"),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    width: integer("width"),
    height: integer("height"),

    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    runIdx: index("logo_design_assets_run_idx").on(table.runId),
    userCreatedIdx: index("logo_design_assets_user_created_idx").on(table.userId, table.createdAt),
  })
)

// Persistent one-to-one binding between a CloudOS user and an E2B sandbox ID.
export const userSandboxes = pgTable(
  "user_sandboxes",
  {
    userId: text("user_id").primaryKey(),
    sandboxId: text("sandbox_id").notNull(),
    provider: text("provider").notNull().default("e2b"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sandboxIdUniqueIdx: uniqueIndex("user_sandboxes_sandbox_id_unique_idx").on(table.sandboxId),
  })
)

// ---------------------------------------------------------------------------
// Agent activity + registry
// ---------------------------------------------------------------------------

export const agentRegistry = pgTable(
  "agent_registry",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: text("agent_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    offlineCapable: boolean("offline_capable").notNull().default(false),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    agentIdUniqueIdx: uniqueIndex("agent_registry_agent_id_unique_idx").on(table.agentId),
    offlineCapableIdx: index("agent_registry_offline_capable_idx").on(table.offlineCapable, table.updatedAt),
  })
)

export const agentActivity = pgTable(
  "agent_activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    agentId: text("agent_id")
      .notNull()
      .references(() => agentRegistry.agentId),
    activityType: text("activity_type").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    threadId: text("thread_id"),
    runId: text("run_id"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userCreatedIdx: index("agent_activity_user_created_idx").on(table.userId, table.createdAt),
    userAgentCreatedIdx: index("agent_activity_user_agent_created_idx").on(
      table.userId,
      table.agentId,
      table.createdAt
    ),
  })
)

// ---------------------------------------------------------------------------
// AFS v2 — Unified path-based file system
//
// Two tables: afs_memory (writable) + afs_history (append-only)
// Path protocol: Desktop/<scope>/<kind>/<bucket>/<subpath>/<name>
// ---------------------------------------------------------------------------

export const AFS_SCOPES = ["Desktop", "Canvas", "Logo", "VibeCoding"] as const
export type AfsScope = (typeof AFS_SCOPES)[number]

export const AFS_MEMORY_BUCKETS = ["user", "note"] as const
export type AfsMemoryBucket = (typeof AFS_MEMORY_BUCKETS)[number]

export const AFS_HISTORY_BUCKETS = ["actions", "sessions", "prediction-runs", "workflow-runs", "canvas-activity"] as const
export type AfsHistoryBucket = (typeof AFS_HISTORY_BUCKETS)[number]

export const AFS_SOURCE_TYPES = ["prediction_agent", "workflow_curator", "manual", "system"] as const
export type AfsSourceType = (typeof AFS_SOURCE_TYPES)[number]

export const AFS_INGEST_CHECKPOINT_STATUSES = ["idle", "running", "completed", "failed"] as const
export type AfsIngestCheckpointStatus = (typeof AFS_INGEST_CHECKPOINT_STATUSES)[number]

const vector = customType<{ data: number[]; driverData: string; config: { dimensions: number } }>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 1536})`
  },
  toDriver(value) {
    return `[${value.join(",")}]`
  },
  fromDriver(value) {
    if (typeof value !== "string") return value as number[]
    const trimmed = value.trim().replace(/^\[/, "").replace(/\]$/, "")
    if (!trimmed) return []
    return trimmed.split(",").map((part) => Number(part.trim()))
  },
})

export const afsMemory = pgTable(
  "afs_memory",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    scope: text("scope").$type<AfsScope>().notNull().default("Desktop"),
    bucket: text("bucket").$type<AfsMemoryBucket>().notNull().default("user"),
    path: text("path").notNull().default("/"),
    name: text("name").notNull(),
    content: text("content").notNull(),
    contentType: text("content_type"),
    tags: jsonb("tags").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    confidence: integer("confidence").notNull().default(80),
    sourceType: text("source_type").$type<AfsSourceType>().notNull().default("prediction_agent"),
    accessCount: integer("access_count").notNull().default(0),
    lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userScopeBucketIdx: index("afs_memory_user_scope_bucket_idx").on(table.userId, table.scope, table.bucket),
    userScopeBucketPathNameIdx: uniqueIndex("afs_memory_user_scope_bucket_path_name_idx").on(
      table.userId, table.scope, table.bucket, table.path, table.name
    ),
    userConfidenceIdx: index("afs_memory_user_confidence_idx").on(table.userId, table.confidence),
    deletedIdx: index("afs_memory_deleted_idx").on(table.deletedAt),
  })
)

export type AfsMemoryRow = typeof afsMemory.$inferSelect

export const afsHistory = pgTable(
  "afs_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    scope: text("scope").$type<AfsScope>().notNull().default("Desktop"),
    bucket: text("bucket").$type<AfsHistoryBucket>().notNull().default("actions"),
    path: text("path").notNull().default("/"),
    name: text("name").notNull(),
    actionType: text("action_type"),
    content: text("content").notNull(),
    status: text("status"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userScopeBucketCreatedIdx: index("afs_history_user_scope_bucket_created_idx").on(
      table.userId, table.scope, table.bucket, table.createdAt
    ),
    userActionTypeIdx: index("afs_history_user_action_type_idx").on(table.userId, table.actionType),
  })
)

export const afsMemoryEmbeddings = pgTable(
  "afs_memory_embeddings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memoryId: uuid("memory_id").notNull().references(() => afsMemory.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    model: text("model").notNull(),
    modelVersion: text("model_version").notNull(),
    contentHash: text("content_hash").notNull(),
    indexedAt: timestamp("indexed_at", { withTimezone: true }).defaultNow().notNull(),
    staleAt: timestamp("stale_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  },
  (table) => ({
    memoryIdIdx: uniqueIndex("afs_memory_embeddings_memory_id_idx").on(table.memoryId),
    userIdIdx: index("afs_memory_embeddings_user_id_idx").on(table.userId),
    staleIdx: index("afs_memory_embeddings_stale_idx").on(table.staleAt),
  })
)

export const afsIngestCheckpoints = pgTable(
  "afs_ingest_checkpoints",
  {
    userId: text("user_id").primaryKey(),
    lastIngestedAt: timestamp("last_ingested_at", { withTimezone: true }),
    lastHistoryCreatedAt: timestamp("last_history_created_at", { withTimezone: true }),
    lastHistoryId: uuid("last_history_id"),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    status: text("status").$type<AfsIngestCheckpointStatus>().notNull().default("idle"),
    error: text("error"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    statusUpdatedIdx: index("afs_ingest_checkpoints_status_updated_idx").on(table.status, table.updatedAt),
    lastRunIdx: index("afs_ingest_checkpoints_last_run_idx").on(table.lastRunAt),
  })
)



export const afsTransactionLogs = pgTable(
  "afs_transaction_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actor: text("actor").notNull(),
    operation: text("operation").notNull(),
    path: text("path").notNull(),
    detail: jsonb("detail").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    actorCreatedIdx: index("afs_tx_logs_actor_created_idx").on(table.actor, table.createdAt),
    pathIdx: index("afs_tx_logs_path_idx").on(table.path),
  })
)

// ---------------------------------------------------------------------------
// Copilot handoff records
// ---------------------------------------------------------------------------

export const handoffRecords = pgTable(
  "handoff_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    handoffId: text("handoff_id").notNull(),
    sourceAgentId: text("source_agent_id").notNull(),
    targetAgentId: text("target_agent_id").notNull(),
    threadId: text("thread_id").notNull(),
    reason: text("reason"),
    report: jsonb("report").$type<{
      task: string
      contextDigest: string
      done: string[]
      nextSteps: string[]
      constraints: string[]
      artifacts: string[]
      openQuestions: string[]
      riskNotes: string[]
    }>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userCreatedIdx: index("handoff_records_user_created_idx").on(table.userId, table.createdAt),
    threadCreatedIdx: index("handoff_records_thread_created_idx").on(table.threadId, table.createdAt),
  })
)

export const HANDOFF_CONTEXT_STATUSES = ["pending", "consumed"] as const
export type HandoffContextStatus = (typeof HANDOFF_CONTEXT_STATUSES)[number]

export type HandoffContextMetadata = {
  handoffId: string
  reason?: string | null
  task?: string
  done?: string[]
  nextSteps?: string[]
  constraints?: string[]
  artifacts?: string[]
  openQuestions?: string[]
  riskNotes?: string[]
}

/** Pending handoff document for Mastra input processor (per thread + target agent). */
export const handoffContext = pgTable(
  "handoff_context",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    threadId: text("thread_id").notNull(),
    sourceAgentId: text("source_agent_id").notNull(),
    targetAgentId: text("target_agent_id").notNull(),
    content: text("content").notNull(),
    status: text("status").$type<HandoffContextStatus>().notNull().default("pending"),
    metadata: jsonb("metadata").$type<HandoffContextMetadata>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
  },
  (table) => ({
    threadTargetStatusIdx: index("handoff_context_thread_target_status_idx").on(
      table.threadId,
      table.targetAgentId,
      table.status
    ),
    userThreadIdx: index("handoff_context_user_thread_idx").on(table.userId, table.threadId),
  })
)

// ---------------------------------------------------------------------------
// Coding apps
// ---------------------------------------------------------------------------

export const CODING_APP_STATUSES = ["active", "archived"] as const
export type CodingAppStatus = (typeof CODING_APP_STATUSES)[number]

export const codingApps = pgTable(
  "coding_apps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    sandboxId: text("sandbox_id").notNull(),
    threadId: text("thread_id").notNull(),
    status: text("status").$type<CodingAppStatus>().notNull().default("active"),
    lastOpenedAt: timestamp("last_opened_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userUpdatedIdx: index("coding_apps_user_updated_idx").on(table.userId, table.updatedAt),
    userStatusIdx: index("coding_apps_user_status_idx").on(table.userId, table.status),
    sandboxIdUniqueIdx: uniqueIndex("coding_apps_sandbox_id_unique_idx").on(table.sandboxId),
    threadIdUniqueIdx: uniqueIndex("coding_apps_thread_id_unique_idx").on(table.threadId),
  })
)

// ---------------------------------------------------------------------------
// AFS Skill — Dynamic skill storage for agents
//
// Each agent can have multiple skills. Skills are loaded in two phases:
// 1. Metadata (description, triggerWhen, tags) — injected into system message
// 2. Full content — loaded on demand when agent activates a skill
// ---------------------------------------------------------------------------

export const afsSkill = pgTable(
  "afs_skill",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    agentId: text("agent_id"), // nullable = global skill available to all agents
    scope: text("scope").$type<AfsScope>().notNull().default("Desktop"),
    name: text("name").notNull(),
    description: text("description").notNull(),
    triggerWhen: text("trigger_when"), // when should agent activate this skill
    tags: jsonb("tags").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    content: text("content").notNull(), // full skill instructions (markdown)
    version: integer("version").notNull().default(1),
    isActive: boolean("is_active").notNull().default(true),
    priority: integer("priority").notNull().default(0),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userAgentScopeNameIdx: uniqueIndex("afs_skill_user_agent_scope_name_idx").on(
      table.userId, table.agentId, table.scope, table.name
    ).where(sql`${table.agentId} is not null`),
    userScopeNameGlobalIdx: uniqueIndex("afs_skill_user_scope_name_global_idx").on(
      table.userId, table.scope, table.name
    ).where(sql`${table.agentId} is null`),
    userScopeActiveIdx: index("afs_skill_user_scope_active_idx").on(
      table.userId, table.scope, table.isActive
    ),
    agentActiveIdx: index("afs_skill_agent_active_idx").on(
      table.agentId, table.isActive
    ),
  })
)

export type AfsSkillRow = typeof afsSkill.$inferSelect

export const AFS_SKILL_REFERENCE_CONTENT_FORMATS = [
  "markdown",
  "text",
  "json",
] as const

export type AfsSkillReferenceContentFormat =
  (typeof AFS_SKILL_REFERENCE_CONTENT_FORMATS)[number]

export const afsSkillReference = pgTable(
  "afs_skill_reference",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    skillId: uuid("skill_id").notNull().references(() => afsSkill.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    content: text("content").notNull(),
    contentFormat: text("content_format")
      .$type<AfsSkillReferenceContentFormat>()
      .notNull()
      .default("markdown"),
    loadWhen: text("load_when"),
    priority: integer("priority").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    skillNameIdx: uniqueIndex("afs_skill_reference_skill_name_idx").on(
      table.skillId, table.name
    ),
    userSkillActiveIdx: index("afs_skill_reference_user_skill_active_idx").on(
      table.userId, table.skillId, table.isActive, table.priority
    ),
  })
)

export type AfsSkillReferenceRow = typeof afsSkillReference.$inferSelect
