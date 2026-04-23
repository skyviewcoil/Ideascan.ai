import { createFileRoute, notFound } from "@tanstack/react-router";
import { StepShell } from "@/components/forms/StepShell";
import { ideasService } from "@/services";

export const Route = createFileRoute("/idea/$ideaId/step-1")({
  head: () => ({ meta: [{ title: "שלב 1 — הגדרת הרעיון" }] }),
  loader: async ({ params }) => {
    const idea = await ideasService.get(params.ideaId);
    if (!idea) throw notFound();
    return { ideaId: idea.id };
  },
  component: StepOne,
});

function StepOne() {
  const { ideaId } = Route.useLoaderData();
  return <StepShell step={1} ideaId={ideaId} />;
}
