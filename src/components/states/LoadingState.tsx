export function LoadingState({ label = "טוען…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
      <p className="text-small text-muted-foreground">{label}</p>
    </div>
  );
}
