import type { MetadataRoute } from "next";
import {
  MPA_APP_ICON_192_PATH,
  MPA_APP_ICON_512_PATH,
  MPA_BRAND_NAME,
  MPA_BRAND_TAGLINE
} from "../lib/branding";

const PWA_ICON_SIZES = [16, 32, 48, 64, 128, 192, 256, 512] as const;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${MPA_BRAND_NAME} ${MPA_BRAND_TAGLINE}`,
    short_name: MPA_BRAND_NAME,
    description: `${MPA_BRAND_NAME} enterprise property management platform`,
    start_url: "/",
    display: "standalone",
    background_color: "#F3F4F6",
    theme_color: "#0D2645",
    icons: [
      ...PWA_ICON_SIZES.map((size) => ({
        src: `/icons/icon-${size}.png`,
        sizes: `${size}x${size}`,
        type: "image/png" as const,
        purpose: "any" as const
      })),
      {
        src: MPA_APP_ICON_192_PATH,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: MPA_APP_ICON_512_PATH,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
