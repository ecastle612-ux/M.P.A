import { LoginForm } from "../../../components/shell/login-form";
import { AuthBrandShell } from "../../../components/branding/auth-brand-shell";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <AuthBrandShell>
        <LoginForm />
      </AuthBrandShell>
    </main>
  );
}
