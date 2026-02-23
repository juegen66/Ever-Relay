# CopilotKit `useFrontendTool` Reference

Primary sources:
- https://docs.copilotkit.ai/reference/v2/hooks/useFrontendTool
- https://dev.to/copilotkit/ship-production-ready-ai-agents-in-minutes-not-months-a-complete-guide-for-devs-2nhm
- https://github.com/CopilotKit/CopilotKit/issues/2650
- https://www.copilotkit.ai/blog

Use this reference when registering client-side tools for CopilotKit agents.

## Core Purpose

Expose frontend capabilities (UI/state/browser-side actions) as callable tools for the agent through a React hook.

## Minimal Usage Pattern

```tsx
import { useFrontendTool } from "@copilotkit/react-core"
import z from "zod"

useFrontendTool({
  name: "askForConfirmation",
  description: "Ask user to confirm before execution",
  parameters: z.object({
    title: z.string(),
    message: z.string()
  }),
  handler: (args) => {
    // open modal, collect response, return result object
    return { approved: true, title: args.title }
  }
})
```

## Recommended Definition Rules

- Keep `name` action-oriented and stable.
- Write `description` as a concrete capability, not implementation detail.
- Define strict `parameters` schema.
- Keep `handler` deterministic and return serializable results.
- Keep side effects explicit (open modal, write state, call API).

## Version Compatibility Note

- Official CopilotKit update on June 16, 2025 announces `zod` support for `useFrontendTool` in `v1.50+`.
- Older behavior may differ. A CopilotKit maintainer note (issue #2650) states `useFrontendTool` can behave as a wrapper over `useCopilotAction` in older versions.

When debugging existing apps, check installed CopilotKit version before assuming schema behavior.

## Integration Checklist

- Tool is registered in a mounted React component.
- `name` matches prompt/tool invocation expectations.
- Schema validation errors are handled in UX.
- `handler` returns predictable structure consumed by the agent flow.
- Combine with `useHumanInTheLoop` when tool execution needs human approval.
