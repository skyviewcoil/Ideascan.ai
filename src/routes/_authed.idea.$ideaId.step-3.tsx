import { createFileRoute } from "@tanstack/react-router";
import { StepShell } from "@/components/forms/StepShell";

export const Route = createFileRoute("/_authed/idea/$ideaId/step-3")({
  head: () => ({ meta: [{ title: "שלב 3 — בעיה ושוק" }] }),
  component: StepThree,
});

function StepThree() {
  const { ideaId } = Route.useParams();
  return <StepShell step={3} ideaId={ideaId} />;
}
