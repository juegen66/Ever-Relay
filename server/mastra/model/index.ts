import { createAnthropic } from "@ai-sdk/anthropic"
import { createOpenAI } from "@ai-sdk/openai"


// const claude = createClaude({
//   apiKey: process.env.CLAUDE_API_KEY ?? "",
//   baseURL: process.env.CLAUDE_BASE_URL ?? "https://api.anthropic.com/v1",
// })


const perplexityProvider = createOpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY ?? "",
  baseURL: process.env.PERPLEXITY_BASE_URL ?? "https://api.perplexity.ai",
})

const perplexity = perplexityProvider("sonar")

const anthropicProvider = createAnthropic({
  apiKey: "sk-dummy",
  baseURL: "http://localhost:8317/v1",
  headers: {
    "anthropic-version": "2023-06-01",
  },
})



const lzmodel = createOpenAI({
  apiKey: process.env.API_KEY ?? "",
  baseURL: process.env.BASE_URL ?? "https://api.laozhang.ai/v1",
})

const tuzimodel = createOpenAI({
  apiKey: process.env.TUZI_API_KEY ?? "",
  baseURL: process.env.TUZI_BASE_URL ?? "https://api.tu-zi.com/v1",
})

const lzmodel4oMini = anthropicProvider.chat("gpt-5.4")
const tuzimodel4oMini = tuzimodel.chat("gpt-4o-mini")

const model = {
  lzmodel4oMini,
  tuzimodel4oMini,
  perplexity,
}

export default model
