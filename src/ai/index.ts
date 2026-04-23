// Public surface of the AI narrative module.
//
//   generateNarrative(input) — server-side entry. Runs the three prompts
//                              in parallel and returns whatever succeeded.
//   AINarrative, EvaluationInput, and friends — shared types and schemas.

export { generateNarrative } from "./generateNarrative";
export {
  AINarrativeSchema,
  EvaluationInputSchema,
  FinalReportNarrativeSchema,
  SectionInsightsOutputSchema,
  ValidationPlanOutputSchema,
} from "./schema";
export type {
  AINarrative,
  EvaluationInput,
  FinalReportNarrative,
  SectionInsightNarrative,
  SectionInsightsOutput,
  ValidationPhase,
  ValidationPlanOutput,
} from "./schema";
