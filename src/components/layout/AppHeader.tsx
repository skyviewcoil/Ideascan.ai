import { Link } from "@tanstack/react-router";

interface AppHeaderProps {
  variant?: "full" | "minimal";
}

export function AppHeader({ variant = "full" }: AppHeaderProps) {
  return (
    <header className="border-b border-border bg-surface no-print">
      <div className="container-app flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-surface">
            <span className="font-heading text-sm font-bold">IS</span>
          </div>
          <span className="font-heading text-base font-bold tracking-tight">
            Ideascan.ai
          </span>
        </Link>

        {variant === "full" && (
          <nav className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="rounded-lg px-3 py-2 text-label text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
              activeProps={{ className: "bg-surface-muted text-foreground" }}
            >
              הרעיונות שלי
            </Link>
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-label text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              התנתק
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
