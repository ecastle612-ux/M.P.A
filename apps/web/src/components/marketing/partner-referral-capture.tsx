"use client";

import { useEffect } from "react";
import { PARTNER_REF_PARAM, parsePartnerRefParam } from "@mpa/shared";

export function PartnerReferralCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = parsePartnerRefParam(params.get(PARTNER_REF_PARAM));
    if (!slug) return;
    void fetch("/api/partners/ref", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: slug })
    }).catch(() => undefined);
  }, []);
  return null;
}
