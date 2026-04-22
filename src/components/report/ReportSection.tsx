import type { ReactNode } from "react";

interface ReportSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  id?: string;
}

export function ReportSection({ title, description, children, id }: ReportSectionProps) {
  return (
    <section id={id} className="border-t border-border pt-8">
      <h3 className="font-heading text-xl font-semibold">{title}</h3>
      {description && (
        <p className="mt-1.5 text-body text-muted-foreground">{description}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}
