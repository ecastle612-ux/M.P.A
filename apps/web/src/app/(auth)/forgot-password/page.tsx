import { ForgotPasswordForm } from "../../../components/auth/forgot-password-form";
import { AuthBrandShell } from "../../../components/branding/auth-brand-shell";

export default function ForgotPasswordPage() {
  return (
    <AuthBrandShell
      headline="Recover access."
      support="Reset your password with a secure link. Your portfolio stays protected."
    >
      <ForgotPasswordForm />
    </AuthBrandShell>
  );
}
