// Prompt v1 for the 14-day validation plan narrative. Phases are fixed
// (conversations → pricing → channel → manual_sale); only the content
// inside each phase varies with the evaluation.

import type { EvaluationInput } from "@/ai/schema";

export const VALIDATION_PLAN_PROMPT_VERSION = "validation-plan.v1" as const;

export const VALIDATION_PLAN_SYSTEM_PROMPT = `אתה עוזר ניתוח לרעיונות עסקיים עבור Ideascan.ai. בהינתן פלט הניתוח הדטרמיניסטי, בנה תוכנית בדיקה מעשית ל-14 יום המורכבת מארבעה שלבים קבועים:

1. phase: "conversations", day_range: "ימים 1–3" — שיחות עומק עם לקוח היעד כדי לאמת את תיאור הבעיה והטריגר.
2. phase: "pricing", day_range: "ימים 4–7" — הצגת מחיר ל-5–10 לקוחות כדי לאמת נכונות לשלם.
3. phase: "channel", day_range: "ימים 8–11" — ניסוי ערוץ הפצה אחד בלבד עם מדדי המרה ברורים.
4. phase: "manual_sale", day_range: "ימים 12–14" — מכירה ידנית ראשונה ללא מוצר ממשי.

חוקים:
1. אסור להמציא נתונים. אם חסר מחיר, ערוץ או תיאור לקוח — השתמש בניסוח כללי במקום להמציא.
2. אסור להוסיף שלבים, לשנות את הסדר או לשנות את ה-phase/day_range.
3. לכל שלב כתוב:
   - title: כותרת קצרה בעברית (עד 8 מילים).
   - description: 1–2 משפטים שמתארים בדיוק מה עושים, בהתאמה לרעיון הספציפי.
   - outcome: משפט אחד שמגדיר תוצאה מדידה. מה "הצלחה" לגבי הבדיקה הזו.
4. התאם את התוכן לאותות ולדגלים. למשל: אם payment_signal_score נמוך, שלב הpricing צריך להתמקד בגילוי התנגדויות מחיר. אם acquisition_clarity_10 נמוך, שלב ה-channel צריך להדגיש שבחירת ערוץ אחד היא קריטית.
5. כתוב תמציתי, עברית פעילה, בלי סופרלטיבים.

פורמט הפלט: אובייקט JSON עם מפתח "phases" שהוא מערך של 4 אובייקטים לפי הסדר לעיל.`;

export function buildValidationPlanUserPrompt(input: EvaluationInput): string {
  const payload = {
    idea: input.idea,
    normalized: {
      first_customer: input.normalized.first_customer,
      price_point: input.normalized.price_point,
      pricing_model: input.normalized.pricing_model,
      first_10_customers: input.normalized.first_10_customers,
      first_100_customers: input.normalized.first_100_customers,
      manual_first_version: input.normalized.manual_first_version,
      first_payment_requirements: input.normalized.first_payment_requirements,
      riskiest_assumption: input.normalized.riskiest_assumption,
      first_14_days_test: input.normalized.first_14_days_test,
    },
    signals: {
      payment_signal_score: (input.signals as Record<string, unknown>).payment_signal_score,
      acquisition_clarity_10: (input.signals as Record<string, unknown>).acquisition_clarity_10,
      acquisition_clarity_100: (input.signals as Record<string, unknown>).acquisition_clarity_100,
      mvp_scope: (input.signals as Record<string, unknown>).mvp_scope,
      audience_specificity: (input.signals as Record<string, unknown>).audience_specificity,
    },
    flags: input.flags.map((f) => ({ id: f.id, severity: f.severity, title: f.title })),
    decision: input.decision,
  };
  return `הנה פלט הניתוח. בנה את תוכנית ה-14 יום לפי הפורמט שבמערכת:\n\n<evaluation>\n${JSON.stringify(payload, null, 2)}\n</evaluation>`;
}
