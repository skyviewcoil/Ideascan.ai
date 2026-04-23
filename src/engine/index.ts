// Public surface of the evaluation engine.
//
//   evaluate()     — raw answers → EvaluationResult (pure primitives only).
//   buildReport()  — EvaluationResult + Idea → Report (for the UI contract).
//
// The engine is I/O-free: no storage, no auth, no network. Swapping any
// rule body for an AI-generated equivalent later only requires changing
// the relevant module; callers keep the same signature.

import type { Idea, IdeaAnswer, Report } from "@/types";
import { normalizeAnswers } from "./normalize";
import { deriveSignals } from "./signals";
import { calculateScores } from "./scores";
import { detectFlags } from "./flags";
import { detectContradictions } from "./contradictions";
import { calculateConfidence } from "./confidence";
import { decideOutcome } from "./decision";
import {
  buildCriticalAssumption,
  buildHeadline,
  buildRecommendation,
  buildSectionInsights,
  buildShortSummary,
  buildStrengths,
  buildWeaknesses,
} from "./narrative";
import { buildValidationPlan } from "./validationPlan";
import type { EvaluationResult } from "./types";

export function evaluate(
  rawAnswers: Record<string, IdeaAnswer["value"] | undefined>,
): EvaluationResult {
  const normalized = normalizeAnswers(rawAnswers);
  const signals = deriveSignals(normalized);
  const scores = calculateScores(signals, normalized);
  const flags = detectFlags(signals, normalized);
  const contradictions = detectContradictions(signals, normalized);
  const confidence = calculateConfidence(signals, scores, flags);
  const decision = decideOutcome(scores, flags, confidence);
  return { normalized, signals, scores, flags, contradictions, confidence, decision };
}

export function buildReport(
  idea: Idea,
  rawAnswers: Record<string, IdeaAnswer["value"] | undefined>,
  options: { is_stale?: boolean; generated_at?: string } = {},
): Report {
  const result = evaluate(rawAnswers);
  const { normalized, signals, scores, flags, contradictions, decision } = result;

  return {
    id: `report_${idea.id}`,
    idea_id: idea.id,
    generated_at: options.generated_at ?? new Date().toISOString(),
    is_stale: options.is_stale ?? false,
    summary: {
      decision,
      total_score: scores.total,
      headline: buildHeadline(decision),
      short_summary: buildShortSummary(decision, scores, signals, flags, normalized),
    },
    section_insights: buildSectionInsights(scores, signals),
    strengths: buildStrengths(scores, signals),
    weaknesses: buildWeaknesses(scores, signals, flags),
    critical_assumption: buildCriticalAssumption(normalized, flags),
    flags,
    contradictions,
    validation_plan: buildValidationPlan(signals, normalized, flags),
    recommendation: buildRecommendation(decision, flags, normalized),
  };
}

export type { EvaluationResult } from "./types";
