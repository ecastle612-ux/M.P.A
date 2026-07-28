import { Button, Card, Input } from "@mpa/ui/auth";
import { forgotPasswordAction } from "../../lib/auth/login-actions";

/**
 * M0-PERF Option C — Server Component forgot-password (no client island).
 */
export function ForgotPasswordForm({
  error = null,
  notice = null
}: {
  error?: string | null;
  notice?: string | null;
}) {
  return (
    <Card className="w-full max-w-md">
      <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
        Reset password
      </h1>
      <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
        We will send a secure reset link to your email.
      </p>

      <form className="mt-4 space-y-3" action={forgotPasswordAction}>
        <div className="space-y-1">
          <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="email">
            Email
          </label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
        {notice ? <p className="text-sm text-[var(--mpa-color-brand-primary)]">{notice}</p> : null}
        <Button className="w-full" type="submit">
          Send reset link
        </Button>
        <p className="text-center text-sm text-[var(--mpa-color-text-secondary)]">
          <a className="underline" href="/login">
            Back to sign in
          </a>
        </p>
      </form>
    </Card>
  );
}
