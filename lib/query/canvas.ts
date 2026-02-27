import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { ApiError } from "@/lib/api"
import { canvasApi } from "@/lib/api/modules/canvas"
import type {
  CanvasProject,
  CanvasProjectListParams,
  CanvasProjectListResult,
  CanvasProjectStatus,
  CanvasTag,
  CreateCanvasProjectParams,
  UpdateCanvasProjectContentParams,
  UpdateCanvasProjectParams,
} from "@/lib/api/modules/canvas"

export type ProjectStatusFilter = CanvasProjectStatus | "all"

export const canvasQueryKeys = {
  all: ["canvas"] as const,
  projectsAll: ["canvas", "projects"] as const,
  projects: (params: CanvasProjectListParams) =>
    ["canvas", "projects", params] as const,
  trashAll: ["canvas", "trash"] as const,
  trash: (params: CanvasProjectListParams) =>
    ["canvas", "trash", params] as const,
  tags: ["canvas", "tags"] as const,
  project: (projectId: string, includeDeleted = false) =>
    ["canvas", "project", projectId, { includeDeleted }] as const,
}

interface CanvasProjectsQueryOptions {
  query: string
  statusFilter: ProjectStatusFilter
}

interface CanvasTrashQueryOptions {
  enabled: boolean
}

interface CanvasProjectQueryOptions {
  projectId: string | null
  includeDeleted?: boolean
  enabled?: boolean
}

function normalizeSearchQuery(query: string): string | undefined {
  const normalized = query.trim()
  return normalized.length > 0 ? normalized : undefined
}

function toProjectSummary(project: CanvasProject): CanvasProject {
  return {
    ...project,
    contentJson: {},
  }
}

function upsertProject(collection: CanvasProject[], project: CanvasProject) {
  const index = collection.findIndex((item) => item.id === project.id)
  if (index < 0) {
    return [project, ...collection]
  }

  const next = [...collection]
  next[index] = project
  return next
}

function patchProjectInListCaches(queryClient: ReturnType<typeof useQueryClient>, project: CanvasProject) {
  const projectSummary = toProjectSummary(project)

  queryClient.setQueriesData<CanvasProjectListResult>(
    { queryKey: canvasQueryKeys.projectsAll },
    (current) => {
      if (!current) return current
      return {
        ...current,
        items: upsertProject(current.items, projectSummary),
      }
    }
  )

  queryClient.setQueriesData<CanvasProjectListResult>(
    { queryKey: canvasQueryKeys.trashAll },
    (current) => {
      if (!current) return current
      return {
        ...current,
        items: project.deletedAt
          ? upsertProject(current.items, projectSummary)
          : current.items.filter((item) => item.id !== project.id),
      }
    }
  )
}

function makeProjectsListParams({
  query,
  statusFilter,
}: CanvasProjectsQueryOptions): CanvasProjectListParams {
  return {
    q: normalizeSearchQuery(query),
    status: statusFilter === "all" ? undefined : [statusFilter],
    sort: "updated",
    order: "desc",
    includeDeleted: false,
    limit: 100,
  }
}

function makeTrashListParams(): CanvasProjectListParams {
  return {
    deletedOnly: true,
    sort: "updated",
    order: "desc",
    limit: 100,
  }
}

async function invalidateProjectLists(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: canvasQueryKeys.projectsAll }),
    queryClient.invalidateQueries({ queryKey: canvasQueryKeys.trashAll }),
  ])
}

export function useCanvasProjectsQuery(options: CanvasProjectsQueryOptions) {
  const params = makeProjectsListParams(options)

  return useQuery({
    queryKey: canvasQueryKeys.projects(params),
    queryFn: async () => {
      const result = await canvasApi.listProjects(params)
      return {
        ...result,
        items: result.items.map(toProjectSummary),
      }
    },
  })
}

export function useCanvasTrashProjectsQuery(options: CanvasTrashQueryOptions) {
  const params = makeTrashListParams()

  return useQuery({
    queryKey: canvasQueryKeys.trash(params),
    queryFn: async () => {
      const result = await canvasApi.listProjects(params)
      return {
        ...result,
        items: result.items.map(toProjectSummary),
      }
    },
    enabled: options.enabled,
  })
}

export function useCanvasTagsQuery() {
  return useQuery<CanvasTag[]>({
    queryKey: canvasQueryKeys.tags,
    queryFn: () => canvasApi.listTags(),
  })
}

export function useCanvasProjectQuery(options: CanvasProjectQueryOptions) {
  const includeDeleted = options.includeDeleted ?? false

  return useQuery({
    queryKey: options.projectId
      ? canvasQueryKeys.project(options.projectId, includeDeleted)
      : [...canvasQueryKeys.all, "project", "idle"] as const,
    queryFn: () => canvasApi.getProject(options.projectId as string, includeDeleted),
    enabled: Boolean(options.projectId) && (options.enabled ?? true),
  })
}

export function useCreateCanvasProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: CreateCanvasProjectParams) =>
      canvasApi.createProject(params),
    onSuccess: async (project) => {
      queryClient.setQueryData(canvasQueryKeys.project(project.id, false), project)
      await queryClient.invalidateQueries({ queryKey: canvasQueryKeys.projectsAll })
    },
  })
}

export function useUpdateCanvasProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: UpdateCanvasProjectParams }) =>
      canvasApi.updateProject(id, params),
    onSuccess: async (project) => {
      queryClient.setQueryData(canvasQueryKeys.project(project.id, false), project)
      await invalidateProjectLists(queryClient)
    },
  })
}

export function useDeleteCanvasProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => canvasApi.deleteProject(id),
    onSuccess: async (_, projectId) => {
      queryClient.removeQueries({ queryKey: canvasQueryKeys.project(projectId, false) })
      await invalidateProjectLists(queryClient)
    },
  })
}

export function useRestoreCanvasProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => canvasApi.restoreProject(id),
    onSuccess: async (project) => {
      queryClient.setQueryData(canvasQueryKeys.project(project.id, false), project)
      await invalidateProjectLists(queryClient)
    },
  })
}

export function useDuplicateCanvasProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => canvasApi.duplicateProject(id),
    onSuccess: async (project) => {
      queryClient.setQueryData(canvasQueryKeys.project(project.id, false), project)
      await queryClient.invalidateQueries({ queryKey: canvasQueryKeys.projectsAll })
    },
  })
}

function parseConflictExpectedVersion(error: ApiError): number | undefined {
  if (error.status !== 409 || !error.details || typeof error.details !== "object") {
    return undefined
  }

  const payload = error.details as {
    data?: {
      expectedVersion?: unknown
    }
  }

  return typeof payload?.data?.expectedVersion === "number"
    ? payload.data.expectedVersion
    : undefined
}

export interface SaveCanvasProjectContentResult {
  project?: CanvasProject
  conflictExpectedVersion?: number
}

interface UpdateCanvasProjectContentVariables {
  id: string
  params: UpdateCanvasProjectContentParams
}

interface UpdateCanvasProjectContentContext {
  previousProject?: CanvasProject
}

export function useUpdateCanvasProjectContentMutation() {
  const queryClient = useQueryClient()

  return useMutation<
    SaveCanvasProjectContentResult,
    Error,
    UpdateCanvasProjectContentVariables,
    UpdateCanvasProjectContentContext
  >({
    mutationFn: async ({ id, params }) => {
      try {
        const project = await canvasApi.updateProjectContent(id, params)
        return { project }
      } catch (error) {
        if (error instanceof ApiError) {
          const expectedVersion = parseConflictExpectedVersion(error)
          if (expectedVersion !== undefined) {
            return { conflictExpectedVersion: expectedVersion }
          }
        }
        throw error
      }
    },
    onMutate: async ({ id, params }) => {
      await queryClient.cancelQueries({ queryKey: canvasQueryKeys.project(id, false) })
      const previousProject = queryClient.getQueryData<CanvasProject>(
        canvasQueryKeys.project(id, false)
      )

      if (previousProject) {
        queryClient.setQueryData(canvasQueryKeys.project(id, false), {
          ...previousProject,
          contentJson: params.contentJson,
          contentVersion: params.contentVersion,
        })
      }

      return { previousProject }
    },
    onError: (_error, variables, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(
          canvasQueryKeys.project(variables.id, false),
          context.previousProject
        )
      }
    },
    onSuccess: async (result, variables, context) => {
      if (result.project) {
        queryClient.setQueryData(
          canvasQueryKeys.project(variables.id, false),
          result.project
        )
        patchProjectInListCaches(queryClient, result.project)
        await invalidateProjectLists(queryClient)
        return
      }

      if (result.conflictExpectedVersion !== undefined && context?.previousProject) {
        queryClient.setQueryData(
          canvasQueryKeys.project(variables.id, false),
          {
            ...context.previousProject,
            contentVersion: result.conflictExpectedVersion,
          }
        )
      }
    },
  })
}
