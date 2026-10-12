import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CineSeat",
    short_name: "CineSeat",
    description: "See your seat in 3D before you book.",
    start_url: "/",
    display: "standalone",
    background_color: "#07060b",
    theme_color: "#07060b",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
