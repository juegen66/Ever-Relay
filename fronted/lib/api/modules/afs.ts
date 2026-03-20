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
  return afsSearchWithOptions({ query, scope, limit })
}

export async function afsSearchWithOptions(options: {
  query: string
  mode?: "exact" | "semantic"
  scope?: string
  pathPrefix?: string
  limit?: number
}) {
  const { data } = await apiClient.get<{ data: AfsSearchResponse }>("/afs/search", {
    params: options,
  })
  return data.data
}

export async function logActionBatch(
  actions: { actionType: string; payload?: Record<string, unknown>; ts?: number }[],
  sessionId?: string
) {
  await apiClient.post("/afs/actions/batch", { actions, sessionId })
}

export async function afsListSkills(scope?: string) {
  const path = scope ? `Desktop/${scope}/Skill` : "Desktop/Skill"
  return afsList(path)
}

export async function afsReadSkill(name: string, scope?: string) {
  const path = scope ? `Desktop/${scope}/Skill/${name}` : `Desktop/Skill/${name}`
  return afsRead(path)
}
