/**
 * Seed afs_skill table with message-html-builder skill.
 *
 * Run: USER_ID=your-user-id pnpm db:seed-message-html-builder
 *
 * Uses USER_ID env var (required for production). Falls back to mastra-skill-test-user
 * when MASTRA_SKILL_TEST_USER_ID is set (for local testing).
 *
 * This skill is loaded by AfsSkillProcessor for Desktop Copilot when scope is Desktop.
 */

import { afsSkillService } from "@/server/afs/skill"

const MESSAGE_HTML_BUILDER_CONTENT = `# Message HTML Builder

Generate compact, polished, single-file HTML documents that are ready to render inside chatbot messages. Favor visual clarity, strong hierarchy, and lightweight interactivity without introducing build steps or framework code.

Use this skill proactively when HTML is the better answer format, even if the user did not explicitly ask for HTML.
When a \`render_artifact\` tool is available, prefer that tool over pasting raw HTML into the assistant message.

## Output Contract

- Always generate one complete HTML document.
- If a \`render_artifact\` tool is available, call it and pass the document in the \`html\` argument, with \`title\` when useful.
- When using \`render_artifact\`, do not paste the raw HTML into the assistant message. Keep the follow-up message brief.
- If no HTML-rendering tool is available, return the HTML document directly.
- Keep all required CSS and JavaScript inside the file, except for approved CDN imports.
- Do not output React, Vue, Next.js, JSX, TSX, or multi-file project structures.
- Do not rely on npm, bundlers, local assets, or a server runtime.

## Library Rules

- Always load Tailwind CSS from CDN for styling.
- Use ECharts only when the user request clearly needs a chart or data visualization.
- Do not load ECharts for non-chart requests.
- Prefer native HTML, CSS, and JavaScript for interaction logic.
- Add another CDN library only when it materially improves the result and the same outcome would be awkward with native JavaScript alone.
- Do not replace Tailwind or ECharts with other styling or charting libraries.

## Interaction Rules

- Default to static-first artifacts that remain readable even when scripts do not run.
- Use JavaScript as progressive enhancement when it improves comprehension or delight.
- Favor lightweight patterns such as tabs, toggles, hover states, expandable details, segmented views, sortable cards, animated counters, or chart controls.
- Keep interaction resilient: core content should remain understandable if scripts are stripped, blocked, or only run after explicit trust.
- Avoid noisy effects, heavy animation, or interaction that obscures information.

## Layout Rules

- Design for narrow, embedded containers first.
- Keep spacing, typography, and component density appropriate for a message bubble.
- Make the layout responsive without assuming full-page width.
- Give chart containers explicit dimensions so ECharts can initialize reliably.
- For chart-heavy outputs, include visible headings, labels, and summary text so the artifact still communicates value before scripts run.
- Use a clear visual direction instead of generic dashboard styling.

## Workflow

1. Determine whether the request is truly for embeddable chat HTML.
2. If the user did not ask for HTML explicitly, decide whether an HTML artifact would communicate the answer better than plain prose.
3. Check whether a \`render_artifact\`-style tool is available for inline HTML rendering.
4. Decide whether the content is chart-driven or non-chart.
5. Build a complete HTML document with Tailwind via CDN.
6. Add ECharts via CDN only if the request includes visualization needs.
7. Add small, meaningful JavaScript interactions only as enhancement over a readable static baseline.
8. If \`render_artifact\` is available, render through the tool instead of replying with raw HTML.
9. Check that the result can stand alone inside a chat message without additional setup.

## When to Decline or Redirect

- If the user is asking for a full website, app shell, or framework component, use a more general frontend skill instead.
- If the user wants a production app with a build pipeline, this skill is the wrong tool.
- If the environment clearly cannot load external CDNs, mention the limitation and degrade gracefully.

## Response Pattern

- If \`render_artifact\` is available, call it with the completed HTML and keep the assistant message short.
- If no such tool is available, return the final HTML immediately.
- Do not include setup instructions, dependency installation steps, or commentary before the document unless the user asks for them.

## Typical Triggers

- "Answer this in a more visual way."
- "Show this as something interactive in the chat."
- "Make an HTML card for a chatbot reply."
- "Create an interactive result widget for this chat response."
- "Build a small HTML dashboard that can render inline in a message."
- "Show this data as a polished chart in a single HTML file."
`

async function main() {
  const userId =
    process.env.USER_ID ??
    process.env.MASTRA_SKILL_TEST_USER_ID ??
    "mastra-skill-test-user"

  console.log(`Seeding message-html-builder skill for userId=${userId}...`)

  await afsSkillService.upsertSkill(userId, {
    agentId: null,
    scope: "Desktop",
    name: "message-html-builder",
    description:
      "Create self-contained single-file HTML for chatbot messages, inline cards, embeddable widgets, compact dashboards, and interactive reply content. Use when the response would be clearer, more visual, or more interactive as HTML than as plain text, especially for charts, data summaries, comparisons, process visuals, rich cards, or other vivid inline presentations. Always style with Tailwind CSS loaded from CDN. When the request involves charts, trends, proportions, comparisons, or other data visualizations, load ECharts from CDN and use it for the chart implementation.",
    triggerWhen:
      "当回复更适合以 HTML 图表、卡片、仪表盘等形式展示时",
    tags: ["html", "artifact", "chart", "dashboard"],
    content: MESSAGE_HTML_BUILDER_CONTENT,
    priority: 15,
    metadata: { source: "seed-script", purpose: "message-html-builder" },
  })

  console.log("  ✓ message-html-builder (Desktop, global)")
  console.log("\nDone. Run Desktop Copilot and ask for an HTML artifact to verify.")
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
