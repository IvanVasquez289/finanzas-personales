import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finanzas",
    short_name: "Finanzas",
    description: "Sistema personal de control financiero",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#04060a",
    theme_color: "#06080c",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
