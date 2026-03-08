import { Agent } from "@mastra/core/agent"
import model from "@/server/mastra/model"

export const CONTEXT_COMPRESSION_AGENT_ID = "context_compression_agent"

function buildCompressionPrompt(rawText: string, maxChars: number) {
  return [
    "You are a context compression agent for agent handoff.",
    "Your task: summarize the chat transcript below into a concise digest for the receiving agent.",
    "Preserve: user intent, key decisions, completed steps, open questions, and artifacts mentioned.",
    "Output plain text only. No JSON, no code fences, no markdown formatting.",
    `Target length: at most ${maxChars} characters.`,
    "",
    "--- Chat transcript ---",
    rawText,
    "--- End transcript ---",
    "",
    "Provide a concise summary:",
  ].join("\n")
}

export const contextCompressionAgent = new Agent({
  id: CONTEXT_COMPRESSION_AGENT_ID,
  name: "Context Compression",
  model: model.lzmodel4oMini,
  instructions: [
    "You summarize chat context for agent handoff.",
    "Output plain text only. No JSON, XML, code fences, or <think> tags.",
    "Preserve user intent, key decisions, done items, next steps, and open questions.",
    "Keep the summary concise and actionable for the receiving agent.",
  ].join("\n"),
})

export async function compressContext(
  rawText: string,
  maxChars: number
): Promise<string> {
  const prompt = buildCompressionPrompt(rawText, maxChars)
  const output = await contextCompressionAgent.generate(prompt, {
    toolChoice: "none",
  })
  const text = (output.text ?? "").trim()
  return text || ""
}
