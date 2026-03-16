"use client"

import { create } from "zustand"

export type WorkflowProgressKind = "build" | "coding"

interface WorkflowProgressStore {
  activeRunId: string | null
  activeKind: WorkflowProgressKind
  visible: boolean
  openForRun: (runId: string, kind: WorkflowProgressKind) => void
  close: () => void
  clear: () => void
}

export const useWorkflowProgressStore = create<WorkflowProgressStore>((set) => ({
  activeRunId: null,
  activeKind: "build",
  visible: false,
  openForRun: (runId, kind) => set({ activeRunId: runId, activeKind: kind, visible: true }),
  close: () => set({ visible: false }),
  clear: () => set({ activeRunId: null, activeKind: "build", visible: false }),
}))
