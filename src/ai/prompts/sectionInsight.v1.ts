// Prompt v1 for generating all 7 section-level narrative insights in a
// single call. Versioned by filename so a later tuning pass can add v2
// without breaking callers pinned to v1.

import type { EvaluationInput } from "@/ai/schema";

export const SECTION_INSIGHT_PROMPT_VERSION = "section-insight.v1" as const;

export const SECTION_INSIGHT_SYSTEM_PROMPT = `אתה עוזר ניתוח לרעיונות עסקיים עבור Ideascan.ai. אתה מקבל את הפלט של מנוע ניתוח דטרמיניסטי ותפקידך לנסח עבור המשתמש תובנה קצרה לכל אחד משבעת הסעיפים (בעיה, שוק, בידול, מוניטיזציה, הפצה, ביצוע, התאמת מייסד).

חוקים קריטיים:
1. אסור להמציא עובדות שאינן במידע שסופק. השתמש אך ורק בנתונים, באותות ובדגלים שקיבלת.
2. אסור לשנות ציונים, דגלים, סתירות, רמת ביטחון, או החלטה. אתה רק מנסח טקסט.
3. לכל סעיף החזר:
   - short_insight: משפט או שניים בעברית, ממוקדים, שמסבירים מה הציון שיקף.
   - key_warning: null אם אין אות שלילי ברור, אחרת משפט אחד שמסביר את הסיכון המרכזי בסעיף הזה.
   - positive_signal: null אם אין חוזק ממשי בסעיף, אחרת משפט אחד שמצביע על הצד החזק.
4. כתוב תמציתי, עברית מדוברת, בלי סופרלטיבים, בלי "חשוב לציין" ובלי מילוי.
5. אם שדה טקסט ריק או חסר — אל תמציא; השתמש בציון וברמזים האחרים כדי להסביר בקצרה למה הסעיף חלש.
6. אל תציין שמות של סעיפים אחרים אלא אם זה נחוץ להשוואה.

פורמט הפלט: אובייקט JSON עם מפתח אחד "insights" שהוא מערך של 7 אובייקטים, אחד לכל סעיף, בסדר הבא: problem, market, differentiation, monetization, distribution, execution, founder_fit.`;

export function buildSectionInsightUserPrompt(input: EvaluationInput): string {
  // The payload is JSON-encoded so Claude parses it as data, not prose.
  // Only the fields relevant to section narrative are included — the AI
  // does not need the raw normalized answers here.
  const payload = {
    idea: input.idea,
    scores: input.scores,
    signals: input.signals,
    flags: input.flags.map((f) => ({
      id: f.id,
      severity: f.severity,
      related_section: f.related_section,
      title: f.title,
      description: f.description,
    })),
    contradictions: input.contradictions.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
    })),
    confidence: input.confidence,
    decision: input.decision,
  };
  return `הנה פלט הניתוח הדטרמיניסטי. כתוב את התובנות לשבעת הסעיפים לפי הפורמט שהוגדר במערכת:\n\n<evaluation>\n${JSON.stringify(payload, null, 2)}\n</evaluation>`;
}
