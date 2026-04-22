interface SavedStateIndicatorProps {
  state: "idle" | "saving" | "saved";
}

export function SavedStateIndicator({ state }: SavedStateIndicatorProps) {
  if (state === "idle") return null;
  return (
    <span className="text-small text-muted-foreground" aria-live="polite">
      {state === "saving" ? "שומר…" : "נשמר"}
    </span>
  );
}
