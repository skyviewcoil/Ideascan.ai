// Auth service. Backed by Supabase Auth (email + password). Public
// interface is unchanged so routes / guards / UI keep working:
//   getCurrentUser / requireUser / isAuthenticated
//   signIn / signUp / signOut
//   onSessionChange
//
// When Supabase is not configured (`VITE_SUPABASE_URL` / anon key
// missing) the service behaves as an unauthenticated session:
// getCurrentUser returns null, isAuthenticated returns false, sign-in
// and sign-up throw a configuration error. The _authed guard redirects
// to /login in that case — the app still loads, just without auth.

import type { Session as AppSession, User } from "@/types";
import { getSupabase } from "@/lib/supabase";

type Listener = (session: AppSession | null) => void;
const listeners = new Set<Listener>();
let authStateSubscribed = false;

function emit(session: AppSession | null) {
  for (const fn of listeners) fn(session);
}

function subscribeToAuthStateOnce() {
  if (authStateSubscribed) return;
  const client = getSupabase();
  if (!client) return;
  authStateSubscribed = true;
  client.auth.onAuthStateChange((_event, session) => {
    emit(session ? toAppSession(session.user) : null);
  });
}

type SupabaseUserLike = {
  id: string;
  email?: string;
  user_metadata?: { name?: string };
};

function toAppSession(u: SupabaseUserLike): AppSession {
  const name = u.user_metadata?.name?.trim() || (u.email ? u.email.split("@")[0] : "משתמש");
  return {
    user: {
      id: u.id,
      name,
      email: u.email ?? "",
    },
    provider: "email",
    issued_at: new Date().toISOString(),
  };
}

export interface AuthService {
  getCurrentUser(): Promise<User | null>;
  requireUser(): Promise<User>;
  isAuthenticated(): Promise<boolean>;
  signIn(email: string, password: string): Promise<AppSession>;
  signUp(input: { name: string; email: string; password: string }): Promise<AppSession>;
  signOut(): Promise<void>;
  onSessionChange(listener: Listener): () => void;
}

export const authService: AuthService = {
  async getCurrentUser() {
    const client = getSupabase();
    if (!client) return null;
    subscribeToAuthStateOnce();
    const { data } = await client.auth.getUser();
    if (!data.user) return null;
    const session = toAppSession(data.user as SupabaseUserLike);
    return session.user;
  },

  async requireUser() {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error("Not authenticated");
    return user;
  },

  async isAuthenticated() {
    const client = getSupabase();
    if (!client) return false;
    subscribeToAuthStateOnce();
    const { data } = await client.auth.getSession();
    return !!data.session;
  },

  async signIn(email, password) {
    const client = getSupabase();
    if (!client)
      throw new Error(
        "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      );
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("Sign-in succeeded but no user returned");
    const session = toAppSession(data.user as SupabaseUserLike);
    emit(session);
    return session;
  },

  async signUp({ name, email, password }) {
    const client = getSupabase();
    if (!client)
      throw new Error(
        "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      );
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    if (!data.user) {
      // Supabase returns user=null when email confirmation is required.
      // Surface a recognizable message so the login form can tell the
      // user to check their inbox.
      throw new Error("CHECK_EMAIL");
    }
    const session = toAppSession(data.user as SupabaseUserLike);
    emit(session);
    return session;
  },

  async signOut() {
    const client = getSupabase();
    if (!client) return;
    await client.auth.signOut();
    emit(null);
  },

  onSessionChange(listener) {
    subscribeToAuthStateOnce();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
