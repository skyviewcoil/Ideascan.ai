// Engine-internal types. Not exported from the app surface; consumers
// should use the aggregate EvaluationResult or the buildReport() adapter.

import type { Contradiction, DecisionType, Flag, SectionKey } from "@/types";

export type DomainLevel = "none" | "some" | "deep" | "expert" | null;
export type SkillLevel = "low" | "medium" | "high" | "expert" | null;
export type HoursLevel = "lt5" | "5_15" | "15_30" | "ft" | null;
export type PaymentSignal = "no" | "indirect" | "yes_low" | "yes_high" | null;
export type PricingModel =
  | "subscription"
  | "usage"
  | "license"
  | "service"
  | "marketplace"
  | "other"
  | null;
export type CopyDifficulty = "trivial" | "easy" | "moderate" | "hard" | "very_hard" | null;
export type FrequencyLevel = "rare" | "monthly" | "weekly" | "daily" | "constant" | null;

// Stage 1 — strictly typed, normalized shape of the raw questionnaire.
export interface NormalizedAnswers {
  // Step 1
  idea_name: string;
  idea_description: string;
  first_customer: string;
  core_problem: string;
  current_solution: string;
  differentiator: string;
  revenue_model: string;

  // Step 2
  founder_domain_experience: DomainLevel;
  founder_sales_skill: SkillLevel;
  founder_build_skill: SkillLevel;
  founder_weekly_hours: HoursLevel;
  founder_assets: string[];
  founder_unfair_advantage: string;

  // Step 3
  problem_intensity: 1 | 2 | 3 | 4 | 5 | null;
  problem_frequency: FrequencyLevel;
  problem_consequence: string;
  existing_payment: PaymentSignal;
  market_size_estimate: string;
  trigger_moment: string;

  // Step 4
  price_point: string;
  price_point_numeric: number | null;
  pricing_model: PricingModel;
  direct_competitors: string;
  why_buy_from_you: string;
  first_10_customers: string;
  first_100_customers: string;
  ease_of_copy: CopyDifficulty;

  // Step 5
  first_payment_requirements: string;
  manual_first_version: string;
  riskiest_assumption: string;
  first_14_days_test: string;
  regulatory_risk: string;
}

// Stage 2 — structured semantic primitives derived from normalized answers.
// Numeric scales are 0..3 unless noted. Used by scoring, flags, and
// contradictions so each of those stays focused on its own rule set.
export interface Signals {
  audience_specificity: "vague" | "sector" | "specific" | "named";
  problem_pain: 0 | 1 | 2 | 3 | 4 | 5;
  problem_frequency_score: 0 | 1 | 2 | 3 | 4;
  payment_signal_score: 0 | 1 | 2 | 3;
  acquisition_clarity_10: 0 | 1 | 2 | 3;
  acquisition_clarity_100: 0 | 1 | 2 | 3;
  founder_advantage: "none" | "weak" | "strong";
  founder_domain_level: 0 | 1 | 2 | 3;
  founder_sales_level: 0 | 1 | 2 | 3;
  founder_build_level: 0 | 1 | 2 | 3;
  time_capacity: "low" | "medium" | "high" | "full" | "unknown";
  copy_risk: "low" | "medium" | "high" | "unknown";
  legal_risk: "none" | "unclear" | "present";
  mvp_scope: "concierge" | "manual" | "system" | "unclear";
  price_is_premium: boolean;
  claims_no_competitors: boolean;
  has_revenue_model: boolean;
  assumption_test_alignment: "aligned" | "misaligned" | "unknown";
  completeness_percent: number; // required questions answered / total required
}

export interface SectionScores {
  problem: number;
  market: number;
  differentiation: number;
  monetization: number;
  distribution: number;
  execution: number;
  founder_fit: number;
  total: number;
}

export type Confidence = "high" | "medium" | "low";

export interface EvaluationResult {
  normalized: NormalizedAnswers;
  signals: Signals;
  scores: SectionScores;
  flags: Flag[];
  contradictions: Contradiction[];
  confidence: Confidence;
  decision: DecisionType;
}

// Re-export the cross-boundary types so consumers can import everything
// from the engine without reaching into src/types.
export type { Contradiction, DecisionType, Flag, SectionKey };
