"use client"

import { MoreHorizontal, Copy, FolderOpen, Trash2, ArchiveRestore, CircleDot } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { CanvasProject } from "@/lib/api/modules/canvas"

interface ProjectCardProps {
  project: CanvasProject
  onOpen: (projectId: string) => void
  onDuplicate: (projectId: string) => void
  onDelete: (projectId: string) => void
  onRestore?: (projectId: string) => void
  onChangeStatus: (projectId: string, status: CanvasProject["status"]) => void
  inTrash?: boolean
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

const STATUS_STYLES: Record<CanvasProject["status"], string> = {
  draft: "bg-neutral-100 text-neutral-700",
  published: "bg-blue-100 text-blue-700",
  archived: "bg-amber-100 text-amber-700",
}

export function ProjectCard({
  project,
  onOpen,
  onDuplicate,
  onDelete,
  onRestore,
  onChangeStatus,
  inTrash = false,
}: ProjectCardProps) {
  return (
    <article
      className="group flex min-h-44 flex-col rounded-xl border border-black/10 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      onDoubleClick={() => !inTrash && onOpen(project.id)}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-neutral-900">{project.title}</h3>
          <p className="mt-0.5 text-xs text-neutral-500">Updated {formatDate(project.updatedAt)}</p>
        </div>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-black/10 bg-white/70 text-neutral-700 opacity-0 transition group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="z-[2147483647] border-black/10 bg-white/95 backdrop-blur-xl"
          >
            {!inTrash && (
              <DropdownMenuItem onSelect={() => onOpen(project.id)}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Open
              </DropdownMenuItem>
            )}
            {!inTrash && (
              <DropdownMenuItem onSelect={() => onDuplicate(project.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
            )}

            {!inTrash && project.status !== "draft" && (
              <DropdownMenuItem onSelect={() => onChangeStatus(project.id, "draft")}>
                <CircleDot className="mr-2 h-4 w-4" />
                Mark as Draft
              </DropdownMenuItem>
            )}
            {!inTrash && project.status !== "published" && (
              <DropdownMenuItem onSelect={() => onChangeStatus(project.id, "published")}>
                <CircleDot className="mr-2 h-4 w-4" />
                Mark as Published
              </DropdownMenuItem>
            )}
            {!inTrash && project.status !== "archived" && (
              <DropdownMenuItem onSelect={() => onChangeStatus(project.id, "archived")}>
                <CircleDot className="mr-2 h-4 w-4" />
                Mark as Archived
              </DropdownMenuItem>
            )}

            {inTrash ? (
              <DropdownMenuItem onSelect={() => onRestore?.(project.id)}>
                <ArchiveRestore className="mr-2 h-4 w-4" />
                Restore
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="text-red-600" onSelect={() => onDelete(project.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Move to Trash
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mb-3 min-h-14 rounded-lg border border-dashed border-black/10 bg-gradient-to-br from-neutral-100 to-white" />

      <div className="mt-auto space-y-2">
        {project.description ? (
          <p className="max-h-9 overflow-hidden text-xs text-neutral-600">{project.description}</p>
        ) : (
          <p className="text-xs text-neutral-400">No description</p>
        )}

        <div className="flex flex-wrap gap-1.5">
          <Badge className={STATUS_STYLES[project.status]}>{project.status}</Badge>
          {project.tags.slice(0, 2).map((tag) => (
            <Badge key={tag.id} variant="outline" className="border-black/10 bg-white/70 text-neutral-700">
              {tag.name}
            </Badge>
          ))}
          {project.tags.length > 2 && (
            <Badge variant="outline" className="border-black/10 bg-white/70 text-neutral-700">
              +{project.tags.length - 2}
            </Badge>
          )}
        </div>
      </div>
    </article>
  )
}
