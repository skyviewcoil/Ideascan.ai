// Public surface of the evaluation engine.
//
//   evaluate()     — raw answers → EvaluationResult (deterministic primitives).
//   buildReport()  — EvaluationResult + Idea [+ optional AI narrative] → Report.
//
// The engine remains I/O-free: no storage, no auth, no network. The AI
// narrative is an optional input, never an internal dependency — when
// it's missing or partial, deterministic text fills the gap.

import type { Idea, IdeaAnswer, Report } from "@/types";
import type { AINarrative } from "@/ai/schema";
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

export interface BuildReportOptions {
  is_stale?: boolean;
  generated_at?: string;
  narrative?: AINarrative | null;
}

export function buildReport(
  idea: Idea,
  rawAnswers: Record<string, IdeaAnswer["value"] | undefined>,
  options: BuildReportOptions = {},
): Report {
  const result = evaluate(rawAnswers);
  const { normalized, signals, scores, flags, contradictions, decision } = result;
  const ai = options.narrative ?? null;

  // Deterministic defaults — always computed, used when the AI slice for
  // this field is missing.
  const deterministicSummary = buildShortSummary(decision, scores, signals, flags, normalized);
  const deterministicStrengths = buildStrengths(scores, signals);
  const deterministicWeaknesses = buildWeaknesses(scores, signals, flags);
  const deterministicCritical = buildCriticalAssumption(normalized, flags);
  const deterministicRecommendation = buildRecommendation(decision, flags, normalized);
  const deterministicSections = buildSectionInsights(scores, signals);
  const deterministicPlan = buildValidationPlan(signals, normalized, flags);

  // Merge: AI output wins when present and validated. Deterministic
  // output is the unconditional floor. Sections, validation plan, and
  // the short summary merge at the field level; strengths/weaknesses
  // replace wholesale (AI returns full lists).
  const section_insights = ai?.sections
    ? deterministicSections.map((det) => {
        const aiInsight = ai.sections!.insights.find((x) => x.section === det.section);
        return aiInsight
          ? {
              ...det,
              note: aiInsight.short_insight,
              // Carry through the two narrative extras so the UI (or a
              // print/export path) can surface them without touching the
              // AI layer directly.
              key_warning: aiInsight.key_warning,
              positive_signal: aiInsight.positive_signal,
            }
          : det;
      })
    : deterministicSections;

  const validation_plan = ai?.validation
    ? ai.validation.phases
        .map((p, i) => ({
          id: `v_${p.phase}`,
          day_range: p.day_range,
          title: p.title,
          description: p.description,
          outcome: p.outcome,
          // Index preserved in id for deterministic React keys.
          _index: i,
        }))
        .map(({ _index: _unused, ...rest }) => rest)
    : deterministicPlan;

  const summary_short = ai?.final?.summary ?? deterministicSummary;
  const strengths = ai?.final?.strengths ?? deterministicStrengths;
  const weaknesses = ai?.final?.weaknesses ?? deterministicWeaknesses;
  const critical_assumption = ai?.final?.critical_assumption ?? deterministicCritical;
  // `recommendation` is the "next step" paragraph the user sees under
  // המלצה ישירה. `why_not_ready_yet` is null only when the decision is
  // `go` (per prompt contract), so preferring it routes non-go decisions
  // to the "what's missing" text and avoids the contradiction of
  // showing "build this MVP" under a `not_now` / `validate_first`
  // decision. `recommended_mvp` remains available on its own field for
  // any UI that wants to surface the concrete MVP suggestion.
  const recommendation =
    ai?.final?.why_not_ready_yet ?? ai?.final?.recommended_mvp ?? deterministicRecommendation;

  const narrative_source: "ai" | "deterministic" | "hybrid" = ai
    ? ai.sections && ai.final && ai.validation
      ? "ai"
      : "hybrid"
    : "deterministic";

  const report: Report = {
    id: `report_${idea.id}`,
    idea_id: idea.id,
    generated_at: options.generated_at ?? new Date().toISOString(),
    is_stale: options.is_stale ?? false,
    summary: {
      decision,
      total_score: scores.total,
      headline: buildHeadline(decision),
      short_summary: summary_short,
    },
    section_insights,
    strengths,
    weaknesses,
    critical_assumption,
    flags,
    contradictions,
    validation_plan,
    recommendation,
    narrative_source,
  };

  if (ai?.final?.why_not_ready_yet) report.why_not_ready_yet = ai.final.why_not_ready_yet;
  if (ai?.final?.recommended_mvp) report.recommended_mvp = ai.final.recommended_mvp;

  return report;
}

// Adapter — builds the AI-service input payload from an EvaluationResult.
// Kept here so callers don't assemble it by hand.
export function toEvaluationInput(idea: Idea, result: EvaluationResult) {
  return {
    idea: {
      name: idea.name,
      category: idea.category,
      initial_market: idea.initial_market,
      region: idea.region,
    },
    normalized: result.normalized as unknown as Record<string, unknown>,
    signals: result.signals as unknown as Record<string, unknown>,
    scores: result.scores,
    flags: result.flags.map((f) => ({
      id: f.id,
      severity: f.severity,
      title: f.title,
      description: f.description,
      related_section: f.related_section,
    })),
    contradictions: result.contradictions.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      related_questions: c.related_questions,
    })),
    confidence: result.confidence,
    decision: result.decision,
  };
}

export type { EvaluationResult } from "./types";
