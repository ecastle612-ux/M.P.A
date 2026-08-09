import { Suspense } from "react";
import { AuthChrome, AuthLoadingCard } from "../../../components/auth/auth-chrome";
import { LoginForm } from "../../../components/shell/login-form";

export default function LoginPage() {
  return (
    <AuthChrome>
      <Suspense fallback={<AuthLoadingCard label="Preparing sign-in…" />}>
        <LoginForm />
      </Suspense>
    </AuthChrome>
  );
}
