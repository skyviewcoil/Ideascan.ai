// Server function bridge between the (client) services layer and the
// (server) AI narrative generator. Runs only on the Cloudflare Worker,
// where the ANTHROPIC_API_KEY is available.
//
// This is the single client→server seam; nothing else in the app talks
// to Anthropic directly. Any unexpected error inside the handler is
// converted to `null` (deterministic fallback) — provider-specific
// errors are never bubbled back to the client.

import { createServerFn } from "@tanstack/react-start";
import { generateNarrative } from "@/ai/generateNarrative";
import { log } from "@/ai/logger";
import { EvaluationInputSchema, type AINarrative, type EvaluationInput } from "@/ai/schema";
import { z } from "zod";

const RequestSchema = z.object({
  evaluation: EvaluationInputSchema,
  idea_id: z.string().optional(),
  user_id: z.string().nullable().optional(),
});

type NarrateRequest = z.infer<typeof RequestSchema>;

export const narrateFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown): NarrateRequest => RequestSchema.parse(data))
  .handler(async ({ data }: { data: NarrateRequest }): Promise<AINarrative | null> => {
    try {
      const evaluation: EvaluationInput = data.evaluation;
      return await generateNarrative(evaluation, {
        ideaId: data.idea_id,
        userId: data.user_id ?? null,
      });
    } catch (err) {
      // generateNarrative itself swallows per-slice errors, so reaching
      // this catch means an unexpected top-level failure (e.g. the SDK
      // constructor threw). Log it and degrade — the client never sees
      // the provider's error shape.
      const message = err instanceof Error ? err.message : String(err);
      log("error", "narrate.fallback", {
        idea_id: data.idea_id ?? "unknown",
        user_id: data.user_id ?? null,
        reason: "handler_exception",
        error_message: message.slice(0, 200),
      });
      return null;
    }
  });
