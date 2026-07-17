import { headers } from "next/headers";

export async function fetchAuthedApi<T>(
  path: string,
  init?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const cookie = headerStore.get("cookie") ?? "";

  try {
    const response = await fetch(`${protocol}://${host}${path}`, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        cookie,
        accept: "application/json"
      },
      cache: "no-store"
    });
    if (!response.ok) {
      return { ok: false, status: response.status };
    }
    return { ok: true, data: (await response.json()) as T };
  } catch {
    return { ok: false, status: 500 };
  }
}
