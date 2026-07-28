import type { ReactNode } from "react";
import { Button, FormField, FormSection, Input, Link } from "@mpa/ui/auth";
import { signInAction } from "../../lib/auth/login-actions";

/**
 * AUTH-001 Slice A — username + password sign-in (invitation-only; no public signup).
 * Server Component; UX-012 Slice B FormField via @mpa/ui/auth + --mpa-* classes.
 */
export function LoginForm({
  error = null,
  notice = null,
  next = null
}: {
  error?: string | null;
  notice?: string | null;
  next?: string | null;
}) {
  return (
    <FormSection
      className="w-full max-w-md"
      title="Sign In"
      description="Enter your username and password to open the Property Operations OS."
    >
      <form className="space-y-[var(--mpa-space-4)]" action={signInAction}>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <FormField
          htmlFor="username"
          label="Username"
          required
          hint="Login uses your M.P.A. username. Existing design-partner accounts may use email during migration."
        >
          <Input
            id="username"
            name="username"
            type="text"
            required
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            error={Boolean(error)}
          />
        </FormField>
        <FormField htmlFor="password" label="Password" required>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            error={Boolean(error)}
          />
        </FormField>
        {error ? (
          <p role="alert" className="mpa-text-caption text-[var(--mpa-color-feedback-error)]">
            {error}
          </p>
        ) : null}
        {notice ? <p className="mpa-text-caption text-[var(--mpa-color-brand-primary)]">{notice}</p> : null}
        <Button className="w-full" type="submit">
          Sign in
        </Button>
        <p className="mpa-text-caption text-center text-[var(--mpa-color-text-secondary)]">
          <Link href="/forgot-password">Forgot your password?</Link>
        </p>
        <p className="mpa-text-micro text-center text-[var(--mpa-color-text-muted)]">
          Team accounts are invitation-only.{" "}
          <Link href="/pricing">New to M.P.A.? See pricing</Link>
        </p>
      </form>
    </FormSection>
  );
}

/** @deprecated Sign-up mode removed under AUTH-001 invitation-only. */
export type LoginFormMode = "sign_in";

export function InvitationOnlyNotice({ children }: { children?: ReactNode }) {
  return (
    <p className="mpa-text-caption text-[var(--mpa-color-text-secondary)]">{children}</p>
  );
}
