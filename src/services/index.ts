// Service layer. Still mock-backed — backed by an in-memory session store so
// ideas created during a session stay retrievable by id across routes. Swap
// each implementation for real API calls in a later pass without touching
// callers.

import type { Idea, IdeaAnswer, Report } from "@/types";
import { MOCK_IDEAS } from "@/data/mock/ideas";
import { MOCK_REPORT } from "@/data/mock/report";
import { MOCK_ANSWERS } from "@/data/mock/answers";

// Session-scoped stores. Reset on full page reload — intentional for now.
const ideasStore: Idea[] = MOCK_IDEAS.map((i) => ({ ...i }));
const answersStore: Record<string, Record<string, IdeaAnswer["value"]>> = {
  idea_1: { ...MOCK_ANSWERS },
};

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
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
    await delay(200);
    return ideasStore.slice();
  },
  async get(id: string): Promise<Idea | null> {
    await delay(150);
    return ideasStore.find((i) => i.id === id) ?? null;
  },
  async create(
    input: Pick<Idea, "name" | "category" | "initial_market" | "region">,
  ): Promise<Idea> {
    await delay(300);
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
    ideasStore.unshift(idea);
    answersStore[idea.id] = {};
    return idea;
  },
};

// ── answersService ──────────────────────────────────────────
export const answersService = {
  async getForIdea(ideaId: string): Promise<Record<string, IdeaAnswer["value"]>> {
    await delay(150);
    return { ...(answersStore[ideaId] ?? {}) };
  },
  async save(
    ideaId: string,
    key: string,
    value: IdeaAnswer["value"],
  ): Promise<{ saved_at: string }> {
    await delay(300);
    const bucket = (answersStore[ideaId] ??= {});
    bucket[key] = value;
    return { saved_at: new Date().toISOString() };
  },
};

// ── evaluationService ──────────────────────────────────────
export const evaluationService = {
  async generate(_ideaId: string): Promise<{ ok: true }> {
    await delay(2400);
    return { ok: true };
  },
};

// ── reportsService ─────────────────────────────────────────
export const reportsService = {
  async getForIdea(ideaId: string): Promise<Report | null> {
    await delay(200);
    const idea = ideasStore.find((i) => i.id === ideaId);
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
