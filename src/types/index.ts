// Core domain types for Idea Validator.
// These shapes are the contract between UI and (future) backend.

export type SectionKey =
  | "problem"
  | "market"
  | "differentiation"
  | "monetization"
  | "distribution"
  | "execution"
  | "founder_fit";

export type IdeaStatus = "draft" | "completed" | "report_ready" | "needs_update";

export type DecisionType =
  | "go"
  | "refine"
  | "validate_first"
  | "not_now";

export type QuestionType =
  | "short_text"
  | "long_text"
  | "single_choice"
  | "multi_choice"
  | "scale";

export interface QuestionOption {
  value: string;
  label: string;
  helper?: string;
}

export interface QuestionDefinition {
  key: string;
  step: 1 | 2 | 3 | 4 | 5;
  section: SectionKey;
  type: QuestionType;
  label: string;
  helper_text?: string;
  placeholder?: string;
  required?: boolean;
  options?: QuestionOption[];
  ai_classification_needed?: boolean;
  scoring_impact_keys?: SectionKey[];
}

export interface Idea {
  id: string;
  name: string;
  category: string;
  initial_market: string;
  region: string;
  status: IdeaStatus;
  created_at: string;
  updated_at: string;
  current_step: 1 | 2 | 3 | 4 | 5;
  completion_percent: number;
}

export interface IdeaAnswer {
  idea_id: string;
  question_key: string;
  value: string | string[] | number;
  updated_at: string;
}

export interface SectionInsight {
  section: SectionKey;
  score: number; // 0–100
  status: "empty" | "weak" | "ok" | "strong";
  note: string;
}

export interface Flag {
  id: string;
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  related_section: SectionKey;
}

export interface Contradiction {
  id: string;
  title: string;
  description: string;
  related_questions: string[];
}

export interface ValidationPlanItem {
  id: string;
  day_range: string; // e.g. "ימים 1–3"
  title: string;
  description: string;
  outcome: string;
}

export interface EvaluationSummary {
  decision: DecisionType;
  total_score: number; // 0–100
  headline: string;
  short_summary: string;
}

export interface Report {
  id: string;
  idea_id: string;
  generated_at: string;
  is_stale: boolean;
  summary: EvaluationSummary;
  section_insights: SectionInsight[];
  strengths: string[];
  weaknesses: string[];
  critical_assumption: string;
  flags: Flag[];
  contradictions: Contradiction[];
  validation_plan: ValidationPlanItem[];
  recommendation: string;
}

export interface IdeaRevision {
  id: string;
  idea_id: string;
  created_at: string;
  note: string;
}

export interface AIOutput {
  id: string;
  idea_id: string;
  kind: "section_insight" | "flag" | "contradiction" | "summary";
  payload: unknown;
  created_at: string;
}

// Display labels for sections (Hebrew)
export const SECTION_LABELS: Record<SectionKey, string> = {
  problem: "בעיה",
  market: "שוק",
  differentiation: "בידול",
  monetization: "מוניטיזציה",
  distribution: "הפצה",
  execution: "ביצוע",
  founder_fit: "התאמת מייסד",
};

export const DECISION_LABELS: Record<DecisionType, string> = {
  go: "אפשר להתקדם",
  refine: "צריך חידוד",
  validate_first: "צריך לאמת לפני שבונים",
  not_now: "לא נכון כרגע",
};

export const STATUS_LABELS: Record<IdeaStatus, string> = {
  draft: "טיוטה",
  completed: "הושלם",
  report_ready: "דוח מוכן",
  needs_update: "דורש עדכון",
};
