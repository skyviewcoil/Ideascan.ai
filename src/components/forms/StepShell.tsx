import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { IdeaAnswer } from "@/types";
import { QUESTIONS_BY_STEP, STEP_DESCRIPTIONS, STEP_TITLES, TOTAL_STEPS } from "@/config/questions";
import { MOCK_ANSWERS } from "@/data/mock/answers";
import { MOCK_SECTION_INSIGHTS } from "@/data/mock/report";
import { AppShell } from "@/components/layout/AppShell";
import { ProgressHeader } from "@/components/layout/ProgressHeader";
import { SidebarStatus } from "@/components/layout/SidebarStatus";
import { StickyBottomActions } from "@/components/layout/StickyBottomActions";
import { QuestionRenderer } from "@/components/forms/QuestionRenderer";
import { SavedStateIndicator } from "@/components/forms/SavedStateIndicator";
import { PrimaryButton } from "@/components/ui-kit/PrimaryButton";

interface StepShellProps {
  step: 1 | 2 | 3 | 4 | 5;
}

export function StepShell({ step }: StepShellProps) {
  const navigate = useNavigate();
  const questions = QUESTIONS_BY_STEP[step];
  const [answers, setAnswers] = useState<Record<string, IdeaAnswer["value"]>>(MOCK_ANSWERS);
  const [savedState, setSavedState] = useState<"idle" | "saving" | "saved">("idle");

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
    window.setTimeout(() => setSavedState("saved"), 600);
  };

  const goNext = () => {
    if (step < TOTAL_STEPS) {
      navigate({ to: `/idea/step-${step + 1}` as "/idea/step-2" });
    } else {
      navigate({ to: "/idea/analyzing" });
    }
  };

  const goPrev = () => {
    if (step > 1) {
      navigate({ to: `/idea/step-${step - 1}` as "/idea/step-1" });
    } else {
      navigate({ to: "/idea/new" });
    }
  };

  return (
    <AppShell headerVariant="minimal">
      <ProgressHeader currentStep={step} ideaName={ideaName} />

      <div className="container-app py-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <header className="mb-6">
              <h1 className="font-heading text-3xl font-bold sm:text-4xl">
                {STEP_TITLES[step]}
              </h1>
              <p className="mt-2 text-body-lg text-muted-foreground">
                {STEP_DESCRIPTIONS[step]}
              </p>
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
              step >= 3
                ? "נראה פער בין תדירות הבעיה לרגע הרכישה. שווה לבדוק שוב."
                : undefined
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
          <PrimaryButton onClick={goNext}>
            {step === TOTAL_STEPS ? "הפק דוח" : "הבא"}
          </PrimaryButton>
        }
      />
    </AppShell>
  );
}
