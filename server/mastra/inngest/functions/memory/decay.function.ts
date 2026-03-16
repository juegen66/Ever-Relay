import { inngest } from "@/server/mastra/inngest/client"
import { afsService } from "@/server/modules/afs/afs.service"

export const AFS_MEMORY_DECAY_EVENT = "afs.memory.decay" as const

export const afsMemoryDecayFunction = inngest.createFunction(
  {
    id: "afs-memory-decay",
    name: "AFS Memory Confidence Decay & Cleanup",
  },
  [
    { cron: "0 3 * * *" }, // daily at 3 AM
    { event: AFS_MEMORY_DECAY_EVENT },
  ],
  async () => {
    // 1. Decay confidence for entries not accessed in 30 days
    await afsService.decayConfidence(30, 10, 20)

    // 2. Clean up expired entries
    await afsService.cleanupExpired()

    return { ok: true, ranAt: new Date().toISOString() }
  }
)
