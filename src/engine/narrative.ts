// Deterministic Hebrew narrative for the report view. No AI calls — just
// template selection based on signals, scores, and decision. A future AI
// pass can replace the strings without changing call sites.

import type {
  Confidence,
  DecisionType,
  Flag,
  NormalizedAnswers,
  SectionKey,
  SectionScores,
  Signals,
} from "./types";

const SECTION_LABELS_HE: Record<SectionKey, string> = {
  problem: "בעיה",
  market: "שוק",
  differentiation: "בידול",
  monetization: "מוניטיזציה",
  distribution: "הפצה",
  execution: "ביצוע",
  founder_fit: "התאמת מייסד",
};

const SECTIONS_IN_ORDER: SectionKey[] = [
  "problem",
  "market",
  "differentiation",
  "monetization",
  "distribution",
  "execution",
  "founder_fit",
];

function scoreStatus(score: number): "empty" | "weak" | "ok" | "strong" {
  if (score === 0) return "empty";
  if (score < 50) return "weak";
  if (score < 75) return "ok";
  return "strong";
}

function scoreNote(section: SectionKey, score: number, signals: Signals): string {
  const level = scoreStatus(score);
  const noteBy: Record<SectionKey, Record<typeof level, string>> = {
    problem: {
      empty: "חסרות תשובות כדי להעריך את חדות הבעיה.",
      weak: "הבעיה לא ברורה מספיק, או שעוצמתה נמוכה.",
      ok: "הבעיה מתוארת, אבל כדאי להחדד את עצמתה ואת תדירותה.",
      strong: "הבעיה מתוארת בחדות ונראית כואבת בפועל.",
    },
    market: {
      empty: "חסר תיאור שוק ולקוח יעד.",
      weak: "הלקוח רחב מדי או שאין אות שהלקוחות משלמים היום.",
      ok: "השוק הראשוני קיים, אך לא מוגדר מספיק במספרים או במחיר.",
      strong: "הלקוח ממוקד ויש אות ברור שהוא כבר משלם על פתרונות קרובים.",
    },
    differentiation: {
      empty: "אין תיאור בידול.",
      weak: "הבידול לא ברור מול מתחרים או שקל מדי להעתיק אותו.",
      ok: "יש כיוון לבידול אך הוא זקוק לחידוד לפני השוק.",
      strong: "יש בידול משמעותי שקשה להעתיק.",
    },
    monetization: {
      empty: "חסר מודל הכנסה ברור.",
      weak: "המודל אינו שלם או שחסר מחיר בר־בדיקה.",
      ok: "מודל סביר, המחיר עדיין דורש אימות מול לקוחות.",
      strong: "מודל ברור, מחיר מוגדר ומתאים למבנה הערך.",
    },
    distribution: {
      empty: "אין מסלול רכישה מתואר.",
      weak: "אין ערוץ ברור ל־10 או ל־100 הלקוחות הראשונים.",
      ok: "קיים ערוץ אחד לפחות, אך הגיבוי לטווח בינוני חלש.",
      strong: "מסלול הגעה ברור ל־10 וגם ל־100 הלקוחות הראשונים.",
    },
    execution: {
      empty: "לא תואר מה נבנה בפועל.",
      weak: "קשה להתחיל — ה־MVP רחב מדי או שלא הוגדר מבחן קונקרטי.",
      ok: "אפשר להתחיל באופן חלקי, אבל המסלול עוד לא ממוקד.",
      strong: "מסלול ביצוע ברור עם בדיקה ראשונה מדידה.",
    },
    founder_fit: {
      empty: "לא תואר פרופיל המייסד.",
      weak: "פניות נמוכה או ניסיון מוגבל בתחום.",
      ok: "יש בסיס סביר, אך חסר יתרון מובהק.",
      strong: "ניסיון רלוונטי, פניות טובה, יתרון זמין.",
    },
  };

  const base = noteBy[section][level];
  // Tiny signal-driven embellishments only when they add information.
  if (section === "market" && signals.payment_signal_score === 0) {
    return `${base} הלקוחות לא משלמים היום על פתרון קרוב.`;
  }
  if (section === "distribution" && signals.acquisition_clarity_10 <= 1) {
    return `${base} חסר ערוץ קונקרטי ל־10 הלקוחות הראשונים.`;
  }
  if (section === "differentiation" && signals.copy_risk === "high") {
    return `${base} קל להעתיק את הרעיון.`;
  }
  return base;
}

export function buildSectionInsights(scores: SectionScores, signals: Signals) {
  return SECTIONS_IN_ORDER.map((section) => {
    const score = scores[section];
    return {
      section,
      score,
      status: scoreStatus(score),
      note: scoreNote(section, score, signals),
    };
  });
}

// ── strengths / weaknesses ─────────────────────────────────
export function buildStrengths(scores: SectionScores, signals: Signals): string[] {
  const lines: string[] = [];
  const sorted = SECTIONS_IN_ORDER.map((s) => ({ s, v: scores[s] })).sort((a, b) => b.v - a.v);

  for (const { s, v } of sorted.slice(0, 3)) {
    if (v < 70) break;
    lines.push(`${SECTION_LABELS_HE[s]} — ציון ${v}/100, אחד הבסיסים החזקים של הרעיון.`);
  }

  if (signals.founder_advantage === "strong") {
    lines.push("יתרון מייסד אמיתי ומתואר בפירוט, לא רק 'אני אעבוד קשה'.");
  }
  if (signals.payment_signal_score >= 2) {
    lines.push("לקוחות כבר משלמים על פתרונות קרובים — אות שוק חיובי.");
  }
  if (signals.mvp_scope === "concierge" || signals.mvp_scope === "manual") {
    lines.push("אפשר להתחיל ידנית ולגבות תשלום בלי לבנות מערכת שלמה.");
  }
  if (signals.acquisition_clarity_10 >= 2) {
    lines.push("יש ערוץ קונקרטי ל־10 הלקוחות הראשונים.");
  }

  return lines.slice(0, 4);
}

export function buildWeaknesses(scores: SectionScores, signals: Signals, flags: Flag[]): string[] {
  const lines: string[] = [];

  for (const f of flags.filter((x) => x.severity === "high").slice(0, 3)) {
    lines.push(f.title + " — " + f.description);
  }

  const sorted = SECTIONS_IN_ORDER.map((s) => ({ s, v: scores[s] })).sort((a, b) => a.v - b.v);
  for (const { s, v } of sorted.slice(0, 2)) {
    if (v >= 55) break;
    lines.push(`${SECTION_LABELS_HE[s]} — ציון ${v}/100, חלש ביחס לשאר הרעיון.`);
  }

  if (signals.copy_risk === "high" && !lines.some((l) => l.startsWith("קל להעתיק"))) {
    lines.push("קל להעתיק — אין חפיר מובנה, יידרש יתרון מבצועי או רגולטורי.");
  }

  return lines.slice(0, 4);
}

// ── headline / short summary / recommendation ──────────────
const DECISION_HEADLINES: Record<DecisionType, string> = {
  go: "רעיון חזק עם בסיס מוצק להמשך",
  refine: "רעיון עם פוטנציאל — דורש חידוד ממוקד",
  validate_first: "רעיון עם בסיס אמיתי, חסר אימות שוק",
  not_now: "כרגע הסיכונים גדולים מהפוטנציאל",
};

export function buildHeadline(decision: DecisionType): string {
  return DECISION_HEADLINES[decision];
}

export function buildShortSummary(
  decision: DecisionType,
  scores: SectionScores,
  signals: Signals,
  flags: Flag[],
  normalized: NormalizedAnswers,
): string {
  const topFlag = flags[0];
  const byScore = SECTIONS_IN_ORDER.map((s) => ({ s, v: scores[s] })).sort((a, b) => a.v - b.v);
  const weakest = byScore[0];
  const strongest = byScore[byScore.length - 1];

  const pieces: string[] = [];
  if (strongest.v >= 70) {
    pieces.push(`הצד החזק הוא ${SECTION_LABELS_HE[strongest.s]} (${strongest.v}/100)`);
  }
  if (weakest.v < 60) {
    pieces.push(`הצד החלש הוא ${SECTION_LABELS_HE[weakest.s]} (${weakest.v}/100)`);
  }
  if (topFlag) {
    pieces.push(`הדגל העיקרי: ${topFlag.title}`);
  }
  if (signals.completeness_percent < 100) {
    pieces.push(`(${signals.completeness_percent}% מהשאלות מולאו)`);
  }

  const prefix =
    decision === "go"
      ? `ציון כולל ${scores.total}/100 — אפשר להתקדם.`
      : decision === "refine"
        ? `ציון כולל ${scores.total}/100 — פוטנציאל קיים, חידוד דרוש.`
        : decision === "validate_first"
          ? `ציון כולל ${scores.total}/100 — לאמת לפני שבונים.`
          : `ציון כולל ${scores.total}/100 — לא נכון להתקדם כרגע.`;

  // Nudge using the user's own wording if available.
  const suffix = normalized.riskiest_assumption
    ? ` ההנחה הכי מסוכנת שציינת היא: "${truncate(normalized.riskiest_assumption, 120)}"`
    : "";

  return [prefix, ...pieces].join(". ") + "." + suffix;
}

export function buildRecommendation(
  decision: DecisionType,
  flags: Flag[],
  normalized: NormalizedAnswers,
): string {
  const topFlag = flags.find((f) => f.severity === "high") ?? flags[0];
  const topIssue = topFlag?.title;

  switch (decision) {
    case "go":
      return "הסימנים חיוביים. התחילו מ־2 לקוחות משלמים באופן ידני תוך 14 יום, ומשם תכננו את הגרסה הראשונה של המוצר.";
    case "refine":
      return `הבסיס מוצק, אבל לפני שבונים — חדדו את ${topIssue ?? "נקודת התורפה החזקה ביותר"}. שוחחו עם 5 לקוחות נוספים עד שהתיאור חד.`;
    case "validate_first":
      return `אל תבנו מערכת עכשיו. הקדישו 14 יום לאימות ${topIssue ?? "ההנחה המסוכנת ביותר"}. אם בסוף התקופה יש לקוח משלם אחד וערוץ עם הזנה חוזרת — חזרו והעריכו מחדש.`;
    case "not_now":
      return `נכון לעכשיו הסיכונים עולים על הסיכוי. אפשר לשמור את הרעיון ולחזור אליו אחרי שתפתרו לפחות ${topIssue ?? "את הדגל הקריטי"}, או לעבור לרעיון אחר.`;
    default:
      // unreachable — `decision` is exhaustively typed above.
      return normalized.idea_name
        ? `${normalized.idea_name} דורש בחינה נוספת.`
        : "הרעיון דורש בחינה נוספת.";
  }
}

export function buildCriticalAssumption(normalized: NormalizedAnswers, flags: Flag[]): string {
  if (normalized.riskiest_assumption.trim().length >= 20) {
    return normalized.riskiest_assumption.trim();
  }
  const high = flags.find((f) => f.severity === "high");
  if (high) return `${high.title} — ${high.description}`;
  return "חסרה הגדרה של ההנחה המסוכנת ביותר. בלי ההגדרה הזו, קשה לדעת מה לאמת קודם.";
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}

export function confidenceLabel(c: Confidence): string {
  return c === "high" ? "גבוה" : c === "medium" ? "בינוני" : "נמוך";
}
