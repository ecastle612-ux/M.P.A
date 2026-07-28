import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { clientEnv } from "./lib/env/client-env";
import {
  assignedSurfaceHome,
  canAccessOperationsPath,
  canAccessOperationsShell,
  flattenMembershipRoles,
  isOperationsShellPath
} from "./lib/auth/ops-shell-access";
import type { PasswordState } from "./lib/auth/identity/types";
import { ACTIVE_ORGANIZATION_COOKIE } from "./lib/organization/contracts";

async function principalRequiresFirstLoginGate(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("identity_principals")
    .select("password_state, must_accept_terms, status")
    .eq("auth_provider_subject", userId)
    .maybeSingle();

  if (!data) return false;
  const status = String(data["status"] ?? "");
  if (status === "disabled" || status === "locked" || status === "archived") return false;
  const passwordState = String(data["password_state"] ?? "") as PasswordState;
  if (passwordState === "temporary_issued" || passwordState === "reset_required") return true;
  return Boolean(data["must_accept_terms"]);
}

async function principalRequiresContactVerification(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("identity_principals")
    .select("must_verify_contact, password_state, must_accept_terms, status")
    .eq("auth_provider_subject", userId)
    .maybeSingle();
  if (!data) return false;
  const status = String(data["status"] ?? "");
  if (status === "disabled" || status === "locked" || status === "archived") return false;
  const passwordState = String(data["password_state"] ?? "") as PasswordState;
  if (passwordState === "temporary_issued" || passwordState === "reset_required") return false;
  if (Boolean(data["must_accept_terms"])) return false;
  return Boolean(data["must_verify_contact"]);
}

function isMasterAdminUser(user: { app_metadata?: Record<string, unknown> } | null): boolean {
  return user?.app_metadata?.["dev_master_admin"] === true;
}

async function resolveMembershipRoles(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("organization_memberships")
    .select("roles")
    .eq("user_id", userId)
    .eq("status", "active");
  return flattenMembershipRoles(data ?? []);
}

async function resolvePrimaryOrganizationType(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("organization_memberships")
    .select("roles, organizations(organization_type)")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(20);
  if (!data?.length) return null;
  for (const row of data) {
    const roles = Array.isArray(row.roles) ? row.roles : [];
    if (roles.includes("organization_admin")) {
      const org = row.organizations as { organization_type?: string | null } | null;
      return org?.organization_type ?? null;
    }
  }
  const first = data[0]?.organizations as { organization_type?: string | null } | null | undefined;
  return first?.organization_type ?? null;
}

async function homePathForAuthenticatedUser(
  supabase: ReturnType<typeof createServerClient>,
  user: { id: string; app_metadata?: Record<string, unknown> }
): Promise<string> {
  const isMasterAdmin = isMasterAdminUser(user);
  const roles = await resolveMembershipRoles(supabase, user.id);
  const organizationType = roles.includes("organization_admin")
    ? await resolvePrimaryOrganizationType(supabase, user.id)
    : null;
  return assignedSurfaceHome(roles, isMasterAdmin, { organizationType });
}

/** COM-001 Slice D — freeze/archive export-only navigation (AUTH Cancelled posture). */
async function resolveOffboardingMutationBlock(
  supabase: ReturnType<typeof createServerClient>,
  request: NextRequest,
  userId: string
): Promise<"none" | "export_only" | "archived"> {
  const orgId = request.cookies.get(ACTIVE_ORGANIZATION_COOKIE)?.value;
  if (!orgId) return "none";
  const { data: membership } = await supabase
    .from("organization_memberships")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) return "none";
  const { data } = await supabase
    .from("commercial_offboarding_states")
    .select("stage")
    .eq("organization_id", orgId)
    .maybeSingle();
  const stage = data ? String(data["stage"] ?? "none") : "none";
  if (stage === "archived") return "archived";
  if (stage === "frozen" || stage === "archive_scheduled") return "export_only";
  return "none";
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // Expose pathname to Server Components for SetupGate (avoid client-only redirect flash).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-mpa-pathname", pathname);
  const response = NextResponse.next({
    request: { headers: requestHeaders }
  });

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

  // Product correction: Vendor Portal retired — no authenticated vendor portal experience.
  if (pathname === "/portal/vendor" || pathname.startsWith("/portal/vendor/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/vendor-access";
    return NextResponse.redirect(url);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const isRootRoute = pathname === "/";
  const isLoginRoute = pathname.startsWith("/login");
  const isFirstLoginRoute = pathname.startsWith("/first-login");
  const isVerifyContactRoute = pathname.startsWith("/verify-contact");
  const isForgotPasswordRoute = pathname.startsWith("/forgot-password");
  const isAcceptInvitationRoute = pathname.startsWith("/accept-invitation");
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

  if ((isFirstLoginRoute || isVerifyContactRoute) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // AUTH-001 Slice A: first-login / forced password-change gate (before product/home routing).
  if (user && !isFirstLoginRoute && !isResetPasswordRoute && !isVerifyContactRoute) {
    const needsGate = await principalRequiresFirstLoginGate(supabase, user.id);
    if (
      needsGate &&
      (isProtected || isLoginRoute || isRootRoute || isForgotPasswordRoute || isAcceptInvitationRoute)
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/first-login";
      return NextResponse.redirect(url);
    }
  }

  // AUTH-001 Slice C: contact email verification gate after first-login.
  if (
    user &&
    !isFirstLoginRoute &&
    !isVerifyContactRoute &&
    !isResetPasswordRoute &&
    !isAcceptInvitationRoute
  ) {
    const needsContact = await principalRequiresContactVerification(supabase, user.id);
    if (needsContact && (isProtected || isLoginRoute || isRootRoute || isForgotPasswordRoute)) {
      const url = request.nextUrl.clone();
      url.pathname = "/verify-contact";
      return NextResponse.redirect(url);
    }
  }

  if (isRootRoute) {
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = await homePathForAuthenticatedUser(supabase, user);
      return NextResponse.redirect(url);
    }
    // ACQ-001 Slice A — anonymous visitors see the public landing page.
    return response;
  }

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if ((isLoginRoute || isForgotPasswordRoute) && user) {
    const url = request.nextUrl.clone();
    const needsGate = await principalRequiresFirstLoginGate(supabase, user.id);
    url.pathname = needsGate ? "/first-login" : await homePathForAuthenticatedUser(supabase, user);
    return NextResponse.redirect(url);
  }

  // Master Admin must never be trapped in the PM setup wizard.
  if (user && isMasterAdminUser(user) && pathname.startsWith("/setup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/master-admin";
    return NextResponse.redirect(url);
  }

  // COM-001 Slice D: frozen / archived orgs → export-only settings (Ops shell only; portals untouched).
  if (user && !isMasterAdminUser(user) && isOperationsShellPath(pathname)) {
    const block = await resolveOffboardingMutationBlock(supabase, request, user.id);
    const exportAllowed =
      pathname.startsWith("/settings") || pathname.startsWith("/profile");
    if ((block === "archived" || block === "export_only") && !exportAllowed) {
      const url = request.nextUrl.clone();
      url.pathname = "/settings/organization";
      return NextResponse.redirect(url);
    }
  }

  // REG-ACL-001 + AUTH-001 Slice D: portal-only roles never enter Ops;
  // leasing/technician are path-scoped inside Ops.
  if (user && isOperationsShellPath(pathname)) {
    const isMasterAdmin = isMasterAdminUser(user);
    const roles = await resolveMembershipRoles(supabase, user.id);
    if (!canAccessOperationsShell(roles, isMasterAdmin)) {
      const url = request.nextUrl.clone();
      url.pathname = await homePathForAuthenticatedUser(supabase, user);
      if (url.pathname === pathname) {
        url.pathname = "/unauthorized";
      }
      return NextResponse.redirect(url);
    }
    if (!canAccessOperationsPath(pathname, roles, isMasterAdmin)) {
      const url = request.nextUrl.clone();
      url.pathname = await homePathForAuthenticatedUser(supabase, user);
      if (url.pathname === pathname) {
        url.pathname = "/unauthorized";
      }
      return NextResponse.redirect(url);
    }
  }

  // Master Admin HQ routes require Master Admin capability.
  if (user && pathname.startsWith("/master-admin") && !isMasterAdminUser(user)) {
    const roles = await resolveMembershipRoles(supabase, user.id);
    const url = request.nextUrl.clone();
    url.pathname = assignedSurfaceHome(roles, false);
    if (url.pathname.startsWith("/master-admin")) {
      url.pathname = "/unauthorized";
    }
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/inbox/:path*",
    "/activity/:path*",
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
    "/first-login",
    "/forgot-password",
    "/reset-password",
    "/accept-invitation/:path*",
    "/verify-contact",
    "/verify-contact/:path*"
  ]
};
