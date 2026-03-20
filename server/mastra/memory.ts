import { Memory } from "@mastra/memory"
import { PostgresStore } from "@mastra/pg"
import { z } from "zod"
import { pool } from "@/server/core/database"

const ActiveProject = z.object({
  name: z.string(),
  status: z.string(),
  lastActivity: z.string(),
})

const BrandPreferences = z.object({
  colors: z.array(z.string()).optional(),
  style: z.string().optional(),
})

const Preferences = z.object({
  language: z.string().optional(),
  workStyle: z.string().optional(),
  toolPreferences: z.array(z.string()).optional(),
  brandPreferences: BrandPreferences.optional(),
})

const Connection = z.object({
  itemA: z.string(),
  itemB: z.string(),
  relation: z.string(),
})

const AgentState = z.object({
  // Identity
  userName: z.string().optional(),
  role: z.string().optional(),

  // Current work focus
  currentFocus: z.string().optional(),
  activeProjects: z.array(ActiveProject).optional(),
  pendingTasks: z.array(z.string()).optional(),

  // Long-term preferences
  preferences: Preferences.optional(),

  // Connection graph
  recentConnections: z.array(Connection).optional(),

  // AI observations
  observations: z.array(z.string()).optional(),
})

export const createAgentMemory = () =>
  new Memory({
    storage: new PostgresStore({
      id: "mastra-memory-storage",
      pool,
    }),
    options: {
      workingMemory: {
        enabled: true,
        schema: AgentState,
      },
    },
  })
