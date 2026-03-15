import { afs } from "@/server/afs"
import type { AfsNode } from "@/server/afs/types"

// ---------------------------------------------------------------------------
// Context Engineering Pipeline - Constructor
// 职责：从AFS中选择、排序、压缩上下文
// ---------------------------------------------------------------------------

export interface ConstructorConfig {
  /** 当前任务描述，用于相关性计算 */
  task: string
  /** Token预算（默认3000） */
  tokenBudget?: number
  /** 候选源路径 */
  sources: string[]
  /** 必须包含的路径（优先级最高） */
  requiredPaths?: string[]
  /** 选择策略 */
  strategy?: "relevance" | "recency" | "hybrid"
}

export interface ContextSegment {
  path: string
  content: string
  tokens: number
  relevance: number
  priority: "critical" | "high" | "normal" | "low"
  source: string
}

export interface ConstructedContext {
  segments: ContextSegment[]
  totalTokens: number
  coverage: number
  dropped: number
  reasoning: string[]
}

/**
 * 估算token数（粗略：1 token ≈ 4字符）
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * 上下文构造器
 *
 * 使用示例：
 *   const constructor = new ContextConstructor()
 *   const context = await constructor.build('user-123', {
 *     task: '预测用户下一步操作',
 *     sources: ['Desktop/Memory/user', 'Desktop/Memory/note'],
 *     tokenBudget: 3000
 *   })
 */
export class ContextConstructor {
  async build(userId: string, config: ConstructorConfig): Promise<ConstructedContext> {
    const budget = config.tokenBudget ?? 3000
    const strategy = config.strategy ?? "hybrid"

    // 1. 收集候选内容
    const candidates = await this.gatherCandidates(userId, config.sources)

    // 2. 评分
    const scored = await this.scoreRelevance(candidates, config.task, strategy)

    // 3. 排序
    const sorted = this.prioritize(scored, config.requiredPaths)

    // 4. 压缩到预算
    const packed = this.packIntoBudget(sorted, budget)

    // 5. 记录构造日志（可选）
    await this.logConstruction(userId, config, packed, sorted.length)

    return {
      segments: packed,
      totalTokens: packed.reduce((sum, s) => sum + s.tokens, 0),
      coverage: packed.length / sorted.length,
      dropped: sorted.length - packed.length,
      reasoning: packed.map((s) => `Selected ${s.path} (relevance: ${s.relevance})`),
    }
  }

  /**
   * 从AFS收集候选内容
   */
  private async gatherCandidates(userId: string, sources: string[]): Promise<ContextSegment[]> {
    const candidates: ContextSegment[] = []

    for (const sourcePath of sources) {
      try {
        const nodes = await afs.list(userId, sourcePath, { limit: 50 })

        for (const node of nodes) {
          if (node.type === "file" && node.content) {
            candidates.push({
              path: node.path,
              content: node.content,
              tokens: estimateTokens(node.content),
              relevance: 0,
              priority: this.inferPriority(node),
              source: sourcePath,
            })
          }
        }
      } catch {
        // 某个源可能不存在，跳过
        continue
      }
    }

    return candidates
  }

  /**
   * 从节点元数据推断优先级
   */
  private inferPriority(node: AfsNode): "critical" | "high" | "normal" | "low" {
    const confidence = node.metadata?.confidence ?? 50
    if (confidence >= 90) return "critical"
    if (confidence >= 70) return "high"
    if (confidence >= 40) return "normal"
    return "low"
  }

  /**
   * 计算相关性评分
   */
  private async scoreRelevance(
    candidates: ContextSegment[],
    task: string,
    strategy: string
  ): Promise<ContextSegment[]> {
    const taskLower = task.toLowerCase()
    const taskKeywords = taskLower.split(/\s+/).filter((k) => k.length > 2)

    return candidates.map((c) => {
      let score = 0
      const contentLower = c.content.toLowerCase()

      // 关键词匹配
      for (const kw of taskKeywords) {
        if (contentLower.includes(kw)) score += 10
      }

      // 来源加分
      if (c.path.includes("/Memory/user")) score += 20
      if (c.path.includes("/Memory/note")) score += 15
      if (c.path.includes("/History/")) score += 5

      // 访问频率（从AFS metadata）
      // 注意：这里无法直接获取，需要扩展AFS接口

      return { ...c, relevance: Math.min(100, score) }
    })
  }

  /**
   * 按优先级排序
   */
  private prioritize(
    candidates: ContextSegment[],
    requiredPaths?: string[]
  ): ContextSegment[] {
    return candidates.sort((a, b) => {
      // 必须的置顶
      const aRequired = requiredPaths?.some((p) => a.path.includes(p))
      const bRequired = requiredPaths?.some((p) => b.path.includes(p))
      if (aRequired && !bRequired) return -1
      if (bRequired && !aRequired) return 1

      // 按优先级
      const priorityMap = { critical: 4, high: 3, normal: 2, low: 1 }
      const priorityDiff = priorityMap[b.priority] - priorityMap[a.priority]
      if (priorityDiff !== 0) return priorityDiff

      // 按相关性
      return b.relevance - a.relevance
    })
  }

  /**
   * 打包到token预算
   */
  private packIntoBudget(sorted: ContextSegment[], budget: number): ContextSegment[] {
    const result: ContextSegment[] = []
    let usedTokens = 0

    // 预留500给系统prompt和格式开销
    const available = budget - 500

    for (const item of sorted) {
      if (usedTokens + item.tokens <= available) {
        result.push(item)
        usedTokens += item.tokens
      } else if (item.priority === "critical" && usedTokens < available * 0.9) {
        // 关键内容：做摘要
        const summary = this.summarize(item.content, available - usedTokens)
        result.push({
          ...item,
          content: summary,
          tokens: estimateTokens(summary),
        })
        usedTokens = available
      }
    }

    return result
  }

  /**
   * 内容摘要
   */
  private summarize(content: string, maxTokens: number): string {
    const maxChars = maxTokens * 4
    if (content.length <= maxChars) return content
    return content.slice(0, maxChars) + "... [truncated]"
  }

  /**
   * 记录构造日志（用于后续优化）
   */
  private async logConstruction(
    userId: string,
    config: ConstructorConfig,
    selected: ContextSegment[],
    totalCandidates: number
  ): Promise<void> {
    // 可以写入数据库，用于分析
    // 这里简化，只打印日志
    console.log("[ContextConstructor]", {
      userId,
      task: config.task,
      selected: selected.length,
      total: totalCandidates,
      coverage: `${((selected.length / totalCandidates) * 100).toFixed(1)}%`,
    })
  }
}

// ---------------------------------------------------------------------------
// Context Updater - 格式化并注入上下文
// ---------------------------------------------------------------------------

export interface UpdateConfig {
  format?: "plain" | "markdown" | "xml"
}

export class ContextUpdater {
  /**
   * 注入到prompt
   */
  inject(context: ConstructedContext, basePrompt: string, config?: UpdateConfig): string {
    const format = config?.format ?? "markdown"
    const contextBlock = this.formatContext(context, format)

    return `${basePrompt}\n\n## Context\n${contextBlock}`
  }

  /**
   * 注入为Mastra messages
   */
  toMessages(context: ConstructedContext): Array<{ role: "system"; content: string }> {
    return context.segments.map((seg) => ({
      role: "system" as const,
      content: `[${seg.path}] ${seg.content}`,
    }))
  }

  private formatContext(context: ConstructedContext, format: string): string {
    switch (format) {
      case "xml":
        return context.segments
          .map(
            (s) =>
              `<context path="${s.path}" relevance="${s.relevance}" priority="${s.priority}">\n${s.content}\n</context>`
          )
          .join("\n\n")

      case "plain":
        return context.segments.map((s) => `[${s.path}] ${s.content}`).join("\n\n")

      case "markdown":
      default:
        return context.segments
          .map((s) => `### ${s.path}\n**Relevance:** ${s.relevance}% | **Priority:** ${s.priority}\n\n${s.content}`)
          .join("\n\n---\n\n")
    }
  }
}

// ---------------------------------------------------------------------------
// Context Evaluator - 评估输出质量
// ---------------------------------------------------------------------------

export interface EvaluationResult {
  passed: boolean
  score: number
  issues: Array<{ type: string; message: string }>
  needsHumanReview: boolean
  suggestedAction: "continue" | "retry" | "escalate" | "reject"
}

export class ContextEvaluator {
  private thresholds = {
    pass: 70,
    humanReview: 50,
  }

  async evaluate(input: {
    task: string
    context: ConstructedContext
    output: string
  }): Promise<EvaluationResult> {
    const checks = await Promise.all([
      this.checkRelevance(input.task, input.output),
      this.checkCompleteness(input.output),
      this.checkSafety(input.output),
      this.checkConsistency(input.context, input.output),
    ])

    const totalScore = Math.round(checks.reduce((sum, c) => sum + c.score, 0) / checks.length)
    const issues = checks.flatMap((c) => c.issues)

    const needsHumanReview = totalScore < this.thresholds.humanReview || issues.some((i) => i.type === "unsafe")

    return {
      passed: totalScore >= this.thresholds.pass && issues.length === 0,
      score: totalScore,
      issues,
      needsHumanReview,
      suggestedAction: this.decideAction(totalScore, issues),
    }
  }

  private async checkRelevance(task: string, output: string) {
    const taskKeywords = task.toLowerCase().split(/\s+/).filter((k) => k.length > 2)
    const outputLower = output.toLowerCase()

    const matched = taskKeywords.filter((k) => outputLower.includes(k)).length
    const score = taskKeywords.length > 0 ? (matched / taskKeywords.length) * 100 : 50

    return {
      score,
      issues: score < 50 ? [{ type: "irrelevant", message: "输出与任务相关性较低" }] : [],
    }
  }

  private async checkCompleteness(output: string) {
    const isComplete = output.length > 50 && !output.includes("...") && !output.endsWith(",")
    return {
      score: isComplete ? 100 : 60,
      issues: !isComplete ? [{ type: "incomplete", message: "输出可能不完整" }] : [],
    }
  }

  private async checkSafety(output: string) {
    const unsafePatterns = [/api[_-]?key\s*[:=]/i, /password\s*[:=]/i, /<script/i, /eval\(/i]
    const found = unsafePatterns.some((p) => p.test(output))

    return {
      score: found ? 0 : 100,
      issues: found ? [{ type: "unsafe", message: "输出包含潜在不安全内容" }] : [],
    }
  }

  private async checkConsistency(context: ConstructedContext, output: string) {
    // 简单检查：输出是否与上下文矛盾
    // 实际可以用LLM做更复杂的检查
    const outputLower = output.toLowerCase()
    let contradictions = 0

    for (const seg of context.segments) {
      // 如果上下文说"喜欢A"，输出却说"讨厌A"
      // 这里简化处理，实际可以用语义匹配
      if (seg.content.includes("喜欢") && outputLower.includes("讨厌")) {
        contradictions++
      }
    }

    return {
      score: contradictions === 0 ? 100 : Math.max(0, 100 - contradictions * 20),
      issues: contradictions > 0 ? [{ type: "contradiction", message: `发现${contradictions}处潜在矛盾` }] : [],
    }
  }

  private decideAction(score: number, issues: Array<{ type: string }>): EvaluationResult["suggestedAction"] {
    if (score < 30 || issues.some((i) => i.type === "unsafe")) return "reject"
    if (score < 50) return "escalate"
    if (score < 70 || issues.length > 0) return "retry"
    return "continue"
  }
}

// ---------------------------------------------------------------------------
// 组合使用 - Pipeline Runner
// ---------------------------------------------------------------------------

export interface PipelineResult {
  success: boolean
  output?: string
  evaluation?: EvaluationResult
  error?: string
}

/**
 * 运行完整Pipeline
 *
 * 使用示例：
 *   const result = await runPipeline('user-123', {
 *     task: '预测用户下一步',
 *     sources: ['Desktop/Memory/user', 'Desktop/History/actions'],
 *     generate: async (prompt) => await agent.generate(prompt)
 *   })
 */
export async function runPipeline(
  userId: string,
  config: {
    task: string
    sources: string[]
    tokenBudget?: number
    basePrompt: string
    generate: (prompt: string) => Promise<string>
    maxRetries?: number
  }
): Promise<PipelineResult> {
  const constructor = new ContextConstructor()
  const updater = new ContextUpdater()
  const evaluator = new ContextEvaluator()

  let retries = 0
  const maxRetries = config.maxRetries ?? 1

  while (retries <= maxRetries) {
    try {
      // 1. 构造上下文
      const context = await constructor.build(userId, {
        task: config.task,
        sources: config.sources,
        tokenBudget: config.tokenBudget,
      })

      // 2. 注入到prompt
      const prompt = updater.inject(context, config.basePrompt)

      // 3. 生成输出
      const output = await config.generate(prompt)

      // 4. 评估
      const evaluation = await evaluator.evaluate({
        task: config.task,
        context,
        output,
      })

      // 5. 处理结果
      if (evaluation.suggestedAction === "continue") {
        return { success: true, output, evaluation }
      }

      if (evaluation.suggestedAction === "retry" && retries < maxRetries) {
        retries++
        continue
      }

      if (evaluation.suggestedAction === "escalate" || evaluation.suggestedAction === "reject") {
        return {
          success: false,
          error: `Quality check failed: ${evaluation.issues.map((i) => i.message).join(", ")}`,
          evaluation,
        }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Pipeline failed" }
    }
  }

  return { success: false, error: "Max retries exceeded" }
}
