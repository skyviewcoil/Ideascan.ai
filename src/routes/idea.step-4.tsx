import { createFileRoute } from "@tanstack/react-router";
import { StepShell } from "@/components/forms/StepShell";

export const Route = createFileRoute("/idea/step-4")({
  head: () => ({ meta: [{ title: "שלב 4 — מוניטיזציה, תחרות והפצה" }] }),
  component: () => <StepShell step={4} />,
});
