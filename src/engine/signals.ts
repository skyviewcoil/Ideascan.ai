// Normalized answers → semantic primitives used by every downstream stage.
// Text heuristics are intentionally simple and inspectable: length brackets
// plus keyword matches in Hebrew + English. Good enough for MVP gating; an
// AI pass can refine any specific signal later without changing callers.

import { QUESTIONS } from "@/config/questions";
import type { NormalizedAnswers, Signals } from "./types";

const REQUIRED_QUESTIONS = QUESTIONS.filter((q) => q.required);
const REQUIRED_TOTAL = REQUIRED_QUESTIONS.length;

// ── text utilities ─────────────────────────────────────────
function countWords(s: string): number {
  const t = s.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

function hasAny(s: string, needles: readonly string[]): boolean {
  const lower = s.toLowerCase();
  return needles.some((n) => lower.includes(n.toLowerCase()));
}

function hasDigit(s: string): boolean {
  return /\d/.test(s);
}

// ── keyword banks ──────────────────────────────────────────
const ROLE_TOKENS = [
  "cto",
  "ceo",
  "מנהל",
  "מנהלת",
  "ראש",
  "founder",
  "owner",
  "בעל",
  "מייסד",
  "head of",
  "vp",
  "מפתח",
  "מעצב",
  "יועץ",
];

const INDUSTRY_TOKENS = [
  "saas",
  "agency",
  "agencies",
  "סוכנות",
  "סוכנויות",
  "ecommerce",
  "retail",
  "logistics",
  "לוגיסטיקה",
  "health",
  "רפואה",
  "קליניק",
  "fintech",
  "education",
  "חינוך",
  "שיווק",
  "מכירות",
  "hr",
];

const ACQUISITION_CHANNELS = [
  "linkedin",
  "cold email",
  "outbound",
  "outreach",
  "seo",
  "content",
  "partnership",
  "שותפות",
  "community",
  "קהילה",
  "referral",
  "הפניה",
  "הפניות",
  "events",
  "כנס",
  "meetup",
  "ads",
  "פרסום",
  "webinar",
  "podcast",
];

const ACQUISITION_ACTIONS = [
  "contact",
  "reach",
  "partner",
  "publish",
  "post",
  "cold",
  "warm intro",
  "intro",
  "יצור קשר",
  "פנייה",
  "פניות",
  "פרסם",
  "אירגן",
  "ארגן",
  "מפגש",
];

const NO_COMPETITORS_PHRASES = [
  "אין מתחרים",
  "אין מתחרה",
  "אין תחרות",
  "לא מכיר מתחרים",
  "no competitors",
  "no competition",
  "nobody does this",
];

const LEGAL_TOKENS = [
  "regulation",
  "regulatory",
  "compliance",
  "gdpr",
  "hipaa",
  "רגולציה",
  "רגולטורי",
  "משפטי",
  "חוק",
  "רישוי",
  "ביטוח",
  "רשיון",
];

const MVP_MANUAL_TOKENS = [
  "concierge",
  "ידנית",
  "ידני",
  "manual",
  "whatsapp",
  "גוגל שיט",
  "google sheet",
  "excel",
  "אקסל",
  "airtable",
  "notion",
  "email",
  "מייל",
  "אישי",
];

const MVP_SYSTEM_TOKENS = [
  "system",
  "platform",
  "integration",
  "integrations",
  "מערכת",
  "פלטפורמה",
  "אינטגרציה",
  "api",
  "backend",
  "dashboard",
  "ai",
  "ml",
];

const ONESHOT_TOKENS = [
  "one-time",
  "one time",
  "חד פעמי",
  "חד־פעמי",
  "פרויקט",
  "project-based",
  "מסירה",
];

const SUBSCRIPTION_TOKENS = ["subscription", "מנוי", "חודשי", "monthly", "recurring", "חוזר"];

// ── individual signal derivations ──────────────────────────
function audienceSpecificity(text: string): Signals["audience_specificity"] {
  const t = text.trim();
  if (t.length < 10) return "vague";
  const hasRole = hasAny(t, ROLE_TOKENS);
  const hasIndustry = hasAny(t, INDUSTRY_TOKENS);
  const hasSize = /\b\d+[-–]\d+\b|\b\d{2,}\s*(employees|עובדים|people|אנשים)\b/i.test(t);
  if (hasRole && hasIndustry && hasSize) return "named";
  if (hasRole && hasIndustry) return "specific";
  if (hasIndustry || hasRole) return "sector";
  return "vague";
}

function acquisitionClarity(text: string): 0 | 1 | 2 | 3 {
  const t = text.trim();
  if (t.length < 30) return 0;
  let score = 1;
  if (hasAny(t, ACQUISITION_CHANNELS)) score += 1;
  if (hasAny(t, ACQUISITION_ACTIONS) || hasDigit(t)) score += 1;
  return Math.min(3, score) as 0 | 1 | 2 | 3;
}

function founderAdvantage(text: string): Signals["founder_advantage"] {
  const t = text.trim();
  if (t.length < 20) return "none";
  const specific = hasAny(t, ROLE_TOKENS) || hasAny(t, INDUSTRY_TOKENS) || hasDigit(t);
  if (t.length > 80 && specific) return "strong";
  return "weak";
}

function timeCapacity(hours: NormalizedAnswers["founder_weekly_hours"]): Signals["time_capacity"] {
  if (hours === "lt5") return "low";
  if (hours === "5_15") return "medium";
  if (hours === "15_30") return "high";
  if (hours === "ft") return "full";
  return "unknown";
}

function copyRisk(ease: NormalizedAnswers["ease_of_copy"]): Signals["copy_risk"] {
  if (ease === "trivial" || ease === "easy") return "high";
  if (ease === "moderate") return "medium";
  if (ease === "hard" || ease === "very_hard") return "low";
  return "unknown";
}

function legalRisk(text: string): Signals["legal_risk"] {
  const t = text.trim().toLowerCase();
  if (!t) return "unclear";
  // `\b` is ASCII-only in JS regex, so we match the first non-space token
  // explicitly — this is needed for Hebrew "אין" / "לא" / "ללא".
  const firstToken = t.split(/\s+/)[0]?.replace(/[.,!?]+$/, "") ?? "";
  const NEGATIVE = new Set(["אין", "ללא", "לא", "none", "no", "n/a", "na"]);
  if (NEGATIVE.has(firstToken) && t.length < 15) return "none";
  if (hasAny(t, LEGAL_TOKENS) || t.length > 30) return "present";
  return "unclear";
}

function mvpScope(manual: string, firstPayment: string): Signals["mvp_scope"] {
  const text = `${manual}\n${firstPayment}`;
  if (!text.trim()) return "unclear";
  const manualHits = MVP_MANUAL_TOKENS.filter((k) =>
    text.toLowerCase().includes(k.toLowerCase()),
  ).length;
  const systemHits = MVP_SYSTEM_TOKENS.filter((k) =>
    text.toLowerCase().includes(k.toLowerCase()),
  ).length;
  if (manualHits >= 2 && systemHits === 0) return "concierge";
  if (manualHits > systemHits) return "manual";
  if (systemHits > manualHits) return "system";
  return "unclear";
}

function problemFrequencyScore(
  freq: NormalizedAnswers["problem_frequency"],
): Signals["problem_frequency_score"] {
  switch (freq) {
    case "rare":
      return 0;
    case "monthly":
      return 1;
    case "weekly":
      return 2;
    case "daily":
      return 3;
    case "constant":
      return 4;
    default:
      return 0;
  }
}

function paymentSignalScore(
  payment: NormalizedAnswers["existing_payment"],
): Signals["payment_signal_score"] {
  switch (payment) {
    case "no":
      return 0;
    case "indirect":
      return 1;
    case "yes_low":
      return 2;
    case "yes_high":
      return 3;
    default:
      return 0;
  }
}

function skillLevel(level: NormalizedAnswers["founder_build_skill"]): 0 | 1 | 2 | 3 {
  switch (level) {
    case "low":
      return 0;
    case "medium":
      return 1;
    case "high":
      return 2;
    case "expert":
      return 3;
    default:
      return 0;
  }
}

function domainLevel(level: NormalizedAnswers["founder_domain_experience"]): 0 | 1 | 2 | 3 {
  switch (level) {
    case "none":
      return 0;
    case "some":
      return 1;
    case "deep":
      return 2;
    case "expert":
      return 3;
    default:
      return 0;
  }
}

function claimsNoCompetitors(text: string): boolean {
  if (!text) return false;
  return hasAny(text, NO_COMPETITORS_PHRASES);
}

function priceIsPremium(n: number | null, model: NormalizedAnswers["pricing_model"]): boolean {
  if (n === null) return false;
  // Cheap heuristic: monthly subscription ≥ 250 or one-shot ≥ 5000. Unit
  // agnostic (NIS/USD aren't distinguished) — good enough to trigger a
  // contradiction check, not a scoring input.
  if (model === "subscription" || model === "usage") return n >= 250;
  return n >= 5000;
}

function assumptionTestAlignment(
  assumption: string,
  test: string,
): Signals["assumption_test_alignment"] {
  if (!assumption || !test) return "unknown";
  // Hebrew inflects by prefix attachment (ש/ה/ב/מ/ל/כ/ו), so "שלקוחות"
  // and "לקוחות" should match. A simple substring check handles both
  // prefix and suffix attachments reliably without a dictionary — and
  // avoids over-stripping cases where ל/ב/... is actually part of the
  // root (e.g., "לקוחות" itself).
  const tokenize = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 4),
    );
  const aTokens = tokenize(assumption);
  const tTokens = tokenize(test);
  if (aTokens.size < 2 || tTokens.size < 2) return "unknown";
  let overlap = 0;
  for (const x of aTokens) {
    const match =
      tTokens.has(x) || [...tTokens].some((y) => y.length >= 4 && (x.includes(y) || y.includes(x)));
    if (match) overlap++;
  }
  const ratio = overlap / Math.min(aTokens.size, tTokens.size);
  return ratio >= 0.2 ? "aligned" : "misaligned";
}

function completenessPercent(n: NormalizedAnswers): number {
  if (REQUIRED_TOTAL === 0) return 100;
  let answered = 0;
  for (const q of REQUIRED_QUESTIONS) {
    const v = (n as unknown as Record<string, unknown>)[q.key];
    if (typeof v === "string" && v.length > 0) answered++;
    else if (Array.isArray(v) && v.length > 0) answered++;
    else if (typeof v === "number" && Number.isFinite(v)) answered++;
  }
  return Math.round((answered / REQUIRED_TOTAL) * 100);
}

// ── public entry ───────────────────────────────────────────
export function deriveSignals(n: NormalizedAnswers): Signals {
  return {
    audience_specificity: audienceSpecificity(n.first_customer),
    problem_pain: (n.problem_intensity ?? 0) as Signals["problem_pain"],
    problem_frequency_score: problemFrequencyScore(n.problem_frequency),
    payment_signal_score: paymentSignalScore(n.existing_payment),
    acquisition_clarity_10: acquisitionClarity(n.first_10_customers),
    acquisition_clarity_100: acquisitionClarity(n.first_100_customers),
    founder_advantage: founderAdvantage(n.founder_unfair_advantage),
    founder_domain_level: domainLevel(n.founder_domain_experience),
    founder_sales_level: skillLevel(n.founder_sales_skill),
    founder_build_level: skillLevel(n.founder_build_skill),
    time_capacity: timeCapacity(n.founder_weekly_hours),
    copy_risk: copyRisk(n.ease_of_copy),
    legal_risk: legalRisk(n.regulatory_risk),
    mvp_scope: mvpScope(n.manual_first_version, n.first_payment_requirements),
    price_is_premium: priceIsPremium(n.price_point_numeric, n.pricing_model),
    claims_no_competitors: claimsNoCompetitors(n.direct_competitors),
    has_revenue_model: countWords(n.revenue_model) >= 4,
    assumption_test_alignment: assumptionTestAlignment(n.riskiest_assumption, n.first_14_days_test),
    completeness_percent: completenessPercent(n),
  };
}

// Exposed so contradictions/flags can reuse the same subscription/one-shot
// vocabulary without drifting from signals.
export const VOCAB = {
  ONESHOT_TOKENS,
  SUBSCRIPTION_TOKENS,
  hasAny,
};
