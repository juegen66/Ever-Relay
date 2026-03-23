import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, "..")
const devkitRoot = resolve(repoRoot, "..", "everrelay-third-party-sdk")
const publicAssetsTarget = resolve(repoRoot, "fronted/public/third-party-apps")

const command = process.argv[2]

const commands = {
  "demo-weather:dev": [["pnpm", ["demo-weather:dev"]]],
  "demo-weather:sync": [
    ["pnpm", ["build:demo-weather"]],
    ["pnpm", ["export:host-assets", "--", "--target", publicAssetsTarget]],
  ],
  "export:host-assets": [["pnpm", ["export:host-assets", "--", "--target", publicAssetsTarget]]],
  "build:sdk": [["pnpm", ["build:sdk"]]],
  "pack:sdk": [["pnpm", ["pack:sdk"]]],
  "test-mcp-afs:http": [["pnpm", ["test-mcp-afs:http"]]],
}

if (!command || !(command in commands)) {
  console.error(
    "Unknown third-party devkit command. Expected one of: demo-weather:dev, demo-weather:sync, export:host-assets, build:sdk, pack:sdk, test-mcp-afs:http."
  )
  process.exit(1)
}

if (!existsSync(devkitRoot)) {
  console.error(
    [
      `Missing sibling repository: ${devkitRoot}`,
      "Clone or move everrelay-third-party-sdk next to this repo, then run `pnpm install` inside it.",
    ].join("\n")
  )
  process.exit(1)
}

for (const [bin, args] of commands[command]) {
  await new Promise((resolveStep, rejectStep) => {
    const child = spawn(bin, args, {
      cwd: devkitRoot,
      stdio: "inherit",
      env: process.env,
    })

    child.on("exit", (code) => {
      if (code === 0) {
        resolveStep(undefined)
        return
      }

      rejectStep(new Error(`${bin} ${args.join(" ")} exited with code ${code ?? 1}`))
    })

    child.on("error", rejectStep)
  }).catch((error) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error(message)
    process.exit(1)
  })
}
