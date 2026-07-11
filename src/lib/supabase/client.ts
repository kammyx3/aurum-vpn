"use client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const TOKEN_KEY = "aurum_token";

let cachedClient: ReturnType<typeof createSupabaseClient> | null = null;

/** Read the raw token data from localStorage */
export function getStoredToken(): { access_token: string; refresh_token?: string; user_id?: string; email?: string } | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Save token data to localStorage */
export function storeToken(data: { access_token: string; refresh_token?: string; user?: { id: string; email?: string } }) {
  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({
      access_token: data.access_token,
      refresh_token: data.refresh_token || "",
      user_id: data.user?.id || "",
      email: data.user?.email || "",
    }));
  } catch {}
}

/** Clear stored token */
export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}

export function createClient() {
  if (cachedClient) return cachedClient;
  cachedClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: true, persistSession: false },
  });
  return cachedClient;
}

/** Fetch an API route with the stored Bearer token automatically */
export async function apiFetch(path: string, options: RequestInit = {}) {
  const stored = getStoredToken();
  const headers = new Headers(options.headers);
  if (stored?.access_token) {
    headers.set("Authorization", `Bearer ${stored.access_token}`);
  }
  if (options.method && options.method !== "GET" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(path, { ...options, headers });
}
