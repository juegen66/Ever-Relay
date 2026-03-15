"use client"

import { useEffect } from "react"

import { afsList } from "@/lib/api/modules/afs"
import { useLongTermMemoryStore } from "@/lib/stores/long-term-memory-store"

const REFRESH_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

export function useLongTermMemory() {
  const setFacts = useLongTermMemoryStore((s) => s.setFacts)
  const setPatterns = useLongTermMemoryStore((s) => s.setPatterns)
  const setEpisodes = useLongTermMemoryStore((s) => s.setEpisodes)
  const setLoading = useLongTermMemoryStore((s) => s.setLoading)
  const markFetched = useLongTermMemoryStore((s) => s.markFetched)
  const lastFetched = useLongTermMemoryStore((s) => s.lastFetched)

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      try {
        const [factsRes, patternsRes, episodesRes] = await Promise.all([
          afsList("Desktop/Memory/user", 20),
          afsList("Desktop/Memory/note", 20),
          afsList("Desktop/History/prediction-runs", 10),
        ])
        setFacts(factsRes.nodes)
        setPatterns(patternsRes.nodes)
        setEpisodes(episodesRes.nodes)
        markFetched()
      } catch {
        // Silently fail – long-term memory is supplementary
      } finally {
        setLoading(false)
      }
    }

    // Fetch on mount or if stale
    if (!lastFetched || Date.now() - lastFetched > REFRESH_INTERVAL_MS) {
      void fetchAll()
    }

    const interval = window.setInterval(fetchAll, REFRESH_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [lastFetched, markFetched, setEpisodes, setFacts, setLoading, setPatterns])

  return useLongTermMemoryStore()
}
