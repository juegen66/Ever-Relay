import { z } from "zod"

const logoSvgSetSchema = z.object({
  full: z.string().min(1),
  icon: z.string().min(1),
  wordmark: z.string().min(1),
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

export const logoDesignPlanOutputSchema = z.object({
  runId: z.string().uuid(),
  userId: z.string().min(1),
  prompt: z.string().min(1),
  brandBrief: z.record(z.string(), z.unknown()).optional(),
  planText: z.string(),
  planJson: z.record(z.string(), z.unknown()).nullable(),
})

export const logoDesignBrandOutputSchema = z.object({
  runId: z.string().uuid(),
  userId: z.string().min(1),
  prompt: z.string().min(1),
  brandBrief: z.record(z.string(), z.unknown()).optional(),
  planText: z.string(),
  planJson: z.record(z.string(), z.unknown()).nullable(),
  brandOutput: logoBrandOutputSchema,
})

export const logoDesignPosterOutputSchema = z.object({
  runId: z.string().uuid(),
  userId: z.string().min(1),
  prompt: z.string().min(1),
  brandBrief: z.record(z.string(), z.unknown()).optional(),
  planText: z.string(),
  planJson: z.record(z.string(), z.unknown()).nullable(),
  brandOutput: logoBrandOutputSchema,
  posterOutput: logoPosterOutputSchema,
})

export const logoDesignPersistOutputSchema = z.object({
  runId: z.string().uuid(),
  userId: z.string().min(1),
  prompt: z.string().min(1),
  planText: z.string(),
  planJson: z.record(z.string(), z.unknown()).nullable(),
  brandOutput: logoBrandOutputSchema,
  posterOutput: logoPosterOutputSchema,
})

export type LogoBrandOutput = z.infer<typeof logoBrandOutputSchema>
export type LogoPosterOutput = z.infer<typeof logoPosterOutputSchema>
export type LogoDesignWorkflowInput = z.infer<typeof logoDesignWorkflowInputSchema>
export type LogoDesignPlanOutput = z.infer<typeof logoDesignPlanOutputSchema>
export type LogoDesignBrandOutput = z.infer<typeof logoDesignBrandOutputSchema>
export type LogoDesignPosterOutput = z.infer<typeof logoDesignPosterOutputSchema>
export type LogoDesignPersistOutput = z.infer<typeof logoDesignPersistOutputSchema>
