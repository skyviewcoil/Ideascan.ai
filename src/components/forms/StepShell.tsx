import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { IdeaAnswer } from "@/types";
import { QUESTIONS_BY_STEP, STEP_DESCRIPTIONS, STEP_TITLES, TOTAL_STEPS } from "@/config/questions";
import { MOCK_SECTION_INSIGHTS } from "@/data/mock/report";
import { answersService } from "@/services";
import { AppShell } from "@/components/layout/AppShell";
import { ProgressHeader } from "@/components/layout/ProgressHeader";
import { SidebarStatus } from "@/components/layout/SidebarStatus";
import { StickyBottomActions } from "@/components/layout/StickyBottomActions";
import { QuestionRenderer } from "@/components/forms/QuestionRenderer";
import { SavedStateIndicator } from "@/components/forms/SavedStateIndicator";
import { PrimaryButton } from "@/components/ui-kit/PrimaryButton";

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

export function StepShell({ step, ideaId }: StepShellProps) {
  const navigate = useNavigate();
  const questions = QUESTIONS_BY_STEP[step];
  const [answers, setAnswers] = useState<Record<string, IdeaAnswer["value"]>>({});
  const [savedState, setSavedState] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    let cancelled = false;
    answersService.getForIdea(ideaId).then((loaded) => {
      if (!cancelled) setAnswers(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [ideaId]);

  const ideaName = useMemo(() => {
    const v = answers["idea_name"];
    return typeof v === "string" && v ? v : "ללא שם";
  }, [answers]);

  // Demo: progressively reveal section insights as user advances
  const visibleInsights = useMemo(() => {
    return MOCK_SECTION_INSIGHTS.slice(0, Math.min(7, step + 2));
  }, [step]);

  const handleChange = (key: string, value: IdeaAnswer["value"]) => {
    setAnswers((p) => ({ ...p, [key]: value }));
    setSavedState("saving");
    answersService.save(ideaId, key, value).then(() => setSavedState("saved"));
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
        middle={<SavedStateIndicator state={savedState} />}
        right={
          <PrimaryButton onClick={goNext}>{step === TOTAL_STEPS ? "הפק דוח" : "הבא"}</PrimaryButton>
        }
      />
    </AppShell>
  );
}
