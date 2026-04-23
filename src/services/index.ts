// Service layer — the single integration seam for the rest of the app.
//
// Currently backed by localStorage via ./storage and ./auth. A later pass
// can replace the bodies here with real HTTP calls; signatures are stable
// so callers (routes, components) don't have to change.
//
// All data operations are scoped to the current user's id. Sign-out wipes
// the session but keeps the user's data in localStorage (so signing in
// again with the same id restores it).

import type { Idea, IdeaAnswer, IdeaStatus, Report } from "@/types";
import type { AINarrative } from "@/ai/schema";
import { QUESTIONS } from "@/config/questions";
import { MOCK_IDEAS } from "@/data/mock/ideas";
import { MOCK_ANSWERS } from "@/data/mock/answers";
import { buildReport, evaluate, toEvaluationInput } from "@/engine";
import { narrateFn } from "@/server/narrate";
import { isBrowser, readKey, writeKey } from "./storage";
import { authService } from "./auth";

export { authService } from "./auth";
export type { AuthService } from "./auth";

type AnswersByIdea = Record<string, Record<string, IdeaAnswer["value"]>>;

// Narrative cache — keyed by idea, pinned to the idea's updated_at.
// When a user edits an answer `updated_at` bumps and the cached
// narrative is invalidated automatically.
type NarrativeCacheEntry = {
  narrative: AINarrative;
  idea_updated_at: string;
  generated_at: string;
};
type NarrativeCacheByIdea = Record<string, NarrativeCacheEntry>;

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// Server-side fallbacks used when there is no localStorage (SSR). These are
// effectively the public demo dataset — no user scoping possible.
const SEED_IDEAS: Idea[] = MOCK_IDEAS.map((i) => ({ ...i }));
const SEED_ANSWERS: AnswersByIdea = { idea_1: { ...MOCK_ANSWERS } };

function structuredCloneSafe<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

async function currentUserId(): Promise<string | null> {
  const user = await authService.getCurrentUser();
  return user?.id ?? null;
}

function loadIdeas(userId: string | null): Idea[] {
  if (!isBrowser() || !userId) return SEED_IDEAS.map((i) => ({ ...i }));
  const stored = readKey<Idea[]>("ideas", userId);
  if (stored) return stored;
  // First run for this user on this browser — seed the demo dataset so
  // the dashboard isn't empty while there's no backend.
  writeKey<Idea[]>("ideas", SEED_IDEAS, userId);
  return SEED_IDEAS.map((i) => ({ ...i }));
}

function loadAnswers(userId: string | null): AnswersByIdea {
  if (!isBrowser() || !userId) return structuredCloneSafe(SEED_ANSWERS);
  const stored = readKey<AnswersByIdea>("answers", userId);
  if (stored) return stored;
  writeKey<AnswersByIdea>("answers", SEED_ANSWERS, userId);
  return structuredCloneSafe(SEED_ANSWERS);
}

function persistIdeas(ideas: Idea[], userId: string) {
  writeKey<Idea[]>("ideas", ideas, userId);
}

function persistAnswers(answers: AnswersByIdea, userId: string) {
  writeKey<AnswersByIdea>("answers", answers, userId);
}

// ── Progress helpers ───────────────────────────────────────
const REQUIRED_QUESTIONS = QUESTIONS.filter((q) => q.required);
const REQUIRED_TOTAL = REQUIRED_QUESTIONS.length;

function isAnswered(value: IdeaAnswer["value"] | undefined): boolean {
  if (value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return true;
  return false;
}

function computeCompletionPercent(
  answers: Record<string, IdeaAnswer["value"]> | undefined,
): number {
  if (REQUIRED_TOTAL === 0) return 0;
  const a = answers ?? {};
  const answered = REQUIRED_QUESTIONS.reduce((n, q) => (isAnswered(a[q.key]) ? n + 1 : n), 0);
  return Math.round((answered / REQUIRED_TOTAL) * 100);
}

function nextStatusAfterEdit(current: IdeaStatus): IdeaStatus {
  // Editing an answer invalidates a generated report.
  if (current === "report_ready") return "needs_update";
  return current;
}

function stepForQuestion(questionKey: string): 1 | 2 | 3 | 4 | 5 | null {
  const q = QUESTIONS.find((x) => x.key === questionKey);
  return q ? q.step : null;
}

// ── ideasService ────────────────────────────────────────────
export const ideasService = {
  async list(): Promise<Idea[]> {
    await delay(120);
    const uid = await currentUserId();
    return loadIdeas(uid);
  },
  async get(id: string): Promise<Idea | null> {
    await delay(80);
    const uid = await currentUserId();
    return loadIdeas(uid).find((i) => i.id === id) ?? null;
  },
  async create(
    input: Pick<Idea, "name" | "category" | "initial_market" | "region">,
  ): Promise<Idea> {
    await delay(200);
    const uid = await currentUserId();
    if (!uid) throw new Error("Cannot create idea: no active session.");
    const now = new Date().toISOString();
    const idea: Idea = {
      id: `idea_${Date.now()}`,
      ...input,
      status: "draft",
      created_at: now,
      updated_at: now,
      current_step: 1,
      completion_percent: 0,
    };
    const ideas = loadIdeas(uid);
    ideas.unshift(idea);
    persistIdeas(ideas, uid);

    const answers = loadAnswers(uid);
    answers[idea.id] = {};
    persistAnswers(answers, uid);

    return idea;
  },
  async setCurrentStep(ideaId: string, step: 1 | 2 | 3 | 4 | 5): Promise<void> {
    await delay(50);
    const uid = await currentUserId();
    if (!uid) return;
    const ideas = loadIdeas(uid);
    const idx = ideas.findIndex((i) => i.id === ideaId);
    if (idx < 0) return;
    const idea = ideas[idx];
    if (idea.current_step >= step) return;
    ideas[idx] = {
      ...idea,
      current_step: step,
      updated_at: new Date().toISOString(),
    };
    persistIdeas(ideas, uid);
  },
};

// ── answersService ──────────────────────────────────────────
export const answersService = {
  async getForIdea(ideaId: string): Promise<Record<string, IdeaAnswer["value"]>> {
    await delay(80);
    const uid = await currentUserId();
    return { ...(loadAnswers(uid)[ideaId] ?? {}) };
  },
  async save(
    ideaId: string,
    key: string,
    value: IdeaAnswer["value"],
  ): Promise<{ saved_at: string }> {
    await delay(180);
    const uid = await currentUserId();
    if (!uid) throw new Error("Cannot save answer: no active session.");

    const answers = loadAnswers(uid);
    const bucket = { ...(answers[ideaId] ?? {}), [key]: value };
    answers[ideaId] = bucket;
    persistAnswers(answers, uid);

    // Keep idea progress metadata coherent so the dashboard and step
    // headers don't drift from the actual answer state.
    const ideas = loadIdeas(uid);
    const idx = ideas.findIndex((i) => i.id === ideaId);
    if (idx >= 0) {
      const current = ideas[idx];
      const step = stepForQuestion(key);
      const nextStep = step !== null && step > current.current_step ? step : current.current_step;
      ideas[idx] = {
        ...current,
        current_step: nextStep,
        completion_percent: computeCompletionPercent(bucket),
        status: nextStatusAfterEdit(current.status),
        updated_at: new Date().toISOString(),
      };
      persistIdeas(ideas, uid);
    }

    return { saved_at: new Date().toISOString() };
  },
};

// ── evaluationService ──────────────────────────────────────
export const evaluationService = {
  // Called when the user finishes step 5 and reaches /analyzing. Runs the
  // deterministic engine once against the saved answers (validating that
  // evaluation produces a result) and flips idea status so the report
  // route starts returning a report.
  async generate(ideaId: string): Promise<{ ok: true }> {
    await delay(300);
    const uid = await currentUserId();
    if (!uid) return { ok: true };
    const ideas = loadIdeas(uid);
    const idx = ideas.findIndex((i) => i.id === ideaId);
    if (idx < 0) return { ok: true };
    // The engine itself is pure, so we don't need to persist its output —
    // reportsService.getForIdea regenerates it on demand. We still call it
    // here to fail fast on any evaluation error and keep parity with how a
    // real backend would behave.
    buildReport(ideas[idx], loadAnswers(uid)[ideaId] ?? {});
    ideas[idx] = {
      ...ideas[idx],
      status: "report_ready",
      updated_at: new Date().toISOString(),
    };
    persistIdeas(ideas, uid);
    return { ok: true };
  },
};

// ── narrative cache helpers ─────────────────────────────────
function loadNarratives(userId: string | null): NarrativeCacheByIdea {
  if (!isBrowser() || !userId) return {};
  return readKey<NarrativeCacheByIdea>("narratives", userId) ?? {};
}

function persistNarrative(userId: string, ideaId: string, entry: NarrativeCacheEntry) {
  const cache = loadNarratives(userId);
  cache[ideaId] = entry;
  try {
    writeKey<NarrativeCacheByIdea>("narratives", cache, userId);
  } catch {
    // Non-fatal — next view regenerates. Don't fail the report render.
  }
}

async function fetchNarrative(
  idea: Idea,
  answers: Record<string, IdeaAnswer["value"]>,
): Promise<AINarrative | null> {
  try {
    const evaluation = evaluate(answers);
    const input = toEvaluationInput(idea, evaluation);
    // Calls the server function; on the client this becomes an HTTP POST.
    return await narrateFn({ data: input });
  } catch (err) {
    // Network error, schema rejection, or missing API key on the server
    // — any of these mean "no AI narrative this time". The caller falls
    // back to the deterministic text.
    if (typeof console !== "undefined") {
      const message = err instanceof Error ? err.message : String(err);
      console.warn("[reportsService] narrative fetch failed:", message);
    }
    return null;
  }
}

// ── reportsService ─────────────────────────────────────────
export const reportsService = {
  async getForIdea(ideaId: string): Promise<Report | null> {
    await delay(120);
    const uid = await currentUserId();
    const idea = loadIdeas(uid).find((i) => i.id === ideaId);
    if (!idea) return null;
    const hasReport = idea.status === "report_ready" || idea.status === "needs_update";
    if (!hasReport) return null;
    const answers = loadAnswers(uid)[ideaId] ?? {};

    // AI narrative cache: use when the idea hasn't been edited since the
    // narrative was generated. Stale reports (`needs_update`) always
    // regenerate since the underlying answers changed.
    let narrative: AINarrative | null = null;
    if (uid) {
      const cache = loadNarratives(uid);
      const cached = cache[ideaId];
      if (cached && cached.idea_updated_at === idea.updated_at) {
        narrative = cached.narrative;
      } else {
        narrative = await fetchNarrative(idea, answers);
        if (narrative) {
          persistNarrative(uid, ideaId, {
            narrative,
            idea_updated_at: idea.updated_at,
            generated_at: new Date().toISOString(),
          });
        }
      }
    }

    return buildReport(idea, answers, {
      is_stale: idea.status === "needs_update",
      generated_at: idea.updated_at,
      narrative,
    });
  },
};
