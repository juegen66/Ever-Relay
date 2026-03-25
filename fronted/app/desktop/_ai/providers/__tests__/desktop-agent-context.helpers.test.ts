import { describe, expect, it } from "vitest"

import type { WindowState } from "@/lib/desktop/types"

import {
  MAX_AGENT_TEXT_DOCUMENTS,
  selectOpenTextDocuments,
  truncateTextForAgent,
} from "../desktop-agent-context.helpers"

function createWindow(overrides: Partial<WindowState>): WindowState {
  return {
    id: "window-1",
    appId: "finder",
    x: 0,
    y: 0,
    width: 600,
    height: 400,
    zIndex: 1,
    minimized: false,
    maximized: false,
    ...overrides,
  }
}

describe("desktop-agent-context helpers", () => {
  it("prioritizes the active text document and removes duplicate file ids", () => {
    const windows: WindowState[] = [
      createWindow({ id: "a", appId: "textedit", fileId: "f-1", fileName: "A.md" }),
      createWindow({ id: "b", appId: "textedit", fileId: "f-2", fileName: "B.md" }),
      createWindow({ id: "c", appId: "textedit", fileId: "f-1", fileName: "A copy.md" }),
    ]

    const result = selectOpenTextDocuments(windows, "b")

    expect(result).toEqual([
      {
        windowId: "b",
        fileId: "f-2",
        fileName: "B.md",
        isActive: true,
      },
      {
        windowId: "a",
        fileId: "f-1",
        fileName: "A.md",
        isActive: false,
      },
    ])
  })

  it("limits the number of documents shared with the agent", () => {
    const windows = Array.from({ length: MAX_AGENT_TEXT_DOCUMENTS + 2 }, (_, index) =>
      createWindow({
        id: `w-${index}`,
        appId: "textedit",
        fileId: `f-${index}`,
        fileName: `File-${index}.md`,
      })
    )

    const result = selectOpenTextDocuments(windows, null)

    expect(result).toHaveLength(MAX_AGENT_TEXT_DOCUMENTS)
  })

  it("truncates oversized text while preserving a suffix marker", () => {
    const content = "a".repeat(50)
    const result = truncateTextForAgent(content, 20)

    expect(result.length).toBeGreaterThanOrEqual(20)
    expect(result).toContain("[Truncated for agent context]")
  })
})
