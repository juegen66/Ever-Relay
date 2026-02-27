import { MASTRA_RESOURCE_ID_KEY, RequestContext } from "@mastra/core/request-context"

export interface BuildRunContextInput {
  userId: string
  runId?: string
  projectId?: string | null
}

export function createBuildRunRequestContext(input: BuildRunContextInput) {
  const requestContext = new RequestContext<Record<string, unknown>>()
  requestContext.set("userId", input.userId)
  requestContext.set("runId", input.runId ?? "")
  requestContext.set("projectId", input.projectId ?? null)
  requestContext.set(MASTRA_RESOURCE_ID_KEY, input.userId)
  return requestContext
}

