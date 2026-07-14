import type { MetadataRoute } from "next";
import {
  MPA_APP_ICON_192_PATH,
  MPA_APP_ICON_512_PATH,
  MPA_BRAND_NAME,
  MPA_BRAND_TAGLINE
} from "../lib/branding";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${MPA_BRAND_NAME} ${MPA_BRAND_TAGLINE}`,
    short_name: "MPA",
    description: `${MPA_BRAND_NAME} enterprise property management platform`,
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#102B4E",
    icons: [
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
