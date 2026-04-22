import type { ReactNode } from "react";

interface StickyBottomActionsProps {
  left?: ReactNode;
  right?: ReactNode;
  middle?: ReactNode;
}

export function StickyBottomActions({ left, middle, right }: StickyBottomActionsProps) {
  return (
    <div className="sticky bottom-0 z-20 mt-10 border-t border-border bg-surface/95 backdrop-blur no-print">
      <div className="container-app flex items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-2">{left}</div>
        <div className="flex-1 text-center text-small text-muted-foreground">{middle}</div>
        <div className="flex items-center gap-2">{right}</div>
      </div>
    </div>
  );
}
