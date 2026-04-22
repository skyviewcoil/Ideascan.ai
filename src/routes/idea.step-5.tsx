import { createFileRoute } from "@tanstack/react-router";
import { StepShell } from "@/components/forms/StepShell";

export const Route = createFileRoute("/idea/step-5")({
  head: () => ({ meta: [{ title: "שלב 5 — ביצוע וסיכון" }] }),
  component: () => <StepShell step={5} />,
});
