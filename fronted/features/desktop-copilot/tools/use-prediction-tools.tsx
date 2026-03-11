"use client"

import { useFrontendTool } from "@copilotkit/react-core"

import { useDesktopUIStore } from "@/lib/stores/desktop-ui-store"
import { usePredictionStore } from "@/lib/stores/prediction-store"
import type { PredictionCard, SuggestionCard } from "@/lib/stores/prediction-store"
import { PREDICTION_AGENT_ID } from "@/shared/copilot/constants"

export function usePredictionTools() {
  const setPredictions = usePredictionStore((state) => state.setPredictions)
  const setSuggestions = usePredictionStore((state) => state.setSuggestions)
  const setLoading = usePredictionStore((state) => state.setLoading)

  useFrontendTool(
    {
      name: "update_predictions",
      description:
        "Update the workflow dashboard with AI-generated predictions and improvement suggestions. Call this after analyzing user behavior.",
      parameters: [
        {
          name: "predictions",
          type: "object[]",
          description:
            "Array of predicted next steps. Each object: { id: string, title: string, description: string, confidence: number (0-100), actionLabel?: string, estimatedTime?: string }",
          required: true,
        },
        {
          name: "suggestions",
          type: "object[]",
          description:
            "Array of improvement suggestions. Each object: { id: string, title: string, description: string }",
          required: true,
        },
      ],
      handler: async (args) => {
        const { silentAgentId, silentRunning } = useDesktopUIStore.getState()
        if (!silentRunning || silentAgentId !== PREDICTION_AGENT_ID) {
          return {
            ok: false,
            ignored: true,
            reason: "No active prediction run",
          }
        }

        const predictions = (args.predictions ?? []) as PredictionCard[]
        const suggestions = (args.suggestions ?? []) as SuggestionCard[]

        setLoading(false)
        setPredictions(predictions)
        setSuggestions(suggestions)

        return {
          ok: true,
          predictionsCount: predictions.length,
          suggestionsCount: suggestions.length,
        }
      },
    },
    [setPredictions, setSuggestions, setLoading]
  )
}
