// Browser-only persistence primitives. Keys are versioned and (optionally)
// user-scoped so:
//   1. a schema bump can invalidate old data without touching call sites,
//   2. data written under one user does not leak to another on the same
//      browser when real auth lands.
//
// Layout:
//   ideascan:v1:session              — the active session (not user-scoped).
//   ideascan:v1:u:<userId>:ideas     — per-user ideas list.
//   ideascan:v1:u:<userId>:answers   — per-user answers bucket.
//
// Services are the only consumer of this module — route components must
// not read or write storage directly.

const KEY_PREFIX = "ideascan:v1:";

export type StorageKey = "ideas" | "answers" | "session" | "narratives";

function hasLocalStorage(): boolean {
  return (
    typeof globalThis !== "undefined" &&
    typeof (globalThis as { localStorage?: Storage }).localStorage !== "undefined"
  );
}

function fullKey(key: StorageKey, userId?: string | null): string {
  // `session` identifies the user — it cannot itself be user-scoped.
  if (key === "session" || !userId) return `${KEY_PREFIX}${key}`;
  return `${KEY_PREFIX}u:${userId}:${key}`;
}

export function readKey<T>(key: StorageKey, userId?: string | null): T | null {
  if (!hasLocalStorage()) return null;
  try {
    const raw = globalThis.localStorage.getItem(fullKey(key, userId));
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    // Corrupt payload or read error — treat as empty. Services can decide
    // whether to reseed.
    return null;
  }
}

export function writeKey<T>(key: StorageKey, value: T, userId?: string | null): void {
  if (!hasLocalStorage()) return;
  // Deliberately not wrapped — quota or serialization failures need to
  // bubble up so the UI can show a save error.
  globalThis.localStorage.setItem(fullKey(key, userId), JSON.stringify(value));
}

export function removeKey(key: StorageKey, userId?: string | null): void {
  if (!hasLocalStorage()) return;
  globalThis.localStorage.removeItem(fullKey(key, userId));
}

// Raw helpers used exactly once, by the one-time unscoped→scoped migration
// in auth.ts. Keep this API small and private in spirit.
export function readRaw(suffix: string): string | null {
  if (!hasLocalStorage()) return null;
  return globalThis.localStorage.getItem(`${KEY_PREFIX}${suffix}`);
}

export function removeRaw(suffix: string): void {
  if (!hasLocalStorage()) return;
  globalThis.localStorage.removeItem(`${KEY_PREFIX}${suffix}`);
}

export function isBrowser(): boolean {
  return hasLocalStorage();
}
