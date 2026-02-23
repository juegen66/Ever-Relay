# CopilotKit `useAgent` Reference

Primary source:
- https://docs.copilotkit.ai/reference/v2/hooks/useAgent
- Direct LLM page: https://docs.copilotkit.ai/direct-to-llm/reference/hooks/use-agent-hook

Use this hook to interact with an agent node and control state, execution, and cancellation.

## Core Usage

```tsx
const { state, setState, run, stop, running, nodeName } = useAgent({
  agentName: "trip_agent",
  initialState: { destination: "", budget: 0 },
  followUp: "What else should I include?",
  disableChat: true
})
```

## Type Definitions

```ts
type UseAgentOptions<T extends Message[] = Message[], S extends Record<string, any> = Record<string, any>> = {
  initialState?: Partial<S>
  agentName?: string
  followUp?: string
  disableChat?: boolean
}

type UseAgentReturn<T extends Message[] = Message[], S extends Record<string, any> = Record<string, any>> = {
  state: S
  setState: (
    stateOrUpdater:
      | S
      | ((prevState: S) => S)
  ) => void
  run: (
    message: string,
    options?: {
      hints?: Record<string, string>
      properties?: Record<string, any>
    }
  ) => Promise<T | undefined>
  stop: () => void
  running: boolean
  nodeName: string
}
```

## Behavior Notes

- Call `run(message, options?)` to trigger the agent.
- Use `hints` to guide execution with lightweight key-value cues.
- Use `properties` to pass execution metadata.
- `stop()` aborts currently running execution.
- `running` is the canonical busy flag for UI and button disabling.

## Integration Checklist

- Keep `agentName` explicit in multi-agent apps.
- Keep `initialState` minimal and serializable.
- Use functional `setState` for dependent updates.
- Disable duplicate submits while `running === true`.
