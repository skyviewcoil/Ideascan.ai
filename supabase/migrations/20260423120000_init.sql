-- Ideascan.ai — initial schema
--
-- Tables: ideas, idea_answers, evaluations, reports.
-- Every user-owned row carries `user_id` referencing auth.users(id).
-- RLS is enabled on every table; per-row policies enforce
--   auth.uid() = user_id
-- for every CRUD verb. A missing/expired JWT ⇒ no access.

-- ── helpers ────────────────────────────────────────────────
-- updated_at trigger so we don't have to set it from the client.
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── ideas ──────────────────────────────────────────────────
CREATE TABLE public.ideas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  title          TEXT NOT NULL,
  category       TEXT NOT NULL DEFAULT '',
  target_market  TEXT NOT NULL DEFAULT '',
  country        TEXT NOT NULL DEFAULT '',

  current_step        SMALLINT NOT NULL DEFAULT 1
                      CHECK (current_step BETWEEN 1 AND 5),
  completion_percent  SMALLINT NOT NULL DEFAULT 0
                      CHECK (completion_percent BETWEEN 0 AND 100),
  status              TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','completed','report_ready','needs_update')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ideas_user_id_updated_at_idx
  ON public.ideas(user_id, updated_at DESC);

CREATE TRIGGER ideas_touch_updated_at
  BEFORE UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY ideas_select_own ON public.ideas
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY ideas_insert_own ON public.ideas
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY ideas_update_own ON public.ideas
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY ideas_delete_own ON public.ideas
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ── idea_answers ───────────────────────────────────────────
-- Answer values are split by type so we can query a specific shape
-- without JSON parsing. Exactly one of the three value columns is
-- non-null per row (enforced by the check constraint).
CREATE TABLE public.idea_answers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id       UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  section_key   TEXT NOT NULL,
  question_key  TEXT NOT NULL,
  answer_type   TEXT NOT NULL CHECK (answer_type IN ('text','number','json')),

  answer_value_text   TEXT,
  answer_value_number NUMERIC,
  answer_value_json   JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT one_value_per_row CHECK (
    (answer_type = 'text'   AND answer_value_text   IS NOT NULL
                            AND answer_value_number IS NULL
                            AND answer_value_json   IS NULL)
    OR
    (answer_type = 'number' AND answer_value_number IS NOT NULL
                            AND answer_value_text   IS NULL
                            AND answer_value_json   IS NULL)
    OR
    (answer_type = 'json'   AND answer_value_json   IS NOT NULL
                            AND answer_value_text   IS NULL
                            AND answer_value_number IS NULL)
  ),
  CONSTRAINT idea_answers_unique UNIQUE (idea_id, question_key)
);

CREATE INDEX idea_answers_idea_id_idx ON public.idea_answers(idea_id);

CREATE TRIGGER idea_answers_touch_updated_at
  BEFORE UPDATE ON public.idea_answers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.idea_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY idea_answers_select_own ON public.idea_answers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY idea_answers_insert_own ON public.idea_answers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY idea_answers_update_own ON public.idea_answers
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY idea_answers_delete_own ON public.idea_answers
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── evaluations ────────────────────────────────────────────
-- One row per generated evaluation. History is append-only — the
-- latest row (by created_at) is the current evaluation. Never updated
-- in place, so no updated_at trigger.
CREATE TABLE public.evaluations (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id  UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  total_score           SMALLINT NOT NULL CHECK (total_score BETWEEN 0 AND 100),
  problem_score         SMALLINT NOT NULL CHECK (problem_score BETWEEN 0 AND 100),
  market_score          SMALLINT NOT NULL CHECK (market_score BETWEEN 0 AND 100),
  differentiation_score SMALLINT NOT NULL CHECK (differentiation_score BETWEEN 0 AND 100),
  monetization_score    SMALLINT NOT NULL CHECK (monetization_score BETWEEN 0 AND 100),
  distribution_score    SMALLINT NOT NULL CHECK (distribution_score BETWEEN 0 AND 100),
  execution_score       SMALLINT NOT NULL CHECK (execution_score BETWEEN 0 AND 100),
  founder_fit_score     SMALLINT NOT NULL CHECK (founder_fit_score BETWEEN 0 AND 100),

  confidence_level   TEXT NOT NULL CHECK (confidence_level IN ('high','medium','low')),
  decision_candidate TEXT NOT NULL CHECK (decision_candidate IN ('go','refine','validate_first','not_now')),

  signals_json        JSONB NOT NULL,
  flags_json          JSONB NOT NULL,
  contradictions_json JSONB NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX evaluations_idea_id_created_at_idx
  ON public.evaluations(idea_id, created_at DESC);

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY evaluations_select_own ON public.evaluations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY evaluations_insert_own ON public.evaluations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- evaluations are append-only — no update / delete policy.

-- ── reports ────────────────────────────────────────────────
-- One report per idea (the current one). Updated in place when a new
-- evaluation + narrative is generated. `report_json` holds the full
-- serialized Report object for fast single-query reads; the other
-- columns are denormalized for queries / dashboards.
CREATE TABLE public.reports (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id  UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  narrative_source  TEXT NOT NULL CHECK (narrative_source IN ('ai','deterministic','hybrid')),

  summary              TEXT NOT NULL,
  strengths_json       JSONB NOT NULL,
  weaknesses_json      JSONB NOT NULL,
  critical_assumption  TEXT NOT NULL,
  why_not_ready_yet    TEXT,
  recommended_mvp      TEXT,
  validation_plan_json JSONB NOT NULL,
  section_insights_json JSONB NOT NULL,
  report_json          JSONB NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT reports_idea_id_unique UNIQUE (idea_id)
);

CREATE INDEX reports_idea_id_idx ON public.reports(idea_id);

CREATE TRIGGER reports_touch_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY reports_select_own ON public.reports
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY reports_insert_own ON public.reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY reports_update_own ON public.reports
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY reports_delete_own ON public.reports
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
