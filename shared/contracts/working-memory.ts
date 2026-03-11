import { z } from "zod"

const activeProjectSchema = z.object({
  name: z.string(),
  status: z.string(),
  lastActivity: z.string(),
})

const brandPreferencesSchema = z.object({
  colors: z.array(z.string()).optional(),
  style: z.string().optional(),
})

const preferencesSchema = z.object({
  language: z.string().optional(),
  workStyle: z.string().optional(),
  toolPreferences: z.array(z.string()).optional(),
  brandPreferences: brandPreferencesSchema.optional(),
})

const connectionSchema = z.object({
  itemA: z.string(),
  itemB: z.string(),
  relation: z.string(),
})

export const workingMemorySchema = z.object({
  userName: z.string().optional(),
  role: z.string().optional(),
  currentFocus: z.string().optional(),
  activeProjects: z.array(activeProjectSchema).optional(),
  pendingTasks: z.array(z.string()).optional(),
  preferences: preferencesSchema.optional(),
  recentConnections: z.array(connectionSchema).optional(),
  observations: z.array(z.string()).optional(),
})

export type WorkingMemoryState = z.infer<typeof workingMemorySchema>
