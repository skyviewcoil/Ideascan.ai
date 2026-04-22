// Service stubs. Mock implementations now — replace with real backend later.

import type { Idea, IdeaAnswer, Report } from "@/types";
import { MOCK_IDEAS } from "@/data/mock/ideas";
import { MOCK_REPORT } from "@/data/mock/report";
import { MOCK_ANSWERS } from "@/data/mock/answers";

// ── authService ─────────────────────────────────────────────
export const authService = {
  async signIn(_email: string, _password: string): Promise<{ ok: true }> {
    await delay(400);
    return { ok: true };
  },
  async signUp(_email: string, _password: string): Promise<{ ok: true }> {
    await delay(400);
    return { ok: true };
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
    return MOCK_IDEAS;
  },
  async get(id: string): Promise<Idea | null> {
    await delay(150);
    return MOCK_IDEAS.find((i) => i.id === id) ?? null;
  },
  async create(input: Pick<Idea, "name" | "category" | "initial_market" | "region">): Promise<Idea> {
    await delay(300);
    return {
      id: `idea_${Date.now()}`,
      ...input,
      status: "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      current_step: 1,
      completion_percent: 0,
    };
  },
};

// ── answersService ──────────────────────────────────────────
export const answersService = {
  async getForIdea(_ideaId: string): Promise<Record<string, IdeaAnswer["value"]>> {
    await delay(150);
    return MOCK_ANSWERS;
  },
  async save(_ideaId: string, _key: string, _value: IdeaAnswer["value"]): Promise<{ saved_at: string }> {
    await delay(300);
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
  async getForIdea(_ideaId: string): Promise<Report> {
    await delay(200);
    return MOCK_REPORT;
  },
};

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
