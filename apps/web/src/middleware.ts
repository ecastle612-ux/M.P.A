import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  COM_002_FLAGS,
  evaluatePathEntitlement,
  hasLifecycleModuleAccess,
  isProductSku,
  isSubscriptionPlatformStatus,
  type ProductSku,
  type SubscriptionPlatformStatus
} from "@mpa/shared";
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
  // `/` (marketing homepage) is intentionally public and is not matched below.
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
    // Preserve safe post-login handoff targets (portal magic links, invite accepts).
    const nextRaw = request.nextUrl.searchParams.get("next");
    if (nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//")) {
      return NextResponse.redirect(new URL(nextRaw, request.url));
    }
    // J0: first login goes through /dashboard → Setup or product home (not launcher theater).
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
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

  // Bootstrap active-org cookie from first membership when missing (portal first login).
  let organizationId = request.cookies.get(ACTIVE_ORGANIZATION_COOKIE)?.value ?? null;
  if (user && isProtected && !organizationId) {
    const { data: membership } = await supabase
      .from("organization_memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    const membershipOrg =
      membership && typeof membership.organization_id === "string"
        ? membership.organization_id
        : null;
    if (membershipOrg) {
      organizationId = membershipOrg;
      response.cookies.set(ACTIVE_ORGANIZATION_COOKIE, membershipOrg, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env["NODE_ENV"] === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30
      });
    }
  }

  // P0-1: Customer routes fail closed on entitlements + Slice E lifecycle access.
  // Platform operators may preview customer surfaces for support.
  // Billing remains reachable so customers can recover payment / reactivate.
  if (user && isProtected && !pathname.startsWith("/admin") && !isOperator) {
    let sku: ProductSku | null = null;
    let moduleAccess = true;

    if (organizationId) {
      const { data: subscription } = await supabase
        .from("organization_subscriptions")
        .select("sku_code, status, grace_started_at, cancel_at_period_end")
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (subscription && isProductSku(subscription.sku_code)) {
        const status = subscription.status;
        if (COM_002_FLAGS.sliceE_subscriptionLifecycle && isSubscriptionPlatformStatus(status)) {
          moduleAccess = hasLifecycleModuleAccess({
            status: status as SubscriptionPlatformStatus,
            graceStartedAt:
              typeof subscription.grace_started_at === "string" ? subscription.grace_started_at : null,
            cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end)
          });
          if (moduleAccess || pathname.startsWith("/billing") || pathname.startsWith("/setup")) {
            sku = subscription.sku_code;
          }
        } else if (status !== "canceled") {
          sku = subscription.sku_code;
        }
      }
    }

    const billingOrSetup =
      pathname.startsWith("/billing") || pathname.startsWith("/setup");

    if (COM_002_FLAGS.sliceE_subscriptionLifecycle && !moduleAccess && !billingOrSetup && sku) {
      const url = request.nextUrl.clone();
      url.pathname = "/billing";
      url.search = "?reason=subscription";
      return NextResponse.redirect(url);
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
