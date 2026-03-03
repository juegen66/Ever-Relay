import { readFileSync } from "fs"
import { join } from "path"
import { Agent } from "@mastra/core/agent"
import { z } from "zod"
import model from "@/server/mastra/model"
import { createAgentMemory } from "@/server/mastra/memory"

export const BRAND_BRIEF_AGENT_ID = "brand_brief_agent"

const brandBriefSkillPath = join(process.cwd(), "skills/brand-brief/SKILL.md")
const brandBriefPrompt = readFileSync(brandBriefSkillPath, "utf-8").replace(
  /^---[\s\S]*?---\n/,
  ""
)

const brandBriefRequestContextSchema = z.object({
  userId: z.string().min(1),
  runId: z.string().optional(),
  projectId: z.string().nullable().optional(),
})

export const brandBriefAgent = new Agent({
  id: BRAND_BRIEF_AGENT_ID,
  name: "Brand Brief Designer",
  model: model.lzmodel4oMini,
  memory: createAgentMemory(),
  requestContextSchema: brandBriefRequestContextSchema,
  instructions: [
    "You are the brand brief agent for logo workflow step 1.",
    "You must output markdown only.",
    "Never output JSON, XML, SVG, markdown fences, or <think> tags.",
    "Create a concise but decision-complete logo brief for downstream concept generation.",
    "Follow the brand-brief skill guidance strictly:",
    brandBriefPrompt,
  ].join("\n\n"),
})
