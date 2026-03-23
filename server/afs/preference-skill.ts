import type { AfsScope } from "@/server/db/schema"

export const PREFERENCE_MEMORY_MAINTAINER_SKILL_NAME = "preference-memory-maintainer"
export const PREFERRED_WORKSTYLE_SKILL_NAME = "preferred-workstyle"

export const PREFERENCE_MEMORY_MAINTAINER_DESCRIPTION =
  "Teach agents how to detect durable user-preference signals, store candidate evidence and best examples in AFS Memory, and maintain a scope-specific preferred-workstyle skill without introducing a backend orchestrator."

export const PREFERENCE_MEMORY_MAINTAINER_TRIGGER =
  "当任务涉及用户偏好的写法、结构、命名、排版、流程风格，或需要记录/更新最佳实践时"

export const PREFERENCE_MEMORY_MAINTAINER_TAGS = [
  "preference",
  "memory",
  "best-practice",
  "workstyle",
]

export const PREFERENCE_MEMORY_MAINTAINER_PRIORITY = 20

function scopeRoot(scope: AfsScope) {
  return scope === "Desktop" ? "Desktop" : `Desktop/${scope}`
}

export function buildPreferenceProfilePath(scope: AfsScope) {
  return `${scopeRoot(scope)}/Memory/user/preference-profile`
}

export function buildPreferenceCandidatesDir(scope: AfsScope) {
  return `${scopeRoot(scope)}/Memory/note/preference-candidates`
}

export function buildBestExamplesDir(scope: AfsScope) {
  return `${scopeRoot(scope)}/Memory/note/best-examples`
}

export function buildPreferredWorkstyleSkillPath(scope: AfsScope) {
  return `${scopeRoot(scope)}/Skill/${PREFERRED_WORKSTYLE_SKILL_NAME}`
}

export const PREFERRED_WORKSTYLE_TEMPLATE = `# Preferred Workstyle

## Scope
- Scope: <Desktop|Canvas|Logo|VibeCoding>
- Last updated: <ISO timestamp or brief date>

## Active Preferences
- <rule 1>
- <rule 2>
- <rule 3>

## Avoid
- <anti-pattern 1>
- <anti-pattern 2>

## Supporting Materials
- <Memory/skill/ path>: <brief description of what it contains>

## Guardrails
- Treat these rules as defaults unless the user explicitly overrides them for this task.
- If a new signal conflicts but is still weak, keep this skill unchanged and record only a candidate.
`

export const PREFERENCE_MEMORY_MAINTAINER_CONTENT = `# Preference Memory Maintainer

Use this skill when the task touches the user's preferred way of writing, structuring, naming, formatting, planning, or operating inside an app.

Your job is to learn stable preferences without flooding AFS or rewriting official guidance after one weak signal.

## AFS Storage Convention

AFS has three storage areas. Each area has a dedicated purpose — **never mix them up**.

| Area | Path pattern | Purpose | Writable |
|------|-------------|---------|----------|
| **Memory** | \`Desktop/<Scope>/Memory/<bucket>/<name>\` | Persistent knowledge & supporting materials | ✅ |
| **History** | \`Desktop/<Scope>/History/<bucket>/<name>\` | Immutable activity logs | ❌ Read-only |
| **Skill** | \`Desktop/<Scope>/Skill/<name>\` | Behavioral instruction sets for agents | ✅ |

### Memory Buckets

Memory has three buckets. **Always use the right bucket for the right content.**

| Bucket | Path | What goes here | What does NOT go here |
|--------|------|----------------|----------------------|
| \`user\` | \`Memory/user/<name>\` | Durable user facts & preferences (profile, habits) | Templates, examples, observations |
| \`note\` | \`Memory/note/<name>\` | Agent observations, candidates, episodic summaries | Templates, user profiles |
| \`skill\` | \`Memory/skill/<name>\` | Templates, checklists, detailed examples that support a skill | Preferences, observations |

### Skill vs Memory/skill — the critical distinction

- **\`Skill/<name>\`** = A standalone behavioral instruction set. It tells agents *how to behave*.
- **\`Memory/skill/<name>\`** = Supporting material (templates, checklists, examples) that a skill *references*. It is data, not behavior.

❌ WRONG — storing a template as a standalone skill:
\`\`\`
afs_write("Desktop/Logo/Skill/logo-direction-template", ...)
\`\`\`

✅ CORRECT — storing a template in the skill memory bucket:
\`\`\`
afs_write("Desktop/Logo/Memory/skill/logo-direction-template", ...)
\`\`\`

## Scope Resolution

- Use \`Desktop/...\` for desktop-global work.
- Use \`Desktop/<Scope>/...\` for app-specific work (Canvas, Logo, VibeCoding).
- Keep **one** official preference profile and **one** official \`${PREFERRED_WORKSTYLE_SKILL_NAME}\` skill per scope.

## Canonical Paths

| Item | Path |
|------|------|
| Official preference profile | \`Desktop/<Scope>/Memory/user/preference-profile\` |
| Candidate evidence | \`Desktop/<Scope>/Memory/note/preference-candidates/<dimension>-<slug>\` |
| Best examples | \`Desktop/<Scope>/Memory/note/best-examples/<dimension>-<slug>\` |
| Skill templates & checklists | \`Desktop/<Scope>/Memory/skill/<template-name>\` |
| Official skill | \`Desktop/<Scope>/Skill/${PREFERRED_WORKSTYLE_SKILL_NAME}\` |

For Desktop scope, omit the extra scope segment:

- \`${buildPreferenceProfilePath("Desktop")}\`
- \`${buildPreferenceCandidatesDir("Desktop")}/<dimension>-<slug>\`
- \`${buildBestExamplesDir("Desktop")}/<dimension>-<slug>\`
- \`Desktop/Memory/skill/<template-name>\`
- \`${buildPreferredWorkstyleSkillPath("Desktop")}\`

## Signal Classification

### Strong Signals — may promote to official guidance

- The user explicitly says a style should be reused later.
- The user keeps or reuses a certain format across multiple tasks.
- The user corrects a generated result toward the same pattern more than once.
- A specific example is clearly marked as the reference to follow later.

### Weak Signals — candidates only, never promote directly

- A one-off request tied to a single task.
- A format implied by the task, but not by the user's long-term preference.
- A single example with no confirmation and no repeated reuse.

## Workflow

1. **Read current state first.**
   - Check whether \`${PREFERRED_WORKSTYLE_SKILL_NAME}\` already exists for the current scope.
   - Read the current \`preference-profile\` if it exists.
   - Search or list existing candidates/examples before writing a near-duplicate.

2. **Record candidates conservatively** → \`Memory/note/preference-candidates/<dimension>-<slug>\`
   - Include: dimension, summary, why this looks durable, and the source reference.

3. **Save best examples only when genuinely representative** → \`Memory/note/best-examples/<dimension>-<slug>\`
   - Store the example itself or a compact excerpt plus why it represents the preferred pattern.

4. **Store templates & checklists separately** → \`Memory/skill/<template-name>\`
   - Heavy templates, multi-step examples, or domain-specific guides go here.
   - Reference them by path in the official skill's Supporting Materials section.

5. **Promote only when evidence is strong enough.**
   Promote to official profile + official skill only when:
   - the user explicitly confirms reuse later, OR
   - the same preference appears at least twice with strong evidence, OR
   - a best example is clearly reused in later work.

6. **Handle conflicts conservatively.**
   - If the new pattern conflicts with existing official guidance but evidence is still weak, keep the official skill unchanged.
   - Record only a candidate and, if useful, a best example.

## Writing Rules

- Do not write more than one new candidate and one new example for the same dimension in a single turn unless the user explicitly asked you to curate preferences.
- Keep candidate entries short and factual.
- Keep the official \`${PREFERRED_WORKSTYLE_SKILL_NAME}\` concise and executable — no long templates inline.
- Long templates, checklists, or detailed examples belong in \`Memory/skill/\`, never in the skill body or \`Memory/note/\`.

## Skill Update Contract

When you update the official \`${PREFERRED_WORKSTYLE_SKILL_NAME}\` skill, update **both**:

1. \`Memory/user/preference-profile\` — the official preference profile
2. \`Skill/${PREFERRED_WORKSTYLE_SKILL_NAME}\` — the official skill

For the skill write, call \`afs_write\` on the Skill path with metadata:

- \`metadata.description\`: short summary of the active workstyle
- \`metadata.triggerWhen\`: when the skill should be activated
- \`metadata.priority\`: use \`40\` unless a higher-priority scope rule is justified
- \`tags\`: include \`preference\`, \`workstyle\`, and a scope or dimension hint

Suggested trigger text: "当任务涉及该 scope 下用户偏好的格式、结构、命名、风格或操作习惯时"

## Official Skill Template

Use this structure for \`${PREFERRED_WORKSTYLE_SKILL_NAME}\`:

\`\`\`md
${PREFERRED_WORKSTYLE_TEMPLATE}
\`\`\`

## Safety Rules

- Never overwrite official guidance after a single weak signal.
- Never create duplicates if the same preference already exists.
- If the user gives a task-specific override, follow the override for that task without deleting long-term preferences unless the user clearly reframes their default.
- Templates and examples are NOT skills. Always store them in \`Memory/skill/\`, never as \`Skill/<name>\`.
`

export const PREFERENCE_MEMORY_MAINTAINER_SEED = {
  name: PREFERENCE_MEMORY_MAINTAINER_SKILL_NAME,
  description: PREFERENCE_MEMORY_MAINTAINER_DESCRIPTION,
  triggerWhen: PREFERENCE_MEMORY_MAINTAINER_TRIGGER,
  tags: PREFERENCE_MEMORY_MAINTAINER_TAGS,
  priority: PREFERENCE_MEMORY_MAINTAINER_PRIORITY,
  content: PREFERENCE_MEMORY_MAINTAINER_CONTENT,
} as const
