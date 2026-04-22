import type { QuestionOption } from "@/types";

interface ChoiceGroupProps {
  options: QuestionOption[];
  value: string;
  onChange: (v: string) => void;
}

export function ChoiceGroup({ options, value, onChange }: ChoiceGroupProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              "rounded-lg border px-4 py-3 text-right text-body transition-all",
              active
                ? "border-foreground bg-foreground text-surface"
                : "border-border bg-surface text-foreground hover:border-foreground/40 hover:bg-surface-muted",
            ].join(" ")}
          >
            <span className="block font-medium">{opt.label}</span>
            {opt.helper && (
              <span className={`mt-0.5 block text-small ${active ? "text-surface/70" : "text-muted-foreground"}`}>
                {opt.helper}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
