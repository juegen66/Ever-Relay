import { describe, expect, it } from "vitest"

import {
  toolErr,
  toolOk,
  toolRetryLater,
} from "../types"

describe("tool result helpers", () => {
  it("returns structured defaults for successful tool results", () => {
    expect(toolOk("done", { value: 1 })).toEqual({
      ok: true,
      message: "done",
      value: 1,
      status: "completed",
      shouldStop: false,
      retryable: false,
      nextAction: null,
    })
  })

  it("returns structured defaults for blocked tool results", () => {
    expect(toolErr("bad input")).toEqual({
      ok: false,
      message: "Failed: bad input",
      error: "bad input",
      status: "blocked",
      shouldStop: true,
      retryable: false,
      nextAction: "reply_to_user",
    })
  })

  it("returns machine-readable retry_later results", () => {
    expect(
      toolRetryLater(
        "Canvas app is not ready yet.",
        { scope: "canvas" },
        { nextAction: "wait_for_canvas_ready" }
      )
    ).toEqual({
      ok: false,
      message: "Retry later: Canvas app is not ready yet.",
      error: "Canvas app is not ready yet.",
      scope: "canvas",
      status: "retry_later",
      shouldStop: true,
      retryable: true,
      nextAction: "wait_for_canvas_ready",
    })
  })
})
