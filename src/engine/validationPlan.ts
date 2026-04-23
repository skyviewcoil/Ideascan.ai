// Builds the 14-day validation plan from the top few flags / gaps. Fully
// deterministic: the same evaluation always produces the same plan. Phases
// are fixed; only the content inside each phase shifts with the signals.

import type { Flag, ValidationPlanItem } from "@/types";
import type { NormalizedAnswers, Signals } from "./types";

type PhaseBuilder = (
  signals: Signals,
  normalized: NormalizedAnswers,
  flags: Flag[],
) => ValidationPlanItem;

const phaseCustomerConversations: PhaseBuilder = (signals, normalized) => {
  const targetAudience = normalized.first_customer || "הלקוח שציינת";
  const topic =
    signals.payment_signal_score === 0
      ? "האם זו בעיה שהם באמת שווים לשלם עליה"
      : "איך הם מתמודדים היום ומה הכאב האמיתי";
  return {
    id: "v_conversations",
    day_range: "ימים 1–3",
    title: "10 שיחות עם לקוח יעד",
    description: `תאם 10 שיחות של 20 דק' עם ${targetAudience}. אל תמכור — הקשב. הנושא: ${topic}.`,
    outcome: "אישור או שלילה של תיאור הבעיה והטריגר לרכישה.",
  };
};

const phasePricingTest: PhaseBuilder = (signals, normalized) => {
  const price =
    normalized.price_point_numeric !== null
      ? `${normalized.price_point_numeric}${/[$₪€£]/.test(normalized.price_point) ? "" : "₪"}`
      : "המחיר שציינת";
  const focus =
    signals.payment_signal_score <= 1
      ? "הצג את המחיר מוקדם כדי לאסוף התנגדויות אמיתיות"
      : "השווה למה שהם משלמים היום על פתרונות קרובים";
  return {
    id: "v_pricing",
    day_range: "ימים 4–7",
    title: "הצגת מחיר מול 5 לקוחות",
    description: `הצג את ${price} ל־5 לקוחות מתוך השיחות ובדוק תגובה מילולית ולא־מילולית. ${focus}.`,
    outcome: "לפחות 3 מתוך 5 מאשרים שזה סביר לתפקיד שלהם.",
  };
};

const phaseChannelTest: PhaseBuilder = (signals, normalized) => {
  const channelHint =
    signals.acquisition_clarity_10 >= 2 && normalized.first_10_customers
      ? "השתמש בערוץ שכבר תיארת"
      : "בחר ערוץ אחד קונקרטי — אל תנסה שניים במקביל";
  return {
    id: "v_channel",
    day_range: "ימים 8–11",
    title: "ניסוי ערוץ הפצה אחד",
    description: `${channelHint} והרץ 50 פניות ממוקדות. מדוד המרה להצעת שיחה.`,
    outcome: "5 פגישות מתואמות לפחות — אחרת הערוץ לא עובד ונעבור לחלופה.",
  };
};

const phaseManualSale: PhaseBuilder = (signals, normalized) => {
  const mvpHint =
    signals.mvp_scope === "concierge" || signals.mvp_scope === "manual"
      ? normalized.manual_first_version || "ספק את הערך ידנית"
      : "ספק את הערך ידנית — ללא מערכת, ללא קוד";
  return {
    id: "v_manual_sale",
    day_range: "ימים 12–14",
    title: "מכירה ידנית ראשונה",
    description: `${mvpHint}. מטרה: לקוח אחד משלם, גם אם התשלום חלקי.`,
    outcome: "תשלום אחד אמיתי שעובר. בלי זה, אל תבנה כלום.",
  };
};

export function buildValidationPlan(
  signals: Signals,
  normalized: NormalizedAnswers,
  flags: Flag[],
): ValidationPlanItem[] {
  return [
    phaseCustomerConversations(signals, normalized, flags),
    phasePricingTest(signals, normalized, flags),
    phaseChannelTest(signals, normalized, flags),
    phaseManualSale(signals, normalized, flags),
  ];
}
