import type { IdeaAnswer } from "@/types";

// Partial mock answers used to demonstrate sidebar status / weak feedback.
export const MOCK_ANSWERS: Record<string, IdeaAnswer["value"]> = {
  idea_name: "ClearBrief",
  idea_description:
    "מערכת שמייצרת בריפים תמציתיים ומדויקים מצוותי לקוח לסוכנויות שיווק, ומקצרת זמן ניהול בריף ב־70%.",
  first_customer: "מנהל אקאונט בסוכנות שיווק של 10–30 עובדים בישראל",
  core_problem: "בריפים מלקוחות מגיעים חסרים ולא ברורים, מה שגורם לשעות עבודה מבוזבזות.",
  current_solution: "מיילים ארוכים, פגישות, וטמפלטים בגוגל דוקס.",
  differentiator: "מבנה בריף מובנה + שאלות חכמות שמופקות אוטומטית מתוך תחום הלקוח.",
  revenue_model: "מנוי חודשי לסוכנות לפי כמות פרויקטים פעילים.",
};
