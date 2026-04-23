import { createFileRoute } from "@tanstack/react-router";
import { StepShell } from "@/components/forms/StepShell";

export const Route = createFileRoute("/_authed/idea/$ideaId/step-1")({
  head: () => ({ meta: [{ title: "שלב 1 — הגדרת הרעיון" }] }),
  component: StepOne,
});

function StepOne() {
  const { ideaId } = Route.useParams();
  return <StepShell step={1} ideaId={ideaId} />;
}
