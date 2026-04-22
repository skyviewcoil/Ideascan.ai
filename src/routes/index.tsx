import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PrimaryButton } from "@/components/ui-kit/PrimaryButton";
import { DecisionBadge } from "@/components/report/DecisionBadge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Idea Validator — בדוק את הרעיון העסקי שלך לפני שאתה בונה" },
      {
        name: "description",
        content:
          "מערכת שמנתחת את הבעיה, השוק, הבידול, המוניטיזציה, ההפצה והסיכון של רעיון עסקי, ומחזירה דוח החלטה ותוכנית בדיקה ל־14 יום.",
      },
      { property: "og:title", content: "Idea Validator — בדוק את הרעיון העסקי שלך" },
      {
        property: "og:description",
        content: "דוח החלטה ברור ותוכנית בדיקה מעשית לכל רעיון עסקי.",
      },
    ],
  }),
  component: LandingPage,
});

const VALUES = [
  {
    title: "ניתוח שיטתי במקום ניחוש",
    body:
      "המערכת בוחנת בעיה, שוק, בידול, מוניטיזציה והפצה לפי מסגרת אחת ברורה — ולא לפי תחושת בטן.",
  },
  {
    title: "זיהוי סתירות והנחות מסוכנות",
    body:
      "כל תשובה מנותחת מול שאר התשובות. המערכת מצביעה על הנחות שאם יתבדו — כל הרעיון נופל.",
  },
  {
    title: "תוכנית בדיקה ל־14 יום",
    body:
      "במקום לבנות חודשים, מקבלים מסלול בדיקה קונקרטי עם תוצאה מדידה לכל שלב.",
  },
];

function LandingPage() {
  return (
    <AppShell headerVariant="full">
      {/* HERO */}
      <section className="border-b border-border">
        <div className="container-app grid gap-10 py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-small text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              מערכת ניתוח רעיונות עסקיים
            </span>
            <h1 className="mt-6 font-heading text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[56px]">
              בדוק את הרעיון העסקי שלך
              <br />
              <span className="text-muted-foreground">לפני שאתה בונה</span>
            </h1>
            <p className="mt-6 max-w-xl text-body-lg text-muted-foreground">
              מערכת שמנתחת את הבעיה, השוק, הבידול, המוניטיזציה, ההפצה והסיכון —
              ומחזירה דוח החלטה ברור ותוכנית בדיקה מעשית.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/signup">
                <PrimaryButton size="lg">התחל בדיקה</PrimaryButton>
              </Link>
              <Link to="/report/$ideaId" params={{ ideaId: "idea_1" }}>
                <PrimaryButton size="lg" variant="secondary">
                  צפה בדוח לדוגמה
                </PrimaryButton>
              </Link>
            </div>
            <p className="mt-6 text-small text-muted-foreground">
              ללא כרטיס אשראי. בדיקה ראשונה חינם.
            </p>
          </div>

          {/* Visual preview */}
          <div className="relative">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-small text-muted-foreground">דוח החלטה</p>
                  <h3 className="font-heading text-lg font-semibold">ClearBrief</h3>
                </div>
                <DecisionBadge decision="validate_first" size="sm" />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { l: "בעיה", s: 78, c: "bg-success" },
                  { l: "שוק", s: 62, c: "bg-info" },
                  { l: "בידול", s: 48, c: "bg-warning" },
                  { l: "מוניטיזציה", s: 70, c: "bg-info" },
                  { l: "הפצה", s: 55, c: "bg-warning" },
                  { l: "ביצוע", s: 72, c: "bg-info" },
                ].map((it) => (
                  <div key={it.l} className="rounded-lg border border-border bg-surface-muted p-3">
                    <p className="text-small text-muted-foreground">{it.l}</p>
                    <p className="mt-1 font-heading text-lg font-bold tabular-nums">{it.s}</p>
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-border">
                      <div className={`h-full ${it.c}`} style={{ width: `${it.s}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-lg border border-border bg-surface-muted px-4 py-3">
                <p className="text-small text-muted-foreground">המלצה</p>
                <p className="mt-0.5 text-body text-foreground">
                  אל תבנה. הקדש 14 יום לאימות מחיר וערוץ הפצה.
                </p>
              </div>
            </div>
            <div className="absolute -inset-x-6 -bottom-6 -z-10 h-32 rounded-3xl bg-surface-muted/60 blur-xl" />
          </div>
        </div>
      </section>

      {/* VALUE CARDS */}
      <section className="container-app py-16 lg:py-24">
        <div className="max-w-2xl">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            למה להריץ את הרעיון דרך המערכת
          </h2>
          <p className="mt-3 text-body-lg text-muted-foreground">
            המטרה היא לחסוך לך חודשי בנייה מיותרים על רעיון שלא היה צריך להיבנות בכלל.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-2xl border border-border bg-surface p-6">
              <h3 className="font-heading text-lg font-semibold">{v.title}</h3>
              <p className="mt-2 text-body text-muted-foreground">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-surface">
        <div className="container-app flex flex-col items-start justify-between gap-6 py-14 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">
              מוכן לבדוק את הרעיון הבא שלך?
            </h2>
            <p className="mt-2 text-body text-muted-foreground">
              הניתוח לוקח כ־15 דקות. הדוח מוכן בסוף.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/signup">
              <PrimaryButton size="lg">התחל בדיקה</PrimaryButton>
            </Link>
            <Link to="/report/$ideaId" params={{ ideaId: "idea_1" }}>
              <PrimaryButton size="lg" variant="secondary">
                צפה בדוח לדוגמה
              </PrimaryButton>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-background">
        <div className="container-app flex flex-col items-start justify-between gap-3 py-8 text-small text-muted-foreground md:flex-row md:items-center">
          <span>© Idea Validator</span>
          <span>נבנה לקבלת החלטות יותר טובות.</span>
        </div>
      </footer>
    </AppShell>
  );
}
