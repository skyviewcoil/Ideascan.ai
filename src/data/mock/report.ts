import type { Report, SectionInsight } from "@/types";

export const MOCK_SECTION_INSIGHTS: SectionInsight[] = [
  { section: "problem", score: 78, status: "strong", note: "הבעיה מתוארת בחדות והיא תכופה." },
  { section: "market", score: 62, status: "ok", note: "השוק הראשוני קיים אך לא מוגדר מספיק במספרים." },
  { section: "differentiation", score: 48, status: "weak", note: "הבידול אינו ברור מול שני מתחרים ישירים." },
  { section: "monetization", score: 70, status: "ok", note: "מודל סביר, מחיר עדיין לא מאומת מול לקוחות." },
  { section: "distribution", score: 55, status: "weak", note: "אין ערוץ ברור ל־100 לקוחות ראשונים." },
  { section: "execution", score: 72, status: "ok", note: "אפשר להתחיל ידנית, יש מסלול ברור ל־14 יום." },
  { section: "founder_fit", score: 80, status: "strong", note: "ניסיון מתחום, יתרון הפצה אישי." },
];

export const MOCK_REPORT: Report = {
  id: "report_1",
  idea_id: "idea_1",
  generated_at: "2025-04-12T17:30:00Z",
  is_stale: false,
  summary: {
    decision: "validate_first",
    total_score: 66,
    headline: "רעיון עם בסיס אמיתי, חסר אימות שוק",
    short_summary:
      "הבעיה אמיתית והפרופיל שלך מתאים. הסיכון העיקרי הוא בידול חלש מול מתחרים ישירים והיעדר ערוץ הפצה מוכח. מומלץ לאמת מחיר וערוץ מול 10 לקוחות לפני שבונים מערכת.",
  },
  section_insights: MOCK_SECTION_INSIGHTS,
  strengths: [
    "הבעיה תכופה וכואבת — לקוחות חווים אותה שבועית.",
    "פרופיל מייסד חזק עם גישה לקהל היעד.",
    "אפשרות להתחיל ידנית ולגבות תשלום בשבועיים.",
  ],
  weaknesses: [
    "בידול לא חד מול שני מתחרים ישירים שכבר משווקים.",
    "אין הוכחה שלקוחות מוכנים לשלם את המחיר המוצע.",
    "ערוץ ההפצה ל־100 הלקוחות הראשונים עדיין לא מוגדר.",
  ],
  critical_assumption:
    "ההנחה שלקוחות מוכנים לשלם 290₪ לחודש לפני שיש אינטגרציה מלאה עם הכלים שלהם. אם זה לא נכון — כל מודל ההכנסה משתנה.",
  flags: [
    {
      id: "f1",
      severity: "high",
      title: "מחיר לא מאומת",
      description: "המחיר המוצע גבוה ב־40% מהפתרון הקרוב ביותר ללא הצדקה ברורה.",
      related_section: "monetization",
    },
    {
      id: "f2",
      severity: "medium",
      title: "תלות בערוץ אחד",
      description: "כל ההפצה ל־10 הלקוחות הראשונים מתבססת על רשת אישית, ללא מסלול חוזר.",
      related_section: "distribution",
    },
    {
      id: "f3",
      severity: "medium",
      title: "בידול חלש",
      description: "התשובה ל'למה דווקא ממך' חופפת לפיצ'ר קיים אצל מתחרה.",
      related_section: "differentiation",
    },
  ],
  contradictions: [
    {
      id: "c1",
      title: "תדירות מול דחיפות",
      description:
        "תיארת את הבעיה כיומית, אך הטריגר לרכישה מתואר כאירוע נדיר. אחת התשובות לא מדויקת.",
      related_questions: ["problem_frequency", "trigger_moment"],
    },
    {
      id: "c2",
      title: "מודל מנוי מול שירות חד פעמי",
      description:
        "בחרת מודל מנוי, אך 'מה שלקוח מקבל ראשון' מתואר כפרויקט חד פעמי. סתירה בערך החוזר.",
      related_questions: ["pricing_model", "first_payment_requirements"],
    },
  ],
  validation_plan: [
    {
      id: "v1",
      day_range: "ימים 1–3",
      title: "10 שיחות עם לקוח יעד",
      description: "תאם 10 שיחות של 20 דק' עם דמות הקונה המדויקת. אל תמכור — הקשב.",
      outcome: "אישור או שלילה של תיאור הבעיה והטריגר.",
    },
    {
      id: "v2",
      day_range: "ימים 4–7",
      title: "הצגת מחיר מול 5 לקוחות",
      description: "הצג מחיר מוצע (290₪/חודש) ובדוק תגובה מילולית ולא־מילולית.",
      outcome: "לפחות 3 מתוך 5 מאשרים שזה סביר לתפקיד שלהם.",
    },
    {
      id: "v3",
      day_range: "ימים 8–11",
      title: "ניסוי ערוץ הפצה אחד",
      description: "בחר ערוץ אחד (LinkedIn outbound או שותפות) והרץ 50 פניות ממוקדות.",
      outcome: "5 פגישות מתואמות לפחות — אחרת הערוץ לא עובד.",
    },
    {
      id: "v4",
      day_range: "ימים 12–14",
      title: "מכירה ידנית ראשונה",
      description: "ספק את הערך ידנית ל־1–2 לקוחות תמורת תשלום מלא, ללא מוצר.",
      outcome: "תשלום אחד אמיתי שעובר. בלי זה, אל תבנה כלום.",
    },
  ],
  recommendation:
    "אל תבנה מערכת בשלב הזה. הקדש 14 יום לאימות מחיר וערוץ. אם בסוף התקופה יש לקוח משלם אחד וערוץ עם הזנה חוזרת — חזור והערך מחדש.",
};
