import type { ReactNode } from "react";

interface QuestionCardProps {
  label: string;
  helperText?: string;
  required?: boolean;
  children: ReactNode;
  feedback?: ReactNode;
  index?: number;
  total?: number;
}

export function QuestionCard({
  label,
  helperText,
  required,
  children,
  feedback,
  index,
  total,
}: QuestionCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      {typeof index === "number" && typeof total === "number" && (
        <p className="mb-2 text-small text-muted-foreground">
          שאלה {index} מתוך {total}
        </p>
      )}
      <label className="block">
        <span className="block font-heading text-lg font-semibold leading-snug text-foreground">
          {label}
          {required && <span className="mr-1 text-danger">*</span>}
        </span>
        {helperText && (
          <span className="mt-1.5 block text-body text-muted-foreground">
            {helperText}
          </span>
        )}
      </label>
      <div className="mt-5">{children}</div>
      {feedback && <div className="mt-4">{feedback}</div>}
    </div>
  );
}
