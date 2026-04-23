// Server function bridge between the (client) services layer and the
// (server) AI narrative generator. Runs only on the Cloudflare Worker,
// where the ANTHROPIC_API_KEY is available.
//
// This is the single client→server seam; nothing else in the app talks
// to Anthropic directly.

import { createServerFn } from "@tanstack/react-start";
import { generateNarrative } from "@/ai/generateNarrative";
import { EvaluationInputSchema, type AINarrative, type EvaluationInput } from "@/ai/schema";

export const narrateFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown): EvaluationInput => EvaluationInputSchema.parse(data))
  .handler(async ({ data }: { data: EvaluationInput }): Promise<AINarrative | null> => {
    return generateNarrative(data);
  });
