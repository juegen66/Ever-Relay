import { describe, expect, it } from "vitest"

import { resolveAppDisplayName } from "../resolve-app-display-name"

describe("resolveAppDisplayName", () => {
  it("returns the Optimize Report label for the report app", () => {
    expect(resolveAppDisplayName("report")).toBe("Optimize Report")
  })
})
