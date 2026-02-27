"use client"

import { useMemo, useState } from "react"
import { Archive, Plus, RefreshCcw, Search } from "lucide-react"

import { ProjectCard } from "@/components/canvas-manager/project-card"
import { ProjectCreateDialog } from "@/components/canvas-manager/project-create-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CanvasProject, CanvasProjectStatus } from "@/lib/api/modules/canvas"
import {
  useCanvasProjectsQuery,
  useCanvasTrashProjectsQuery,
  useCanvasTagsQuery,
  useCreateCanvasProjectMutation,
  useDeleteCanvasProjectMutation,
  useDuplicateCanvasProjectMutation,
  useRestoreCanvasProjectMutation,
  useUpdateCanvasProjectMutation,
} from "@/lib/query/canvas"

interface ProjectsHubProps {
  onOpenProject: (projectId: string) => void | Promise<void>
}

type ProjectStatusFilter = CanvasProjectStatus | "all"

const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
] as const

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallback
}

export function ProjectsHub({ onOpenProject }: ProjectsHubProps) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [trashDialogOpen, setTrashDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const projectsQuery = useCanvasProjectsQuery({ query, statusFilter })
  const trashProjectsQuery = useCanvasTrashProjectsQuery({ enabled: trashDialogOpen })
  useCanvasTagsQuery()

  const createProjectMutation = useCreateCanvasProjectMutation()
  const updateProjectMutation = useUpdateCanvasProjectMutation()
  const deleteProjectMutation = useDeleteCanvasProjectMutation()
  const restoreProjectMutation = useRestoreCanvasProjectMutation()
  const duplicateProjectMutation = useDuplicateCanvasProjectMutation()

  const projects = projectsQuery.data?.items ?? []
  const trashProjects = trashProjectsQuery.data?.items ?? []
  const loading = projectsQuery.isPending
  const loadingTrash = trashProjectsQuery.isPending || trashProjectsQuery.isFetching

  const projectsError = projectsQuery.error
    ? toErrorMessage(projectsQuery.error, "Failed to fetch projects")
    : null
  const trashError = trashProjectsQuery.error
    ? toErrorMessage(trashProjectsQuery.error, "Failed to fetch trash projects")
    : null
  const error = actionError ?? projectsError

  const projectCountLabel = useMemo(() => {
    if (loading) {
      return "Loading projects..."
    }
    return `${projects.length} projects`
  }, [loading, projects.length])

  const handleCreate = async ({ title, description }: { title: string; description?: string }) => {
    setActionError(null)

    try {
      const created = await createProjectMutation.mutateAsync({
        title,
        description,
      })
      await onOpenProject(created.id)
    } catch (err) {
      setActionError(toErrorMessage(err, "Failed to create project"))
      throw err
    }
  }

  const handleDelete = (projectId: string) => {
    setProjectToDelete(projectId)
  }

  const confirmDelete = async () => {
    if (projectToDelete) {
      setActionError(null)
      try {
        await deleteProjectMutation.mutateAsync(projectToDelete)
        setProjectToDelete(null)
      } catch (err) {
        setActionError(toErrorMessage(err, "Failed to delete project"))
      }
    }
  }

  const handleOpenTrash = () => {
    setTrashDialogOpen(true)
  }

  const handleDuplicate = async (projectId: string) => {
    setActionError(null)
    try {
      await duplicateProjectMutation.mutateAsync(projectId)
    } catch (err) {
      setActionError(toErrorMessage(err, "Failed to duplicate project"))
    }
  }

  const handleStatusChange = async (projectId: string, status: CanvasProject["status"]) => {
    setActionError(null)
    try {
      await updateProjectMutation.mutateAsync({
        id: projectId,
        params: { status },
      })
    } catch (err) {
      setActionError(toErrorMessage(err, "Failed to update project"))
    }
  }

  const handleRestore = async (projectId: string) => {
    setActionError(null)
    try {
      await restoreProjectMutation.mutateAsync(projectId)
    } catch (err) {
      setActionError(toErrorMessage(err, "Failed to restore project"))
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-gradient-to-b from-neutral-100/80 to-neutral-200/30 text-neutral-900">
      <div className="border-b border-black/5 bg-white/80 px-5 py-4 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">My Canvas Projects</h2>
            <p className="text-sm text-neutral-500">{projectCountLabel}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-black/10 bg-white/70 text-neutral-900 hover:bg-black/5"
              onClick={() => void projectsQuery.refetch()}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              className="border-black/10 bg-white/70 text-neutral-900 hover:bg-black/5"
              onClick={handleOpenTrash}
            >
              <Archive className="mr-2 h-4 w-4" />
              Trash
            </Button>
            <Button className="bg-[#0058d0] text-white hover:bg-[#0045a6]" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title or description"
              className="border-black/10 bg-white/80 pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(next) => setStatusFilter(next as typeof statusFilter)}
          >
            <SelectTrigger className="w-[180px] border-black/10 bg-white/80">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="border-black/10 bg-white/95 backdrop-blur-xl">
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-5">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {!loading && projects.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-black/15 bg-white/60 p-8 text-center">
            <h3 className="text-base font-semibold text-neutral-800">No projects yet</h3>
            <p className="mt-1 text-sm text-neutral-500">Create your first canvas project to get started.</p>
            <Button className="mt-4 bg-[#0058d0] text-white hover:bg-[#0045a6]" onClick={() => setCreateDialogOpen(true)}>
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={(projectId) => void onOpenProject(projectId)}
                onDuplicate={(projectId) => void handleDuplicate(projectId)}
                onDelete={(projectId) => void handleDelete(projectId)}
                onChangeStatus={(projectId, status) => void handleStatusChange(projectId, status)}
              />
            ))}
          </div>
        )}
      </div>

      <ProjectCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreate}
      />

      <Dialog open={trashDialogOpen} onOpenChange={setTrashDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-hidden border-black/10 bg-white/90 text-neutral-900 shadow-xl shadow-black/10 backdrop-blur-xl sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Trash</DialogTitle>
            <DialogDescription>Projects moved to trash can be restored later.</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-auto">
            {loadingTrash ? (
              <div className="py-10 text-center text-sm text-neutral-500">Loading trash...</div>
            ) : trashError ? (
              <div className="py-10 text-center text-sm text-red-600">{trashError}</div>
            ) : trashProjects.length === 0 ? (
              <div className="py-10 text-center text-sm text-neutral-500">Trash is empty</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {trashProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    inTrash
                    onOpen={() => undefined}
                    onDuplicate={() => undefined}
                    onDelete={() => undefined}
                    onRestore={(projectId) => void handleRestore(projectId)}
                    onChangeStatus={() => undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={projectToDelete !== null} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent className="border-black/10 bg-white/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Trash?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move this project to the trash? You can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={confirmDelete}>
              Move to Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
