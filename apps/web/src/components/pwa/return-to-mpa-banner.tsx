"use client";

import { Banner, Button } from "@mpa/ui";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const RETURN_KEYS = ["paid", "saas", "checkout", "billing_return", "stripe_return", "canceled"] as const;

function messageForParams(params: URLSearchParams): string | null {
  const paid = params.get("paid");
  if (paid === "1" || paid === "true") {
    return "Welcome back — your payment flow finished. You’re back in My Property Assistant.";
  }
  const canceled = params.get("canceled");
  if (canceled === "1" || canceled === "true") {
    return "Checkout canceled. You’re still in My Property Assistant.";
  }
  const saas = params.get("saas");
  if (saas === "success") {
    return "Welcome back — billing update complete. You’re back in My Property Assistant.";
  }
  if (saas === "cancel") {
    return "Checkout canceled. You’re still in My Property Assistant.";
  }
  if (
    params.get("checkout") === "success" ||
    params.get("billing_return") === "1" ||
    params.get("stripe_return") === "1"
  ) {
    return "Welcome back — you’re back in My Property Assistant.";
  }
  return null;
}

/**
 * Pattern C return interstitial — banner after Stripe (or similar) redirects back into the app.
 */
export function ReturnToMpaBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const next = messageForParams(searchParams);
    if (!next) return;
    setMessage(next);

    const cleaned = new URLSearchParams(searchParams.toString());
    for (const key of RETURN_KEYS) cleaned.delete(key);
    cleaned.delete("session_id");
    const qs = cleaned.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  if (!message) return null;

  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <Banner tone="success" className="flex-1">
        {message}
      </Banner>
      <Button type="button" variant="ghost" size="sm" onClick={() => setMessage(null)} aria-label="Dismiss">
        Dismiss
      </Button>
    </div>
  );
}
