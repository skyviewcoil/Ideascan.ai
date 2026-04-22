import type { DecisionType } from "@/types";
import { DECISION_LABELS } from "@/types";

interface DecisionBadgeProps {
  decision: DecisionType;
  size?: "sm" | "md";
}

const TONE: Record<DecisionType, string> = {
  go: "border-success/30 bg-success/10 text-success",
  refine: "border-info/30 bg-info/10 text-info",
  validate_first: "border-warning/30 bg-warning/10 text-warning",
  not_now: "border-danger/30 bg-danger/10 text-danger",
};

export function DecisionBadge({ decision, size = "md" }: DecisionBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border font-heading font-semibold",
        TONE[decision],
        size === "sm" ? "px-2.5 py-1 text-small" : "px-4 py-1.5 text-label",
      ].join(" ")}
    >
      {DECISION_LABELS[decision]}
    </span>
  );
}
