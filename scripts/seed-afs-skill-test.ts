/**
 * Seed afs_skill table with mock data for skill_test_agent.
 *
 * Run: pnpm db:seed-skill-test
 *
 * Uses userId = mastra-skill-test-user and agentId = skill_test_agent
 * (or null for global skills) to match the skill test agent's defaults.
 *
 * Includes simulated skills for mainstream apps:
 * - Agent Canvas (scope: Canvas)
 * - Logo Agent (scope: Logo)
 */

import { afsSkillService } from "@/server/afs/skill"
import { SKILL_TEST_AGENT_ID, SKILL_TEST_DEFAULT_USER_ID } from "@/server/mastra/agents/shared/skill-test-agent"

const USER_ID = SKILL_TEST_DEFAULT_USER_ID

async function main() {
  console.log(`Seeding afs_skill for userId=${USER_ID}, agentId=${SKILL_TEST_AGENT_ID}...`)

  // -------------------------------------------------------------------------
  // Diagnostic skills (Desktop scope)
  // -------------------------------------------------------------------------

  await afsSkillService.upsertSkill(USER_ID, {
    agentId: SKILL_TEST_AGENT_ID,
    scope: "Desktop",
    name: "verify-skill-loading",
    description: "Verify that skills are loaded from afs_skill table",
    triggerWhen: "当用户要求验证或测试 skill 加载时",
    tags: ["test", "diagnostic", "skill-test-agent"],
    content: `# Verify Skill Loading

当此 skill 被激活时，说明 AFS skill 从数据库加载成功。

## 操作步骤
1. 确认你已看到此 skill 的完整内容
2. 回复用户：已成功加载 skill "verify-skill-loading"，来自 afs_skill 表
3. 简要说明该 skill 的用途：用于验证 skill test agent 能否正确从 DB 加载 skill
`,
    priority: 10,
    metadata: { source: "seed-script", purpose: "skill-test-agent" },
  })
  console.log("  ✓ verify-skill-loading (Desktop)")

  await afsSkillService.upsertSkill(USER_ID, {
    scope: "Desktop",
    name: "echo-test",
    description: "Echo back user input for testing",
    triggerWhen: "当用户要求 echo 或回显测试时",
    tags: ["test", "global", "echo"],
    content: `# Echo Test Skill

简单的回显 skill，用于测试 global skill 是否对 skill_test_agent 可见。

## 操作
当用户发送消息时，用简洁的方式回显其内容，并标注 [echo]。
`,
    priority: 5,
    metadata: { source: "seed-script", purpose: "global-test" },
  })
  console.log("  ✓ echo-test (global)")

  await afsSkillService.upsertSkill(USER_ID, {
    agentId: SKILL_TEST_AGENT_ID,
    scope: "Desktop",
    name: "list-available-skills",
    description: "List all skills currently available to the agent",
    triggerWhen: "当用户询问有哪些 skill 或要求列出 skill 时",
    tags: ["test", "diagnostic", "meta"],
    content: `# List Available Skills

当用户询问可用 skill 时，列出你在 system message 中看到的 Available Skills 部分。

## 操作
1. 引用你收到的 skill 元数据（name + description）
2. 说明每个 skill 的 triggerWhen（如有）
3. 提醒用户可用 skill-activate 激活某个 skill 以加载完整指令
`,
    priority: 8,
    metadata: { source: "seed-script" },
  })
  console.log("  ✓ list-available-skills (Desktop)")

  // -------------------------------------------------------------------------
  // Agent Canvas 模拟 skills (scope: Canvas)
  // -------------------------------------------------------------------------

  await afsSkillService.upsertSkill(USER_ID, {
    agentId: SKILL_TEST_AGENT_ID,
    scope: "Canvas",
    name: "canvas-create-project",
    description: "创建新的 Canvas 画布项目",
    triggerWhen: "当用户要创建画布、新建项目、或开始白板时",
    tags: ["canvas", "agent-canvas", "project", "create"],
    content: `# Canvas 创建项目 Skill

模拟 Agent Canvas 的创建画布能力。

## 操作步骤
1. 确认用户想要创建新的 Canvas 项目
2. 询问项目标题（可选）和用途
3. 模拟创建流程：建议默认画布尺寸 1200x800
4. 回复：已模拟创建 Canvas 项目 "[标题]"，可在画布中添加节点、连线、便签等
`,
    priority: 7,
    metadata: { source: "seed-script", app: "agent-canvas" },
  })
  console.log("  ✓ canvas-create-project (Canvas)")

  await afsSkillService.upsertSkill(USER_ID, {
    agentId: SKILL_TEST_AGENT_ID,
    scope: "Canvas",
    name: "canvas-add-nodes",
    description: "在画布上添加节点、卡片或便签",
    triggerWhen: "当用户要在画布上添加元素、节点、卡片、便签时",
    tags: ["canvas", "agent-canvas", "nodes", "add"],
    content: `# Canvas 添加节点 Skill

模拟在 Agent Canvas 画布上添加各类节点。

## 操作步骤
1. 识别用户要添加的内容类型：文本节点、图片、代码块、链接等
2. 模拟添加节点到画布
3. 回复：已在画布添加 [类型] 节点，内容概要：[简要描述]
`,
    priority: 6,
    metadata: { source: "seed-script", app: "agent-canvas" },
  })
  console.log("  ✓ canvas-add-nodes (Canvas)")

  await afsSkillService.upsertSkill(USER_ID, {
    agentId: SKILL_TEST_AGENT_ID,
    scope: "Canvas",
    name: "canvas-organize-layout",
    description: "整理画布布局、分组、对齐",
    triggerWhen: "当用户要整理画布、分组、对齐、自动布局时",
    tags: ["canvas", "agent-canvas", "layout", "organize"],
    content: `# Canvas 整理布局 Skill

模拟 Agent Canvas 的布局整理能力。

## 操作步骤
1. 理解用户想要的布局方式：网格、分组、树状等
2. 模拟执行布局调整
3. 回复：已模拟整理画布布局，按 [布局类型] 排列
`,
    priority: 5,
    metadata: { source: "seed-script", app: "agent-canvas" },
  })
  console.log("  ✓ canvas-organize-layout (Canvas)")

  // -------------------------------------------------------------------------
  // Logo Agent 模拟 skills (scope: Logo)
  // -------------------------------------------------------------------------

  await afsSkillService.upsertSkill(USER_ID, {
    agentId: SKILL_TEST_AGENT_ID,
    scope: "Logo",
    name: "logo-draft-brand-brief",
    description: "起草品牌简介和设计需求",
    triggerWhen: "当用户要写品牌简介、品牌 brief、设计需求时",
    tags: ["logo", "logo-agent", "brand", "brief"],
    content: `# Logo 起草品牌简介 Skill

模拟 Logo Agent 的品牌 brief 起草能力。

## 操作步骤
1. 收集：品牌名、行业、目标受众、风格偏好、关键词
2. 结构化输出 brandBrief：companyName, industry, targetAudience, styleKeywords, tone
3. 回复：已起草品牌简介草稿，[简要摘要]，可调用 confirm_logo_brief 进入设计流程
`,
    priority: 8,
    metadata: { source: "seed-script", app: "logo-agent" },
  })
  console.log("  ✓ logo-draft-brand-brief (Logo)")

  await afsSkillService.upsertSkill(USER_ID, {
    agentId: SKILL_TEST_AGENT_ID,
    scope: "Logo",
    name: "logo-refine-philosophy",
    description: "提炼设计哲学和视觉语言",
    triggerWhen: "当用户要提炼设计哲学、视觉语言、品牌调性时",
    tags: ["logo", "logo-agent", "philosophy", "design"],
    content: `# Logo 提炼设计哲学 Skill

模拟 Logo Agent 的设计哲学提炼能力。

## 操作步骤
1. 基于品牌 brief 提炼 2-4 条设计哲学
2. 每条：理念 + 视觉表现方式
3. 回复：已提炼设计哲学，[要点列表]，可用于指导 logo 生成
`,
    priority: 7,
    metadata: { source: "seed-script", app: "logo-agent" },
  })
  console.log("  ✓ logo-refine-philosophy (Logo)")

  await afsSkillService.upsertSkill(USER_ID, {
    agentId: SKILL_TEST_AGENT_ID,
    scope: "Logo",
    name: "logo-export-assets",
    description: "导出 logo 资产（SVG、PNG、品牌指南）",
    triggerWhen: "当用户要导出 logo、下载、获取品牌资产时",
    tags: ["logo", "logo-agent", "export", "assets"],
    content: `# Logo 导出资产 Skill

模拟 Logo Agent 的 logo 资产导出能力。

## 操作步骤
1. 确认要导出的格式：logo_svg_full, logo_svg_icon, logo_png, brand_guidelines 等
2. 模拟导出流程
3. 回复：已模拟导出 [格式] 资产，可从 logo_design_assets 获取
`,
    priority: 6,
    metadata: { source: "seed-script", app: "logo-agent" },
  })
  console.log("  ✓ logo-export-assets (Logo)")

  console.log("\nDone. Seeded skills for:")
  console.log("  - Desktop: verify-skill-loading, echo-test, list-available-skills")
  console.log("  - Canvas (Agent Canvas): canvas-create-project, canvas-add-nodes, canvas-organize-layout")
  console.log("  - Logo (Logo Agent): logo-draft-brand-brief, logo-refine-philosophy, logo-export-assets")
  console.log("\nRun skill test agent and ask: '列出可用的 skills' or '验证 skill 加载'")
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
