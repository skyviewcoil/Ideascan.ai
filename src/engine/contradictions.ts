// Deterministic contradictions — cross-answer consistency checks.
// Each rule fires at most once per evaluation.

import type { Contradiction, NormalizedAnswers, Signals } from "./types";
import { VOCAB } from "./signals";

type Rule = (s: Signals, n: NormalizedAnswers) => Contradiction | null;

const rules: Rule[] = [
  // Low pain but premium pricing
  (s, n) => {
    if (!s.price_is_premium) return null;
    if (s.problem_pain === 0 || s.problem_pain > 2) return null;
    return {
      id: "low_pain_premium_pricing",
      title: "כאב חלש מול מחיר פרימיום",
      description: `עצמת הבעיה סומנה נמוכה, אבל המחיר המוצע (${n.price_point || "גבוה"}) משקף ערך משמעותי. לקוחות לא משלמים פרימיום על מטרד.`,
      related_questions: ["problem_intensity", "price_point"],
    };
  },

  // Subscription model for a one-shot deliverable
  (s, n) => {
    if (n.pricing_model !== "subscription") return null;
    const haystack = `${n.first_payment_requirements}\n${n.idea_description}\n${n.manual_first_version}`;
    if (!VOCAB.hasAny(haystack, VOCAB.ONESHOT_TOKENS)) return null;
    if (VOCAB.hasAny(haystack, VOCAB.SUBSCRIPTION_TOKENS)) return null;
    return {
      id: "subscription_for_oneshot",
      title: "מנוי על מוצר חד־פעמי",
      description:
        "בחרת מודל מנוי, אך מה שהלקוח מקבל מתואר כפרויקט חד־פעמי. אם אין ערך חוזר, לקוחות יבטלו אחרי חודש.",
      related_questions: ["pricing_model", "first_payment_requirements"],
    };
  },

  // Complex MVP with low founder capacity
  (s) => {
    if (s.mvp_scope !== "system") return null;
    if (s.time_capacity !== "low" && s.time_capacity !== "medium") return null;
    return {
      id: "complex_mvp_low_capacity",
      title: "MVP מורכב מול פניות נמוכה",
      description:
        "הגרסה הראשונה דורשת מערכת, אבל הפניות השבועית שלך מוגבלת. קיים סיכון גבוה שלא תסיים את הבנייה בחלון הרלוונטי.",
      related_questions: ["manual_first_version", "founder_weekly_hours"],
    };
  },

  // "No competitors" in a paying market
  (s) => {
    if (!s.claims_no_competitors) return null;
    if (s.payment_signal_score < 2) return null;
    return {
      id: "no_competitors_mature_market",
      title: "'אין מתחרים' בשוק שכבר משלם",
      description:
        "טענת שאין מתחרים, אבל הלקוחות כבר משלמים על פתרונות קרובים. בדרך כלל זה אומר שלא חיפשת מספיק — חפש מתחרים עקיפים ופתרונות תחליפיים.",
      related_questions: ["direct_competitors", "existing_payment"],
    };
  },

  // 100-customer scaling unclear while market hinges on volume
  (s, n) => {
    if (s.acquisition_clarity_100 > 1) return null;
    const hasLargeNumber = /\b\d{5,}\b/.test(n.market_size_estimate);
    if (!hasLargeNumber) return null;
    return {
      id: "unclear_scaling_channel",
      title: "סקיילינג לא ברור בשוק גדול",
      description:
        "הערכת השוק מדברת על היקף גדול, אבל אין מסלול קונקרטי איך מגיעים ל־100 לקוחות. בלי ערוץ חוזר — הגודל הנומינלי לא רלוונטי.",
      related_questions: ["market_size_estimate", "first_100_customers"],
    };
  },

  // Riskiest assumption not matching the 14-day test
  (s) => {
    if (s.assumption_test_alignment !== "misaligned") return null;
    return {
      id: "assumption_mismatch_test",
      title: "ההנחה הכי מסוכנת לא נבדקת",
      description:
        "ההנחה הקריטית שציינת ותוכנית ה־14 יום לא חופפות. אם נתחיל מבדיקה שלא נוגעת בהנחה החשובה, לא נלמד את מה שצריך.",
      related_questions: ["riskiest_assumption", "first_14_days_test"],
    };
  },
];

export function detectContradictions(
  signals: Signals,
  normalized: NormalizedAnswers,
): Contradiction[] {
  const out: Contradiction[] = [];
  for (const r of rules) {
    const c = r(signals, normalized);
    if (c) out.push(c);
  }
  return out;
}
