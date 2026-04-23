import { createFileRoute, notFound } from "@tanstack/react-router";
import { StepShell } from "@/components/forms/StepShell";
import { ideasService } from "@/services";

export const Route = createFileRoute("/idea/$ideaId/step-5")({
  head: () => ({ meta: [{ title: "שלב 5 — ביצוע וסיכון" }] }),
  loader: async ({ params }) => {
    const idea = await ideasService.get(params.ideaId);
    if (!idea) throw notFound();
    return { ideaId: idea.id };
  },
  component: StepFive,
});

function StepFive() {
  const { ideaId } = Route.useLoaderData();
  return <StepShell step={5} ideaId={ideaId} />;
}
