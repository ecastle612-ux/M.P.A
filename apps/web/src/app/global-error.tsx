"use client";

import { useEffect } from "react";
import { MPA_BRAND_NAME, MPA_BRAND_TAGLINE, resolveBrandAssetUrl } from "@mpa/shared";

/**
 * Last-resort boundary (replaces root layout when it fails).
 * Uses branding-package resolveBrandAssetUrl only — no app-shell BrandLogo.
 */
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("[global]", error);
  }, [error]);

  const brand = resolveBrandAssetUrl("header", "light-surface");

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "Georgia, 'Times New Roman', serif",
          background: "#f6f4ef",
          color: "#1c1917",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            background: "#fff",
            border: "1px solid #e7e5e4",
            borderRadius: 16,
            padding: 28,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Global fallback avoids app-shell image dependencies. */}
          <img
            src={brand.src}
            alt={`${MPA_BRAND_NAME} ${MPA_BRAND_TAGLINE}`}
            width={brand.width}
            height={brand.height}
            style={{
              display: "block",
              width: brand.width,
              height: brand.height,
              objectFit: "contain",
              marginBottom: 16
            }}
          />
          <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>{MPA_BRAND_NAME}</p>
          <h1 style={{ margin: "8px 0 12px", fontSize: 28 }}>We hit a serious snag</h1>
          <p style={{ margin: "0 0 8px", fontSize: 14, lineHeight: 1.5, color: "#57534e" }}>
            <strong style={{ color: "#1c1917" }}>What happened:</strong> The application shell failed to render.
          </p>
          <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.5, color: "#57534e" }}>
            <strong style={{ color: "#1c1917" }}>How to fix it:</strong> Retry once. If it keeps happening, refresh the
            browser or contact support@mypropertyassistant.com.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                background: "#0f766e",
                color: "#fff",
                border: 0,
                borderRadius: 8,
                padding: "10px 16px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Retry
            </button>
            <a href="/dashboard" style={{ alignSelf: "center", fontSize: 14, fontWeight: 600, color: "#0f766e" }}>
              Back to Operations
            </a>
            <a
              href="mailto:support@mypropertyassistant.com?subject=M.P.A.%20help"
              style={{ alignSelf: "center", fontSize: 14, fontWeight: 600, color: "#0f766e" }}
            >
              Contact support
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
