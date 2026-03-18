import { describe, it, expect } from "vitest"

import { selectProactiveReminder } from "../select-proactive-reminder"
import type { PredictionCard } from "@/lib/stores/prediction-store"

describe("selectProactiveReminder", () => {
  it("returns null when predictions array is empty", () => {
    expect(selectProactiveReminder([])).toBeNull()
  })

  it("returns null when top prediction confidence < 80", () => {
    const predictions: PredictionCard[] = [
      { id: "1", title: "A", description: "desc", confidence: 79 },
      { id: "2", title: "B", description: "desc", confidence: 75 },
    ]
    expect(selectProactiveReminder(predictions)).toBeNull()
  })

  it("returns reminder when top prediction confidence >= 80", () => {
    const predictions: PredictionCard[] = [
      { id: "1", title: "Low", description: "low desc", confidence: 70 },
      { id: "2", title: "High", description: "high desc", confidence: 92 },
    ]
    const result = selectProactiveReminder(predictions)
    expect(result).not.toBeNull()
    expect(result!.predictionId).toBe("2")
    expect(result!.title).toBe("High")
    expect(result!.message).toBe("high desc")
    expect(result!.confidence).toBe(92)
  })

  it("picks highest confidence when multiple >= 80", () => {
    const predictions: PredictionCard[] = [
      { id: "1", title: "A", description: "a", confidence: 91 },
      { id: "2", title: "B", description: "b", confidence: 95 },
      { id: "3", title: "C", description: "c", confidence: 93 },
    ]
    const result = selectProactiveReminder(predictions)
    expect(result!.predictionId).toBe("2")
    expect(result!.confidence).toBe(95)
  })

  it("uses actionLabel as title when present", () => {
    const predictions: PredictionCard[] = [
      {
        id: "1",
        title: "Full Title",
        description: "desc",
        confidence: 95,
        actionLabel: "Quick Action",
      },
    ]
    const result = selectProactiveReminder(predictions)
    expect(result!.title).toBe("Quick Action")
  })

  it("uses title when actionLabel is empty", () => {
    const predictions: PredictionCard[] = [
      {
        id: "1",
        title: "Fallback",
        description: "desc",
        confidence: 90,
        actionLabel: "",
      },
    ]
    const result = selectProactiveReminder(predictions)
    expect(result!.title).toBe("Fallback")
  })

  it("generates unique key from id, title, confidence", () => {
    const predictions: PredictionCard[] = [
      { id: "pred-1", title: "Test", description: "msg", confidence: 92 },
    ]
    const result = selectProactiveReminder(predictions)
    expect(result!.key).toBe("pred-1:Test:92")
  })

  it("returns reminder when confidence is exactly 80", () => {
    const predictions: PredictionCard[] = [
      { id: "1", title: "Edge", description: "80%", confidence: 80 },
    ]
    const result = selectProactiveReminder(predictions)
    expect(result).not.toBeNull()
    expect(result!.confidence).toBe(80)
  })
})
