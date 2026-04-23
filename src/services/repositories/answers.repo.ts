// Answers repository. Each questionnaire answer is one row keyed by
// (idea_id, question_key). Value is stored in one of three typed
// columns (text / number / json) — the DB check constraint enforces
// exactly one is non-null. The repo hides that split and returns a
// flat `Record<questionKey, value>` map to services.

import type { IdeaAnswer } from "@/types";
import { QUESTIONS } from "@/config/questions";
import { getSupabase } from "@/lib/supabase";

type AnswerValue = IdeaAnswer["value"];

type AnswerRow = {
  idea_id: string;
  user_id: string;
  section_key: string;
  question_key: string;
  answer_type: "text" | "number" | "json";
  answer_value_text: string | null;
  answer_value_number: number | null;
  answer_value_json: unknown | null;
};

type AnswerInsert = Omit<AnswerRow, never>;

function sectionKeyFor(questionKey: string): string {
  // The QUESTIONS config already encodes section-per-question. If a
  // question has been retired, default to "problem" rather than
  // rejecting the save — never break persistence on config drift.
  return QUESTIONS.find((q) => q.key === questionKey)?.section ?? "problem";
}

function splitValue(
  value: AnswerValue,
): Pick<
  AnswerInsert,
  "answer_type" | "answer_value_text" | "answer_value_number" | "answer_value_json"
> {
  if (typeof value === "number") {
    return {
      answer_type: "number",
      answer_value_text: null,
      answer_value_number: value,
      answer_value_json: null,
    };
  }
  if (Array.isArray(value)) {
    return {
      answer_type: "json",
      answer_value_text: null,
      answer_value_number: null,
      answer_value_json: value,
    };
  }
  return {
    answer_type: "text",
    answer_value_text: value,
    answer_value_number: null,
    answer_value_json: null,
  };
}

function rowToValue(
  row: Pick<
    AnswerRow,
    "answer_type" | "answer_value_text" | "answer_value_number" | "answer_value_json"
  >,
): AnswerValue {
  switch (row.answer_type) {
    case "number":
      return row.answer_value_number ?? 0;
    case "json":
      // We only store string[] arrays today; wider JSON shapes are not
      // produced by any question. Treat anything else as empty array
      // rather than throw, so config drift cannot brick the form.
      if (Array.isArray(row.answer_value_json)) {
        return row.answer_value_json.filter((x): x is string => typeof x === "string");
      }
      return [];
    case "text":
    default:
      return row.answer_value_text ?? "";
  }
}

export const answersRepo = {
  async getForIdea(ideaId: string): Promise<Record<string, AnswerValue>> {
    const client = getSupabase();
    if (!client) return {};
    const { data, error } = await client
      .from("idea_answers")
      .select(
        "question_key, answer_type, answer_value_text, answer_value_number, answer_value_json",
      )
      .eq("idea_id", ideaId);
    if (error) throw new Error(`answers.getForIdea: ${error.message}`);
    const out: Record<string, AnswerValue> = {};
    for (const row of (data ?? []) as AnswerRow[]) {
      out[row.question_key] = rowToValue(row);
    }
    return out;
  },

  async upsert(
    userId: string,
    ideaId: string,
    questionKey: string,
    value: AnswerValue,
  ): Promise<{ saved_at: string }> {
    const client = getSupabase();
    if (!client) throw new Error("answers.upsert: supabase not configured");
    const row: AnswerInsert = {
      idea_id: ideaId,
      user_id: userId,
      section_key: sectionKeyFor(questionKey),
      question_key: questionKey,
      ...splitValue(value),
    };
    // onConflict uses the (idea_id, question_key) unique constraint.
    const { error } = await client
      .from("idea_answers")
      .upsert(row, { onConflict: "idea_id,question_key" });
    if (error) throw new Error(`answers.upsert: ${error.message}`);
    return { saved_at: new Date().toISOString() };
  },
};
