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

export type ProactivePredictionReminder = {
  key: string
  predictionId: string
  title: string
  message: string
  confidence: number
}

interface PredictionStore {
  predictions: PredictionCard[]
  suggestions: SuggestionCard[]
  proactiveReminder: ProactivePredictionReminder | null
  lastUpdated: number | null
  isLoading: boolean
  setPredictionSnapshot: (input: {
    predictions: PredictionCard[]
    suggestions: SuggestionCard[]
    proactiveReminder: ProactivePredictionReminder | null
  }) => void
  setLoading: (v: boolean) => void
  clear: () => void
}

export const usePredictionStore = create<PredictionStore>((set) => ({
  predictions: [],
  suggestions: [],
  proactiveReminder: null,
  lastUpdated: null,
  isLoading: false,
  setPredictionSnapshot: ({ predictions, suggestions, proactiveReminder }) =>
    set({
      predictions,
      suggestions,
      proactiveReminder,
      lastUpdated: Date.now(),
    }),
  setLoading: (v) => set({ isLoading: v }),
  clear: () =>
    set({
      predictions: [],
      suggestions: [],
      proactiveReminder: null,
      lastUpdated: null,
    }),
}))
