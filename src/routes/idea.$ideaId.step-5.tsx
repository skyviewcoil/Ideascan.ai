import { createFileRoute } from "@tanstack/react-router";
import { StepShell } from "@/components/forms/StepShell";

export const Route = createFileRoute("/idea/$ideaId/step-5")({
  head: () => ({ meta: [{ title: "שלב 5 — ביצוע וסיכון" }] }),
  component: StepFive,
});

function StepFive() {
  const { ideaId } = Route.useParams();
  return <StepShell step={5} ideaId={ideaId} />;
}
