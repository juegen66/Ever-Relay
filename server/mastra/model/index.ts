import { createAnthropic } from "@ai-sdk/anthropic"
import { createOpenAI } from "@ai-sdk/openai"

const openaiProvider = createOpenAI({
  apiKey: "sk-uKkuGljN5bH47ch7yh8FWQ6o1QFelfBDNmlVSNdFRCtlRIBD",
  baseURL: "https://api.tu-zi.com/v1",
})

const anthropicProvider = createAnthropic({
  apiKey: "sk-dummy",
  baseURL: "http://localhost:8317/v1",
  headers: {
    "anthropic-version": "2023-06-01",
  },
})

const lzmodel4oMini = anthropicProvider.chat("gpt-5.4")

const model = {
  lzmodel4oMini,
}

export default model
