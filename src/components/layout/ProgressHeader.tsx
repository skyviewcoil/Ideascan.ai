import { STEP_TITLES, TOTAL_STEPS } from "@/config/questions";

interface ProgressHeaderProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
  ideaName?: string;
}

export function ProgressHeader({ currentStep, ideaName }: ProgressHeaderProps) {
  const percent = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur no-print">
      <div className="container-app py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-small text-muted-foreground">
              שלב {currentStep} מתוך {TOTAL_STEPS}
            </p>
            <h2 className="mt-0.5 truncate font-heading text-lg font-semibold">
              {STEP_TITLES[currentStep]}
            </h2>
          </div>
          {ideaName && (
            <div className="hidden text-left sm:block">
              <p className="text-small text-muted-foreground">רעיון</p>
              <p className="text-label">{ideaName}</p>
            </div>
          )}
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
