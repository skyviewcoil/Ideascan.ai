// Reports repository. One row per idea (unique constraint on idea_id);
// updated in place when a new narrative is generated. `report_json`
// carries the full serialized Report for single-query reads.

import type { Report } from "@/types";
import { getSupabase } from "@/lib/supabase";

type ReportRow = {
  id: string;
  idea_id: string;
  user_id: string;
  narrative_source: "ai" | "deterministic" | "hybrid";
  summary: string;
  strengths_json: string[];
  weaknesses_json: string[];
  critical_assumption: string;
  why_not_ready_yet: string | null;
  recommended_mvp: string | null;
  validation_plan_json: Report["validation_plan"];
  section_insights_json: Report["section_insights"];
  report_json: Report;
  created_at: string;
  updated_at: string;
};

export const reportsRepo = {
  async upsert(userId: string, report: Report): Promise<Report> {
    const client = getSupabase();
    if (!client) throw new Error("reports.upsert: supabase not configured");
    const row = {
      idea_id: report.idea_id,
      user_id: userId,
      narrative_source: report.narrative_source ?? "deterministic",
      summary: report.summary.short_summary,
      strengths_json: report.strengths,
      weaknesses_json: report.weaknesses,
      critical_assumption: report.critical_assumption,
      why_not_ready_yet: report.why_not_ready_yet ?? null,
      recommended_mvp: report.recommended_mvp ?? null,
      validation_plan_json: report.validation_plan,
      section_insights_json: report.section_insights,
      report_json: report,
    };
    const { data, error } = await client
      .from("reports")
      .upsert(row, { onConflict: "idea_id" })
      .select("report_json")
      .single();
    if (error) throw new Error(`reports.upsert: ${error.message}`);
    return (data as { report_json: Report }).report_json;
  },

  async getForIdea(ideaId: string): Promise<Report | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from("reports")
      .select("report_json")
      .eq("idea_id", ideaId)
      .maybeSingle();
    if (error) throw new Error(`reports.getForIdea: ${error.message}`);
    return (data as { report_json: Report } | null)?.report_json ?? null;
  },
};

export type { ReportRow };
