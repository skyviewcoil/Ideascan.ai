import { createFileRoute } from "@tanstack/react-router";
import { StepShell } from "@/components/forms/StepShell";

export const Route = createFileRoute("/idea/step-1")({
  head: () => ({ meta: [{ title: "שלב 1 — הגדרת הרעיון" }] }),
  component: () => <StepShell step={1} />,
});
