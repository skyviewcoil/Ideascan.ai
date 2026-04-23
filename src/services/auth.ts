// Auth service. Mock implementation today; signature is stable so a real
// provider (email/password, OAuth, Supabase, Clerk, etc.) can replace the
// body without touching callers.
//
// The service also owns one-time migration from the previous-pass unscoped
// storage keys (`ideascan:v1:ideas`, `ideascan:v1:answers`) into the
// current user's namespace.

import type { Session, User } from "@/types";
import { isBrowser, readKey, readRaw, removeKey, removeRaw, writeKey } from "./storage";

// Default guest identity. Matches the previous-pass hard-coded user so
// existing localStorage data migrates cleanly into u_1's namespace and
// the UX (greeting, header) does not change.
const GUEST_USER: User = {
  id: "u_1",
  name: "דניאל",
  email: "daniel@example.com",
};

type Listener = (session: Session | null) => void;
const listeners = new Set<Listener>();

function emit(session: Session | null) {
  for (const fn of listeners) fn(session);
}

function persist(session: Session | null) {
  if (!isBrowser()) return;
  if (session) {
    writeKey("session", session);
  } else {
    removeKey("session");
  }
  emit(session);
}

// One-time migration: if the previous pass left behind unscoped keys,
// move them under the active user so data carries over instead of being
// shadowed. Safe to call repeatedly — no-op once the old keys are gone.
function migrateUnscopedData(userId: string) {
  if (!isBrowser()) return;

  const legacyIdeas = readRaw("ideas");
  if (legacyIdeas !== null) {
    const alreadyScoped = readKey<unknown>("ideas", userId);
    if (!alreadyScoped) {
      try {
        writeKey("ideas", JSON.parse(legacyIdeas), userId);
      } catch {
        // Ignore corrupted legacy data — we just drop it.
      }
    }
    removeRaw("ideas");
  }

  const legacyAnswers = readRaw("answers");
  if (legacyAnswers !== null) {
    const alreadyScoped = readKey<unknown>("answers", userId);
    if (!alreadyScoped) {
      try {
        writeKey("answers", JSON.parse(legacyAnswers), userId);
      } catch {
        // Drop corrupted legacy data.
      }
    }
    removeRaw("answers");
  }
}

function ensureGuestSession(): Session {
  const existing = readKey<Session>("session");
  if (existing) {
    // Run migration opportunistically in case the browser had legacy keys
    // from before the session file existed.
    migrateUnscopedData(existing.user.id);
    return existing;
  }
  const session: Session = {
    user: GUEST_USER,
    provider: "guest",
    issued_at: new Date().toISOString(),
  };
  persist(session);
  migrateUnscopedData(session.user.id);
  return session;
}

// Internal session resolver — used by getCurrentUser / isAuthenticated.
// Kept module-private so the public API stays user-centric.
function resolveSession(): Session | null {
  if (!isBrowser()) {
    // SSR has no storage and no per-user data — render as the public
    // guest so routes that do not require auth still work. The route
    // guard runs on the client after hydration and redirects there.
    return {
      user: GUEST_USER,
      provider: "guest",
      issued_at: "1970-01-01T00:00:00.000Z",
    };
  }
  return ensureGuestSession();
}

export interface AuthService {
  getCurrentUser(): Promise<User | null>;
  requireUser(): Promise<User>;
  isAuthenticated(): Promise<boolean>;
  signIn(email: string, password: string): Promise<Session>;
  signUp(input: { name: string; email: string; password: string }): Promise<Session>;
  signOut(): Promise<void>;
  onSessionChange(listener: Listener): () => void;
}

export const authService: AuthService = {
  async getCurrentUser() {
    return resolveSession()?.user ?? null;
  },

  async requireUser() {
    const user = resolveSession()?.user;
    if (!user) {
      throw new Error("Not authenticated");
    }
    return user;
  },

  async isAuthenticated() {
    return resolveSession() !== null;
  },

  async signIn(email, _password) {
    // No real credential check — the mock provider accepts anything and
    // binds the entered email to the existing guest identity so all data
    // the user has already created remains visible after sign-in.
    const current = readKey<Session>("session");
    const user: User = current
      ? { ...current.user, email: email.trim() || current.user.email }
      : { ...GUEST_USER, email: email.trim() || GUEST_USER.email };
    const session: Session = {
      user,
      provider: "mock",
      issued_at: new Date().toISOString(),
    };
    persist(session);
    migrateUnscopedData(session.user.id);
    return session;
  },

  async signUp({ name, email }) {
    // A real signup would create a new user id. For continuity with the
    // local guest data we keep `u_1` for now; when a real backend lands
    // this switches to whatever id the server returns.
    const session: Session = {
      user: {
        id: GUEST_USER.id,
        name: name.trim() || GUEST_USER.name,
        email: email.trim() || GUEST_USER.email,
      },
      provider: "mock",
      issued_at: new Date().toISOString(),
    };
    persist(session);
    migrateUnscopedData(session.user.id);
    return session;
  },

  async signOut() {
    persist(null);
  },

  onSessionChange(listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
