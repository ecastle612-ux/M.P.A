import { AuthShell } from "../../../components/auth/auth-shell";
import { ResetPasswordForm } from "../../../components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Choose a new secure password."
      subtitle="Complete your reset, then continue into your organization workspace."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
