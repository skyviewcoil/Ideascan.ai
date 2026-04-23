import { createFileRoute, notFound } from "@tanstack/react-router";
import { StepShell } from "@/components/forms/StepShell";
import { ideasService } from "@/services";

export const Route = createFileRoute("/idea/$ideaId/step-2")({
  head: () => ({ meta: [{ title: "שלב 2 — פרופיל מייסד" }] }),
  loader: async ({ params }) => {
    const idea = await ideasService.get(params.ideaId);
    if (!idea) throw notFound();
    return { ideaId: idea.id };
  },
  component: StepTwo,
});

function StepTwo() {
  const { ideaId } = Route.useLoaderData();
  return <StepShell step={2} ideaId={ideaId} />;
}
