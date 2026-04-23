import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { InputField } from "@/components/forms/InputField";
import { PrimaryButton } from "@/components/ui-kit/PrimaryButton";
import { ideasService } from "@/services";

export const Route = createFileRoute("/idea/new")({
  head: () => ({
    meta: [
      { title: "רעיון חדש — Ideascan.ai" },
      { name: "description", content: "פתח רעיון חדש לבדיקה." },
    ],
  }),
  component: NewIdeaPage,
});

const CATEGORIES = [
  "B2B SaaS",
  "B2C SaaS",
  "Marketplace",
  "Health Tech",
  "Fintech",
  "Internal Tools",
  "Consumer App",
  "Services",
  "אחר",
];

function NewIdeaPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [market, setMarket] = useState("");
  const [region, setRegion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const idea = await ideasService.create({
        name: name.trim() || "רעיון ללא שם",
        category,
        initial_market: market.trim(),
        region: region.trim(),
      });
      navigate({ to: "/idea/$ideaId/step-1", params: { ideaId: idea.id } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell headerVariant="minimal">
      <div className="container-app py-10">
        <div className="mx-auto max-w-2xl">
          <Link to="/dashboard" className="text-small text-muted-foreground hover:text-foreground">
            ← חזרה ללוח הבקרה
          </Link>
          <h1 className="mt-4 font-heading text-3xl font-bold sm:text-4xl">רעיון חדש</h1>
          <p className="mt-2 text-body-lg text-muted-foreground">
            כמה פרטים בסיסיים, ואז נתחיל לבדוק.
          </p>

          <form
            onSubmit={submit}
            className="mt-8 space-y-5 rounded-2xl border border-border bg-surface p-6 sm:p-8"
          >
            <InputField
              id="name"
              label="שם הרעיון"
              value={name}
              onChange={setName}
              placeholder="לדוגמה: ClearBrief"
              helperText="שם עבודה — אפשר לשנות בהמשך."
            />

            <div>
              <label className="mb-1.5 block text-label">קטגוריה</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="block w-full rounded-lg border border-border bg-surface px-4 py-3 text-body text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <InputField
              id="market"
              label="שוק יעד ראשוני"
              value={market}
              onChange={setMarket}
              placeholder="לדוגמה: סוכנויות שיווק קטנות"
              helperText="מי הקבוצה הספציפית שאתה רוצה למכור לה ראשונה."
            />

            <InputField
              id="region"
              label="מדינה / אזור"
              value={region}
              onChange={setRegion}
              placeholder="ישראל / אירופה / גלובלי"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Link
                to="/dashboard"
                className="text-label text-muted-foreground hover:text-foreground"
              >
                ביטול
              </Link>
              <PrimaryButton size="lg" type="submit" disabled={submitting}>
                {submitting ? "פותח רעיון…" : "התחל ניתוח"}
              </PrimaryButton>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
