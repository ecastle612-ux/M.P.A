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
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isRootRoute = pathname === "/";
  const isLoginRoute = pathname.startsWith("/login");
  const isForgotPasswordRoute = pathname.startsWith("/forgot-password");
  const isProtected =
    request.nextUrl.pathname.startsWith("/dashboard") ||
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
    request.nextUrl.pathname.startsWith("/ai-operations");

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
    "/join/:path*",
    "/login",
    "/forgot-password",
    "/reset-password",
    "/accept-invitation/:path*"
  ]
};
