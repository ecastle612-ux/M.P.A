"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@mpa/ui";
import { createAuthClient } from "../../lib/auth/client";

export function LoginForm() {
  const router = useRouter();
  const supabase = createAuthClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <Card className="w-full max-w-md">
      <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">Login</h1>
      <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
        Foundation authentication screen.
      </p>
      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
        <Button className="w-full" disabled={loading} type="submit">
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </Card>
  );
}
