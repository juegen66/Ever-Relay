import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  thirdPartyAppsApi,
  type CreateThirdPartyAppBody,
  type ThirdPartyAppConfig,
  type UpdateThirdPartyAppBody,
} from "@/lib/api/modules/third-party-apps"
import {
  thirdPartyMcpApi,
  type ThirdPartyMcpBinding,
  type UpsertThirdPartyMcpBindingBody,
} from "@/lib/api/modules/third-party-mcp"

export const thirdPartyAppsQueryKeys = {
  all: ["third-party-apps"] as const,
  list: ["third-party-apps", "list"] as const,
  detail: (appSlug: string) => ["third-party-apps", "detail", appSlug] as const,
  mcpBinding: (appSlug: string) => ["third-party-apps", "mcp-binding", appSlug] as const,
}

function upsertApp(list: ThirdPartyAppConfig[] | undefined, app: ThirdPartyAppConfig) {
  if (!list) return [app]

  const next = [...list]
  const index = next.findIndex((item) => item.appSlug === app.appSlug)
  if (index === -1) {
    next.unshift(app)
  } else {
    next[index] = app
  }

  return next.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export function useThirdPartyAppsQuery() {
  return useQuery({
    queryKey: thirdPartyAppsQueryKeys.list,
    queryFn: () => thirdPartyAppsApi.listApps(),
  })
}

export function useThirdPartyAppQuery(appSlug: string | null) {
  return useQuery({
    queryKey: appSlug
      ? thirdPartyAppsQueryKeys.detail(appSlug)
      : [...thirdPartyAppsQueryKeys.all, "detail", "idle"] as const,
    queryFn: () => thirdPartyAppsApi.getApp(appSlug as string),
    enabled: Boolean(appSlug),
  })
}

export function useCreateThirdPartyAppMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateThirdPartyAppBody) => thirdPartyAppsApi.createApp(body),
    onSuccess: async (app) => {
      queryClient.setQueryData(thirdPartyAppsQueryKeys.detail(app.appSlug), app)
      queryClient.setQueryData<ThirdPartyAppConfig[] | undefined>(
        thirdPartyAppsQueryKeys.list,
        (current) => upsertApp(current, app)
      )
      await queryClient.invalidateQueries({ queryKey: thirdPartyAppsQueryKeys.list })
    },
  })
}

export function useUpdateThirdPartyAppMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      appSlug,
      body,
    }: {
      appSlug: string
      body: UpdateThirdPartyAppBody
    }) => thirdPartyAppsApi.updateApp(appSlug, body),
    onSuccess: async (app) => {
      queryClient.setQueryData(thirdPartyAppsQueryKeys.detail(app.appSlug), app)
      queryClient.setQueryData<ThirdPartyAppConfig[] | undefined>(
        thirdPartyAppsQueryKeys.list,
        (current) => upsertApp(current, app)
      )
      await queryClient.invalidateQueries({ queryKey: thirdPartyAppsQueryKeys.list })
    },
  })
}

export function useDeleteThirdPartyAppMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (appSlug: string) => thirdPartyAppsApi.deleteApp(appSlug),
    onSuccess: async (_, appSlug) => {
      queryClient.removeQueries({ queryKey: thirdPartyAppsQueryKeys.detail(appSlug) })
      queryClient.removeQueries({ queryKey: thirdPartyAppsQueryKeys.mcpBinding(appSlug) })
      queryClient.setQueryData<ThirdPartyAppConfig[] | undefined>(
        thirdPartyAppsQueryKeys.list,
        (current) => current?.filter((item) => item.appSlug !== appSlug) ?? []
      )
      await queryClient.invalidateQueries({ queryKey: thirdPartyAppsQueryKeys.list })
    },
  })
}

export function useThirdPartyMcpBindingQuery(appSlug: string | null) {
  return useQuery({
    queryKey: appSlug
      ? thirdPartyAppsQueryKeys.mcpBinding(appSlug)
      : [...thirdPartyAppsQueryKeys.all, "mcp-binding", "idle"] as const,
    queryFn: async () => {
      const result = await thirdPartyMcpApi.getBinding(appSlug as string)
      return result.binding
    },
    enabled: Boolean(appSlug),
  })
}

export function useUpsertThirdPartyMcpBindingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      appSlug,
      body,
    }: {
      appSlug: string
      body: UpsertThirdPartyMcpBindingBody
    }) => thirdPartyMcpApi.upsertBinding(appSlug, body),
    onSuccess: async (binding) => {
      queryClient.setQueryData<ThirdPartyMcpBinding | null>(
        thirdPartyAppsQueryKeys.mcpBinding(binding.appSlug),
        binding
      )
      await queryClient.invalidateQueries({
        queryKey: thirdPartyAppsQueryKeys.mcpBinding(binding.appSlug),
      })
    },
  })
}

export function useDeleteThirdPartyMcpBindingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (appSlug: string) => thirdPartyMcpApi.deleteBinding(appSlug),
    onSuccess: async (_, appSlug) => {
      queryClient.setQueryData<ThirdPartyMcpBinding | null>(
        thirdPartyAppsQueryKeys.mcpBinding(appSlug),
        null
      )
      await queryClient.invalidateQueries({
        queryKey: thirdPartyAppsQueryKeys.mcpBinding(appSlug),
      })
    },
  })
}
