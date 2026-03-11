"use client"

import { create } from "zustand"
import type { WorkingMemoryState } from "@/shared/contracts/working-memory"

interface WorkingMemoryStore {
  state: WorkingMemoryState | null
  lastFetched: number | null
  setState: (state: WorkingMemoryState | null) => void
  markFetched: () => void
}

export const useWorkingMemoryStore = create<WorkingMemoryStore>((set) => ({
  state: null,
  lastFetched: null,
  setState: (state) => set({ state }),
  markFetched: () => set({ lastFetched: Date.now() }),
}))
