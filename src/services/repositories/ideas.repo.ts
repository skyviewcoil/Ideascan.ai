// Ideas repository — the only place that knows the `ideas` table
// layout. Maps between the app's `Idea` TypeScript shape (which uses
// the legacy field names `name`, `initial_market`, `region`) and the
// database columns (`title`, `target_market`, `country`). Services
// consume the mapped `Idea` and never see DB types.

import type { Idea } from "@/types";
import { getSupabase } from "@/lib/supabase";

type IdeaRow = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  target_market: string;
  country: string;
  current_step: number;
  completion_percent: number;
  status: Idea["status"];
  created_at: string;
  updated_at: string;
};

function rowToIdea(row: IdeaRow): Idea {
  return {
    id: row.id,
    name: row.title,
    category: row.category,
    initial_market: row.target_market,
    region: row.country,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    current_step: row.current_step as Idea["current_step"],
    completion_percent: row.completion_percent,
  };
}

export const ideasRepo = {
  async list(): Promise<Idea[]> {
    const client = getSupabase();
    if (!client) return [];
    const { data, error } = await client
      .from("ideas")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(`ideas.list: ${error.message}`);
    return (data as IdeaRow[] | null)?.map(rowToIdea) ?? [];
  },

  async get(ideaId: string): Promise<Idea | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client.from("ideas").select("*").eq("id", ideaId).maybeSingle();
    // `maybeSingle` returns null on zero rows without throwing; any
    // other error bubbles up as a service failure.
    if (error) throw new Error(`ideas.get: ${error.message}`);
    return data ? rowToIdea(data as IdeaRow) : null;
  },

  async create(
    userId: string,
    input: Pick<Idea, "name" | "category" | "initial_market" | "region">,
  ): Promise<Idea> {
    const client = getSupabase();
    if (!client) throw new Error("ideas.create: supabase not configured");
    const { data, error } = await client
      .from("ideas")
      .insert({
        user_id: userId,
        title: input.name,
        category: input.category,
        target_market: input.initial_market,
        country: input.region,
        status: "draft",
        current_step: 1,
        completion_percent: 0,
      })
      .select("*")
      .single();
    if (error) throw new Error(`ideas.create: ${error.message}`);
    return rowToIdea(data as IdeaRow);
  },

  async update(ideaId: string, patch: Partial<Idea>): Promise<Idea | null> {
    const client = getSupabase();
    if (!client) return null;
    const dbPatch: Partial<IdeaRow> = {};
    if (patch.name !== undefined) dbPatch.title = patch.name;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.initial_market !== undefined) dbPatch.target_market = patch.initial_market;
    if (patch.region !== undefined) dbPatch.country = patch.region;
    if (patch.current_step !== undefined) dbPatch.current_step = patch.current_step;
    if (patch.completion_percent !== undefined)
      dbPatch.completion_percent = patch.completion_percent;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    // `updated_at` is stamped by the DB trigger; never pass it from
    // here.
    const { data, error } = await client
      .from("ideas")
      .update(dbPatch)
      .eq("id", ideaId)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`ideas.update: ${error.message}`);
    return data ? rowToIdea(data as IdeaRow) : null;
  },
};
