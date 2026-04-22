import type { IdeaStatus } from "@/types";
import { STATUS_LABELS } from "@/types";

const TONE: Record<IdeaStatus, string> = {
  draft: "border-border bg-surface-muted text-muted-foreground",
  completed: "border-info/30 bg-info/10 text-info",
  report_ready: "border-success/30 bg-success/10 text-success",
  needs_update: "border-warning/30 bg-warning/10 text-warning",
};

export function StatusBadge({ status }: { status: IdeaStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-small font-semibold ${TONE[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
