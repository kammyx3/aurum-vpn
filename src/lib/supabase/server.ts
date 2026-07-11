import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server client that checks Authorization header first, falls back to cookies
export async function createClient(headers?: Headers) {
  // Try Bearer token from Authorization header
  if (headers) {
    const auth = headers.get("Authorization");
    if (auth?.startsWith("Bearer ")) {
      const token = auth.slice(7);
      const sb = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data, error } = await sb.auth.getUser(token);
      if (!error && data.user) {
        return {
          auth: {
            getSession: async () => ({ data: { session: { user: data.user, access_token: token } }, error: null }),
            getUser: async () => ({ data, error: null }),
          },
        } as unknown as ReturnType<typeof createSupabaseClient>;
      }
    }
  }

  // Fall back to cookie-based SSR client
  const { createServerClient } = await import("@supabase/ssr");
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
    },
  });
}
