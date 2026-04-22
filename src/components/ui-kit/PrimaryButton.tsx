import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "md" | "lg";
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-foreground text-surface hover:bg-foreground/90 disabled:bg-muted-foreground disabled:text-surface/70",
  secondary:
    "border border-border bg-surface text-foreground hover:border-foreground/40 hover:bg-surface-muted disabled:opacity-50",
  ghost:
    "text-foreground hover:bg-surface-muted disabled:opacity-50",
  danger:
    "bg-danger text-danger-foreground hover:bg-danger/90 disabled:opacity-50",
};

const SIZES = {
  md: "h-11 px-5 text-label",
  lg: "h-12 px-6 text-label",
};

export function PrimaryButton({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: PrimaryButtonProps) {
  return (
    <button
      {...rest}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-lg font-heading transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
