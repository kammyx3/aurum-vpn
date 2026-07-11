"use client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SESSION_KEY = "aurum_session";

let cachedClient: ReturnType<typeof createSupabaseClient> | null = null;

export function saveSession(session: { access_token: string; refresh_token?: string; user?: { id: string; email?: string } } | null) {
  try {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {}
}

export function getSavedSession(): { access_token: string; refresh_token?: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.access_token) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function createClient() {
  if (cachedClient) return cachedClient;
  cachedClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
      storageKey: "sb-auth",
    },
  });

  // Whenever auth state changes, sync to our custom key
  cachedClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
      saveSession(session);
    } else if (event === "SIGNED_OUT") {
      saveSession(null);
    }
  });

  return cachedClient;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const session = data.session || getSavedSession();
  const headers = new Headers(options.headers);
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  if (!headers.has("Content-Type") && options.method && options.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }
  return fetch(path, { ...options, headers });
}
