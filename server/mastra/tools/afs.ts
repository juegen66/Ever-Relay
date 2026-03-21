import { createTool } from "@mastra/core/tools"
import { z } from "zod"

import { isAfsMemoryPathPrefix } from "@/shared/contracts/afs"
import { afs } from "@/server/afs"
import { requestContextSchema } from "./common"

const NAMESPACE_TREE = afs.getNamespaceTree()

export const afsListTool = createTool({
  id: "afs_list",
  description:
    "List nodes in the AFS (Agentic File System). Desktop is the root directory.\n" +
    "Path protocol: Desktop/<scope>/Memory|History/<bucket>/<subpath>/<name>\n" +
    "Scopes: Canvas, Logo, VibeCoding (sub-apps), or Desktop-level (global)\n" +
    "Memory buckets: user, note | History buckets: actions, sessions, prediction-runs, workflow-runs, canvas-activity\n" +
    "Skill has no buckets — list directly: Desktop/Skill, Desktop/Canvas/Skill\n\n" +
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
    "Write a memory or skill entry to AFS. Memory and Skill paths are writable.\n" +
    "Path: Desktop/<scope>/Memory/<bucket>/<name> or Desktop/<scope>/Skill/<name>\n" +
    "Buckets: user (preferences, facts), note (observations, episodic summaries)\n" +
    "Existing entries at the same path are merged (deduplication).\n" +
    "Skill write takes description via metadata: pass metadata.description.\n" +
    "Example: Desktop/Memory/user/prefers-morning-design, Desktop/Logo/Memory/note/brand-color-preference, Desktop/Canvas/Skill/poster-layout",
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
    "Search across AFS in exact, semantic, or hybrid mode.\n" +
    "Use mode=exact for fast literal keyword search across Memory, History, and Skill.\n" +
    "Use mode=semantic only for Memory when you need conceptual similarity, and always constrain it with pathPrefix.\n" +
    "Use mode=hybrid for memory recall tasks: it combines exact keyword matches with semantic memory retrieval, then appends semantic-only matches after exact hits.\n" +
    "Semantic and hybrid modes require pathPrefix to point to a Memory subtree, e.g. Desktop/Canvas/Memory/note.\n" +
    "Use scope/pathPrefix to limit the search space: Desktop/Canvas/Memory/note searches only that subtree.",
  inputSchema: z.object({
    query: z.string().describe("Keyword to search for"),
    mode: z.enum(["exact", "semantic", "hybrid"]).default("exact").describe("Search mode"),
    scope: z.string().optional().describe("Optional scope path, e.g. Desktop/Canvas"),
    pathPrefix: z.string().optional().describe("Optional subtree path. Required for semantic and hybrid modes, e.g. Desktop/Canvas/Memory/note"),
    limit: z.number().int().min(1).max(100).optional().describe("Max results, default 20"),
  }).superRefine((value, ctx) => {
    if (value.mode === "semantic" || value.mode === "hybrid") {
      if (!value.pathPrefix) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pathPrefix"],
          message: "pathPrefix is required when mode is semantic or hybrid",
        })
        return
      }

      if (!isAfsMemoryPathPrefix(value.pathPrefix)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pathPrefix"],
          message: "pathPrefix must point to a Memory subtree when mode is semantic or hybrid",
        })
      }
    }
  }),
  requestContextSchema,
  execute: async ({ query, mode, scope, pathPrefix, limit }, context) => {
    const userId = context.requestContext?.get("userId") as string | undefined
    if (!userId) return { ok: false, error: "Missing authenticated user context" }

    const results = await afs.search(userId, query, {
      mode,
      scope,
      pathPrefix,
      limit: limit ?? 20,
    })
    return { ok: true, count: results.length, results }
  },
})

export const afsDeleteTool = createTool({
  id: "afs_delete",
  description:
    "Soft-delete a memory or skill node. Memory and Skill paths can be deleted.",
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
