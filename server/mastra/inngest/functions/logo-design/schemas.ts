import { z } from "zod"

const logoSvgSetSchema = z.object({
  full: z.string().min(1),
  icon: z.string().min(1),
  wordmark: z.string().min(1),
})

export const logoConceptLockupTypeSchema = z.enum([
  "icon_only",
  "icon_with_wordmark",
  "wordmark_only",
])

export const logoConceptSchema = z.object({
  id: z.string().min(1),
  conceptType: logoConceptLockupTypeSchema,
  conceptName: z.string().min(1),
  rationaleMd: z.string().min(1),
  logoSvg: z.string().min(1),
})

export const logoConceptBlueprintSchema = z.object({
  conceptName: z.string().min(1),
  coreIdea: z.string().min(1),
  silhouetteStrategy: z.string().min(1),
  constructionPrinciples: z.array(z.string().min(1)).min(3).max(6),
  wordmarkDirection: z.string().min(1),
  colorStrategy: z.string().min(1),
  avoidMotifs: z.array(z.string().min(1)).max(8).optional(),
})

export const logoGenerationStageDebugSchema = z.object({
  initialStatus: z.enum(["success", "invalid", "error"]),
  repairAttempted: z.boolean(),
  repairStatus: z.enum(["not_attempted", "success", "invalid", "error"]),
  fallbackUsed: z.boolean(),
  failureReason: z.string().optional(),
  validationHint: z.string().optional(),
})

export const logoGenerationDebugSchema = z.object({
  fallbackUsed: z.boolean(),
  fallbackStrategy: z.string().optional(),
  blueprint: logoGenerationStageDebugSchema,
  lockups: logoGenerationStageDebugSchema,
})

export const logoBrandOutputSchema = z.object({
  conceptName: z.string().min(1),
  rationaleMd: z.string().min(1),
  logoSvg: logoSvgSetSchema,
  colorPalette: z.record(z.string(), z.unknown()).optional(),
  typography: z.record(z.string(), z.unknown()).optional(),
  brandGuidelines: z.string().optional(),
})

export const logoPosterOutputSchema = z.object({
  posterSvg: z.string().min(1),
  rationaleMd: z.string().optional(),
  philosophyMd: z.string().optional(),
})

export const logoDesignWorkflowInputSchema = z.object({
  runId: z.string().uuid(),
  userId: z.string().min(1),
  prompt: z.string().min(1),
  brandBrief: z.record(z.string(), z.unknown()).optional(),
})

export const logoDesignBriefOutputSchema = z.object({
  runId: z.string().uuid(),
  userId: z.string().min(1),
  prompt: z.string().min(1),
  brandBrief: z.record(z.string(), z.unknown()).optional(),
  logoBriefMarkdown: z.string().min(1),
  designPhilosophyMarkdown: z.string().min(1),
})

export const logoDesignConceptOutputSchema = z.object({
  runId: z.string().uuid(),
  userId: z.string().min(1),
  prompt: z.string().min(1),
  brandBrief: z.record(z.string(), z.unknown()).optional(),
  logoBriefMarkdown: z.string().min(1),
  designPhilosophyMarkdown: z.string().min(1),
  conceptBlueprint: logoConceptBlueprintSchema.optional(),
  generationDebug: logoGenerationDebugSchema.optional(),
  fallbackStrategy: z.string().optional(),
  logoConcepts: z.array(logoConceptSchema).min(3),
  selectedConceptId: z.string().min(1),
  brandOutput: logoBrandOutputSchema,
})

export const logoDesignPhilosophyOutputSchema = z.object({
  runId: z.string().uuid(),
  userId: z.string().min(1),
  prompt: z.string().min(1),
  brandBrief: z.record(z.string(), z.unknown()).optional(),
  logoBriefMarkdown: z.string().min(1),
  conceptBlueprint: logoConceptBlueprintSchema.optional(),
  generationDebug: logoGenerationDebugSchema.optional(),
  fallbackStrategy: z.string().optional(),
  logoConcepts: z.array(logoConceptSchema).min(3),
  selectedConceptId: z.string().min(1),
  brandOutput: logoBrandOutputSchema,
  designPhilosophyMarkdown: z.string().min(1),
})

export const logoDesignPosterOutputSchema = z.object({
  runId: z.string().uuid(),
  userId: z.string().min(1),
  prompt: z.string().min(1),
  brandBrief: z.record(z.string(), z.unknown()).optional(),
  logoBriefMarkdown: z.string().min(1),
  conceptBlueprint: logoConceptBlueprintSchema.optional(),
  generationDebug: logoGenerationDebugSchema.optional(),
  fallbackStrategy: z.string().optional(),
  logoConcepts: z.array(logoConceptSchema).min(3),
  selectedConceptId: z.string().min(1),
  brandOutput: logoBrandOutputSchema,
  designPhilosophyMarkdown: z.string().min(1),
  posterOutput: logoPosterOutputSchema,
})

export const logoDesignFinalOutputSchema = z.object({
  runId: z.string().uuid(),
  userId: z.string().min(1),
  prompt: z.string().min(1),
  logoBriefMarkdown: z.string().min(1),
  conceptBlueprint: logoConceptBlueprintSchema.optional(),
  generationDebug: logoGenerationDebugSchema.optional(),
  fallbackStrategy: z.string().optional(),
  logoConcepts: z.array(logoConceptSchema).min(3),
  selectedConceptId: z.string().min(1),
  designPhilosophyMarkdown: z.string().min(1),
  brandOutput: logoBrandOutputSchema,
  posterOutput: logoPosterOutputSchema,
})

export type LogoBrandOutput = z.infer<typeof logoBrandOutputSchema>
export type LogoConcept = z.infer<typeof logoConceptSchema>
export type LogoConceptBlueprint = z.infer<typeof logoConceptBlueprintSchema>
export type LogoConceptLockupType = z.infer<typeof logoConceptLockupTypeSchema>
export type LogoGenerationDebug = z.infer<typeof logoGenerationDebugSchema>
export type LogoGenerationStageDebug = z.infer<typeof logoGenerationStageDebugSchema>
export type LogoPosterOutput = z.infer<typeof logoPosterOutputSchema>
export type LogoDesignWorkflowInput = z.infer<typeof logoDesignWorkflowInputSchema>
export type LogoDesignBriefOutput = z.infer<typeof logoDesignBriefOutputSchema>
export type LogoDesignConceptOutput = z.infer<typeof logoDesignConceptOutputSchema>
export type LogoDesignPhilosophyOutput = z.infer<typeof logoDesignPhilosophyOutputSchema>
export type LogoDesignPosterOutput = z.infer<typeof logoDesignPosterOutputSchema>
export type LogoDesignFinalOutput = z.infer<typeof logoDesignFinalOutputSchema>
