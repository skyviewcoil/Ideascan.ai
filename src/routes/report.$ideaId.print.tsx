import { createFileRoute, notFound } from "@tanstack/react-router";
import { DecisionBadge } from "@/components/report/DecisionBadge";
import { MOCK_REPORT } from "@/data/mock/report";
import { MOCK_IDEAS } from "@/data/mock/ideas";
import { SECTION_LABELS } from "@/types";

export const Route = createFileRoute("/report/$ideaId/print")({
  head: () => ({
    meta: [
      { title: "דוח להדפסה — Ideascan.ai" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ params }) => {
    const idea = MOCK_IDEAS.find((i) => i.id === params.ideaId) ?? MOCK_IDEAS[0];
    if (!idea) throw notFound();
    return { idea, report: { ...MOCK_REPORT, idea_id: idea.id } };
  },
  component: PrintReportPage,
});

function PrintReportPage() {
  const { idea, report } = Route.useLoaderData();

  return (
    <div style={{ background: "#fff", color: "#171717" }} className="min-h-screen">
      <div className="mx-auto max-w-3xl px-8 py-10 print:px-0 print:py-0">
        {/* Action bar — hidden in print */}
        <div className="no-print mb-8 flex items-center justify-between border-b border-border pb-4">
          <p className="text-small text-muted-foreground">תצוגת הדפסה</p>
          <button
            onClick={() => window.print()}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-label hover:bg-surface-muted"
          >
            הדפס / שמור כ־PDF
          </button>
        </div>

        <header>
          <p className="text-small text-muted-foreground">דוח החלטה — Ideascan.ai</p>
          <h1 className="mt-1 font-heading text-4xl font-bold">{idea.name}</h1>
          <p className="mt-1 text-body text-muted-foreground">
            {idea.category} · {idea.initial_market} · {idea.region}
          </p>
          <div className="mt-4 flex items-center gap-4">
            <DecisionBadge decision={report.summary.decision} />
            <span className="font-heading text-lg">
              ציון כולל: <strong>{report.summary.total_score}</strong> / 100
            </span>
          </div>
          <p className="mt-5 text-body-lg">{report.summary.short_summary}</p>
        </header>

        <section className="mt-10">
          <h2 className="font-heading text-2xl font-bold">ציונים לפי סעיף</h2>
          <table className="mt-4 w-full border-collapse text-right">
            <tbody>
              {report.section_insights.map((ins) => (
                <tr key={ins.section} className="border-b border-border">
                  <td className="py-2 font-semibold">{SECTION_LABELS[ins.section]}</td>
                  <td className="py-2 tabular-nums">{ins.score} / 100</td>
                  <td className="py-2 text-muted-foreground">{ins.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-10">
          <h2 className="font-heading text-2xl font-bold">חוזקות מרכזיות</h2>
          <ul className="mt-3 list-disc space-y-1.5 pe-5">
            {report.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="font-heading text-2xl font-bold">חולשות מרכזיות</h2>
          <ul className="mt-3 list-disc space-y-1.5 pe-5">
            {report.weaknesses.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="font-heading text-2xl font-bold">ההנחה הכי מסוכנת</h2>
          <p className="mt-2">{report.critical_assumption}</p>
        </section>

        <section className="mt-8 page-break">
          <h2 className="font-heading text-2xl font-bold">דגלים שדורשים תשומת לב</h2>
          {report.flags.map((f) => (
            <div key={f.id} className="mt-3 border-r-4 border-border pe-3 ps-4">
              <p className="font-semibold">{f.title}</p>
              <p className="text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </section>

        <section className="mt-8">
          <h2 className="font-heading text-2xl font-bold">פערים לוגיים שזוהו</h2>
          {report.contradictions.map((c) => (
            <div key={c.id} className="mt-3">
              <p className="font-semibold">{c.title}</p>
              <p className="text-muted-foreground">{c.description}</p>
            </div>
          ))}
        </section>

        <section className="mt-8">
          <h2 className="font-heading text-2xl font-bold">תוכנית בדיקה ל־14 יום</h2>
          <ol className="mt-3 space-y-3">
            {report.validation_plan.map((v, i) => (
              <li key={v.id}>
                <p className="font-semibold">
                  {i + 1}. {v.day_range} — {v.title}
                </p>
                <p className="text-muted-foreground">{v.description}</p>
                <p className="text-small">תוצאה רצויה: {v.outcome}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10 border-t border-border pt-6">
          <h2 className="font-heading text-2xl font-bold">המלצה ישירה</h2>
          <p className="mt-2 text-body-lg">{report.recommendation}</p>
        </section>

        <footer className="mt-12 border-t border-border pt-4 text-small text-muted-foreground">
          <p>הופק דרך Ideascan.ai · {new Date(report.generated_at).toLocaleDateString("he-IL")}</p>
        </footer>
      </div>
    </div>
  );
}
