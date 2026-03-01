import { Memory } from "@mastra/memory"
import { PostgresStore } from "@mastra/pg"
import { z } from "zod"
import { pool } from "@/server/core/database"

const AgentState = z.object({
  userName: z.string().optional(),
  preferences: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

export const createAgentMemory = () =>
  new Memory({
    storage: new PostgresStore({
      id: "mastra-memory-storage",
      pool,
      disableInit: true,
    }),
    options: {
      workingMemory: {
        enabled: true,
        schema: AgentState,
      },
    },
  })
