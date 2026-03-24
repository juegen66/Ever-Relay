import { afterEach, describe, expect, it } from "vitest"

import { validateThirdPartyMcpServerUrl } from "@/server/modules/third-party-mcp/third-party-mcp.service"

const originalAllowLocalhost = process.env.THIRD_PARTY_MCP_ALLOW_LOCALHOST

afterEach(() => {
  if (originalAllowLocalhost === undefined) {
    delete process.env.THIRD_PARTY_MCP_ALLOW_LOCALHOST
  } else {
    process.env.THIRD_PARTY_MCP_ALLOW_LOCALHOST = originalAllowLocalhost
  }
})

describe("third-party MCP service URL validation", () => {
  it("accepts public HTTPS MCP URLs", () => {
    expect(
      validateThirdPartyMcpServerUrl("https://example.com/mcp").toString()
    ).toBe("https://example.com/mcp")
  })

  it("rejects localhost MCP URLs", () => {
    expect(() => validateThirdPartyMcpServerUrl("http://localhost:3000/mcp")).toThrow(
      "Local or private-network MCP server URLs are not allowed"
    )
  })

  it("accepts localhost MCP URLs when explicitly allowed", () => {
    process.env.THIRD_PARTY_MCP_ALLOW_LOCALHOST = "true"

    expect(
      validateThirdPartyMcpServerUrl("http://127.0.0.1:3310/mcp").toString()
    ).toBe("http://127.0.0.1:3310/mcp")
  })

  it("rejects private IPv4 MCP URLs", () => {
    process.env.THIRD_PARTY_MCP_ALLOW_LOCALHOST = "true"

    expect(() => validateThirdPartyMcpServerUrl("http://192.168.0.10/mcp")).toThrow(
      "Local or private-network MCP server URLs are not allowed"
    )
  })
})
