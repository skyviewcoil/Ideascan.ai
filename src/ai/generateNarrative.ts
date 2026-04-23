// Server-side narrative generator. Runs three independent calls in
// parallel (section insights / final report / validation plan) and
// returns whatever succeeded. Any individual failure surfaces as `null`
// for that slice so callers can fall back to deterministic narrative at
// a per-slice granularity.
//
// Hardening layers (PR #4):
//   - Env validation — missing or blank ANTHROPIC_API_KEY degrades
//     gracefully to null, callers keep deterministic text.
//   - Per-call timeout via AbortSignal; the SDK's built-in 2-retry
//     backoff still applies on transient 429/5xx.
//   - Structured logs on every start / failure / success (latency per
//     slice), never emitting raw answers or AI output bodies.

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  AINarrative,
  EvaluationInput,
  FinalReportNarrative,
  FinalReportNarrativeSchema,
  SectionInsightsOutput,
  SectionInsightsOutputSchema,
  ValidationPlanOutput,
  ValidationPlanOutputSchema,
} from "./schema";
import {
  SECTION_INSIGHT_SYSTEM_PROMPT,
  buildSectionInsightUserPrompt,
} from "./prompts/sectionInsight.v1";
import { FINAL_REPORT_SYSTEM_PROMPT, buildFinalReportUserPrompt } from "./prompts/finalReport.v1";
import {
  VALIDATION_PLAN_SYSTEM_PROMPT,
  buildValidationPlanUserPrompt,
} from "./prompts/validationPlan.v1";
import { log } from "./logger";

// Model chosen per the project's Claude API guidance. Swap to a cheaper
// tier by changing this one constant.
const MODEL = "claude-opus-4-7";

// Max tokens sized for Hebrew narrative: final report is the longest at
// ~4 paragraphs + two arrays of short strings. 4000 is comfortably over
// the 99th-percentile output size.
const MAX_TOKENS = 4000;

// Hard wall-clock ceiling per slice call. The SDK retries twice on
// transient failures, so this is a ceiling on the full retry window.
const CALL_TIMEOUT_MS = 25_000;

export type SliceName = "sections" | "final" | "validation";

type SliceStatus = "ok" | "error" | "timeout" | "skipped";

function readApiKey(): string | null {
  if (typeof process === "undefined" || !process.env) return null;
  const raw = process.env.ANTHROPIC_API_KEY;
  if (!raw || raw.trim().length === 0) return null;
  return raw;
}

function getClient(): Anthropic | null {
  const apiKey = readApiKey();
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

async function parseOne<T>(
  client: Anthropic,
  systemPrompt: string,
  userPrompt: string,
  schema: Parameters<typeof zodOutputFormat>[0],
): Promise<T> {
  // AbortController feeds the SDK's `signal` option; if the wall-clock
  // timeout fires the request throws and Promise.allSettled downgrades
  // the slice to null.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);
  try {
    const response = await client.messages.parse(
      {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: [
          {
            type: "text",
            text: systemPrompt,
            // Cache the system prompt where possible — only takes effect
            // once the prompt grows past the model's minimum cacheable
            // prefix, but it's safe to set unconditionally.
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: userPrompt }],
        output_config: {
          format: zodOutputFormat(schema),
        },
      },
      { signal: controller.signal },
    );
    if (!response.parsed_output) {
      throw new Error("parse returned null — schema validation failed");
    }
    return response.parsed_output as T;
  } finally {
    clearTimeout(timer);
  }
}

async function timedSlice<T>(
  name: SliceName,
  ideaId: string,
  userId: string | null,
  run: () => Promise<T>,
): Promise<{ status: SliceStatus; value: T | null; duration_ms: number }> {
  const started = Date.now();
  try {
    const value = await run();
    return { status: "ok", value, duration_ms: Date.now() - started };
  } catch (err) {
    const duration_ms = Date.now() - started;
    const message = err instanceof Error ? err.message : String(err);
    const isAbort =
      err instanceof Error && (err.name === "AbortError" || /aborted|timeout/i.test(err.message));
    const status: SliceStatus = isAbort ? "timeout" : "error";
    log("warn", "narrate.slice_failure", {
      slice: name,
      idea_id: ideaId,
      user_id: userId,
      status,
      duration_ms,
      error_message: message.slice(0, 200),
    });
    return { status, value: null, duration_ms };
  }
}

export async function generateNarrative(
  input: EvaluationInput,
  context: { ideaId?: string; userId?: string | null } = {},
): Promise<AINarrative | null> {
  const ideaId = context.ideaId ?? "unknown";
  const userId = context.userId ?? null;

  const client = getClient();
  if (!client) {
    log("warn", "narrate.fallback", {
      idea_id: ideaId,
      user_id: userId,
      reason: "missing_api_key",
    });
    return null;
  }

  log("info", "narrate.start", {
    idea_id: ideaId,
    user_id: userId,
    decision: input.decision,
    confidence: input.confidence,
    total_score: input.scores.total,
    flag_count: input.flags.length,
    contradiction_count: input.contradictions.length,
  });

  const started = Date.now();
  const [sections, finalReport, validation] = await Promise.all([
    timedSlice<SectionInsightsOutput>("sections", ideaId, userId, () =>
      parseOne(
        client,
        SECTION_INSIGHT_SYSTEM_PROMPT,
        buildSectionInsightUserPrompt(input),
        SectionInsightsOutputSchema,
      ),
    ),
    timedSlice<FinalReportNarrative>("final", ideaId, userId, () =>
      parseOne(
        client,
        FINAL_REPORT_SYSTEM_PROMPT,
        buildFinalReportUserPrompt(input),
        FinalReportNarrativeSchema,
      ),
    ),
    timedSlice<ValidationPlanOutput>("validation", ideaId, userId, () =>
      parseOne(
        client,
        VALIDATION_PLAN_SYSTEM_PROMPT,
        buildValidationPlanUserPrompt(input),
        ValidationPlanOutputSchema,
      ),
    ),
  ]);

  log("info", "narrate.complete", {
    idea_id: ideaId,
    user_id: userId,
    total_duration_ms: Date.now() - started,
    slice_sections: sections.status,
    slice_final: finalReport.status,
    slice_validation: validation.status,
    sections_ms: sections.duration_ms,
    final_ms: finalReport.duration_ms,
    validation_ms: validation.duration_ms,
  });

  return {
    sections: sections.value,
    final: finalReport.value,
    validation: validation.value,
  };
}
