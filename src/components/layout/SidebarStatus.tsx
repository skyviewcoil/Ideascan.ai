import type { SectionInsight, SectionKey } from "@/types";
import { SectionStatusItem } from "./SectionStatusItem";

interface SidebarStatusProps {
  ideaName?: string;
  insights?: SectionInsight[];
  warning?: string;
  insight?: { title: string; body: string };
}

const SECTION_ORDER: SectionKey[] = [
  "problem",
  "market",
  "differentiation",
  "monetization",
  "distribution",
  "execution",
  "founder_fit",
];

export function SidebarStatus({ ideaName, insights, warning, insight }: SidebarStatusProps) {
  const byKey = new Map(insights?.map((i) => [i.section, i]) ?? []);

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-28 space-y-4">
        {ideaName && (
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-small text-muted-foreground">רעיון פעיל</p>
            <h3 className="mt-1 font-heading text-lg font-semibold">{ideaName}</h3>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h4 className="text-label text-foreground">סטטוס סעיפים</h4>
          <div className="mt-3 divide-y divide-border">
            {SECTION_ORDER.map((s) => (
              <SectionStatusItem key={s} section={s} insight={byKey.get(s)} />
            ))}
          </div>
        </div>

        {warning && (
          <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4">
            <p className="text-label text-warning">דגל חם</p>
            <p className="mt-1 text-small text-foreground">{warning}</p>
          </div>
        )}

        {insight && (
          <div className="rounded-2xl border border-border bg-surface-muted p-4">
            <p className="text-label">{insight.title}</p>
            <p className="mt-1 text-small text-muted-foreground">{insight.body}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
