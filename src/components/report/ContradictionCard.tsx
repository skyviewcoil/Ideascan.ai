import type { Contradiction } from "@/types";

export function ContradictionCard({ item }: { item: Contradiction }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h4 className="font-heading text-base font-semibold">{item.title}</h4>
      <p className="mt-1.5 text-body text-muted-foreground">{item.description}</p>
      {item.related_questions.length > 0 && (
        <p className="mt-3 text-small text-muted-foreground">
          קשור לשאלות: {item.related_questions.join(" · ")}
        </p>
      )}
    </div>
  );
}
