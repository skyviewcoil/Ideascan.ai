// Evaluations repository. Append-only: every call to
// evaluationService.generate() inserts a new row; we never update or
// delete in place. Consumers read the latest row for a given idea.

import type { EvaluationResult } from "@/engine";
import { getSupabase } from "@/lib/supabase";

type EvaluationRow = {
  id: string;
  idea_id: string;
  user_id: string;
  total_score: number;
  problem_score: number;
  market_score: number;
  differentiation_score: number;
  monetization_score: number;
  distribution_score: number;
  execution_score: number;
  founder_fit_score: number;
  confidence_level: EvaluationResult["confidence"];
  decision_candidate: EvaluationResult["decision"];
  signals_json: unknown;
  flags_json: unknown;
  contradictions_json: unknown;
  created_at: string;
  updated_at: string;
};

export const evaluationsRepo = {
  async save(userId: string, ideaId: string, result: EvaluationResult): Promise<void> {
    const client = getSupabase();
    if (!client) throw new Error("evaluations.save: supabase not configured");
    const row = {
      idea_id: ideaId,
      user_id: userId,
      total_score: result.scores.total,
      problem_score: result.scores.problem,
      market_score: result.scores.market,
      differentiation_score: result.scores.differentiation,
      monetization_score: result.scores.monetization,
      distribution_score: result.scores.distribution,
      execution_score: result.scores.execution,
      founder_fit_score: result.scores.founder_fit,
      confidence_level: result.confidence,
      decision_candidate: result.decision,
      signals_json: result.signals,
      flags_json: result.flags,
      contradictions_json: result.contradictions,
    };
    const { error } = await client.from("evaluations").insert(row);
    if (error) throw new Error(`evaluations.save: ${error.message}`);
  },

  async getLatest(ideaId: string): Promise<EvaluationRow | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from("evaluations")
      .select("*")
      .eq("idea_id", ideaId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`evaluations.getLatest: ${error.message}`);
    return (data as EvaluationRow | null) ?? null;
  },
};
