"use client"

import { create } from "zustand"

import { ApiError } from "@/lib/api"
import {
  canvasApi,
  type CanvasProject,
  type CanvasProjectStatus,
  type CanvasTag,
  type CreateCanvasProjectParams,
  type UpdateCanvasProjectParams,
} from "@/lib/api/modules/canvas"

type ProjectStatusFilter = CanvasProjectStatus | "all"

interface SaveResult {
  project?: CanvasProject
  conflictExpectedVersion?: number
  error?: string
}

interface CanvasProjectsStore {
  projects: CanvasProject[]
  trashProjects: CanvasProject[]
  tags: CanvasTag[]
  loading: boolean
  loadingTrash: boolean
  error: string | null
  query: string
  statusFilter: ProjectStatusFilter
  setQuery: (query: string) => void
  setStatusFilter: (status: ProjectStatusFilter) => void
  fetchProjects: () => Promise<void>
  fetchTrashProjects: () => Promise<void>
  fetchTags: () => Promise<void>
  createProject: (params: CreateCanvasProjectParams) => Promise<CanvasProject | null>
  updateProject: (id: string, params: UpdateCanvasProjectParams) => Promise<CanvasProject | null>
  deleteProject: (id: string) => Promise<boolean>
  restoreProject: (id: string) => Promise<CanvasProject | null>
  duplicateProject: (id: string) => Promise<CanvasProject | null>
  loadProjectById: (id: string, includeDeleted?: boolean) => Promise<CanvasProject | null>
  saveProjectContent: (id: string, contentJson: Record<string, unknown>, contentVersion: number) => Promise<SaveResult>
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

function toProjectSummary(project: CanvasProject): CanvasProject {
  return {
    ...project,
    contentJson: {},
  }
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

export const useCanvasProjectsStore = create<CanvasProjectsStore>((set, get) => ({
  projects: [],
  trashProjects: [],
  tags: [],
  loading: false,
  loadingTrash: false,
  error: null,
  query: "",
  statusFilter: "all",

  setQuery: (query) => set({ query }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),

  fetchProjects: async () => {
    const { query, statusFilter } = get()

    set({ loading: true, error: null })
    try {
      const result = await canvasApi.listProjects({
        q: query || undefined,
        status: statusFilter === "all" ? undefined : [statusFilter],
        sort: "updated",
        order: "desc",
        includeDeleted: false,
        limit: 100,
      })
      set({ projects: result.items.map(toProjectSummary), loading: false })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to fetch projects",
      })
    }
  },

  fetchTrashProjects: async () => {
    set({ loadingTrash: true, error: null })
    try {
      const result = await canvasApi.listProjects({
        deletedOnly: true,
        sort: "updated",
        order: "desc",
        limit: 100,
      })
      set({ trashProjects: result.items.map(toProjectSummary), loadingTrash: false })
    } catch (error) {
      set({
        loadingTrash: false,
        error: error instanceof Error ? error.message : "Failed to fetch trash projects",
      })
    }
  },

  fetchTags: async () => {
    try {
      const tags = await canvasApi.listTags()
      set({ tags })
    } catch {
      // ignore tag fetching failures in UI bootstrap
    }
  },

  createProject: async (params) => {
    try {
      const project = await canvasApi.createProject(params)
      set((state) => ({
        projects: upsertProject(state.projects, toProjectSummary(project)),
      }))
      return project
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to create project" })
      return null
    }
  },

  updateProject: async (id, params) => {
    try {
      const project = await canvasApi.updateProject(id, params)
      const summary = toProjectSummary(project)
      set((state) => ({
        projects: upsertProject(state.projects, summary),
        trashProjects: upsertProject(state.trashProjects, summary),
      }))
      return project
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to update project" })
      return null
    }
  },

  deleteProject: async (id) => {
    try {
      await canvasApi.deleteProject(id)
      set((state) => {
        const removed = state.projects.find((project) => project.id === id)
        const nextProjects = state.projects.filter((project) => project.id !== id)

        return {
          projects: nextProjects,
          trashProjects: removed
            ? [
                {
                  ...removed,
                  deletedAt: new Date().toISOString(),
                },
                ...state.trashProjects,
              ]
            : state.trashProjects,
        }
      })
      return true
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to delete project" })
      return false
    }
  },

  restoreProject: async (id) => {
    try {
      const project = await canvasApi.restoreProject(id)
      set((state) => ({
        projects: upsertProject(state.projects, toProjectSummary(project)),
        trashProjects: state.trashProjects.filter((item) => item.id !== id),
      }))
      return project
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to restore project" })
      return null
    }
  },

  duplicateProject: async (id) => {
    try {
      const project = await canvasApi.duplicateProject(id)
      set((state) => ({
        projects: upsertProject(state.projects, toProjectSummary(project)),
      }))
      return project
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to duplicate project" })
      return null
    }
  },

  loadProjectById: async (id, includeDeleted = false) => {
    try {
      const project = await canvasApi.getProject(id, includeDeleted)
      set((state) => ({
        projects: upsertProject(state.projects, toProjectSummary(project)),
      }))
      return project
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to load project" })
      return null
    }
  },

  saveProjectContent: async (id, contentJson, contentVersion) => {
    try {
      const project = await canvasApi.updateProjectContent(id, {
        contentJson,
        contentVersion,
      })

      set((state) => ({
        projects: upsertProject(state.projects, toProjectSummary(project)),
      }))

      return { project }
    } catch (error) {
      if (error instanceof ApiError) {
        const expectedVersion = parseConflictExpectedVersion(error)
        if (expectedVersion !== undefined) {
          return { conflictExpectedVersion: expectedVersion }
        }
      }

      return {
        error: error instanceof Error ? error.message : "Failed to save project",
      }
    }
  },
}))
