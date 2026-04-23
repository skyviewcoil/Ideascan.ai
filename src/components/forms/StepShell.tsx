import { Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Idea, IdeaAnswer } from "@/types";
import { QUESTIONS_BY_STEP, STEP_DESCRIPTIONS, STEP_TITLES, TOTAL_STEPS } from "@/config/questions";
import { MOCK_SECTION_INSIGHTS } from "@/data/mock/report";
import { answersService, ideasService } from "@/services";
import { AppShell } from "@/components/layout/AppShell";
import { ProgressHeader } from "@/components/layout/ProgressHeader";
import { SidebarStatus } from "@/components/layout/SidebarStatus";
import { StickyBottomActions } from "@/components/layout/StickyBottomActions";
import { QuestionRenderer } from "@/components/forms/QuestionRenderer";
import { SavedStateIndicator, type SavedState } from "@/components/forms/SavedStateIndicator";
import { PrimaryButton } from "@/components/ui-kit/PrimaryButton";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";

interface StepShellProps {
  step: 1 | 2 | 3 | 4 | 5;
  ideaId: string;
}

// Typed lookup tables — keep navigation targets as literals so the router's
// type system verifies every destination and no string cast is needed.
const NEXT_ROUTE = {
  1: "/idea/$ideaId/step-2",
  2: "/idea/$ideaId/step-3",
  3: "/idea/$ideaId/step-4",
  4: "/idea/$ideaId/step-5",
  5: "/idea/$ideaId/analyzing",
} as const;

const PREV_STEP_ROUTE = {
  2: "/idea/$ideaId/step-1",
  3: "/idea/$ideaId/step-2",
  4: "/idea/$ideaId/step-3",
  5: "/idea/$ideaId/step-4",
} as const;

interface PendingSave {
  key: string;
  value: IdeaAnswer["value"];
}

export function StepShell({ step, ideaId }: StepShellProps) {
  const navigate = useNavigate();
  const questions = QUESTIONS_BY_STEP[step];

  const [idea, setIdea] = useState<Idea | null | undefined>(undefined);
  const [answers, setAnswers] = useState<Record<string, IdeaAnswer["value"]>>({});
  const [loadingAnswers, setLoadingAnswers] = useState(true);
  const [savedState, setSavedState] = useState<SavedState>("idle");
  const lastFailedSave = useRef<PendingSave | null>(null);

  // Load idea metadata (also used as a "does this idea exist?" check) and
  // previously-saved answers in parallel.
  useEffect(() => {
    let cancelled = false;
    setIdea(undefined);
    setLoadingAnswers(true);
    setAnswers({});

    Promise.all([ideasService.get(ideaId), answersService.getForIdea(ideaId)]).then(
      ([loadedIdea, loadedAnswers]) => {
        if (cancelled) return;
        setIdea(loadedIdea);
        setAnswers(loadedAnswers);
        setLoadingAnswers(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [ideaId]);

  // Push a cheap progress signal once the user lands on a step, so the
  // dashboard's `current_step` reflects reality even if they never answer.
  useEffect(() => {
    if (idea) ideasService.setCurrentStep(ideaId, step);
  }, [ideaId, step, idea]);

  const ideaName = useMemo(() => {
    const fromAnswers = answers["idea_name"];
    if (typeof fromAnswers === "string" && fromAnswers) return fromAnswers;
    return idea?.name ?? "ללא שם";
  }, [answers, idea]);

  // Demo: progressively reveal section insights as the user advances.
  const visibleInsights = useMemo(() => {
    return MOCK_SECTION_INSIGHTS.slice(0, Math.min(7, step + 2));
  }, [step]);

  const persist = useCallback(
    (key: string, value: IdeaAnswer["value"]) => {
      setSavedState("saving");
      answersService.save(ideaId, key, value).then(
        () => {
          lastFailedSave.current = null;
          setSavedState("saved");
        },
        () => {
          lastFailedSave.current = { key, value };
          setSavedState("error");
        },
      );
    },
    [ideaId],
  );

  const handleChange = (key: string, value: IdeaAnswer["value"]) => {
    setAnswers((p) => ({ ...p, [key]: value }));
    persist(key, value);
  };

  const retrySave = () => {
    const pending = lastFailedSave.current;
    if (!pending) return;
    persist(pending.key, pending.value);
  };

  const goNext = () => {
    navigate({ to: NEXT_ROUTE[step], params: { ideaId } });
  };

  const goPrev = () => {
    if (step === 1) {
      navigate({ to: "/idea/new" });
    } else {
      navigate({ to: PREV_STEP_ROUTE[step], params: { ideaId } });
    }
  };

  if (idea === undefined) {
    return (
      <AppShell headerVariant="minimal">
        <LoadingState />
      </AppShell>
    );
  }

  if (idea === null) {
    return (
      <AppShell headerVariant="minimal">
        <div className="container-app py-16">
          <EmptyState
            title="הרעיון לא נמצא"
            description="הרעיון שחיפשת לא קיים או נמחק."
            action={
              <Link to="/dashboard">
                <PrimaryButton>חזרה ללוח הבקרה</PrimaryButton>
              </Link>
            }
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell headerVariant="minimal">
      <ProgressHeader currentStep={step} ideaName={ideaName} />

      <div className="container-app py-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <header className="mb-6">
              <h1 className="font-heading text-3xl font-bold sm:text-4xl">{STEP_TITLES[step]}</h1>
              <p className="mt-2 text-body-lg text-muted-foreground">{STEP_DESCRIPTIONS[step]}</p>
            </header>

            {loadingAnswers ? (
              <LoadingState />
            ) : (
              <div className="space-y-5">
                {questions.map((q, idx) => (
                  <QuestionRenderer
                    key={q.key}
                    question={q}
                    value={answers[q.key]}
                    onChange={(v) => handleChange(q.key, v)}
                    index={idx + 1}
                    total={questions.length}
                  />
                ))}
              </div>
            )}
          </div>

          <SidebarStatus
            ideaName={ideaName}
            insights={visibleInsights}
            warning={
              step >= 3 ? "נראה פער בין תדירות הבעיה לרגע הרכישה. שווה לבדוק שוב." : undefined
            }
            insight={{
              title: "תובנה ראשונית",
              body:
                step >= 4
                  ? "ערוץ ההפצה המתואר תלוי ברשת אישית. נסה למצוא ערוץ חוזר."
                  : "ככל שהתשובות שלך ספציפיות יותר, הניתוח יהיה חד יותר.",
            }}
          />
        </div>
      </div>

      <StickyBottomActions
        left={
          <PrimaryButton variant="secondary" onClick={goPrev}>
            הקודם
          </PrimaryButton>
        }
        middle={<SavedStateIndicator state={savedState} onRetry={retrySave} />}
        right={
          <PrimaryButton onClick={goNext}>{step === TOTAL_STEPS ? "הפק דוח" : "הבא"}</PrimaryButton>
        }
      />
    </AppShell>
  );
}
