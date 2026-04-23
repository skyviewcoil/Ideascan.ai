// Browser-only persistence primitives. Keys are versioned so a future schema
// bump can invalidate or migrate old data without touching call sites.
//
// The services layer is the only consumer of this module — route components
// must not read or write storage directly.

const KEY_PREFIX = "ideascan:v1:";

export type StorageKey = "ideas" | "answers";

function hasLocalStorage(): boolean {
  return (
    typeof globalThis !== "undefined" &&
    typeof (globalThis as { localStorage?: Storage }).localStorage !== "undefined"
  );
}

export function readKey<T>(key: StorageKey): T | null {
  if (!hasLocalStorage()) return null;
  try {
    const raw = globalThis.localStorage.getItem(KEY_PREFIX + key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    // Corrupted payload or quota-read error — treat as empty. Services can
    // decide whether to reseed.
    return null;
  }
}

export function writeKey<T>(key: StorageKey, value: T): void {
  if (!hasLocalStorage()) return;
  // Intentionally not wrapped in try/catch — callers need to know about quota
  // or serialization failures so the UI can surface a save error.
  globalThis.localStorage.setItem(KEY_PREFIX + key, JSON.stringify(value));
}

export function isBrowser(): boolean {
  return hasLocalStorage();
}
