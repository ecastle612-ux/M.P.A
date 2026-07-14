import { ForgotPasswordForm } from "../../../components/auth/forgot-password-form";
import { AuthBrandShell } from "../../../components/branding/auth-brand-shell";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <AuthBrandShell>
        <ForgotPasswordForm />
      </AuthBrandShell>
    </main>
  );
}
