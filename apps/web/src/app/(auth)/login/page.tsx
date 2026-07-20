import { LoginForm } from "../../../components/shell/login-form";
import { AuthBrandShell } from "../../../components/branding/auth-brand-shell";

export default function LoginPage() {
  return (
    <AuthBrandShell>
      <LoginForm />
    </AuthBrandShell>
  );
}
