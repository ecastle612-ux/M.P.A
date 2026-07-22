import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { clientEnv } from "./lib/env/client-env";

function isMasterAdminUser(user: { app_metadata?: Record<string, unknown> } | null): boolean {
  return user?.app_metadata?.["dev_master_admin"] === true;
}

function homePathForUser(user: { app_metadata?: Record<string, unknown> } | null): string {
  return isMasterAdminUser(user) ? "/master-admin" : "/portal";
}

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
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/master-admin") ||
      pathname.startsWith("/portal") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/properties") ||
      pathname.startsWith("/units") ||
      pathname.startsWith("/tenants") ||
      pathname.startsWith("/leases") ||
      pathname.startsWith("/maintenance") ||
      pathname.startsWith("/vendors") ||
      pathname.startsWith("/communications") ||
      pathname.startsWith("/financials") ||
      pathname.startsWith("/ai-operations") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/facility") ||
      pathname.startsWith("/applicants") ||
      pathname.startsWith("/residents") ||
      pathname.startsWith("/migration") ||
      pathname.startsWith("/setup") ||
      pathname.startsWith("/accounting"));

  if (isRootRoute) {
    const url = request.nextUrl.clone();
    url.pathname = user ? homePathForUser(user) : "/login";
    return NextResponse.redirect(url);
  }

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if ((isLoginRoute || isForgotPasswordRoute) && user) {
    const url = request.nextUrl.clone();
    url.pathname = homePathForUser(user);
    return NextResponse.redirect(url);
  }

  // Master Admin must never be trapped in the PM setup wizard.
  if (user && isMasterAdminUser(user) && pathname.startsWith("/setup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/master-admin";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/master-admin/:path*",
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
