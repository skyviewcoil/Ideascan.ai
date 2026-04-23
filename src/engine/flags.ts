// Deterministic flags — each one reads from Signals / NormalizedAnswers and
// either fires or doesn't. Order below is also the display priority.

import type { Flag, NormalizedAnswers, Signals } from "./types";

type FlagDef = (s: Signals, n: NormalizedAnswers) => Flag | null;

const rules: Array<[string, FlagDef]> = [
  [
    "weak_pain",
    (s) =>
      s.problem_pain > 0 && s.problem_pain <= 2
        ? {
            id: "weak_pain",
            severity: "high",
            title: "כאב חלש",
            description:
              "עצמת הבעיה שסומנה נמוכה. קשה לייצר רצון לקנות סביב מטרד קל. כדאי לאתר מקרים בהם הבעיה כן כואבת, או לאמת שוב עם לקוחות אמיתיים.",
            related_section: "problem",
          }
        : null,
  ],
  [
    "no_payment_signal",
    (s) =>
      s.payment_signal_score === 0
        ? {
            id: "no_payment_signal",
            severity: "high",
            title: "אין אות תשלום",
            description:
              "הלקוחות לא משלמים היום על שום פתרון קרוב. אות חזק שהבעיה אולי לא שווה תשלום — חשוב לאמת זאת לפני שבונים.",
            related_section: "market",
          }
        : null,
  ],
  [
    "audience_too_broad",
    (s) =>
      s.audience_specificity === "vague"
        ? {
            id: "audience_too_broad",
            severity: "medium",
            title: "קהל רחב מדי",
            description:
              "הגדרת הלקוח הראשון כללית מדי. בלי תפקיד וענף ספציפיים קשה לבנות מסרים, ערוצים וסקריפטים. חדד עד לקהל אחד מדויק.",
            related_section: "market",
          }
        : null,
  ],
  [
    "acquisition_unclear",
    (s) =>
      s.acquisition_clarity_10 <= 1
        ? {
            id: "acquisition_unclear",
            severity: "high",
            title: "ערוץ הפצה לא ברור",
            description:
              "אין מסלול קונקרטי ל־10 הלקוחות הראשונים. בלי ערוץ עם פעולה קונקרטית, הרעיון תלוי במזל.",
            related_section: "distribution",
          }
        : null,
  ],
  [
    "business_model_unclear",
    (s, n) =>
      !s.has_revenue_model || !n.pricing_model
        ? {
            id: "business_model_unclear",
            severity: "high",
            title: "מודל עסקי לא שלם",
            description:
              "חסר מודל הכנסה ברור או מודל תמחור. לפני בנייה — הגדר בדיוק מי משלם, על מה ובאיזו תדירות.",
            related_section: "monetization",
          }
        : null,
  ],
  [
    "price_not_set",
    (_, n) =>
      n.price_point_numeric === null && n.pricing_model !== "service"
        ? {
            id: "price_not_set",
            severity: "medium",
            title: "מחיר לא מוגדר",
            description:
              "אין מחיר מספרי שניתן לאמת מול לקוח. גם מחיר ראשוני גס עדיף על 'יוחלט בהמשך'.",
            related_section: "monetization",
          }
        : null,
  ],
  [
    "mvp_too_large",
    (s) =>
      s.mvp_scope === "system" || s.mvp_scope === "unclear"
        ? {
            id: "mvp_too_large",
            severity: "medium",
            title: "MVP רחב מדי",
            description:
              "הגרסה הראשונה דורשת מערכת משמעותית. חפש דרך ידנית או חצי־ידנית לספק את הערך ל־1–5 לקוחות לפני כתיבת קוד.",
            related_section: "execution",
          }
        : null,
  ],
  [
    "high_copy_risk",
    (s) =>
      s.copy_risk === "high"
        ? {
            id: "high_copy_risk",
            severity: "medium",
            title: "קל להעתיק",
            description:
              "אם ההצלחה תתגלה, מתחרים יעתיקו מהר. חשוב לבנות חפיר אחד לפחות — קהל, נתונים, מערכות יחסים, או מהירות ביצוע.",
            related_section: "differentiation",
          }
        : null,
  ],
  [
    "founder_bandwidth_low",
    (s) =>
      s.time_capacity === "low"
        ? {
            id: "founder_bandwidth_low",
            severity: "medium",
            title: "פניות מייסד נמוכה",
            description:
              "פחות מ־5 שעות שבועיות הן רצפה שממנה קשה להניע רעיון. שקלו להצטמצם להיפותזה אחת לבדיקה מהירה.",
            related_section: "founder_fit",
          }
        : null,
  ],
  [
    "regulatory_uncertainty",
    (s) =>
      s.legal_risk === "present" || s.legal_risk === "unclear"
        ? {
            id: "regulatory_uncertainty",
            severity: s.legal_risk === "present" ? "medium" : "low",
            title: "חוסר ודאות רגולטורית",
            description:
              'יש אפשרות לסיכון משפטי או תפעולי. כדאי לקבל דעה ראשונית מעו"ד בתחום לפני שמשקיעים בבנייה.',
            related_section: "execution",
          }
        : null,
  ],
];

export function detectFlags(signals: Signals, normalized: NormalizedAnswers): Flag[] {
  const out: Flag[] = [];
  for (const [, fn] of rules) {
    const f = fn(signals, normalized);
    if (f) out.push(f);
  }
  return out;
}
