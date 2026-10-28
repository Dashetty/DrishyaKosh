import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DrishyaKosh — A Personal Archive of Moving Pictures",
    short_name: "DrishyaKosh",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0d0a07",
    theme_color: "#0d0a07",
    lang: "en",
    icons: [
      {
        src: "/favicon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
