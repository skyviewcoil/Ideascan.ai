import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PrimaryButton } from "@/components/ui-kit/PrimaryButton";
import { StatusBadge } from "@/components/ui-kit/StatusBadge";
import { EmptyState } from "@/components/states/EmptyState";
import { ideasService } from "@/services";
import type { Idea } from "@/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "הרעיונות שלי — Ideascan.ai" },
      { name: "description", content: "ניהול ובדיקה של רעיונות עסקיים." },
    ],
  }),
  loader: () => ideasService.list(),
  component: DashboardPage,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function IdeaCard({ idea }: { idea: Idea }) {
  const hasReport = idea.status === "report_ready" || idea.status === "needs_update";

  const body = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-heading text-lg font-semibold">{idea.name}</h3>
          <p className="mt-1 text-small text-muted-foreground">
            {idea.category} · {idea.initial_market}
          </p>
        </div>
        <StatusBadge status={idea.status} />
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-small text-muted-foreground">
          <span>השלמה</span>
          <span className="tabular-nums">{idea.completion_percent}%</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-foreground"
            style={{ width: `${idea.completion_percent}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-small text-muted-foreground">
        <span>עודכן {formatDate(idea.updated_at)}</span>
        <span className="font-heading text-foreground transition-transform group-hover:-translate-x-1">
          ←
        </span>
      </div>
    </>
  );

  const className =
    "group block rounded-2xl border border-border bg-surface p-6 transition-all hover:border-foreground/40 hover:shadow-card";

  return hasReport ? (
    <Link to="/report/$ideaId" params={{ ideaId: idea.id }} className={className}>
      {body}
    </Link>
  ) : (
    <Link to="/idea/$ideaId/step-1" params={{ ideaId: idea.id }} className={className}>
      {body}
    </Link>
  );
}

function DashboardPage() {
  const ideas = Route.useLoaderData();
  const isEmpty = ideas.length === 0;

  return (
    <AppShell headerVariant="full">
      <div className="container-app py-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-small text-muted-foreground">שלום, דניאל</p>
            <h1 className="mt-1 font-heading text-3xl font-bold sm:text-4xl">הרעיונות שלי</h1>
            <p className="mt-2 text-body text-muted-foreground">
              {isEmpty
                ? "עדיין לא בדקת רעיון. בוא נתחיל."
                : `יש לך ${ideas.length} רעיונות פעילים.`}
            </p>
          </div>
          <Link to="/idea/new">
            <PrimaryButton size="lg">+ רעיון חדש</PrimaryButton>
          </Link>
        </header>

        <div className="mt-8">
          {isEmpty ? (
            <EmptyState
              title="עדיין אין רעיונות"
              description="התחל את הבדיקה הראשונה שלך וקבל דוח החלטה תוך כ־15 דקות."
              action={
                <Link to="/idea/new">
                  <PrimaryButton size="lg">התחל רעיון ראשון</PrimaryButton>
                </Link>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ideas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
