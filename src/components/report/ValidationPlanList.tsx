import type { ValidationPlanItem } from "@/types";

export function ValidationPlanList({ items }: { items: ValidationPlanItem[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, idx) => (
        <li
          key={item.id}
          className="rounded-2xl border border-border bg-surface p-5"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-foreground font-heading text-sm font-bold text-surface">
              {idx + 1}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-small text-muted-foreground">{item.day_range}</p>
              <h4 className="mt-0.5 font-heading text-base font-semibold">{item.title}</h4>
              <p className="mt-1.5 text-body text-muted-foreground">{item.description}</p>
              <div className="mt-3 rounded-lg border border-border bg-surface-muted px-3 py-2">
                <span className="text-small text-muted-foreground">תוצאה רצויה: </span>
                <span className="text-small text-foreground">{item.outcome}</span>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
