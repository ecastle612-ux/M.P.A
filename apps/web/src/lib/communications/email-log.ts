export type EmailAttemptStatus = "provider_accepted" | "failed" | "skipped";

export function logEmailAttempt(input: {
  template: string;
  to: string;
  status: EmailAttemptStatus;
  error?: string;
  providerId?: string;
  fromSource?: string;
}) {
  const toDomain = input.to.includes("@") ? (input.to.split("@")[1] ?? null) : null;
  const line = JSON.stringify({
    scope: "mpa.email",
    template: input.template,
    toDomain,
    status: input.status,
    fromSource: input.fromSource ?? null,
    providerId: input.providerId ?? null,
    error: input.error ?? null
  });
  if (input.status === "provider_accepted") {
    console.info(line);
    return;
  }
  console.error(line);
}
