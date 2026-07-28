import { Button, FormSection, Input } from "@mpa/ui/auth";
import { firstLoginPasswordAction } from "../../lib/auth/login-actions";

/**
 * AUTH-001 Slice A — first-login / forced password change gate.
 */
export function FirstLoginForm({
  username,
  error = null
}: {
  username: string | null;
  error?: string | null;
}) {
  return (
    <FormSection
      className="w-full max-w-md"
      title="Complete first sign-in"
      description={
        username
          ? `Signed in as ${username}. Set a permanent password to continue.`
          : "Set a permanent password to continue."
      }
    >
      <form className="space-y-[var(--mpa-space-4)]" action={firstLoginPasswordAction}>
        <div className="space-y-[var(--mpa-space-1)]">
          <label
            className="mpa-text-caption font-[var(--mpa-font-weight-medium)] text-[var(--mpa-color-text-secondary)]"
            htmlFor="password"
          >
            New password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
          />
          <p className="mpa-text-micro text-[var(--mpa-color-text-muted)]">At least 12 characters.</p>
        </div>
        <div className="space-y-[var(--mpa-space-1)]">
          <label
            className="mpa-text-caption font-[var(--mpa-font-weight-medium)] text-[var(--mpa-color-text-secondary)]"
            htmlFor="confirmPassword"
          >
            Confirm password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
          />
        </div>
        <label className="flex items-start gap-[var(--mpa-space-2)] mpa-text-caption text-[var(--mpa-color-text-secondary)]">
          <input
            type="checkbox"
            name="acceptTerms"
            className="mt-1"
            required
          />
          <span>I accept the Terms of Service and Privacy Policy.</span>
        </label>
        {error ? <p className="mpa-text-caption text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
        <Button className="w-full" type="submit">
          Save password and continue
        </Button>
      </form>
    </FormSection>
  );
}
