import { createFileRoute } from "@tanstack/react-router";
import { StepShell } from "@/components/forms/StepShell";

export const Route = createFileRoute("/_authed/idea/$ideaId/step-2")({
  head: () => ({ meta: [{ title: "שלב 2 — פרופיל מייסד" }] }),
  component: StepTwo,
});

function StepTwo() {
  const { ideaId } = Route.useParams();
  return <StepShell step={2} ideaId={ideaId} />;
}
