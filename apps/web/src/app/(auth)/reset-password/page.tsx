import { ResetPasswordForm } from "../../../components/auth/reset-password-form";
import { AuthBrandShell } from "../../../components/branding/auth-brand-shell";

export default function ResetPasswordPage() {
  return (
    <AuthBrandShell
      headline="Choose a new password."
      support="Set a strong password to continue managing your properties."
    >
      <ResetPasswordForm />
    </AuthBrandShell>
  );
}
