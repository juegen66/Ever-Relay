"use client"

import { create } from "zustand"

export type PredictionCard = {
  id: string
  title: string
  description: string
  confidence: number
  actionLabel?: string
  estimatedTime?: string
  meta?: Record<string, unknown>
}

export type SuggestionCard = {
  id: string
  title: string
  description: string
  meta?: Record<string, unknown>
}

interface PredictionStore {
  predictions: PredictionCard[]
  suggestions: SuggestionCard[]
  lastUpdated: number | null
  isLoading: boolean
  setPredictions: (cards: PredictionCard[]) => void
  setSuggestions: (cards: SuggestionCard[]) => void
  setLoading: (v: boolean) => void
  clear: () => void
}

export const usePredictionStore = create<PredictionStore>((set) => ({
  predictions: [],
  suggestions: [],
  lastUpdated: null,
  isLoading: false,
  setPredictions: (cards) => set({ predictions: cards, lastUpdated: Date.now() }),
  setSuggestions: (cards) => set({ suggestions: cards, lastUpdated: Date.now() }),
  setLoading: (v) => set({ isLoading: v }),
  clear: () => set({ predictions: [], suggestions: [], lastUpdated: null }),
}))
