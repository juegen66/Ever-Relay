import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  getBindingForUserApp,
  upsertBinding,
  deactivateBinding,
} = vi.hoisted(() => ({
  getBindingForUserApp: vi.fn(),
  upsertBinding: vi.fn(),
  deactivateBinding: vi.fn(),
}))

vi.mock("@/server/modules/third-party-mcp/third-party-mcp.service", () => ({
  thirdPartyMcpService: {
    getBindingForUserApp,
    upsertBinding,
    deactivateBinding,
  },
}))

import {
  deleteThirdPartyMcpBinding,
  getThirdPartyMcpBinding,
  upsertThirdPartyMcpBinding,
} from "@/server/modules/third-party-mcp/third-party-mcp.controller"

type MockContext = {
  get: (key: string) => unknown
  json: (payload: unknown) => unknown
  status: (code: number) => void
}

function createContext() {
  return {
    get: vi.fn((key: string) => {
      if (key === "user") {
        return { id: "user-1" }
      }
      if (key === "requestId") {
        return "request-1"
      }
      return undefined
    }),
    json: vi.fn((payload: unknown) => payload),
    status: vi.fn(),
  } as unknown as MockContext
}

describe("third-party MCP controller", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("formats the active binding without leaking authToken", async () => {
    getBindingForUserApp.mockResolvedValueOnce({
      id: "00000000-0000-0000-0000-000000000100",
      userId: "user-1",
      appSlug: "weather_widget",
      serverUrl: "https://example.com/mcp",
      authType: "bearer",
      authToken: "secret-token",
      isActive: true,
      metadata: { provider: "demo" },
      createdAt: new Date("2026-03-22T10:00:00.000Z"),
      updatedAt: new Date("2026-03-22T10:01:00.000Z"),
    })

    const context = createContext()
    await getThirdPartyMcpBinding(
      context as never,
      { appSlug: "weather_widget" }
    )

    expect(getBindingForUserApp).toHaveBeenCalledWith("user-1", "weather_widget")
    expect(context.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: {
          binding: expect.objectContaining({
            appSlug: "weather_widget",
            hasAuthToken: true,
            authType: "bearer",
          }),
        },
      })
    )
    expect(context.json.mock.calls[0][0].data.binding.authToken).toBeUndefined()
  })

  it("returns the upserted binding", async () => {
    upsertBinding.mockResolvedValueOnce({
      id: "00000000-0000-0000-0000-000000000101",
      userId: "user-1",
      appSlug: "weather_widget",
      serverUrl: "https://example.com/mcp",
      authType: "none",
      authToken: null,
      isActive: true,
      metadata: {},
      createdAt: new Date("2026-03-22T10:00:00.000Z"),
      updatedAt: new Date("2026-03-22T10:02:00.000Z"),
    })

    const context = createContext()
    await upsertThirdPartyMcpBinding(
      context as never,
      { appSlug: "weather_widget" },
      {
        serverUrl: "https://example.com/mcp",
        authType: "none",
      }
    )

    expect(upsertBinding).toHaveBeenCalledWith({
      userId: "user-1",
      appSlug: "weather_widget",
      serverUrl: "https://example.com/mcp",
      authType: "none",
      authToken: undefined,
      metadata: undefined,
    })
    expect(context.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          appSlug: "weather_widget",
          hasAuthToken: false,
        }),
      })
    )
  })

  it("returns 404 when deleting a missing binding", async () => {
    deactivateBinding.mockResolvedValueOnce(false)

    const context = createContext()
    await deleteThirdPartyMcpBinding(
      context as never,
      { appSlug: "missing_app" }
    )

    expect(context.status).toHaveBeenCalledWith(404)
  })
})
