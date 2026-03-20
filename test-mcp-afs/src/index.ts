import "./env"

import { MCPServer } from "@mastra/mcp"

import { memoryTools, skillTools } from "./tools"

const server = new MCPServer({
  id: "afs-demo",
  name: "Test MCP AFS",
  version: "1.0.0",
  description: "AFS Memory and Skill exposed as MCP tools for demo",
  instructions:
    "Use memory tools for path-based AFS Memory (Desktop/.../Memory/...). Use skill tools for listing, reading, and upserting skills.",
  tools: {
    ...memoryTools,
    ...skillTools,
  },
})

// Avoid top-level await: tsx may compile MCP entry as CJS (TLA unsupported).
void server.startStdio().catch((err) => {
  console.error(err)
  process.exit(1)
})
