"use client"

import { useFrontendTool } from "@copilotkit/react-core"

import { useDesktopNotificationStore } from "@/lib/stores/desktop-notification-store"
import { usePredictionStore } from "@/lib/stores/prediction-store"
import type { PredictionCard, SuggestionCard } from "@/lib/stores/prediction-store"

import { selectProactiveReminder } from "./select-proactive-reminder"
import { toolOk } from "./types"

export function usePredictionTools() {
  const setPredictionSnapshot = usePredictionStore((state) => state.setPredictionSnapshot)
  const setLoading = usePredictionStore((state) => state.setLoading)

  useFrontendTool(
    {
      name: "update_predictions",
      description:
        "Update the No Chatbot dashboard with AI-generated optimization actions and supporting suggestions. Call this after analyzing the user's current work.",
      followUp: false,
      parameters: [
        {
          name: "predictions",
          type: "object[]",
          description:
            "Array of ranked primary optimization actions. Each object: { id: string, title: string, description: string, confidence: number (0-100), actionLabel?: string, estimatedTime?: string }",
          required: true,
        },
        {
          name: "suggestions",
          type: "object[]",
          description:
            "Array of secondary optimization suggestions. Each object: { id: string, title: string, description: string }",
          required: true,
        },
      ],
      handler: (args) => {
        const predictions = (args.predictions ?? []) as PredictionCard[]
        const suggestions = (args.suggestions ?? []) as SuggestionCard[]
        const proactiveReminder = selectProactiveReminder(predictions)
        const previousReminder = usePredictionStore.getState().proactiveReminder

        setLoading(false)
        setPredictionSnapshot({
          predictions,
          suggestions,
          proactiveReminder,
        })

        if (
          proactiveReminder &&
          proactiveReminder.key !== previousReminder?.key
        ) {
          useDesktopNotificationStore.getState().enqueueNotification({
            app: "Optimize",
            title: proactiveReminder.title,
            message: `${proactiveReminder.message} Click the Optimize Report app in the Dock to view the detailed analysis.`,
            time: "now",
            iconColor: "#0f766e",
          })
        }

        return toolOk(
          `Succeeded: dashboard updated with ${predictions.length} optimization action(s) and ${suggestions.length} suggestion(s).`,
          {
            predictionsCount: predictions.length,
            suggestionsCount: suggestions.length,
            proactiveReminder: proactiveReminder
              ? {
                  predictionId: proactiveReminder.predictionId,
                  confidence: proactiveReminder.confidence,
                }
              : null,
          }
        )
      },
    },
    [setLoading, setPredictionSnapshot]
  )
}
