import { useEffect, useState } from "react";

// Minimal client-side async fetcher for pages backed by the services layer.
// Deliberately tiny so it can be replaced by React Query (or SWR, or a real
// router loader) later without changing call sites much.

type State<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; error: Error };

export function useAsyncData<T>(fn: () => Promise<T>, deps: ReadonlyArray<unknown>) {
  const [state, setState] = useState<State<T>>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    fn().then(
      (data) => {
        if (!cancelled) setState({ status: "ready", data });
      },
      (err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
