import { createFileRoute } from "@tanstack/react-router";
import { StepShell } from "@/components/forms/StepShell";

export const Route = createFileRoute("/idea/step-3")({
  head: () => ({ meta: [{ title: "שלב 3 — בעיה ושוק" }] }),
  component: () => <StepShell step={3} />,
});
