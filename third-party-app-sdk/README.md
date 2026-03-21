# CloudOS Third-Party App SDK

Embed your web app in CloudOS inside an `iframe`. The host injects `cloudosWindowId` into your page URL; you use this SDK to **register tools** and receive **RPC calls** from the Copilot sidebar (`postMessage`).

## Protocol

- **Channel**: `cloudos:third-party:rpc`
- **Envelope**: `{ channel, v: 1, type, appInstanceId, payload }`
- **Host → iframe**: `type: "call"` with `{ callId, toolName, args }`
- **Iframe → host**: `type: "register"` with `{ tools: [...] }`, `type: "result"` with `{ callId, ok, result? | error? }`, `type: "ready"`

Tool names exposed to the LLM are namespaced as `tp_<yourSlug>__<toolName>` (double underscore before the tool segment).

## Quick start (no bundler)

Serve a page from the same origin as CloudOS (or your registered URL) and load:

`/third-party-apps/sdk/cloudos-host-bridge.js`

```html
<script src="/third-party-apps/sdk/cloudos-host-bridge.js"></script>
<script>
  var id = CloudOSHostBridge.resolveAppInstanceId()
  var bridge = new CloudOSHostBridge({ appInstanceId: id })
  bridge.onTool("hello", function (args) {
    return { message: "Hi " + (args.name || "there") }
  })
  bridge.registerTools([
    {
      id: "hello",
      name: "hello",
      description: "Say hello",
      parameters: {
        type: "object",
        properties: { name: { type: "string", description: "Name" } },
      },
    },
  ])
  bridge.signalReady()
</script>
```

Register a manifest in the host (`useThirdPartyAppRegistry.getState().registerManifest({ slug, displayName, source: { type: "url", url } })`) or use the built-in demo (`tp_demo_weather`).

## TypeScript package

```bash
cd third-party-app-sdk && pnpm install && pnpm build
```

Import from `dist/` or copy `src/` into your project.

## Demo

See `examples/demo-weather/index.html` (mirrors `fronted/public/third-party-apps/demo-weather/index.html`).
