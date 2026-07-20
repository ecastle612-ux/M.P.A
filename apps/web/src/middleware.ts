import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { clientEnv } from "./lib/env/client-env";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(clientEnv.NEXT_PUBLIC_SUPABASE_URL, clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const pathname = request.nextUrl.pathname;
  const isResetPasswordRoute = pathname.startsWith("/reset-password");
  const recoveryCode = request.nextUrl.searchParams.get("code");
  const isDevPortalCertificationRoute =
    process.env.NODE_ENV === "development" && pathname.startsWith("/portal/certification");

  // Password recovery (PKCE): exchange the email link code before the page renders so
  // updateUser() has an authenticated recovery session (prevents "Auth session missing").
  if (isResetPasswordRoute && recoveryCode) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete("code");
    cleanUrl.searchParams.delete("type");
    for (const key of ["error", "error_code", "error_description"]) {
      cleanUrl.searchParams.delete(key);
    }

    const redirectResponse = NextResponse.redirect(cleanUrl);
    const recoveryClient = createServerClient(
      clientEnv.NEXT_PUBLIC_SUPABASE_URL,
      clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              redirectResponse.cookies.set(name, value, options);
            });
          }
        }
      }
    );

    const { error: exchangeError } = await recoveryClient.auth.exchangeCodeForSession(recoveryCode);
    if (exchangeError) {
      cleanUrl.searchParams.set("error", "recovery_exchange_failed");
      cleanUrl.searchParams.set("error_description", exchangeError.message);
      const failedRedirect = NextResponse.redirect(cleanUrl);
      redirectResponse.cookies.getAll().forEach((cookie) => {
        failedRedirect.cookies.set(cookie.name, cookie.value);
      });
      return failedRedirect;
    }

    return redirectResponse;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const isRootRoute = pathname === "/";
  const isLoginRoute = pathname.startsWith("/login");
  const isForgotPasswordRoute = pathname.startsWith("/forgot-password");
  const isProtected =
    !isDevPortalCertificationRoute &&
    (request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/portal") ||
      request.nextUrl.pathname.startsWith("/profile") ||
      request.nextUrl.pathname.startsWith("/properties") ||
      request.nextUrl.pathname.startsWith("/units") ||
      request.nextUrl.pathname.startsWith("/tenants") ||
      request.nextUrl.pathname.startsWith("/leases") ||
      request.nextUrl.pathname.startsWith("/maintenance") ||
      request.nextUrl.pathname.startsWith("/vendors") ||
      request.nextUrl.pathname.startsWith("/communications") ||
      request.nextUrl.pathname.startsWith("/financials") ||
      request.nextUrl.pathname.startsWith("/ai-operations") ||
      request.nextUrl.pathname.startsWith("/settings") ||
      request.nextUrl.pathname.startsWith("/facility") ||
      request.nextUrl.pathname.startsWith("/applicants") ||
      request.nextUrl.pathname.startsWith("/residents") ||
      request.nextUrl.pathname.startsWith("/migration") ||
      request.nextUrl.pathname.startsWith("/setup") ||
      request.nextUrl.pathname.startsWith("/accounting"));

  if (isRootRoute) {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/portal" : "/login";
    return NextResponse.redirect(url);
  }

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if ((isLoginRoute || isForgotPasswordRoute) && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/portal/:path*",
    "/profile/:path*",
    "/properties/:path*",
    "/units/:path*",
    "/tenants/:path*",
    "/leases/:path*",
    "/maintenance/:path*",
    "/vendors/:path*",
    "/communications/:path*",
    "/financials/:path*",
    "/ai-operations/:path*",
    "/settings/:path*",
    "/facility/:path*",
    "/applicants/:path*",
    "/residents/:path*",
    "/migration/:path*",
    "/setup/:path*",
    "/accounting/:path*",
    "/join/:path*",
    "/login",
    "/forgot-password",
    "/reset-password",
    "/accept-invitation/:path*"
  ]
};
