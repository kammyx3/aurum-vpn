"use client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const STORAGE_KEY = "svpn-auth";

let cachedClient: ReturnType<typeof createSupabaseClient> | null = null;

function getSessionFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
      storageKey: STORAGE_KEY,
    },
  });
  return cachedClient;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const session = data.session || getSessionFromStorage();
  const headers = new Headers(options.headers);
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  if (!headers.has("Content-Type") && options.method && options.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }
  return fetch(path, { ...options, headers });
}
