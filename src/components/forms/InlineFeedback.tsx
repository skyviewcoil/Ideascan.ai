interface InlineFeedbackProps {
  tone?: "info" | "warning" | "success";
  children: React.ReactNode;
}

const TONE: Record<string, string> = {
  info: "border-info/20 bg-info/5 text-info",
  warning: "border-warning/30 bg-warning/5 text-warning",
  success: "border-success/30 bg-success/5 text-success",
};

export function InlineFeedback({ tone = "info", children }: InlineFeedbackProps) {
  return (
    <div className={`rounded-lg border px-3 py-2.5 text-small ${TONE[tone]}`}>
      {children}
    </div>
  );
}
