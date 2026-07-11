import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const publicPaths = ["/", "/login", "/signup", "/forgot-password", "/releases", "/pricing", "/auth/callback"];
const apiPrefix = "/api";
const authApiPaths = ["/api/auth", "/api/billing/plans", "/api/billing/perks", "/api/updates", "/api/app-update", "/api/nodes"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isApi = pathname.startsWith(apiPrefix);
  const isAuthApi = authApiPaths.some((p) => pathname.startsWith(p));
  const isStatic = pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname === "/globals.css";

  if (isPublic || isStatic || isAuthApi) {
    return NextResponse.next();
  }

  if (isApi && !isAuthApi) {
    // Check Authorization header first (Bearer token from client)
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const sb = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error } = await sb.auth.getUser(token);
      if (!error) return NextResponse.next();
    }

    // Fall back to cookie-based check
    const response = NextResponse.next();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value }) => response.cookies.set(name, value)); },
      },
    });

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
