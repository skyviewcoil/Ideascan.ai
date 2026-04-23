// Zod schemas for every structured AI exchange.
//
// Input schemas describe exactly what the server sends to the model — the
// AI is given the deterministic evaluation output and must narrate from
// it, not invent from prior knowledge.
//
// Output schemas are enforced by `client.messages.parse()`: the SDK rejects
// any response that doesn't match, so a malformed generation surfaces as
// an exception the caller can fall back on.

import { z } from "zod";

// ── shared enums ───────────────────────────────────────────
export const SectionKeySchema = z.enum([
  "problem",
  "market",
  "differentiation",
  "monetization",
  "distribution",
  "execution",
  "founder_fit",
]);

export const ConfidenceSchema = z.enum(["high", "medium", "low"]);
export const DecisionSchema = z.enum(["go", "refine", "validate_first", "not_now"]);
export const SeveritySchema = z.enum(["low", "medium", "high"]);
export const PhaseSchema = z.enum(["conversations", "pricing", "channel", "manual_sale"]);

// ── input: what the server sends to the model ──────────────
export const EvaluationInputSchema = z.object({
  idea: z.object({
    name: z.string(),
    category: z.string(),
    initial_market: z.string(),
    region: z.string(),
  }),
  normalized: z.record(z.string(), z.unknown()),
  signals: z.record(z.string(), z.unknown()),
  scores: z.object({
    problem: z.number(),
    market: z.number(),
    differentiation: z.number(),
    monetization: z.number(),
    distribution: z.number(),
    execution: z.number(),
    founder_fit: z.number(),
    total: z.number(),
  }),
  flags: z.array(
    z.object({
      id: z.string(),
      severity: SeveritySchema,
      title: z.string(),
      description: z.string(),
      related_section: SectionKeySchema,
    }),
  ),
  contradictions: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      related_questions: z.array(z.string()),
    }),
  ),
  confidence: ConfidenceSchema,
  decision: DecisionSchema,
});

// ── section insights output ────────────────────────────────
export const SectionInsightNarrativeSchema = z.object({
  section: SectionKeySchema,
  short_insight: z.string().min(1).max(400),
  key_warning: z.string().max(400).nullable(),
  positive_signal: z.string().max(400).nullable(),
});

export const SectionInsightsOutputSchema = z.object({
  insights: z.array(SectionInsightNarrativeSchema).length(7),
});

// ── final report narrative output ──────────────────────────
export const FinalReportNarrativeSchema = z.object({
  summary: z.string().min(1).max(1000),
  strengths: z.array(z.string().min(1).max(400)).min(2).max(5),
  weaknesses: z.array(z.string().min(1).max(400)).min(2).max(5),
  critical_assumption: z.string().min(1).max(800),
  why_not_ready_yet: z.string().max(800).nullable(),
  recommended_mvp: z.string().min(1).max(800),
});

// ── validation plan output ─────────────────────────────────
export const ValidationPhaseSchema = z.object({
  phase: PhaseSchema,
  day_range: z.string().min(1).max(60),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  outcome: z.string().min(1).max(400),
});

export const ValidationPlanOutputSchema = z.object({
  phases: z.array(ValidationPhaseSchema).length(4),
});

// ── aggregate AI narrative (all three merged) ──────────────
export const AINarrativeSchema = z.object({
  sections: SectionInsightsOutputSchema.nullable(),
  final: FinalReportNarrativeSchema.nullable(),
  validation: ValidationPlanOutputSchema.nullable(),
});

// ── inferred types (source of truth for callers) ───────────
export type EvaluationInput = z.infer<typeof EvaluationInputSchema>;
export type SectionInsightNarrative = z.infer<typeof SectionInsightNarrativeSchema>;
export type SectionInsightsOutput = z.infer<typeof SectionInsightsOutputSchema>;
export type FinalReportNarrative = z.infer<typeof FinalReportNarrativeSchema>;
export type ValidationPhase = z.infer<typeof ValidationPhaseSchema>;
export type ValidationPlanOutput = z.infer<typeof ValidationPlanOutputSchema>;
export type AINarrative = z.infer<typeof AINarrativeSchema>;
