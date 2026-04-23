export type SavedState = "idle" | "saving" | "saved" | "error";

interface SavedStateIndicatorProps {
  state: SavedState;
  onRetry?: () => void;
}

export function SavedStateIndicator({ state, onRetry }: SavedStateIndicatorProps) {
  if (state === "idle") return null;
  if (state === "error") {
    return (
      <span className="inline-flex items-center gap-2 text-small text-danger" aria-live="polite">
        <span>שמירה נכשלה</span>
        {onRetry && (
          <button type="button" onClick={onRetry} className="underline-offset-2 hover:underline">
            נסה שוב
          </button>
        )}
      </span>
    );
  }
  return (
    <span className="text-small text-muted-foreground" aria-live="polite">
      {state === "saving" ? "שומר…" : "נשמר"}
    </span>
  );
}
