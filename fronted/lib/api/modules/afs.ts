import type { AfsNode } from "@/shared/contracts/afs"

import { apiClient } from "../client"

interface AfsListResponse {
  path: string
  nodes: AfsNode[]
}

interface AfsSearchResponse {
  results: AfsNode[]
}

export async function afsList(path: string, limit?: number) {
  const { data } = await apiClient.get<{ data: AfsListResponse }>("/afs/list", {
    params: { path, limit },
  })
  return data.data
}

export async function afsRead(path: string) {
  const { data } = await apiClient.get<{ data: AfsNode }>("/afs/read", {
    params: { path },
  })
  return data.data
}

export async function afsSearch(query: string, scope?: string, limit?: number) {
  const { data } = await apiClient.get<{ data: AfsSearchResponse }>("/afs/search", {
    params: { query, scope, limit },
  })
  return data.data
}

export async function logActionBatch(
  actions: { actionType: string; payload?: Record<string, unknown>; ts?: number }[],
  sessionId?: string
) {
  await apiClient.post("/afs/actions/batch", { actions, sessionId })
}
