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

## Best Examples
- <path>: <why it matters>

## References to Load When Needed
- <reference-name>: <when to load this deeper template or example>

## Guardrails
- Treat these rules as defaults unless the user explicitly overrides them for this task.
- If a new signal conflicts but is still weak, keep this skill unchanged and record only a candidate.
`

export const PREFERENCE_MEMORY_MAINTAINER_CONTENT = `# Preference Memory Maintainer

Use this skill when the task touches the user's preferred way of writing, structuring, naming, formatting, planning, or operating inside an app.

Your job is to learn stable preferences without flooding AFS or rewriting official guidance after one weak signal.

## Scope Resolution

- Use \`Desktop/...\` for desktop-global work.
- Use \`Desktop/<Scope>/...\` for app-specific work such as Canvas, Logo, or VibeCoding.
- Keep one official preference profile and one official \`${PREFERRED_WORKSTYLE_SKILL_NAME}\` skill per scope.

## Canonical Paths

- Official profile: \`Desktop/<Scope>/Memory/user/preference-profile\`
- Candidate evidence: \`Desktop/<Scope>/Memory/note/preference-candidates/<dimension>-<slug>\`
- Best examples: \`Desktop/<Scope>/Memory/note/best-examples/<dimension>-<slug>\`
- Official skill: \`Desktop/<Scope>/Skill/${PREFERRED_WORKSTYLE_SKILL_NAME}\`

For Desktop scope, omit the extra scope segment:

- \`${buildPreferenceProfilePath("Desktop")}\`
- \`${buildPreferenceCandidatesDir("Desktop")}/<dimension>-<slug>\`
- \`${buildBestExamplesDir("Desktop")}/<dimension>-<slug>\`
- \`${buildPreferredWorkstyleSkillPath("Desktop")}\`

## Strong Preference Signals

- The user explicitly says a style should be reused later.
- The user keeps or reuses a certain format across multiple tasks.
- The user corrects a generated result toward the same pattern more than once.
- A specific example is clearly marked as the reference to follow later.

## Weak Signals

- A one-off request tied to a single task.
- A format implied by the task, but not by the user's long-term preference.
- A single example with no confirmation and no repeated reuse.

Weak signals can create candidates, but must not overwrite official guidance.

## Workflow

1. Read current state first.
   - Check whether \`${PREFERRED_WORKSTYLE_SKILL_NAME}\` already exists for the current scope.
   - Read the current \`preference-profile\` if it exists.
   - Search or list existing candidates/examples before writing a near-duplicate.

2. Record candidates conservatively.
   - Write candidate observations to \`preference-candidates/<dimension>-<slug>\`.
   - Include: dimension, summary, why this looks durable, and the source reference.

3. Save best examples only when they are genuinely representative.
   - Use \`best-examples/<dimension>-<slug>\`.
   - Store the example itself or a compact excerpt plus why it represents the preferred pattern.

4. Promote only when evidence is strong enough.
   Promote to official profile + official skill only when one of these is true:
   - the user explicitly confirms reuse later, or
   - the same preference appears at least twice with strong evidence, or
   - a best example is clearly reused in later work.

5. Handle conflicts conservatively.
   - If the new pattern conflicts with existing official guidance but evidence is still weak, keep the official skill unchanged.
   - Record only a candidate and, if useful, a best example.

## Writing Rules

- Do not write more than one new candidate and one new example for the same dimension in a single turn unless the user explicitly asked you to curate preferences.
- Keep candidate entries short and factual.
- Keep the official \`${PREFERRED_WORKSTYLE_SKILL_NAME}\` concise and executable.
- Do not paste long raw examples into the official skill. Reference best-example paths instead.
- If the workstyle has multiple templates or complex edge cases, move that material into skill references instead of expanding the base skill indefinitely.

## Skill Update Contract

When you update the official \`${PREFERRED_WORKSTYLE_SKILL_NAME}\` skill, update both:

- \`preference-profile\`
- \`${PREFERRED_WORKSTYLE_SKILL_NAME}\`

For the skill write, call \`afs_write\` on the official Skill path and pass skill metadata:

- \`metadata.description\`: short summary of the active workstyle
- \`metadata.triggerWhen\`: when the skill should be activated
- \`metadata.priority\`: use \`40\` unless a higher-priority scope rule is justified
- \`tags\`: include \`preference\`, \`workstyle\`, and a scope or dimension hint

Suggested trigger text:

- "当任务涉及该 scope 下用户偏好的格式、结构、命名、风格或操作习惯时"

## Reference Contract

Use skill references for heavy templates, multi-step examples, or domain-specific subtopics that would make the base \`${PREFERRED_WORKSTYLE_SKILL_NAME}\` too large.

- Keep the base skill short enough to guide decisions.
- Store detailed templates/examples as named references.
- Give each reference a stable \`referenceName\`, a short \`title\`, and a clear \`loadWhen\`.
- The base skill should mention which references exist and when to load them.
- When a task only needs one subtopic, load just that reference instead of the whole library.
- If \`skill-upsert-reference\` is available, use it to persist those deeper documents instead of expanding the base skill body.

## Official Skill Template

Use this structure for \`${PREFERRED_WORKSTYLE_SKILL_NAME}\`:

\`\`\`md
${PREFERRED_WORKSTYLE_TEMPLATE}
\`\`\`

## Safety Rules

- Never overwrite official guidance after a single weak signal.
- Never create duplicates if the same preference already exists.
- If the user gives a task-specific override, follow the override for that task without deleting long-term preferences unless the user clearly reframes their default.
`

export const PREFERENCE_MEMORY_MAINTAINER_SEED = {
  name: PREFERENCE_MEMORY_MAINTAINER_SKILL_NAME,
  description: PREFERENCE_MEMORY_MAINTAINER_DESCRIPTION,
  triggerWhen: PREFERENCE_MEMORY_MAINTAINER_TRIGGER,
  tags: PREFERENCE_MEMORY_MAINTAINER_TAGS,
  priority: PREFERENCE_MEMORY_MAINTAINER_PRIORITY,
  content: PREFERENCE_MEMORY_MAINTAINER_CONTENT,
} as const
