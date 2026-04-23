import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { InputField } from "@/components/forms/InputField";
import { PrimaryButton } from "@/components/ui-kit/PrimaryButton";
import { authService } from "@/services/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "התחברות — Ideascan.ai" },
      { name: "description", content: "התחבר לחשבון שלך כדי להמשיך לבדוק רעיונות עסקיים." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await authService.signIn(email, password);
      navigate({ to: "/dashboard" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell headerVariant="minimal">
      <div className="container-app flex min-h-[calc(100vh-64px)] items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-surface p-8">
            <h1 className="font-heading text-3xl font-bold">התחברות</h1>
            <p className="mt-2 text-body text-muted-foreground">היכנס כדי להמשיך את הבדיקה שלך.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <InputField
                id="email"
                label="אימייל"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@company.com"
              />
              <InputField
                id="password"
                label="סיסמה"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
              />
              <PrimaryButton size="lg" className="w-full" type="submit" disabled={submitting}>
                {submitting ? "מתחבר…" : "התחבר"}
              </PrimaryButton>
            </form>
            <p className="mt-6 text-small text-muted-foreground">
              אין לך חשבון?{" "}
              <Link
                to="/signup"
                className="font-semibold text-foreground underline-offset-4 hover:underline"
              >
                הרשמה
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
