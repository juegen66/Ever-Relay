import {
  MASTRA_RESOURCE_ID_KEY,
  MASTRA_THREAD_ID_KEY,
  RequestContext,
} from "@mastra/core/request-context"

export interface BuildRunContextInput {
  userId: string
  runId?: string
  projectId?: string | null
  appId?: string | null
}

export function createBuildRunRequestContext(input: BuildRunContextInput) {
  const requestContext = new RequestContext<Record<string, unknown>>()
  const threadId = (input.runId ?? "").trim() || input.userId

  requestContext.set("userId", input.userId)
  requestContext.set("runId", input.runId ?? "")
  requestContext.set("projectId", input.projectId ?? null)
  requestContext.set("appId", input.appId ?? null)
  requestContext.set(MASTRA_RESOURCE_ID_KEY, input.userId)
  requestContext.set(MASTRA_THREAD_ID_KEY, threadId)
  return requestContext
}
