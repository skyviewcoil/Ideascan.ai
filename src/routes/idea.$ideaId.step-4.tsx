import { createFileRoute, notFound } from "@tanstack/react-router";
import { StepShell } from "@/components/forms/StepShell";
import { ideasService } from "@/services";

export const Route = createFileRoute("/idea/$ideaId/step-4")({
  head: () => ({ meta: [{ title: "שלב 4 — מוניטיזציה, תחרות והפצה" }] }),
  loader: async ({ params }) => {
    const idea = await ideasService.get(params.ideaId);
    if (!idea) throw notFound();
    return { ideaId: idea.id };
  },
  component: StepFour,
});

function StepFour() {
  const { ideaId } = Route.useLoaderData();
  return <StepShell step={4} ideaId={ideaId} />;
}
