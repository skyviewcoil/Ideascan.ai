import type { QuestionOption } from "@/types";

interface MultiSelectChipsProps {
  options: QuestionOption[];
  value: string[];
  onChange: (v: string[]) => void;
}

export function MultiSelectChips({ options, value, onChange }: MultiSelectChipsProps) {
  const toggle = (v: string) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={[
              "rounded-full border px-4 py-2 text-label transition-all",
              active
                ? "border-foreground bg-foreground text-surface"
                : "border-border bg-surface text-foreground hover:border-foreground/40",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
