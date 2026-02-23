# CopilotKit `useHumanInTheLoop` Reference

Source used:
- https://docs.copilotkit.ai/reference/v2/hooks/useHumanInTheLoop

This reference is a practical summary for implementation work. Prefer this file during coding, then verify final behavior in the official docs if APIs change.

## When To Use

Use this hook when an agent action must pause and wait for human approval, rejection, or argument edits before execution continues.

## Core Flow

1. Define an interruptible Copilot action.
2. Read HITL state from `useHumanInTheLoop()`.
3. When status is `EXECUTION_REQUESTED`, inspect `pending`.
4. Ask user for decision and call `respond(...)`.
5. Continue rendering based on status transitions.

## Return Values (Commonly Used)

- `status`: state of the HITL session.
- `respond(actionExecutionId, accept, args?)`: submit approve/reject decision.
- `actions`: list of actions in the current HITL session.
- `pending`: currently pending action (if any).
- `interrupt`: optional interrupt metadata.

Known statuses from docs:
- `RUNNING`
- `EXECUTION_REQUESTED`
- `ACCEPTED`
- `REJECTED`

## Options (Most Relevant)

- `noInterrupt?: boolean`
- `allowedAgentNames?: string[]`
- `runId?: string`
- `followUp?: string`
- `render?: (props) => ReactNode`
- `onRender?: (props) => ReactNode`

Use `allowedAgentNames` when multiple agents are active and only one should trigger HITL UI.

## Minimal Template

```tsx
import { useHumanInTheLoop } from "@copilotkit/react-core"

export function HumanGate() {
  const { status, pending, respond } = useHumanInTheLoop()

  if (status !== "EXECUTION_REQUESTED" || !pending) return null

  return (
    <div>
      <p>Action: {pending.name}</p>
      <button onClick={() => respond(pending.id, true)}>Approve</button>
      <button onClick={() => respond(pending.id, false)}>Reject</button>
    </div>
  )
}
```

## Args Editing Pattern

```tsx
const [editedArgs, setEditedArgs] = useState<Record<string, unknown>>({})

const approveWithArgs = () => {
  if (!pending) return
  respond(pending.id, true, editedArgs)
}
```

Use typed args instead of `Record<string, unknown>` whenever schema is known.

## Integration Checklist

- Action name is stable and unique enough for UI branching.
- Decision path uses `pending.id` when calling `respond`.
- Approve and reject paths are both tested.
- UI does not submit twice during in-flight response.
- Status changes are visible in logs for debugging.
