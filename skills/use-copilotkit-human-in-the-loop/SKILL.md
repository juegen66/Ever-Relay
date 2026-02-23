---
name: use-copilotkit-human-in-the-loop
description: Integrate and debug CopilotKit React hooks in React/Next.js apps, including `useFrontendTool`, `useHumanInTheLoop`, `useSuggestions`, `useAgent`, and `useAgentContext`. Use when tasks mention frontend tools callable by agents, tool schemas/handlers, approval-rejection gates, interrupted execution, agent state management, suggestion generation, or custom HITL rendering.
---

# Use Copilotkit Human In The Loop

Build robust CopilotKit hook flows on the frontend: define tools with `useFrontendTool`, orchestrate runs with `useAgent`, manage scoped state with `useAgentContext`, generate quick prompts with `useSuggestions`, and add review gates with `useHumanInTheLoop`.

## Workflow

1. Confirm scope
- Confirm project uses CopilotKit v2 hooks in React/Next.js.
- Confirm whether the task is:
  a) frontend tool registration, b) HITL approval flow, c) suggestion UX, d) agent run orchestration, e) shared agent context, or f) combined.

2. Register frontend tools
- Read API and examples first: `references/use-frontend-tool.md`.
- Define `name`, `description`, `parameters`, and `handler`.
- Keep tool names stable; downstream prompts and branching rely on exact names.

3. Add agent run/state hooks when needed
- Read `references/use-agent.md` and `references/use-agent-context.md`.
- Use `useAgent` for run lifecycle (`run`, `stop`, `running`) and scoped state.
- Use `useAgentContext` for nested component state access and controlled state patches.

4. Add suggestions for discoverability UX
- Read `references/use-suggestions.md`.
- Configure suggestion options (`instructions`, min/max, `availableSuggestions`).
- Use `setCurrentSuggestions`, `addSuggestions`, `removeSuggestion`, `clearSuggestions` for UI control.

5. Add HITL only when approval is required
- Configure an interruptible action/tool path that can pause for user decision.
- Read hook options before coding: `references/use-human-in-the-loop.md`.
- Return and use `status`, `pending`, `actions`, `respond`, and optional `interrupt`.

6. Build decision UI
- Render a clear approve/reject path and optional argument editor.
- On approve, call `respond(actionExecutionId, true, args?)`.
- On reject, call `respond(actionExecutionId, false, args?)` or `reject(...)` when available.

7. Gate by status
- Trigger handling only when `status === "EXECUTION_REQUESTED"`.
- Treat `RUNNING`, `ACCEPTED`, and `REJECTED` as separate UI states.

8. Verify behavior
- Validate frontend tool handler arguments and outputs.
- Validate `useAgent` run/stop behavior and state updates.
- Validate `useAgentContext` state patch behavior in child components.
- Validate suggestions insert/remove/clear flows.
- Validate one approve path and one reject path end-to-end.
- Validate follow-up behavior if `followUp` text is configured.

## Implementation Rules

- Prefer `zod` schema for `parameters` when using versions that support it.
- Use functional state updates for complex `useAgent` state transitions.
- Keep `useAgentContext` updates partial and explicit to avoid accidental overwrites.
- Keep suggestion text short, action-oriented, and aligned with available tools.
- Keep HITL handler logic in a small dedicated component or hook.
- Keep action IDs and run IDs explicit in logs for traceability.
- Avoid optimistic UI that assumes approval before callback completion.
- Preserve typed arguments; define a typed shape for `args` whenever possible.

## Troubleshooting

- `pending` is empty while expecting approval:
  Confirm action is configured to allow interruption and status is checked correctly.
- Callback never fires:
  Ensure `respond` is called with the current `pending.id`.
- Wrong action receives decision:
  Match by `pending.id`, not only by action name.

## References

- Load `references/use-frontend-tool.md` for tool registration and schema patterns.
- Load `references/use-agent.md` for run lifecycle and options.
- Load `references/use-agent-context.md` for shared state behavior.
- Load `references/use-suggestions.md` for suggestion management methods.
- Load `references/use-human-in-the-loop.md` for API signatures, status model, and templates.
