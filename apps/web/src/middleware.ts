import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { clientEnv } from "./lib/env/client-env";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(clientEnv.NEXT_PUBLIC_SUPABASE_URL, clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookieOptions: {
      name: process.env["SESSION_COOKIE_NAME"] ?? "mpa_session",
      path: "/",
      sameSite: "lax",
      secure: process.env["NODE_ENV"] === "production",
      httpOnly: true
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLoginRoute = pathname.startsWith("/login");
  const isForgotPasswordRoute = pathname.startsWith("/forgot-password");
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/launcher") ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/billing") ||
    pathname.startsWith("/pm") ||
    pathname.startsWith("/facility") ||
    pathname.startsWith("/shared") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/admin");

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if ((isLoginRoute || isForgotPasswordRoute) && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/launcher";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/portal/:path*",
    "/profile/:path*",
    "/launcher/:path*",
    "/setup/:path*",
    "/billing/:path*",
    "/pm/:path*",
    "/facility/:path*",
    "/shared/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/login",
    "/forgot-password",
    "/reset-password",
    "/accept-invitation/:path*"
  ]
};
