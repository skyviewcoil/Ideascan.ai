// Server-side narrative generator. Runs three independent calls in
// parallel (section insights / final report / validation plan) and
// returns whatever succeeded. Any individual failure surfaces as `null`
// for that slice so callers can fall back to deterministic narrative at
// a per-slice granularity.
//
// Deterministic data (scores, flags, contradictions, confidence, decision)
// is never passed back as AI output — it enters as context and stays in
// the caller's hands.

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

// Model chosen per the project's Claude API guidance. Swap to a cheaper
// tier by changing this one constant.
const MODEL = "claude-opus-4-7";

// Max tokens sized for Hebrew narrative: final report is the longest at
// ~4 paragraphs + two arrays of short strings. 4000 is comfortably over
// the 99th-percentile output size.
const MAX_TOKENS = 4000;

function getClient(): Anthropic | null {
  const apiKey =
    typeof process !== "undefined" && process.env ? process.env.ANTHROPIC_API_KEY : undefined;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

async function parseOne<T>(
  client: Anthropic,
  systemPrompt: string,
  userPrompt: string,
  schema: Parameters<typeof zodOutputFormat>[0],
): Promise<T> {
  // `client.messages.parse()` validates the response against the Zod
  // schema and throws on any mismatch, so a malformed generation bubbles
  // up as an exception the orchestrator catches below.
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: "text",
        text: systemPrompt,
        // Cache the system prompt where possible — only takes effect once
        // the prompt grows past the model's minimum cacheable prefix, but
        // it's safe to set unconditionally.
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
    output_config: {
      format: zodOutputFormat(schema),
    },
  });
  if (!response.parsed_output) {
    throw new Error("parse returned null — schema validation failed");
  }
  return response.parsed_output as T;
}

async function generateSectionInsights(
  client: Anthropic,
  input: EvaluationInput,
): Promise<SectionInsightsOutput> {
  return parseOne<SectionInsightsOutput>(
    client,
    SECTION_INSIGHT_SYSTEM_PROMPT,
    buildSectionInsightUserPrompt(input),
    SectionInsightsOutputSchema,
  );
}

async function generateFinalReport(
  client: Anthropic,
  input: EvaluationInput,
): Promise<FinalReportNarrative> {
  return parseOne<FinalReportNarrative>(
    client,
    FINAL_REPORT_SYSTEM_PROMPT,
    buildFinalReportUserPrompt(input),
    FinalReportNarrativeSchema,
  );
}

async function generateValidationPlan(
  client: Anthropic,
  input: EvaluationInput,
): Promise<ValidationPlanOutput> {
  return parseOne<ValidationPlanOutput>(
    client,
    VALIDATION_PLAN_SYSTEM_PROMPT,
    buildValidationPlanUserPrompt(input),
    ValidationPlanOutputSchema,
  );
}

function settled<T>(result: PromiseSettledResult<T>): T | null {
  if (result.status === "fulfilled") return result.value;
  // Keep failure detail in the server log for debugging; never bubble it
  // back to the client, which already has the deterministic fallback.
  const err = result.reason;
  const message = err instanceof Error ? err.message : String(err);
  console.warn("[narrate] slice failed:", message);
  return null;
}

export async function generateNarrative(input: EvaluationInput): Promise<AINarrative | null> {
  const client = getClient();
  if (!client) {
    // No API key — the caller must fall back to deterministic narrative.
    return null;
  }

  const [sections, finalReport, validation] = await Promise.allSettled([
    generateSectionInsights(client, input),
    generateFinalReport(client, input),
    generateValidationPlan(client, input),
  ]);

  return {
    sections: settled(sections),
    final: settled(finalReport),
    validation: settled(validation),
  };
}
