// Confidence reflects how trustable the deterministic output is:
//   high   — questionnaire essentially complete, no blocking high-severity flags.
//   medium — mostly complete; some gaps or moderate flags.
//   low    — too many gaps or too many high-severity flags.

import type { Confidence, Flag, SectionScores, Signals } from "./types";

export function calculateConfidence(
  signals: Signals,
  scores: SectionScores,
  flags: Flag[],
): Confidence {
  const highSeverity = flags.filter((f) => f.severity === "high").length;
  const completeness = signals.completeness_percent;

  if (completeness < 60) return "low";
  if (highSeverity >= 3) return "low";
  if (scores.total < 35) return "low";

  if (completeness >= 95 && highSeverity === 0 && scores.total >= 60) return "high";
  return "medium";
}
