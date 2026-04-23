// Service layer — the single integration seam for the rest of the app.
//
// Backed by Supabase (Postgres + Auth) via the repositories in
// ./repositories. All user-scoping is enforced by RLS policies on the
// DB side (`auth.uid() = user_id`), so the service calls never need
// to thread a userId manually; the Supabase client already has the
// session and every query goes out with that user's JWT.
//
// The deterministic engine and the AI narrative layer are unchanged —
// evaluationService.generate() orchestrates: evaluate locally → narrate
// on the server → buildReport → persist. Report views become a cheap
// DB read.

import type { Idea, IdeaAnswer, Report } from "@/types";
import type { AINarrative } from "@/ai/schema";
import { buildReport, evaluate, toEvaluationInput } from "@/engine";
import { narrateFn } from "@/server/narrate";
import { log } from "@/ai/logger";
import { checkRate, recordGeneration } from "@/ai/rateGuard";
import { QUESTIONS } from "@/config/questions";
import { ideasRepo } from "./repositories/ideas.repo";
import { answersRepo } from "./repositories/answers.repo";
import { evaluationsRepo } from "./repositories/evaluations.repo";
import { reportsRepo } from "./repositories/reports.repo";
import { authService } from "./auth";

export { authService } from "./auth";
export type { AuthService } from "./auth";

// ── progress helpers ───────────────────────────────────────
// Duplicated narrowly from the engine so we don't pay the cost of a
// full evaluate() just to bump progress metadata on every keystroke.
const REQUIRED_QUESTIONS = QUESTIONS.filter((q) => q.required);
const REQUIRED_TOTAL = REQUIRED_QUESTIONS.length;

function isAnswered(value: IdeaAnswer["value"] | undefined): boolean {
  if (value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return true;
  return false;
}

function completionPercent(answers: Record<string, IdeaAnswer["value"]>): number {
  if (REQUIRED_TOTAL === 0) return 0;
  const answered = REQUIRED_QUESTIONS.reduce((n, q) => (isAnswered(answers[q.key]) ? n + 1 : n), 0);
  return Math.round((answered / REQUIRED_TOTAL) * 100);
}

function stepForQuestion(questionKey: string): 1 | 2 | 3 | 4 | 5 | null {
  const q = QUESTIONS.find((x) => x.key === questionKey);
  return q ? q.step : null;
}

async function currentUserId(): Promise<string | null> {
  const user = await authService.getCurrentUser();
  return user?.id ?? null;
}

// ── ideasService ────────────────────────────────────────────
export const ideasService = {
  async list(): Promise<Idea[]> {
    try {
      return await ideasRepo.list();
    } catch (err) {
      log("error", "ideas.list_failed", {
        error_message: err instanceof Error ? err.message : String(err),
      });
      return [];
    }
  },

  async get(id: string): Promise<Idea | null> {
    try {
      return await ideasRepo.get(id);
    } catch (err) {
      log("error", "ideas.get_failed", {
        idea_id: id,
        error_message: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  },

  async create(
    input: Pick<Idea, "name" | "category" | "initial_market" | "region">,
  ): Promise<Idea> {
    const uid = await currentUserId();
    if (!uid) throw new Error("Cannot create idea: no active session.");
    return ideasRepo.create(uid, input);
  },

  async setCurrentStep(ideaId: string, step: 1 | 2 | 3 | 4 | 5): Promise<void> {
    try {
      const idea = await ideasRepo.get(ideaId);
      if (!idea) return;
      if (idea.current_step >= step) return;
      await ideasRepo.update(ideaId, { current_step: step });
    } catch (err) {
      log("warn", "ideas.set_current_step_failed", {
        idea_id: ideaId,
        error_message: err instanceof Error ? err.message : String(err),
      });
    }
  },
};

// ── answersService ──────────────────────────────────────────
export const answersService = {
  async getForIdea(ideaId: string): Promise<Record<string, IdeaAnswer["value"]>> {
    try {
      return await answersRepo.getForIdea(ideaId);
    } catch (err) {
      log("error", "answers.get_failed", {
        idea_id: ideaId,
        error_message: err instanceof Error ? err.message : String(err),
      });
      return {};
    }
  },

  async save(
    ideaId: string,
    key: string,
    value: IdeaAnswer["value"],
  ): Promise<{ saved_at: string }> {
    const uid = await currentUserId();
    if (!uid) throw new Error("Cannot save answer: no active session.");

    // Write the answer first — if this fails, the caller surfaces the
    // error. Progress bookkeeping on the idea row is best-effort and
    // never blocks the save.
    const saved = await answersRepo.upsert(uid, ideaId, key, value);

    try {
      const idea = await ideasRepo.get(ideaId);
      if (idea) {
        const bucket = await answersRepo.getForIdea(ideaId);
        const step = stepForQuestion(key);
        const nextStep = step !== null && step > idea.current_step ? step : idea.current_step;
        // Editing after report_ready invalidates the generated report.
        const nextStatus: Idea["status"] =
          idea.status === "report_ready" ? "needs_update" : idea.status;
        await ideasRepo.update(ideaId, {
          current_step: nextStep as Idea["current_step"],
          completion_percent: completionPercent(bucket),
          status: nextStatus,
        });
      }
    } catch (err) {
      log("warn", "ideas.progress_update_failed", {
        idea_id: ideaId,
        error_message: err instanceof Error ? err.message : String(err),
      });
    }

    return saved;
  },
};

// ── evaluationService ──────────────────────────────────────
// Runs when the user hits /analyzing. End-to-end: load answers, score
// deterministically, ask the AI for narrative, assemble the Report,
// persist all three (evaluation + report + idea status), and return.
export const evaluationService = {
  async generate(ideaId: string): Promise<{ ok: true }> {
    const uid = await currentUserId();
    if (!uid) throw new Error("Cannot generate evaluation: no active session.");

    const idea = await ideasRepo.get(ideaId);
    if (!idea) throw new Error("Cannot generate evaluation: idea not found.");

    const answers = await answersRepo.getForIdea(ideaId);
    const result = evaluate(answers);

    // Save the deterministic evaluation first — always recorded, even
    // if the AI narrative pass later fails.
    try {
      await evaluationsRepo.save(uid, ideaId, result);
    } catch (err) {
      log("error", "evaluation.save_failed", {
        idea_id: ideaId,
        error_message: err instanceof Error ? err.message : String(err),
      });
    }

    // Narrative — optional. Rate-guarded to prevent spam regeneration
    // burning inference budget.
    let narrative: AINarrative | null = null;
    const rate = checkRate(uid);
    if (!rate.allowed) {
      log("warn", "narrate.rate_limited", {
        idea_id: ideaId,
        user_id: uid,
        reason: rate.reason,
        count: rate.count,
        window_ms: rate.window_ms,
      });
    } else {
      try {
        const input = toEvaluationInput(idea, result);
        narrative = await narrateFn({
          data: { evaluation: input, idea_id: ideaId, user_id: uid },
        });
      } catch (err) {
        log("warn", "narrate.fallback", {
          idea_id: ideaId,
          user_id: uid,
          reason: "transport_error",
          error_message: err instanceof Error ? err.message : String(err),
        });
      }
      recordGeneration(uid);
    }

    const report = buildReport(idea, answers, {
      narrative,
      generated_at: new Date().toISOString(),
    });

    // Persist the report and flip idea status. A save failure here
    // still leaves the evaluation row in place; the user can retry by
    // re-entering the analyzing screen.
    try {
      await reportsRepo.upsert(uid, report);
      await ideasRepo.update(ideaId, { status: "report_ready" });
    } catch (err) {
      log("error", "report.save_failed", {
        idea_id: ideaId,
        error_message: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }

    return { ok: true };
  },
};

// ── reportsService ─────────────────────────────────────────
export const reportsService = {
  async getForIdea(ideaId: string): Promise<Report | null> {
    try {
      const report = await reportsRepo.getForIdea(ideaId);
      if (!report) return null;
      // Refresh the stale flag from the idea row — the report was
      // frozen at generation time, but the idea's status may have
      // bumped to `needs_update` since.
      const idea = await ideasRepo.get(ideaId);
      if (idea?.status === "needs_update") {
        return { ...report, is_stale: true };
      }
      return report;
    } catch (err) {
      log("error", "report.get_failed", {
        idea_id: ideaId,
        error_message: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  },
};
