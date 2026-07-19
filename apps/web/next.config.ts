import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"]
  },
  async headers() {
    // NOTE: enforced directives are intentionally unchanged from the Phase 2.1 baseline to
    // avoid Turbopack/HMR regressions. Production hardening (EP-008 §4.7) adds violation
    // reporting so the move to a strict, nonce-based CSP can be validated via report data.
    // Tracked as a gated follow-up in docs/24-production-hardening/security-review-findings.md.
    const cspPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' https: wss:",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "report-uri /api/security/csp-report",
      "report-to csp-endpoint"
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), usb=(), payment=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Reporting-Endpoints", value: 'csp-endpoint="/api/security/csp-report"' },
          { key: "Content-Security-Policy", value: cspPolicy }
        ]
      }
    ];
  }
};

export default nextConfig;
