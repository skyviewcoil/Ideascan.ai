interface InputFieldProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  label?: string;
  helperText?: string;
  id?: string;
}

export function InputField({
  value,
  onChange,
  placeholder,
  type = "text",
  label,
  helperText,
  id,
}: InputFieldProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-label">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir="rtl"
        className="block w-full rounded-lg border border-border bg-surface px-4 py-3 text-body text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      {helperText && <p className="mt-1.5 text-small text-muted-foreground">{helperText}</p>}
    </div>
  );
}
