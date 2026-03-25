"use client"

import { create } from "zustand"

interface PredictionReportStore {
  html: string | null
  title: string
  generatedAt: number | null
  setReport: (html: string, title: string) => void
  clearReport: () => void
}

export const usePredictionReportStore = create<PredictionReportStore>((set) => ({
  html: null,
  title: "Optimize Report",
  generatedAt: null,
  setReport: (html, title) =>
    set({
      html,
      title,
      generatedAt: Date.now(),
    }),
  clearReport: () =>
    set({
      html: null,
      title: "Optimize Report",
      generatedAt: null,
    }),
}))
