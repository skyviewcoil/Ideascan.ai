// Decide which of the four outcomes the evaluation lands on.
// Rules are ordered — the first one that matches wins.

import type { Confidence, DecisionType, Flag, SectionScores } from "./types";

const BLOCKING_FLAGS = new Set([
  "no_payment_signal",
  "business_model_unclear",
  "acquisition_unclear",
]);

export function decideOutcome(
  scores: SectionScores,
  flags: Flag[],
  confidence: Confidence,
): DecisionType {
  const highSeverity = flags.filter((f) => f.severity === "high").length;
  const hasBlocking = flags.some((f) => f.severity === "high" && BLOCKING_FLAGS.has(f.id));

  // 1. Hard reject — obvious red flags or very low total.
  if (scores.total < 40) return "not_now";
  if (highSeverity >= 3) return "not_now";
  if (confidence === "low" && scores.total < 55) return "not_now";

  // 2. Validate first — real signal but a specific blocker must be resolved
  //    before building anything.
  if (hasBlocking) return "validate_first";
  if (scores.total < 65) return "validate_first";

  // 3. Refine — solid premise, needs sharpening on one or two dimensions.
  if (scores.total < 78 || confidence !== "high") return "refine";
  if (highSeverity >= 1) return "refine";

  // 4. Go — everything lines up.
  return "go";
}
