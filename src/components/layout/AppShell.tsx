import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";

interface AppShellProps {
  children: ReactNode;
  headerVariant?: "full" | "minimal";
}

export function AppShell({ children, headerVariant = "full" }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader variant={headerVariant} />
      <main>{children}</main>
    </div>
  );
}
