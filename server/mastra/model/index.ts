import { createAnthropic } from "@ai-sdk/anthropic"

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
