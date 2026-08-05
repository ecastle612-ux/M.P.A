import { AuthShell } from "../../../components/auth/auth-shell";
import { LoginForm } from "../../../components/shell/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Operate property work with calm confidence."
      subtitle="Sign in to your workspace. Foundation authentication for organizations, roles, and portals."
    >
      <LoginForm />
    </AuthShell>
  );
}
