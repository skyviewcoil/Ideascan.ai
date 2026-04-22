import { createFileRoute } from "@tanstack/react-router";
import { StepShell } from "@/components/forms/StepShell";

export const Route = createFileRoute("/idea/step-2")({
  head: () => ({ meta: [{ title: "שלב 2 — פרופיל מייסד" }] }),
  component: () => <StepShell step={2} />,
});
