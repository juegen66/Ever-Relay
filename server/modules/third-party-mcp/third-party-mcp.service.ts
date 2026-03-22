import { isIP } from "node:net"

import { MCPClient } from "@mastra/mcp"
import { and, eq } from "drizzle-orm"

import { db } from "@/server/core/database"
import { thirdPartyMcpBinding } from "@/server/db/schema"
import type { ThirdPartyMcpAuthType } from "@/shared/contracts/third-party-mcp"

import type { Tool } from "@mastra/core/tools"

type ThirdPartyMcpBindingRecord = typeof thirdPartyMcpBinding.$inferSelect

const MCP_CONNECT_TIMEOUT_MS = 3_000
const MCP_TIMEOUT_MS = 10_000
const LOCAL_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "ip6-localhost",
])

function normalizeHostname(hostname: string) {
  return hostname.trim().toLowerCase().replace(/^\[(.*)\]$/, "$1")
}

function isPrivateIPv4(hostname: string) {
  const parts = normalizeHostname(hostname)
    .split(".")
    .map((segment) => Number.parseInt(segment, 10))
  if (parts.length !== 4 || parts.some((value) => Number.isNaN(value) || value < 0 || value > 255)) {
    return false
  }

  const [a, b] = parts
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  )
}

function isPrivateIPv6(hostname: string) {
  const normalized = normalizeHostname(hostname)
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  )
}

function isLoopbackIPv4(hostname: string) {
  const parts = normalizeHostname(hostname)
    .split(".")
    .map((segment) => Number.parseInt(segment, 10))
  return parts.length === 4 && parts.every((value) => Number.isInteger(value)) && parts[0] === 127
}

function isLoopbackIPv6(hostname: string) {
  const normalized = normalizeHostname(hostname)
  return normalized === "::1" || normalized === "0:0:0:0:0:0:0:1"
}

function isLoopbackHostname(hostname: string) {
  const normalized = normalizeHostname(hostname)
  if (LOCAL_HOSTNAMES.has(normalized)) return true

  const ipVersion = isIP(normalized)
  if (ipVersion === 4) return isLoopbackIPv4(normalized)
  if (ipVersion === 6) return isLoopbackIPv6(normalized)

  return false
}

function allowLoopbackMcpUrls() {
  return process.env.THIRD_PARTY_MCP_ALLOW_LOCALHOST === "true" || process.env.NODE_ENV === "development"
}

function isDisallowedHostname(hostname: string) {
  const normalized = normalizeHostname(hostname)
  if (!normalized) return true
  if (LOCAL_HOSTNAMES.has(normalized)) return true
  if (normalized.endsWith(".local") || normalized.endsWith(".internal")) return true

  const ipVersion = isIP(normalized)
  if (ipVersion === 4) return isPrivateIPv4(normalized)
  if (ipVersion === 6) return isPrivateIPv6(normalized)

  return false
}

export function validateThirdPartyMcpServerUrl(rawUrl: string) {
  let parsed: URL

  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error("Invalid MCP server URL")
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only HTTP(S) MCP server URLs are allowed")
  }

  if (isDisallowedHostname(parsed.hostname) && !(allowLoopbackMcpUrls() && isLoopbackHostname(parsed.hostname))) {
    throw new Error("Local or private-network MCP server URLs are not allowed")
  }

  return parsed
}

function safeServerNameForSlug(appSlug: string) {
  return `mcp_${appSlug.replace(/[^a-zA-Z0-9_]/g, "_")}`
}

function safeToolName(toolName: string) {
  return toolName.replace(/[^a-zA-Z0-9_]/g, "_")
}

function toScopeKey(userId: string, appSlug: string) {
  return `${userId}:${appSlug}`
}

function buildAuthHeaders(binding: Pick<ThirdPartyMcpBindingRecord, "authType" | "authToken">) {
  if (binding.authType !== "bearer" || !binding.authToken) {
    return undefined
  }

  return {
    Authorization: `Bearer ${binding.authToken}`,
  }
}

export class ThirdPartyMcpService {
  private readonly clientCache = new Map<string, MCPClient>()
  private readonly scopeCacheKeys = new Map<string, string>()

  async getBindingForUserApp(
    userId: string,
    appSlug: string,
    options?: { includeInactive?: boolean }
  ) {
    const whereClause = options?.includeInactive
      ? and(eq(thirdPartyMcpBinding.userId, userId), eq(thirdPartyMcpBinding.appSlug, appSlug))
      : and(
          eq(thirdPartyMcpBinding.userId, userId),
          eq(thirdPartyMcpBinding.appSlug, appSlug),
          eq(thirdPartyMcpBinding.isActive, true)
        )

    return db.query.thirdPartyMcpBinding.findFirst({
      where: whereClause,
    })
  }

  async upsertBinding(input: {
    userId: string
    appSlug: string
    serverUrl: string
    authType: ThirdPartyMcpAuthType
    authToken?: string
    metadata?: Record<string, unknown>
  }) {
    const existing = await this.getBindingForUserApp(input.userId, input.appSlug, {
      includeInactive: true,
    })
    const validatedUrl = validateThirdPartyMcpServerUrl(input.serverUrl)
    const nextToken = this.resolveAuthToken({
      authType: input.authType,
      authToken: input.authToken,
      existing,
    })
    const now = new Date()

    await db
      .insert(thirdPartyMcpBinding)
      .values({
        userId: input.userId,
        appSlug: input.appSlug,
        serverUrl: validatedUrl.toString(),
        authType: input.authType,
        authToken: nextToken,
        isActive: true,
        metadata: input.metadata ?? {},
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [thirdPartyMcpBinding.userId, thirdPartyMcpBinding.appSlug],
        set: {
          serverUrl: validatedUrl.toString(),
          authType: input.authType,
          authToken: nextToken,
          isActive: true,
          metadata: input.metadata ?? {},
          updatedAt: now,
        },
      })

    await this.clearScopeCache(toScopeKey(input.userId, input.appSlug))

    const binding = await this.getBindingForUserApp(input.userId, input.appSlug)
    if (!binding) {
      throw new Error("Failed to load saved third-party MCP binding")
    }

    return binding
  }

  async deactivateBinding(userId: string, appSlug: string) {
    const existing = await this.getBindingForUserApp(userId, appSlug, {
      includeInactive: true,
    })

    if (!existing) {
      return false
    }

    await db
      .update(thirdPartyMcpBinding)
      .set({
        isActive: false,
        authToken: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(thirdPartyMcpBinding.userId, userId),
          eq(thirdPartyMcpBinding.appSlug, appSlug)
        )
      )

    await this.clearScopeCache(toScopeKey(userId, appSlug))
    return true
  }

  async listToolsForAgent(
    userId: string,
    appSlug: string
  ): Promise<Record<string, Tool<unknown, unknown, unknown, unknown>>> {
    const scopeKey = toScopeKey(userId, appSlug)
    const binding = await this.getBindingForUserApp(userId, appSlug)

    if (!binding) {
      await this.clearScopeCache(scopeKey)
      return {}
    }

    const clientKey = `${binding.id}:${binding.updatedAt.toISOString()}`
    const serverName = safeServerNameForSlug(binding.appSlug)
    await this.pruneScopeCache(scopeKey, clientKey)

    let client = this.clientCache.get(clientKey)
    if (!client) {
      const headers = buildAuthHeaders(binding)

      client = new MCPClient({
        id: clientKey,
        timeout: MCP_TIMEOUT_MS,
        servers: {
          [serverName]: {
            url: validateThirdPartyMcpServerUrl(binding.serverUrl),
            connectTimeout: MCP_CONNECT_TIMEOUT_MS,
            fetch: headers
              ? async (url, init) => {
                  const nextHeaders = new Headers(init?.headers)
                  for (const [key, value] of Object.entries(headers)) {
                    nextHeaders.set(key, value)
                  }

                  return fetch(url, {
                    ...init,
                    headers: nextHeaders,
                  })
                }
              : undefined,
          },
        },
      })
      this.clientCache.set(clientKey, client)
    }

    const { toolsets, errors } = await client.listToolsetsWithErrors()
    const namespacedTools = toolsets[serverName] ?? {}

    if (errors[serverName]) {
      console.warn(
        `[third-party-mcp] Failed to connect MCP server for user=${userId} app=${appSlug}: ${errors[serverName]}`
      )
    }

    return Object.fromEntries(
      Object.entries(namespacedTools).map(([toolName, tool]) => [
        `${serverName}__${safeToolName(toolName)}`,
        tool,
      ])
    )
  }

  private resolveAuthToken(input: {
    authType: ThirdPartyMcpAuthType
    authToken?: string
    existing: ThirdPartyMcpBindingRecord | undefined
  }) {
    if (input.authType === "none") {
      return null
    }

    const nextToken = input.authToken?.trim()
    if (nextToken) {
      return nextToken
    }

    if (input.existing?.authType === "bearer" && input.existing.authToken) {
      return input.existing.authToken
    }

    throw new Error("authToken is required when authType is bearer")
  }

  private async pruneScopeCache(scopeKey: string, nextClientKey: string) {
    const previousClientKey = this.scopeCacheKeys.get(scopeKey)
    this.scopeCacheKeys.set(scopeKey, nextClientKey)

    if (!previousClientKey || previousClientKey === nextClientKey) {
      return
    }

    await this.disconnectClient(previousClientKey)
  }

  private async clearScopeCache(scopeKey: string) {
    const previousClientKey = this.scopeCacheKeys.get(scopeKey)
    this.scopeCacheKeys.delete(scopeKey)

    if (!previousClientKey) {
      return
    }

    await this.disconnectClient(previousClientKey)
  }

  private async disconnectClient(clientKey: string) {
    const client = this.clientCache.get(clientKey)
    this.clientCache.delete(clientKey)

    if (!client) {
      return
    }

    try {
      await client.disconnect()
    } catch (error) {
      console.warn(`[third-party-mcp] Failed to disconnect cached MCP client ${clientKey}`, error)
    }
  }
}

export const thirdPartyMcpService = new ThirdPartyMcpService()
