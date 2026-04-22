import type { Flag } from "@/types";
import { SECTION_LABELS } from "@/types";

const SEVERITY: Record<Flag["severity"], { label: string; cls: string }> = {
  low: { label: "נמוך", cls: "border-info/30 bg-info/5 text-info" },
  medium: { label: "בינוני", cls: "border-warning/30 bg-warning/5 text-warning" },
  high: { label: "גבוה", cls: "border-danger/30 bg-danger/5 text-danger" },
};

export function FlagCard({ flag }: { flag: Flag }) {
  const sev = SEVERITY[flag.severity];
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2.5 py-0.5 text-small font-semibold ${sev.cls}`}>
          חומרה: {sev.label}
        </span>
        <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-small text-muted-foreground">
          {SECTION_LABELS[flag.related_section]}
        </span>
      </div>
      <h4 className="mt-3 font-heading text-base font-semibold">{flag.title}</h4>
      <p className="mt-1.5 text-body text-muted-foreground">{flag.description}</p>
    </div>
  );
}
