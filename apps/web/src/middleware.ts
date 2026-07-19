import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { clientEnv } from "./lib/env/client-env";
import { REQUEST_ID_HEADER, getRequestId, captureException } from "./lib/observability";

export async function middleware(request: NextRequest) {
  const requestId = getRequestId(request.headers);
  const response = NextResponse.next({ request });
  response.headers.set(REQUEST_ID_HEADER, requestId);

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

  // Fail-open: a transient auth-backend error must not 500 every route. Treat as
  // unauthenticated (protected routes still redirect to /login) and report the error.
  let user: User | null = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (error) {
    captureException(error, { module: "web.middleware", requestId, route: request.nextUrl.pathname });
    user = null;
  }

  const pathname = request.nextUrl.pathname;
  const isLoginRoute = pathname.startsWith("/login");
  const isForgotPasswordRoute = pathname.startsWith("/forgot-password");
  const isProtected =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/portal") ||
    request.nextUrl.pathname.startsWith("/profile");

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirect = NextResponse.redirect(url);
    redirect.headers.set(REQUEST_ID_HEADER, requestId);
    return redirect;
  }

  if ((isLoginRoute || isForgotPasswordRoute) && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    const redirect = NextResponse.redirect(url);
    redirect.headers.set(REQUEST_ID_HEADER, requestId);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/portal/:path*",
    "/profile/:path*",
    "/login",
    "/forgot-password",
    "/reset-password",
    "/accept-invitation/:path*"
  ]
};
