// Service layer — the single integration seam for the rest of the app.
//
// Currently backed by localStorage via ./storage. A later pass can replace
// the bodies here with real HTTP calls; signatures are kept stable so
// callers (routes, components) don't have to change.

import type { Idea, IdeaAnswer, IdeaStatus, Report } from "@/types";
import { QUESTIONS } from "@/config/questions";
import { MOCK_IDEAS } from "@/data/mock/ideas";
import { MOCK_REPORT } from "@/data/mock/report";
import { MOCK_ANSWERS } from "@/data/mock/answers";
import { isBrowser, readKey, writeKey } from "./storage";

type AnswersByIdea = Record<string, Record<string, IdeaAnswer["value"]>>;

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// Server-side fallbacks used when there is no localStorage (SSR). These are
// effectively the public demo dataset.
const SEED_IDEAS: Idea[] = MOCK_IDEAS.map((i) => ({ ...i }));
const SEED_ANSWERS: AnswersByIdea = { idea_1: { ...MOCK_ANSWERS } };

function loadIdeas(): Idea[] {
  if (!isBrowser()) return SEED_IDEAS.map((i) => ({ ...i }));
  const stored = readKey<Idea[]>("ideas");
  if (stored) return stored;
  // First run on this browser — seed with the demo ideas so the dashboard
  // isn't empty while there's no backend.
  writeKey<Idea[]>("ideas", SEED_IDEAS);
  return SEED_IDEAS.map((i) => ({ ...i }));
}

function loadAnswers(): AnswersByIdea {
  if (!isBrowser()) return structuredCloneSafe(SEED_ANSWERS);
  const stored = readKey<AnswersByIdea>("answers");
  if (stored) return stored;
  writeKey<AnswersByIdea>("answers", SEED_ANSWERS);
  return structuredCloneSafe(SEED_ANSWERS);
}

function structuredCloneSafe<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function persistIdeas(ideas: Idea[]) {
  writeKey<Idea[]>("ideas", ideas);
}

function persistAnswers(answers: AnswersByIdea) {
  writeKey<AnswersByIdea>("answers", answers);
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

// ── authService ─────────────────────────────────────────────
export const authService = {
  async signIn(_email: string, _password: string) {
    await delay(400);
    return { ok: true as const };
  },
  async signUp(_email: string, _password: string) {
    await delay(400);
    return { ok: true as const };
  },
  async signOut(): Promise<void> {
    await delay(100);
  },
  getCurrentUser(): { id: string; name: string; email: string } | null {
    return { id: "u_1", name: "דניאל", email: "daniel@example.com" };
  },
};

// ── ideasService ────────────────────────────────────────────
export const ideasService = {
  async list(): Promise<Idea[]> {
    await delay(120);
    return loadIdeas();
  },
  async get(id: string): Promise<Idea | null> {
    await delay(80);
    return loadIdeas().find((i) => i.id === id) ?? null;
  },
  async create(
    input: Pick<Idea, "name" | "category" | "initial_market" | "region">,
  ): Promise<Idea> {
    await delay(200);
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
    const ideas = loadIdeas();
    ideas.unshift(idea);
    persistIdeas(ideas);

    const answers = loadAnswers();
    answers[idea.id] = {};
    persistAnswers(answers);

    return idea;
  },
  async setCurrentStep(ideaId: string, step: 1 | 2 | 3 | 4 | 5): Promise<void> {
    await delay(50);
    const ideas = loadIdeas();
    const idx = ideas.findIndex((i) => i.id === ideaId);
    if (idx < 0) return;
    const idea = ideas[idx];
    if (idea.current_step >= step) return;
    ideas[idx] = {
      ...idea,
      current_step: step,
      updated_at: new Date().toISOString(),
    };
    persistIdeas(ideas);
  },
};

// ── answersService ──────────────────────────────────────────
export const answersService = {
  async getForIdea(ideaId: string): Promise<Record<string, IdeaAnswer["value"]>> {
    await delay(80);
    return { ...(loadAnswers()[ideaId] ?? {}) };
  },
  async save(
    ideaId: string,
    key: string,
    value: IdeaAnswer["value"],
  ): Promise<{ saved_at: string }> {
    await delay(180);

    const answers = loadAnswers();
    const bucket = { ...(answers[ideaId] ?? {}), [key]: value };
    answers[ideaId] = bucket;
    persistAnswers(answers);

    // Keep idea progress metadata coherent so the dashboard and step headers
    // don't drift from the actual answer state.
    const ideas = loadIdeas();
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
      persistIdeas(ideas);
    }

    return { saved_at: new Date().toISOString() };
  },
};

// ── evaluationService ──────────────────────────────────────
export const evaluationService = {
  // Called when the user finishes step 5 and reaches /analyzing. For now this
  // just flips idea status so the report route can start returning a report.
  async generate(ideaId: string): Promise<{ ok: true }> {
    await delay(300);
    const ideas = loadIdeas();
    const idx = ideas.findIndex((i) => i.id === ideaId);
    if (idx < 0) return { ok: true };
    ideas[idx] = {
      ...ideas[idx],
      status: "report_ready",
      updated_at: new Date().toISOString(),
    };
    persistIdeas(ideas);
    return { ok: true };
  },
};

// ── reportsService ─────────────────────────────────────────
export const reportsService = {
  async getForIdea(ideaId: string): Promise<Report | null> {
    await delay(120);
    const idea = loadIdeas().find((i) => i.id === ideaId);
    if (!idea) return null;
    const hasReport = idea.status === "report_ready" || idea.status === "needs_update";
    if (!hasReport) return null;
    return {
      ...MOCK_REPORT,
      idea_id: idea.id,
      is_stale: idea.status === "needs_update",
    };
  },
};
