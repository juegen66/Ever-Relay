import { createTool } from "@mastra/core/tools"
import { z } from "zod"

import { afs } from "@/server/afs"
import { requestContextSchema } from "./common"

const NAMESPACE_TREE = afs.getNamespaceTree()

export const afsListTool = createTool({
  id: "afs_list",
  description:
    "List nodes in the AFS (Agentic File System). Desktop is the root directory.\n" +
    "Path protocol: Desktop/<scope>/Memory|History/<bucket>/<subpath>/<name>\n" +
    "Scopes: Canvas, Logo, VibeCoding (sub-apps), or Desktop-level (global)\n" +
    "Memory buckets: user, note | History buckets: actions, sessions, prediction-runs, workflow-runs, canvas-activity\n\n" +
    "Namespace:\n" + NAMESPACE_TREE + "\n\n" +
    "Pass 'Desktop/' to see top-level. Pass 'Desktop/Canvas/Memory/user' to list Canvas user memories.",
  inputSchema: z.object({
    path: z.string().describe("Directory path, e.g. Desktop/, Desktop/Canvas/Memory/user"),
    limit: z.number().int().min(1).max(200).optional().describe("Max entries to return"),
  }),
  requestContextSchema,
  execute: async ({ path, limit }, context) => {
    const userId = context.requestContext?.get("userId") as string | undefined
    if (!userId) return { ok: false, error: "Missing authenticated user context" }

    const nodes = await afs.list(userId, path, { limit: limit ?? 50 })
    return { ok: true, path, count: nodes.length, nodes }
  },
})

export const afsReadTool = createTool({
  id: "afs_read",
  description:
    "Read a single file node from AFS by its full path. Returns content + metadata.\n" +
    "Example: Desktop/Canvas/Memory/user/profile",
  inputSchema: z.object({
    path: z.string().describe("Full path, e.g. Desktop/Memory/user/morning-design-preference"),
  }),
  requestContextSchema,
  execute: async ({ path }, context) => {
    const userId = context.requestContext?.get("userId") as string | undefined
    if (!userId) return { ok: false, error: "Missing authenticated user context" }

    const node = await afs.read(userId, path)
    if (!node) return { ok: false, error: `Node not found: ${path}` }
    return { ok: true, node }
  },
})

export const afsWriteTool = createTool({
  id: "afs_write",
  description:
    "Write a memory entry to AFS. Only Memory paths are writable.\n" +
    "Path: Desktop/<scope>/Memory/<bucket>/<name>\n" +
    "Buckets: user (preferences, facts), note (observations, episodic summaries)\n" +
    "Existing entries at the same path are merged (deduplication).\n" +
    "Example: Desktop/Memory/user/prefers-morning-design, Desktop/Logo/Memory/note/brand-color-preference",
  inputSchema: z.object({
    path: z.string().describe("Target path, e.g. Desktop/Memory/user/prefers-morning-design"),
    content: z.string().describe("Memory content text"),
    tags: z.array(z.string()).optional().describe("Optional tags for retrieval"),
    confidence: z.number().int().min(0).max(100).optional().describe("Confidence 0-100, default 80"),
  }),
  requestContextSchema,
  execute: async ({ path, content, tags, confidence }, context) => {
    const userId = context.requestContext?.get("userId") as string | undefined
    if (!userId) return { ok: false, error: "Missing authenticated user context" }

    try {
      const node = await afs.write(userId, path, content, {
        tags,
        confidence,
        sourceType: "prediction_agent",
      })
      return { ok: true, node }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Failed to write" }
    }
  },
})

export const afsSearchTool = createTool({
  id: "afs_search",
  description:
    "Search across AFS by keyword. Searches all scopes or a specific scope.\n" +
    "Use scope to limit: Desktop/Canvas searches only Canvas scope.",
  inputSchema: z.object({
    query: z.string().describe("Keyword to search for"),
    scope: z.string().optional().describe("Optional scope path, e.g. Desktop/Canvas"),
    limit: z.number().int().min(1).max(100).optional().describe("Max results, default 20"),
  }),
  requestContextSchema,
  execute: async ({ query, scope, limit }, context) => {
    const userId = context.requestContext?.get("userId") as string | undefined
    if (!userId) return { ok: false, error: "Missing authenticated user context" }

    const results = await afs.search(userId, query, { scope, limit: limit ?? 20 })
    return { ok: true, count: results.length, results }
  },
})

export const afsDeleteTool = createTool({
  id: "afs_delete",
  description:
    "Soft-delete a memory node. Only Memory paths can be deleted.",
  inputSchema: z.object({
    path: z.string().describe("Full path of the memory node to delete"),
  }),
  requestContextSchema,
  execute: async ({ path }, context) => {
    const userId = context.requestContext?.get("userId") as string | undefined
    if (!userId) return { ok: false, error: "Missing authenticated user context" }

    try {
      const deleted = await afs.delete(userId, path)
      if (!deleted) return { ok: false, error: `Node not found: ${path}` }
      return { ok: true, deleted: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Failed to delete" }
    }
  },
})
