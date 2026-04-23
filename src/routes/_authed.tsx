import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { authService } from "@/services/auth";

// Pathless layout that guards every authenticated route underneath it.
// The Supabase session lives in the browser's localStorage, so the
// check can only run client-side — on the server we let the page
// render (it will rehydrate on the client, where the guard enforces).
// If we ran the check on the server unconditionally, direct-URL hits
// to /dashboard from a logged-in user would 302 to /login because the
// server has no session to inspect.

export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    if (!(await authService.isAuthenticated())) {
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
