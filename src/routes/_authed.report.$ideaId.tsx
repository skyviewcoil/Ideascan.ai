import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PrimaryButton } from "@/components/ui-kit/PrimaryButton";
import { DecisionBadge } from "@/components/report/DecisionBadge";
import { ScoreCard } from "@/components/report/ScoreCard";
import { FlagCard } from "@/components/report/FlagCard";
import { ContradictionCard } from "@/components/report/ContradictionCard";
import { ValidationPlanList } from "@/components/report/ValidationPlanList";
import { ReportSection } from "@/components/report/ReportSection";
import { StaleReportBanner } from "@/components/report/StaleReportBanner";
import { EmptyState } from "@/components/states/EmptyState";
import { LoadingState } from "@/components/states/LoadingState";
import { useAsyncData } from "@/hooks/useAsyncData";
import { ideasService, reportsService } from "@/services";
import type { Idea, Report } from "@/types";

export const Route = createFileRoute("/_authed/report/$ideaId")({
  head: () => ({
    meta: [
      { title: "דוח החלטה — Ideascan.ai" },
      {
        name: "description",
        content: "דוח החלטה מלא: ציונים, חוזקות, חולשות, סתירות ותוכנית בדיקה.",
      },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { ideaId } = Route.useParams();
  const state = useAsyncData(async () => {
    const [idea, report] = await Promise.all([
      ideasService.get(ideaId),
      reportsService.getForIdea(ideaId),
    ]);
    return { idea, report };
  }, [ideaId]);

  if (state.status === "loading") {
    return (
      <AppShell headerVariant="minimal">
        <LoadingState />
      </AppShell>
    );
  }

  if (state.status === "error") {
    return (
      <AppShell headerVariant="minimal">
        <div className="container-app py-16">
          <EmptyState
            title="טעינת הדוח נכשלה"
            description="נסה לרענן את הדף."
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

  const { idea, report } = state.data;

  if (!idea) {
    return (
      <AppShell headerVariant="minimal">
        <div className="container-app py-16">
          <EmptyState
            title="הדוח לא נמצא"
            description="הרעיון שביקשת לא קיים או נמחק."
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

  if (!report) {
    return (
      <AppShell headerVariant="minimal">
        <div className="container-app py-16">
          <EmptyState
            title="הדוח עוד לא מוכן"
            description={`הרעיון "${idea.name}" עדיין בטיוטה. השלם את הניתוח כדי להפיק דוח החלטה.`}
            action={
              <Link to="/idea/$ideaId/step-1" params={{ ideaId: idea.id }}>
                <PrimaryButton>המשך מילוי</PrimaryButton>
              </Link>
            }
          />
        </div>
      </AppShell>
    );
  }

  return <ReportContent idea={idea} report={report} />;
}

function ReportContent({ idea, report }: { idea: Idea; report: Report }) {
  return (
    <AppShell headerVariant="full">
      <div className="container-app py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/dashboard" className="text-small text-muted-foreground hover:text-foreground">
            ← חזרה ללוח הבקרה
          </Link>
          <div className="flex flex-wrap gap-2 no-print">
            <Link to="/report/$ideaId/print" params={{ ideaId: idea.id }}>
              <PrimaryButton variant="secondary">תצוגת הדפסה</PrimaryButton>
            </Link>
            <PrimaryButton onClick={() => window.print()}>ייצוא / הדפסה</PrimaryButton>
          </div>
        </div>

        {report.is_stale && (
          <div className="mt-6">
            <StaleReportBanner />
          </div>
        )}

        {/* HERO */}
        <section className="mt-6 rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-small text-muted-foreground">דוח החלטה</p>
              <h1 className="mt-1 font-heading text-3xl font-bold sm:text-4xl">{idea.name}</h1>
              <p className="mt-2 text-body-lg text-muted-foreground">{report.summary.headline}</p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <DecisionBadge decision={report.summary.decision} />
              <div className="rounded-lg border border-border bg-surface-muted px-4 py-2">
                <p className="text-small text-muted-foreground">ציון כולל</p>
                <p className="font-heading text-2xl font-bold tabular-nums">
                  {report.summary.total_score}
                  <span className="text-base font-normal text-muted-foreground"> / 100</span>
                </p>
              </div>
            </div>
          </div>
          <p className="mt-6 max-w-3xl text-body-lg text-foreground">
            {report.summary.short_summary}
          </p>
        </section>

        {/* SCORES */}
        <ReportSection
          title="ציונים לפי סעיף"
          description="כל סעיף מקבל ציון 0–100 לפי איכות התשובות."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {report.section_insights.map((ins) => (
              <ScoreCard key={ins.section} insight={ins} />
            ))}
          </div>
        </ReportSection>

        {/* STRENGTHS / WEAKNESSES */}
        <ReportSection title="חוזקות מרכזיות">
          <ul className="grid gap-3 sm:grid-cols-2">
            {report.strengths.map((s, i) => (
              <li
                key={i}
                className="rounded-2xl border border-success/20 bg-success/5 p-4 text-body"
              >
                {s}
              </li>
            ))}
          </ul>
        </ReportSection>

        <ReportSection title="חולשות מרכזיות">
          <ul className="grid gap-3 sm:grid-cols-2">
            {report.weaknesses.map((s, i) => (
              <li
                key={i}
                className="rounded-2xl border border-warning/20 bg-warning/5 p-4 text-body"
              >
                {s}
              </li>
            ))}
          </ul>
        </ReportSection>

        {/* CRITICAL ASSUMPTION */}
        <ReportSection title="ההנחה הכי מסוכנת">
          <div className="rounded-2xl border border-danger/20 bg-danger/5 p-5">
            <p className="text-body-lg text-foreground">{report.critical_assumption}</p>
          </div>
        </ReportSection>

        {/* FLAGS */}
        <ReportSection
          title="דגלים שדורשים תשומת לב"
          description="נושאים עם פוטנציאל סיכון לפני שמתקדמים."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {report.flags.map((f) => (
              <FlagCard key={f.id} flag={f} />
            ))}
          </div>
        </ReportSection>

        {/* CONTRADICTIONS */}
        <ReportSection title="פערים לוגיים שזוהו" description="סתירות בין תשובות שונות שלך.">
          <div className="grid gap-4 sm:grid-cols-2">
            {report.contradictions.map((c) => (
              <ContradictionCard key={c.id} item={c} />
            ))}
          </div>
        </ReportSection>

        {/* PLAN */}
        <ReportSection
          title="תוכנית בדיקה ל־14 יום"
          description="מסלול ממוקד לאימות ההנחות הקריטיות."
        >
          <ValidationPlanList items={report.validation_plan} />
        </ReportSection>

        {/* RECOMMENDATION */}
        <ReportSection title="המלצה ישירה">
          <div className="rounded-2xl border border-foreground/10 bg-foreground p-6 text-surface">
            <p className="text-body-lg leading-relaxed">{report.recommendation}</p>
          </div>
        </ReportSection>

        <div className="h-12" />
      </div>
    </AppShell>
  );
}
