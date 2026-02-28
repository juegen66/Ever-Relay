"use client"

import { create } from "zustand"

interface BuildProgressStore {
  activeRunId: string | null
  visible: boolean
  openForRun: (runId: string) => void
  close: () => void
  clear: () => void
}

export const useBuildProgressStore = create<BuildProgressStore>((set) => ({
  activeRunId: null,
  visible: false,
  openForRun: (runId) => set({ activeRunId: runId, visible: true }),
  close: () => set({ visible: false }),
  clear: () => set({ activeRunId: null, visible: false }),
}))

