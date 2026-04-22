interface TextareaFieldProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

export function TextareaField({ value, onChange, placeholder, rows = 5 }: TextareaFieldProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      dir="rtl"
      className="block w-full resize-y rounded-lg border border-border bg-surface px-4 py-3 text-body text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
    />
  );
}
