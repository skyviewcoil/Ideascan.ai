// Deterministic 0–100 score per section, weighted into a total.
// Formulas are intentionally simple so they can be printed in a spec or a
// test. Narrative for each section lives in narrative.ts.

import type { NormalizedAnswers, SectionScores, Signals } from "./types";

const SECTION_WEIGHTS = {
  problem: 0.18,
  market: 0.16,
  differentiation: 0.14,
  monetization: 0.14,
  distribution: 0.14,
  execution: 0.1,
  founder_fit: 0.14,
} as const;

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function painToScore(pain: Signals["problem_pain"]): number {
  // 1 → 10, 2 → 30, 3 → 55, 4 → 80, 5 → 95, 0 → 0
  return [0, 10, 30, 55, 80, 95][pain] ?? 0;
}

function frequencyToScore(f: Signals["problem_frequency_score"]): number {
  // rare → 20, monthly → 50, weekly → 75, daily → 90, constant → 95
  return [20, 50, 75, 90, 95][f] ?? 20;
}

function paymentToScore(p: Signals["payment_signal_score"]): number {
  return [20, 45, 70, 90][p] ?? 20;
}

function audienceToScore(a: Signals["audience_specificity"]): number {
  return { vague: 20, sector: 55, specific: 80, named: 95 }[a];
}

function acquisitionToScore(
  v: 0 | 1 | 2 | 3,
  ladder: readonly [number, number, number, number],
): number {
  return ladder[v];
}

function skillToScore(v: 0 | 1 | 2 | 3): number {
  return [15, 45, 75, 95][v];
}

function hoursToScore(h: Signals["time_capacity"]): number {
  switch (h) {
    case "low":
      return 10;
    case "medium":
      return 45;
    case "high":
      return 75;
    case "full":
      return 95;
    default:
      return 25;
  }
}

function copyToScore(c: Signals["copy_risk"]): number {
  switch (c) {
    case "high":
      return 30;
    case "medium":
      return 60;
    case "low":
      return 90;
    default:
      return 40;
  }
}

function textQuality(s: string, minWords = 4): number {
  const words = s.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 0;
  if (words < minWords) return 25;
  if (words < minWords * 2) return 55;
  if (words < minWords * 4) return 80;
  return 95;
}

function problemScore(s: Signals, n: NormalizedAnswers): number {
  const pain = painToScore(s.problem_pain);
  const freq = frequencyToScore(s.problem_frequency_score);
  const consequence = textQuality(n.problem_consequence, 5);
  const core = textQuality(n.core_problem, 6);
  return clamp(0.4 * pain + 0.35 * freq + 0.15 * consequence + 0.1 * core);
}

function marketScore(s: Signals, n: NormalizedAnswers): number {
  const payment = paymentToScore(s.payment_signal_score);
  const audience = audienceToScore(s.audience_specificity);
  const sizeText = textQuality(n.market_size_estimate, 4);
  const trigger = textQuality(n.trigger_moment, 5);
  return clamp(0.4 * payment + 0.3 * audience + 0.15 * sizeText + 0.15 * trigger);
}

function differentiationScore(s: Signals, n: NormalizedAnswers): number {
  const copy = copyToScore(s.copy_risk);
  const diffQuality = textQuality(n.differentiator, 6);
  const whyBuyQuality = textQuality(n.why_buy_from_you, 6);
  const noCompetitorsPenalty = s.claims_no_competitors ? -10 : 0;
  return clamp(0.4 * copy + 0.3 * diffQuality + 0.3 * whyBuyQuality + noCompetitorsPenalty);
}

function monetizationScore(s: Signals, n: NormalizedAnswers): number {
  let score = 20;
  if (s.has_revenue_model) score += 25;
  if (n.pricing_model) score += 20;
  if (n.price_point_numeric !== null) score += 20;
  score += Math.round(0.15 * textQuality(n.first_payment_requirements, 5));
  return clamp(score);
}

function distributionScore(s: Signals): number {
  const ladder10 = [20, 50, 75, 90] as const;
  const ladder100 = [15, 45, 70, 85] as const;
  return clamp(
    0.55 * acquisitionToScore(s.acquisition_clarity_10, ladder10) +
      0.45 * acquisitionToScore(s.acquisition_clarity_100, ladder100),
  );
}

function executionScore(s: Signals, n: NormalizedAnswers): number {
  let score = 0;
  score += s.mvp_scope === "concierge" || s.mvp_scope === "manual" ? 30 : 10;
  score += textQuality(n.manual_first_version, 5) * 0.2;
  score += textQuality(n.first_payment_requirements, 5) * 0.2;
  score += textQuality(n.riskiest_assumption, 5) * 0.15;
  score += textQuality(n.first_14_days_test, 5) * 0.15;
  return clamp(score);
}

function founderFitScore(s: Signals, n: NormalizedAnswers): number {
  const domain = skillToScore(s.founder_domain_level);
  const sales = skillToScore(s.founder_sales_level);
  const build = skillToScore(s.founder_build_level);
  const hours = hoursToScore(s.time_capacity);
  const assets = Math.min(20, n.founder_assets.length * 8);
  const advantage = s.founder_advantage === "strong" ? 20 : s.founder_advantage === "weak" ? 8 : 0;
  return clamp(
    0.25 * domain + 0.2 * sales + 0.15 * build + 0.25 * hours + 0.1 * assets + 0.05 * advantage,
  );
}

export function calculateScores(signals: Signals, normalized: NormalizedAnswers): SectionScores {
  const problem = problemScore(signals, normalized);
  const market = marketScore(signals, normalized);
  const differentiation = differentiationScore(signals, normalized);
  const monetization = monetizationScore(signals, normalized);
  const distribution = distributionScore(signals);
  const execution = executionScore(signals, normalized);
  const founder_fit = founderFitScore(signals, normalized);

  const w = SECTION_WEIGHTS;
  const total = clamp(
    problem * w.problem +
      market * w.market +
      differentiation * w.differentiation +
      monetization * w.monetization +
      distribution * w.distribution +
      execution * w.execution +
      founder_fit * w.founder_fit,
  );

  return {
    problem,
    market,
    differentiation,
    monetization,
    distribution,
    execution,
    founder_fit,
    total,
  };
}

export { SECTION_WEIGHTS };
