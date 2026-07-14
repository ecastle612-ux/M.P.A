import { ResetPasswordForm } from "../../../components/auth/reset-password-form";
import { AuthBrandShell } from "../../../components/branding/auth-brand-shell";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <AuthBrandShell>
        <ResetPasswordForm />
      </AuthBrandShell>
    </main>
  );
}
