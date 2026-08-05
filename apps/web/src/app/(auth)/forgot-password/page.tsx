import { AuthShell } from "../../../components/auth/auth-shell";
import { ForgotPasswordForm } from "../../../components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset access without friction."
      subtitle="We will email a secure link so you can set a new password and return to your workspace."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
