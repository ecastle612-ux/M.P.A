import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  allowedDevOrigins: ["127.0.0.1"],
  serverExternalPackages: ["sharp", "heic-convert"],
  images: {
    formats: ["image/avif", "image/webp"]
  },
  async headers() {
    // OneSignal Web SDK (API-001 / LC-001K):
    // - cdn.onesignal.com: page SDK + service worker importScripts
    // - api.onesignal.com: Web SDK sync JSONP (`/sync/{appId}/web?callback=…`) — required for
    //   subscription creation. Blocking this leaves players=0 and enrollment timeouts.
    // connect-src already allows https: (OneSignal REST / XHR).
    const onesignalCdn = "https://cdn.onesignal.com";
    const onesignalApi = "https://api.onesignal.com";
    const cspPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline' https://onesignal.com https://cdn.onesignal.com",
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${onesignalCdn} ${onesignalApi}`,
      "connect-src 'self' https: wss:",
      `worker-src 'self' blob: ${onesignalCdn}`,
      "manifest-src 'self'",
      "media-src 'self' blob:"
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(), usb=(), payment=()"
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
          { key: "Content-Security-Policy", value: cspPolicy }
        ]
      }
    ];
  }
};

export default nextConfig;
