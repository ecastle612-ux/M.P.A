import { Suspense } from "react";
import { LoginForm } from "../../../components/shell/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<p className="text-sm">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
