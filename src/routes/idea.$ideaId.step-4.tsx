import { createFileRoute } from "@tanstack/react-router";
import { StepShell } from "@/components/forms/StepShell";

export const Route = createFileRoute("/idea/$ideaId/step-4")({
  head: () => ({ meta: [{ title: "שלב 4 — מוניטיזציה, תחרות והפצה" }] }),
  component: StepFour,
});

function StepFour() {
  const { ideaId } = Route.useParams();
  return <StepShell step={4} ideaId={ideaId} />;
}
