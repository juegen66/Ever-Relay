# CopilotKit `useSuggestions` Reference

Primary source:
- https://docs.copilotkit.ai/reference/v2/hooks/useSuggestions
- Direct LLM page: https://docs.copilotkit.ai/direct-to-llm/reference/hooks/use-suggestions

Use this hook to generate and manage suggested prompts for users.

## Core Usage

```tsx
const {
  suggestions,
  setCurrentSuggestions,
  addSuggestions,
  removeSuggestion,
  clearSuggestions
} = useSuggestions({
  instructions: "Provide concise prompts for project planning tasks",
  minSuggestions: 3,
  maxSuggestions: 8
})
```

## Type Definitions

```ts
type UseSuggestionsOptions = {
  instructions?: string
  minSuggestions?: number
  maxSuggestions?: number
  availableSuggestions?: string[]
}

type UseSuggestionsReturn = {
  suggestions: FrontendSuggestion[]
  setCurrentSuggestions: (suggestions: FrontendSuggestion[]) => void
  addSuggestions: (suggestions: FrontendSuggestion[]) => void
  removeSuggestion: (suggestion: FrontendSuggestion) => void
  clearSuggestions: () => void
}
```

## Behavior Notes

- `availableSuggestions` provides a fixed pool for selection/generation bias.
- `setCurrentSuggestions` replaces current suggestions.
- `addSuggestions` appends suggestions.
- `removeSuggestion` removes a specific suggestion item.
- `clearSuggestions` resets list to empty.

## Integration Checklist

- Keep `instructions` tightly aligned with current page/task context.
- Tune `minSuggestions` and `maxSuggestions` for UI density.
- Ensure suggestion click handlers map to chat input or agent run flow.
- Clear stale suggestions when route/context changes significantly.
