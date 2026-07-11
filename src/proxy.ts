import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  if (pathname.startsWith("/admin") || (isApi && !isAuthApi)) {
    const response = NextResponse.next();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => response.cookies.set(name, value));
          },
        },
      }
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/admin")) {
      const { data: profile } = await supabase
        .from("UserProfile")
        .select("role")
        .eq("supabaseUserId", session.user.id)
        .single();

      if (profile?.role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/app/map";
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
