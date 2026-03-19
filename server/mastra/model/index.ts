import { createOpenAI } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"

// const claude = createClaude({
//   apiKey: process.env.CLAUDE_API_KEY ?? "",
//   baseURL: process.env.CLAUDE_BASE_URL ?? "https://api.anthropic.com/v1",
// })


const perplexityProvider = createOpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY ?? "",
  baseURL: process.env.PERPLEXITY_BASE_URL ?? "https://api.perplexity.ai",
})

const perplexity = perplexityProvider("sonar")

const lzmodel = createOpenAI({
  apiKey: process.env.API_KEY ?? "",
  baseURL: process.env.BASE_URL ?? "https://api.laozhang.ai/v1",
})

const tuzimodel = createOpenAI({
  apiKey: process.env.TUZI_API_KEY ?? "",
  baseURL: process.env.TUZI_BASE_URL ?? "https://api.tu-zi.com/v1",
})

const lzmodel4oMini = lzmodel.chat("gemini-3-flash-preview")
const tuzimodel4oMini = tuzimodel.chat("gpt-4o-mini")

const model = {
  lzmodel4oMini,
  tuzimodel4oMini,
  perplexity,
}

export default model
