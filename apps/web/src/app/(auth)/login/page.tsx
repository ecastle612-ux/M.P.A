import { LoginForm } from "../../../components/shell/login-form";
import { AuthBrandShell } from "../../../components/branding/auth-brand-shell";
import { logoWebpPathForTone } from "../../../lib/branding";
import { redirect } from "next/navigation";

type LoginSearchParams = Promise<{
  mode?: string | string[];
  error?: string | string[];
  notice?: string | string[];
  next?: string | string[];
}>;

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

function safeNextPath(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/login") || value.startsWith("/first-login")) return null;
  return value;
}

export default async function LoginPage({ searchParams }: { searchParams: LoginSearchParams }) {
  const params = await searchParams;
  // AUTH-001 invitation-only: reject public signup entrypoint.
  if (firstParam(params.mode) === "sign_up") {
    redirect(
      `/login?error=${encodeURIComponent("Public registration is disabled. Accounts are invitation-only.")}`
    );
  }

  const error = firstParam(params.error);
  const notice = firstParam(params.notice);
  const next = safeNextPath(firstParam(params.next));

  return (
    <>
      <link
        rel="preload"
        as="image"
        href={logoWebpPathForTone("dark-surface")}
        type="image/webp"
      />
      <AuthBrandShell>
        <LoginForm error={error} notice={notice} next={next} />
      </AuthBrandShell>
    </>
  );
}
