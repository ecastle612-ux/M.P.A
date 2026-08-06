import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { evaluatePathEntitlement, isProductSku, type ProductSku } from "@mpa/shared";
import { clientEnv } from "./lib/env/client-env";

const ACTIVE_ORGANIZATION_COOKIE = "mpa_active_organization_id";

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
    // J0: first login goes through /dashboard → Setup or product home (not launcher theater).
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  let isOperator = false;
  if (user) {
    isOperator = user.app_metadata?.["platform_operator"] === true;
    if (!isOperator) {
      const { data: operator } = await supabase
        .from("platform_operators")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      isOperator = Boolean(operator);
    }
  }

  // P0-5: Master Admin routes require platform operator (layout also enforces).
  if (user && pathname.startsWith("/admin") && !isOperator) {
    const url = request.nextUrl.clone();
    url.pathname = "/unauthorized";
    url.search = "?reason=admin";
    return NextResponse.redirect(url);
  }

  // P0-1: Customer routes fail closed on entitlements.
  // Platform operators may preview customer surfaces for support.
  if (user && isProtected && !pathname.startsWith("/admin") && !isOperator) {
    const organizationId = request.cookies.get(ACTIVE_ORGANIZATION_COOKIE)?.value ?? null;
    let sku: ProductSku | null = null;

    if (organizationId) {
      const { data: subscription } = await supabase
        .from("organization_subscriptions")
        .select("sku_code, status")
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (subscription && subscription.status !== "canceled" && isProductSku(subscription.sku_code)) {
        sku = subscription.sku_code;
      }
    }

    const decision = evaluatePathEntitlement({ pathname, sku });
    if (!decision.allowed) {
      const url = request.nextUrl.clone();
      if (!sku) {
        url.pathname = "/setup";
        url.search = "";
      } else {
        url.pathname = "/unauthorized";
        url.search = `?reason=entitlement&required=${encodeURIComponent(decision.entitlement ?? "unknown")}`;
      }
      return NextResponse.redirect(url);
    }
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
