import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { InputField } from "@/components/forms/InputField";
import { PrimaryButton } from "@/components/ui-kit/PrimaryButton";
import { authService } from "@/services/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "הרשמה — Ideascan.ai" },
      { name: "description", content: "צור חשבון חדש כדי לבדוק את הרעיון העסקי שלך." },
    ],
  }),
  component: SignupPage,
});

function prettySignupError(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes("already registered") ||
    m.includes("user_already_exists") ||
    m.includes("email_exists")
  ) {
    return "כתובת האימייל כבר רשומה. התחבר במקום.";
  }
  if (m.includes("password") && m.includes("short")) {
    return "הסיסמה קצרה מדי.";
  }
  if (m.includes("invalid email") || m.includes("email_address_invalid")) {
    return "כתובת אימייל לא תקינה.";
  }
  if (m.includes("supabase is not configured")) {
    return "הרשמה לא זמינה כעת. נסה שוב בעוד רגע.";
  }
  return "ההרשמה נכשלה. נסה שוב.";
}

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await authService.signUp({ name, email, password });
      navigate({ to: "/dashboard" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message === "CHECK_EMAIL") {
        setConfirmEmail(true);
      } else {
        setError(prettySignupError(message));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell headerVariant="minimal">
      <div className="container-app flex min-h-[calc(100vh-64px)] items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-surface p-8">
            <h1 className="font-heading text-3xl font-bold">הרשמה</h1>
            <p className="mt-2 text-body text-muted-foreground">
              נתחיל בבדיקה הראשונה שלך תוך דקה.
            </p>
            {confirmEmail && (
              <div
                className="mt-4 rounded-lg border border-success/40 bg-success/5 p-4 text-body text-foreground"
                role="status"
              >
                שלחנו אליך מייל אישור. לאחר לחיצה על הקישור תוכל להתחבר.
              </div>
            )}
            <form onSubmit={submit} className="mt-6 space-y-4">
              <InputField
                id="name"
                label="שם מלא"
                value={name}
                onChange={setName}
                placeholder="דניאל כהן"
              />
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
                placeholder="לפחות 8 תווים"
              />
              {error && (
                <p className="text-small text-danger" role="alert">
                  {error}
                </p>
              )}
              <PrimaryButton size="lg" className="w-full" type="submit" disabled={submitting}>
                {submitting ? "יוצר חשבון…" : "צור חשבון"}
              </PrimaryButton>
            </form>
            <p className="mt-6 text-small text-muted-foreground">
              כבר יש לך חשבון?{" "}
              <Link
                to="/login"
                className="font-semibold text-foreground underline-offset-4 hover:underline"
              >
                התחברות
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
