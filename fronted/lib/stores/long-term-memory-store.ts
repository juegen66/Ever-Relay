"use client"

import { create } from "zustand"

import type { AfsNode } from "@/shared/contracts/afs"

interface LongTermMemoryStore {
  facts: AfsNode[]
  patterns: AfsNode[]
  episodes: AfsNode[]
  lastFetched: number | null
  isLoading: boolean
  setFacts: (nodes: AfsNode[]) => void
  setPatterns: (nodes: AfsNode[]) => void
  setEpisodes: (nodes: AfsNode[]) => void
  setLoading: (v: boolean) => void
  markFetched: () => void
}

export const useLongTermMemoryStore = create<LongTermMemoryStore>((set) => ({
  facts: [],
  patterns: [],
  episodes: [],
  lastFetched: null,
  isLoading: false,
  setFacts: (nodes) => set({ facts: nodes }),
  setPatterns: (nodes) => set({ patterns: nodes }),
  setEpisodes: (nodes) => set({ episodes: nodes }),
  setLoading: (v) => set({ isLoading: v }),
  markFetched: () => set({ lastFetched: Date.now() }),
}))
