// Raw answers → strongly-typed, trimmed, enum-coerced view.
// Pure function; does not read storage or config beyond static lists.

import type { IdeaAnswer } from "@/types";
import type {
  CopyDifficulty,
  DomainLevel,
  FrequencyLevel,
  HoursLevel,
  NormalizedAnswers,
  PaymentSignal,
  PricingModel,
  SkillLevel,
} from "./types";

type Raw = Record<string, IdeaAnswer["value"] | undefined>;

function str(v: IdeaAnswer["value"] | undefined): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  return "";
}

function arr(v: IdeaAnswer["value"] | undefined): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string" && x.length > 0);
  return [];
}

function oneOf<T extends string>(
  v: IdeaAnswer["value"] | undefined,
  allowed: readonly T[],
): T | null {
  if (typeof v !== "string") return null;
  return (allowed as readonly string[]).includes(v) ? (v as T) : null;
}

function parseIntensity(v: IdeaAnswer["value"] | undefined): 1 | 2 | 3 | 4 | 5 | null {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  if (n >= 1 && n <= 5 && Number.isInteger(n)) return n as 1 | 2 | 3 | 4 | 5;
  return null;
}

// "290₪", "$50", "50$/חודש", "ILS 290" → 290. Currency-symbol aware; picks
// the first numeric token it can find, which is good enough for MVP.
function parsePrice(raw: string): number | null {
  if (!raw) return null;
  const match = raw.replace(/[,_]/g, "").match(/\d+(\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

const DOMAIN_LEVELS = ["none", "some", "deep", "expert"] as const;
const SKILL_LEVELS = ["low", "medium", "high", "expert"] as const;
const HOURS_LEVELS = ["lt5", "5_15", "15_30", "ft"] as const;
const FREQUENCY_LEVELS = ["rare", "monthly", "weekly", "daily", "constant"] as const;
const PAYMENT_SIGNALS = ["no", "indirect", "yes_low", "yes_high"] as const;
const PRICING_MODELS = [
  "subscription",
  "usage",
  "license",
  "service",
  "marketplace",
  "other",
] as const;
const COPY_DIFFICULTY = ["trivial", "easy", "moderate", "hard", "very_hard"] as const;

export function normalizeAnswers(raw: Raw): NormalizedAnswers {
  const price_point = str(raw.price_point);
  return {
    idea_name: str(raw.idea_name),
    idea_description: str(raw.idea_description),
    first_customer: str(raw.first_customer),
    core_problem: str(raw.core_problem),
    current_solution: str(raw.current_solution),
    differentiator: str(raw.differentiator),
    revenue_model: str(raw.revenue_model),

    founder_domain_experience: oneOf<DomainLevel & string>(
      raw.founder_domain_experience,
      DOMAIN_LEVELS,
    ),
    founder_sales_skill: oneOf<SkillLevel & string>(raw.founder_sales_skill, SKILL_LEVELS),
    founder_build_skill: oneOf<SkillLevel & string>(raw.founder_build_skill, SKILL_LEVELS),
    founder_weekly_hours: oneOf<HoursLevel & string>(raw.founder_weekly_hours, HOURS_LEVELS),
    founder_assets: arr(raw.founder_assets),
    founder_unfair_advantage: str(raw.founder_unfair_advantage),

    problem_intensity: parseIntensity(raw.problem_intensity),
    problem_frequency: oneOf<FrequencyLevel & string>(raw.problem_frequency, FREQUENCY_LEVELS),
    problem_consequence: str(raw.problem_consequence),
    existing_payment: oneOf<PaymentSignal & string>(raw.existing_payment, PAYMENT_SIGNALS),
    market_size_estimate: str(raw.market_size_estimate),
    trigger_moment: str(raw.trigger_moment),

    price_point,
    price_point_numeric: parsePrice(price_point),
    pricing_model: oneOf<PricingModel & string>(raw.pricing_model, PRICING_MODELS),
    direct_competitors: str(raw.direct_competitors),
    why_buy_from_you: str(raw.why_buy_from_you),
    first_10_customers: str(raw.first_10_customers),
    first_100_customers: str(raw.first_100_customers),
    ease_of_copy: oneOf<CopyDifficulty & string>(raw.ease_of_copy, COPY_DIFFICULTY),

    first_payment_requirements: str(raw.first_payment_requirements),
    manual_first_version: str(raw.manual_first_version),
    riskiest_assumption: str(raw.riskiest_assumption),
    first_14_days_test: str(raw.first_14_days_test),
    regulatory_risk: str(raw.regulatory_risk),
  };
}
