import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/states/EmptyState";
import { LoadingState } from "@/components/states/LoadingState";
import { PrimaryButton } from "@/components/ui-kit/PrimaryButton";
import { evaluationService, ideasService } from "@/services";

export const Route = createFileRoute("/idea/$ideaId/analyzing")({
  head: () => ({ meta: [{ title: "מנתח את הרעיון…" }] }),
  component: AnalyzingPage,
});

const STAGES = [
  "מנתחים את התשובות",
  "מזהים חוזקות וחולשות",
  "בודקים סתירות והנחות",
  "בונים דוח ותוכנית בדיקה",
];

function AnalyzingPage() {
  const { ideaId } = Route.useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<"checking" | "missing" | "running">("checking");
  const [stage, setStage] = useState(0);

  // Kick off the (mock) evaluation once we've confirmed the idea exists.
  useEffect(() => {
    let cancelled = false;
    ideasService.get(ideaId).then((idea) => {
      if (cancelled) return;
      if (!idea) {
        setStatus("missing");
        return;
      }
      setStatus("running");
      evaluationService.generate(ideaId);
    });
    return () => {
      cancelled = true;
    };
  }, [ideaId]);

  // Stage animation + redirect once evaluation + animation both finish.
  useEffect(() => {
    if (status !== "running") return;
    if (stage >= STAGES.length) {
      const t = window.setTimeout(
        () => navigate({ to: "/report/$ideaId", params: { ideaId } }),
        600,
      );
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setStage((s) => s + 1), 900);
    return () => window.clearTimeout(t);
  }, [status, stage, navigate, ideaId]);

  if (status === "checking") {
    return (
      <AppShell headerVariant="minimal">
        <LoadingState />
      </AppShell>
    );
  }

  if (status === "missing") {
    return (
      <AppShell headerVariant="minimal">
        <div className="container-app py-16">
          <EmptyState
            title="הרעיון לא נמצא"
            description="לא ניתן להפיק דוח — הרעיון לא קיים או נמחק."
            action={
              <Link to="/dashboard">
                <PrimaryButton>חזרה ללוח הבקרה</PrimaryButton>
              </Link>
            }
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell headerVariant="minimal">
      <div className="container-app flex min-h-[calc(100vh-64px)] items-center justify-center py-12">
        <div className="w-full max-w-xl">
          <div className="rounded-2xl border border-border bg-surface p-8 sm:p-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-small text-muted-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              מפיק דוח
            </span>
            <h1 className="mt-5 font-heading text-3xl font-bold">מנתחים את הרעיון</h1>
            <p className="mt-2 text-body text-muted-foreground">
              התהליך לוקח כמה שניות. אל תסגור את החלון.
            </p>

            <ul className="mt-8 space-y-3">
              {STAGES.map((s, i) => {
                const done = i < stage;
                const active = i === stage;
                return (
                  <li
                    key={s}
                    className={[
                      "flex items-center gap-3 rounded-lg border px-4 py-3 transition-all",
                      done
                        ? "border-success/30 bg-success/5"
                        : active
                          ? "border-foreground/30 bg-surface-muted"
                          : "border-border bg-surface",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-6 w-6 flex-none items-center justify-center rounded-full border text-small font-bold",
                        done
                          ? "border-success bg-success text-success-foreground"
                          : active
                            ? "border-foreground/40 bg-surface text-foreground"
                            : "border-border bg-surface text-muted-foreground",
                      ].join(" ")}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <span
                      className={
                        done
                          ? "text-foreground"
                          : active
                            ? "text-foreground"
                            : "text-muted-foreground"
                      }
                    >
                      {s}
                    </span>
                    {active && (
                      <span className="ms-auto h-4 w-4 animate-spin rounded-full border-2 border-border border-t-foreground" />
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
