import { describe, expect, it } from "vitest";
import type { Idea, IdeaAnswer } from "@/types";
import type { AINarrative } from "@/ai/schema";
import { buildReport } from "./index";

// ── fixtures ───────────────────────────────────────────────

const idea: Idea = {
  id: "idea_test",
  name: "TestIdea",
  category: "B2B SaaS",
  initial_market: "סוכנויות",
  region: "ישראל",
  status: "report_ready",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
  current_step: 5,
  completion_percent: 100,
};

// Answer set that drives a mid-strength idea (validate_first / refine).
const okAnswers: Record<string, IdeaAnswer["value"]> = {
  first_customer: "Account manager ב-SaaS agency בגודל 15-40 עובדים",
  core_problem: "בריפים חסרים גורמים לשעות עבודה חוזרות",
  differentiator: "מבנה בריף מובנה עם שאלות חכמות אוטומטיות",
  revenue_model: "מנוי חודשי לסוכנות",
  problem_intensity: "4",
  problem_frequency: "daily",
  existing_payment: "yes_high",
  pricing_model: "subscription",
  price_point: "290",
  ease_of_copy: "hard",
  first_10_customers: "LinkedIn outreach ל-100 owners",
  first_100_customers: "content, SEO, referrals",
  founder_domain_experience: "deep",
  founder_sales_skill: "high",
  founder_build_skill: "high",
  founder_weekly_hours: "ft",
  founder_assets: ["audience", "domain"],
  founder_unfair_advantage: "6 שנים בתחום עם 800 קשרים",
  manual_first_version: "concierge ידני",
  first_payment_requirements: "onboarding ידני",
  riskiest_assumption: "סוכנויות ישלמו 290 לחודש",
  first_14_days_test: "הצגת מחיר ל-10 owners",
  regulatory_risk: "אין",
};

// Weak answer set — drives not_now decision with the `no_payment_signal`
// and `business_model_unclear` flags.
const weakAnswers: Record<string, IdeaAnswer["value"]> = {
  first_customer: "חברות",
  core_problem: "לא יעיל",
  problem_intensity: "2",
  problem_frequency: "monthly",
  existing_payment: "no",
  differentiator: "AI",
  revenue_model: "",
  pricing_model: null as never,
  price_point: "",
  ease_of_copy: "easy",
  first_10_customers: "",
  first_100_customers: "",
  founder_domain_experience: "some",
  founder_sales_skill: "low",
  founder_build_skill: "low",
  founder_weekly_hours: "lt5",
  founder_assets: [],
  founder_unfair_advantage: "",
  manual_first_version: "",
  first_payment_requirements: "",
  riskiest_assumption: "",
  first_14_days_test: "",
  regulatory_risk: "",
};

function makeAINarrative(opts: Partial<AINarrative> = {}): AINarrative {
  const base: AINarrative = {
    sections: {
      insights: [
        {
          section: "problem",
          short_insight: "AI-problem",
          key_warning: "pw",
          positive_signal: null,
        },
        { section: "market", short_insight: "AI-market", key_warning: null, positive_signal: "mp" },
        {
          section: "differentiation",
          short_insight: "AI-diff",
          key_warning: null,
          positive_signal: null,
        },
        {
          section: "monetization",
          short_insight: "AI-mon",
          key_warning: null,
          positive_signal: null,
        },
        {
          section: "distribution",
          short_insight: "AI-dist",
          key_warning: "dw",
          positive_signal: null,
        },
        {
          section: "execution",
          short_insight: "AI-exec",
          key_warning: null,
          positive_signal: null,
        },
        {
          section: "founder_fit",
          short_insight: "AI-fit",
          key_warning: null,
          positive_signal: "fp",
        },
      ],
    },
    final: {
      summary: "AI summary.",
      strengths: ["AI-strength-1", "AI-strength-2", "AI-strength-3"],
      weaknesses: ["AI-weakness-1", "AI-weakness-2"],
      critical_assumption: "AI critical assumption.",
      why_not_ready_yet: "AI why-not-ready text.",
      recommended_mvp: "AI MVP suggestion.",
    },
    validation: {
      phases: [
        {
          phase: "conversations",
          day_range: "ימים 1–3",
          title: "AI-conv",
          description: "d",
          outcome: "o",
        },
        {
          phase: "pricing",
          day_range: "ימים 4–7",
          title: "AI-price",
          description: "d",
          outcome: "o",
        },
        {
          phase: "channel",
          day_range: "ימים 8–11",
          title: "AI-chan",
          description: "d",
          outcome: "o",
        },
        {
          phase: "manual_sale",
          day_range: "ימים 12–14",
          title: "AI-sale",
          description: "d",
          outcome: "o",
        },
      ],
    },
  };
  return { ...base, ...opts };
}

// ── tests ──────────────────────────────────────────────────

describe("buildReport — deterministic-only mode", () => {
  it("labels the report as deterministic when no narrative is supplied", () => {
    const r = buildReport(idea, okAnswers);
    expect(r.narrative_source).toBe("deterministic");
  });

  it("produces all 7 section insights, 4 validation phases", () => {
    const r = buildReport(idea, okAnswers);
    expect(r.section_insights).toHaveLength(7);
    expect(r.validation_plan).toHaveLength(4);
  });

  it("populates strengths and weaknesses from deterministic templates", () => {
    const r = buildReport(idea, okAnswers);
    expect(r.strengths.length).toBeGreaterThanOrEqual(1);
    expect(r.weaknesses.length).toBeGreaterThanOrEqual(0);
  });

  it("omits why_not_ready_yet and recommended_mvp when AI did not write them", () => {
    const r = buildReport(idea, okAnswers);
    expect(r.why_not_ready_yet).toBeUndefined();
    expect(r.recommended_mvp).toBeUndefined();
  });

  it("does not carry key_warning or positive_signal when no AI narrative", () => {
    const r = buildReport(idea, okAnswers);
    for (const insight of r.section_insights) {
      expect(insight.key_warning).toBeUndefined();
      expect(insight.positive_signal).toBeUndefined();
    }
  });
});

describe("buildReport — full AI mode", () => {
  it("labels the report as 'ai' when all three slices are present", () => {
    const r = buildReport(idea, okAnswers, { narrative: makeAINarrative() });
    expect(r.narrative_source).toBe("ai");
  });

  it("uses AI text for summary, strengths, weaknesses, and critical_assumption", () => {
    const r = buildReport(idea, okAnswers, { narrative: makeAINarrative() });
    expect(r.summary.short_summary).toBe("AI summary.");
    expect(r.strengths).toEqual(["AI-strength-1", "AI-strength-2", "AI-strength-3"]);
    expect(r.weaknesses).toEqual(["AI-weakness-1", "AI-weakness-2"]);
    expect(r.critical_assumption).toBe("AI critical assumption.");
  });

  it("uses AI short_insight for each section note, preserves deterministic score + status", () => {
    const r = buildReport(idea, okAnswers, { narrative: makeAINarrative() });
    const problem = r.section_insights.find((s) => s.section === "problem");
    expect(problem?.note).toBe("AI-problem");
    expect(typeof problem?.score).toBe("number");
    expect(["empty", "weak", "ok", "strong"]).toContain(problem?.status);
  });

  it("carries key_warning and positive_signal through from AI insights", () => {
    const r = buildReport(idea, okAnswers, { narrative: makeAINarrative() });
    const problem = r.section_insights.find((s) => s.section === "problem");
    const market = r.section_insights.find((s) => s.section === "market");
    expect(problem?.key_warning).toBe("pw");
    expect(problem?.positive_signal).toBeNull();
    expect(market?.key_warning).toBeNull();
    expect(market?.positive_signal).toBe("mp");
  });

  it("uses AI phases for validation plan", () => {
    const r = buildReport(idea, okAnswers, { narrative: makeAINarrative() });
    expect(r.validation_plan.map((p) => p.title)).toEqual([
      "AI-conv",
      "AI-price",
      "AI-chan",
      "AI-sale",
    ]);
  });

  it("exposes why_not_ready_yet and recommended_mvp on the Report", () => {
    const r = buildReport(idea, okAnswers, { narrative: makeAINarrative() });
    expect(r.why_not_ready_yet).toBe("AI why-not-ready text.");
    expect(r.recommended_mvp).toBe("AI MVP suggestion.");
  });
});

describe("buildReport — hybrid mode", () => {
  it("labels the report as 'hybrid' when only some slices are present", () => {
    const ai = makeAINarrative({ final: null, validation: null });
    const r = buildReport(idea, okAnswers, { narrative: ai });
    expect(r.narrative_source).toBe("hybrid");
  });

  it("uses AI for sections and falls back to deterministic for missing slices", () => {
    const ai = makeAINarrative({ final: null, validation: null });
    const r = buildReport(idea, okAnswers, { narrative: ai });
    const problem = r.section_insights.find((s) => s.section === "problem");
    expect(problem?.note).toBe("AI-problem"); // AI
    // Validation plan phases are deterministic — they have ids like v_conversations.
    expect(r.validation_plan.map((p) => p.id)).toEqual([
      "v_conversations",
      "v_pricing",
      "v_channel",
      "v_manual_sale",
    ]);
  });
});

describe("buildReport — not_now decision must not show MVP as direct recommendation", () => {
  it("with no AI: shows the deterministic not_now recommendation", () => {
    const r = buildReport(idea, weakAnswers);
    expect(r.summary.decision).toBe("not_now");
    // Deterministic text for not_now starts with "נכון לעכשיו הסיכונים..."
    expect(r.recommendation).toMatch(/הסיכונים|לא נכון|לחזור אליו/);
    expect(r.recommendation).not.toMatch(/MVP/);
  });

  it("with full AI: prefers why_not_ready_yet over recommended_mvp", () => {
    const ai = makeAINarrative();
    const r = buildReport(idea, weakAnswers, { narrative: ai });
    expect(r.summary.decision).toBe("not_now");
    expect(r.recommendation).toBe("AI why-not-ready text.");
    // The MVP suggestion is still available on the Report, just not as
    // the primary "next step" paragraph.
    expect(r.recommended_mvp).toBe("AI MVP suggestion.");
  });

  it("with go-like AI (why_not_ready_yet null): falls through to recommended_mvp", () => {
    const ai = makeAINarrative({
      final: {
        summary: "s",
        strengths: ["a", "b"],
        weaknesses: ["c", "d"],
        critical_assumption: "ca",
        why_not_ready_yet: null,
        recommended_mvp: "build a thin slice.",
      },
    });
    // okAnswers is mid-strength; the decision is not "go", but for this
    // test we just want to prove the null-why_not_ready_yet path picks
    // recommended_mvp, not the deterministic floor.
    const r = buildReport(idea, okAnswers, { narrative: ai });
    expect(r.recommendation).toBe("build a thin slice.");
  });
});

describe("buildReport — deterministic fields are never replaced by AI", () => {
  it("decision, total_score, flags, and contradictions come from the engine in every mode", () => {
    const det = buildReport(idea, weakAnswers);
    const ai = buildReport(idea, weakAnswers, { narrative: makeAINarrative() });
    const hybrid = buildReport(idea, weakAnswers, {
      narrative: makeAINarrative({ final: null, validation: null }),
    });
    expect(ai.summary.decision).toBe(det.summary.decision);
    expect(hybrid.summary.decision).toBe(det.summary.decision);
    expect(ai.summary.total_score).toBe(det.summary.total_score);
    expect(hybrid.summary.total_score).toBe(det.summary.total_score);
    expect(ai.flags.map((f) => f.id)).toEqual(det.flags.map((f) => f.id));
    expect(hybrid.flags.map((f) => f.id)).toEqual(det.flags.map((f) => f.id));
    expect(ai.contradictions.map((c) => c.id)).toEqual(det.contradictions.map((c) => c.id));
  });

  it("section scores and statuses stay deterministic even when notes are AI", () => {
    const det = buildReport(idea, okAnswers);
    const ai = buildReport(idea, okAnswers, { narrative: makeAINarrative() });
    for (let i = 0; i < det.section_insights.length; i++) {
      expect(ai.section_insights[i].score).toBe(det.section_insights[i].score);
      expect(ai.section_insights[i].status).toBe(det.section_insights[i].status);
    }
  });
});
