"use client"

import { useCoAgent } from "@copilotkit/react-core"
import { useEffect } from "react"
import { useWorkingMemoryStore } from "@/lib/stores/working-memory-store"
import type { WorkingMemoryState } from "@/shared/contracts/working-memory"
import { DESKTOP_COPILOT_AGENT } from "@/shared/copilot/constants"

export function useWorkingMemory() {
  const { state } = useCoAgent<WorkingMemoryState>({
    name: DESKTOP_COPILOT_AGENT,
  })

  const setStoreState = useWorkingMemoryStore((s) => s.setState)
  const markFetched = useWorkingMemoryStore((s) => s.markFetched)
  const storeState = useWorkingMemoryStore((s) => s.state)

  useEffect(() => {
    if (state && Object.keys(state).length > 0) {
      setStoreState(state)
      markFetched()
    }
  }, [state, setStoreState, markFetched])

  return { state: storeState ?? state ?? null }
}
