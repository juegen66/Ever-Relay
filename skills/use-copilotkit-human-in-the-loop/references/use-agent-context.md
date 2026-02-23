# CopilotKit `useAgentContext` Reference

Primary source:
- https://docs.copilotkit.ai/reference/v2/hooks/useAgentContext
- Direct LLM page: https://docs.copilotkit.ai/direct-to-llm/reference/hooks/use-agent-context

Use this hook to read and update shared agent state, especially in nested components.

## Core Usage

```tsx
const { state, setState } = useAgentContext({
  agentName: "trip_agent",
  initialState: { city: "", days: 0 }
})
```

## Type Definitions

```ts
type UseAgentContextOptions = {
  initialState?: Record<string, any>
  agentName?: string
}

type UseAgentContextReturn = {
  state: Record<string, any>
  setState: (
    partialState: Partial<Record<string, any>> | ((state: Record<string, any>) => Partial<Record<string, any>>)
  ) => void
}
```

## Behavior Notes

- Without `agentName`, it uses the nearest parent `useAgent` context.
- `setState` applies partial updates and merges into current state.
- If a key is set to `undefined`, that key is removed from state.

## Integration Checklist

- Use this hook in child components that should not own full agent lifecycle.
- Keep partial updates narrow and deliberate.
- Avoid storing non-serializable values in agent context state.
- Standardize key names to prevent context drift across components.
