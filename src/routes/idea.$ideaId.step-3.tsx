import { createFileRoute, notFound } from "@tanstack/react-router";
import { StepShell } from "@/components/forms/StepShell";
import { ideasService } from "@/services";

export const Route = createFileRoute("/idea/$ideaId/step-3")({
  head: () => ({ meta: [{ title: "שלב 3 — בעיה ושוק" }] }),
  loader: async ({ params }) => {
    const idea = await ideasService.get(params.ideaId);
    if (!idea) throw notFound();
    return { ideaId: idea.id };
  },
  component: StepThree,
});

function StepThree() {
  const { ideaId } = Route.useLoaderData();
  return <StepShell step={3} ideaId={ideaId} />;
}
