import type { SectionInsight } from "@/types";
import { SECTION_LABELS } from "@/types";

interface ScoreCardProps {
  insight: SectionInsight;
}

const STATUS_BAR: Record<SectionInsight["status"], string> = {
  empty: "bg-border",
  weak: "bg-warning",
  ok: "bg-info",
  strong: "bg-success",
};

export function ScoreCard({ insight }: ScoreCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-baseline justify-between">
        <h4 className="font-heading text-base font-semibold">{SECTION_LABELS[insight.section]}</h4>
        <span className="font-heading text-2xl font-bold tabular-nums">{insight.score}</span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className={`h-full rounded-full ${STATUS_BAR[insight.status]} transition-all`}
          style={{ width: `${insight.score}%` }}
        />
      </div>
      <p className="mt-3 text-small text-muted-foreground">{insight.note}</p>
    </div>
  );
}
