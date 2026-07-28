import { ForgotPasswordForm } from "../../../components/auth/forgot-password-form";
import { AuthBrandShell } from "../../../components/branding/auth-brand-shell";

type ForgotSearchParams = Promise<{
  error?: string | string[];
  notice?: string | string[];
}>;

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

export default async function ForgotPasswordPage({
  searchParams
}: {
  searchParams: ForgotSearchParams;
}) {
  const params = await searchParams;

  return (
    <AuthBrandShell
      headline="Recover access."
      support="Reset your password with a secure link. Your portfolio stays protected."
    >
      <ForgotPasswordForm error={firstParam(params.error)} notice={firstParam(params.notice)} />
    </AuthBrandShell>
  );
}
