import { beforeEach, describe, expect, it } from "vitest"

import { usePredictionReportStore } from "../prediction-report-store"

beforeEach(() => {
  usePredictionReportStore.getState().clearReport()
})

describe("prediction-report-store", () => {
  it("defaults to the Optimize Report title", () => {
    expect(usePredictionReportStore.getState()).toMatchObject({
      html: null,
      title: "Optimize Report",
      generatedAt: null,
    })
  })

  it("restores the Optimize Report title when cleared", () => {
    usePredictionReportStore.getState().setReport("<html></html>", "Custom Title")
    usePredictionReportStore.getState().clearReport()

    expect(usePredictionReportStore.getState()).toMatchObject({
      html: null,
      title: "Optimize Report",
      generatedAt: null,
    })
  })
})
