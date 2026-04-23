import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { authService } from "@/services/auth";

// Pathless layout that guards every authenticated route underneath it.
// In the current mock mode, `getCurrentSession()` auto-creates a guest
// session so the redirect never fires — UX is unchanged. When a real
// auth provider replaces the mock, this guard starts enforcing.

export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ location }) => {
    const session = await authService.getCurrentSession();
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  return <Outlet />;
}
