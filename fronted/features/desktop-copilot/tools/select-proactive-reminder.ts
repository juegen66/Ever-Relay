import type {
  PredictionCard,
  ProactivePredictionReminder,
} from "@/lib/stores/prediction-store"

export const PROACTIVE_REMINDER_MIN_CONFIDENCE = 80

export function selectProactiveReminder(
  predictions: PredictionCard[]
): ProactivePredictionReminder | null {
  const topPrediction = predictions.reduce<PredictionCard | null>((best, current) => {
    if (!best) {
      return current
    }

    return current.confidence > best.confidence ? current : best
  }, null)

  if (!topPrediction || topPrediction.confidence < PROACTIVE_REMINDER_MIN_CONFIDENCE) {
    return null
  }

  const title = topPrediction.actionLabel?.trim() || topPrediction.title.trim()
  const message = topPrediction.description.trim()
  const key = [topPrediction.id, title, topPrediction.confidence].join(":")

  return {
    key,
    predictionId: topPrediction.id,
    title,
    message,
    confidence: topPrediction.confidence,
  }
}
