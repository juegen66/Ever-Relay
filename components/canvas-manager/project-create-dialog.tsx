"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface ProjectCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (payload: { title: string; description?: string }) => Promise<void>
}

export function ProjectCreateDialog({
  open,
  onOpenChange,
  onCreate,
}: ProjectCreateDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const disabled = useMemo(() => !title.trim() || submitting, [submitting, title])

  const reset = () => {
    setTitle("")
    setDescription("")
    setSubmitting(false)
  }

  const handleCreate = async () => {
    if (disabled) return

    try {
      setSubmitting(true)
      await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
      })
      onOpenChange(false)
      reset()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (!nextOpen) {
          reset()
        }
      }}
    >
      <DialogContent className="border-black/10 bg-white/90 text-neutral-900 shadow-xl shadow-black/10 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Create a new canvas project and open it in the editor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-neutral-600">Title</p>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Untitled project"
              maxLength={240}
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-neutral-600">Description</p>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional description"
              rows={4}
              maxLength={1000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="border-black/10 bg-white/70 text-neutral-900 hover:bg-black/5"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-[#0058d0] text-white hover:bg-[#0045a6]"
            onClick={handleCreate}
            disabled={disabled}
          >
            {submitting ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
