import { createStep } from "@mastra/inngest"
import { z } from "zod"

import { afs } from "@/server/afs"

const distillInputSchema = z.object({
  runId: z.string().uuid(),
  userId: z.string().min(1),
  workflowType: z.string().optional(),
  prompt: z.string().optional(),
  summary: z.string().optional(),
})

const distillOutputSchema = distillInputSchema.extend({
  memoriesWritten: z.number().int(),
})

export const distillMemoryStep = createStep({
  id: "distill_memory",
  description: "Distill workflow results into long-term AFS memory entries",
  inputSchema: distillInputSchema,
  outputSchema: distillOutputSchema,
  execute: async ({ inputData }) => {
    const { userId, runId, workflowType, prompt, summary } = inputData
    let memoriesWritten = 0

    const dateStr = new Date().toISOString().split("T")[0]
    const typeLabel = workflowType ?? "workflow"
    const slug = `${dateStr}-${typeLabel}-${runId.slice(0, 8)}`

    // Determine scope from workflow type
    const scopeMap: Record<string, string> = {
      "logo-design": "Logo",
      "app-build": "Canvas",
      "coding-agent": "VibeCoding",
    }
    const scope = scopeMap[typeLabel] ?? "Desktop"

    // Write episodic memory as a note under the appropriate scope
    const episodicContent = [
      `Workflow: ${typeLabel}`,
      `Run ID: ${runId}`,
      `Date: ${dateStr}`,
      prompt ? `Prompt: ${prompt}` : null,
      summary ? `Summary: ${summary}` : null,
    ]
      .filter(Boolean)
      .join("\n")

    try {
      await afs.write(userId, `Desktop/${scope === "Desktop" ? "" : scope + "/"}Memory/note/${slug}`, episodicContent, {
        tags: [typeLabel, "workflow-session"],
        confidence: 75,
        sourceType: "workflow_curator",
      })
      memoriesWritten++
    } catch {
      // Non-critical – continue
    }

    return {
      ...inputData,
      memoriesWritten,
    }
  },
})
