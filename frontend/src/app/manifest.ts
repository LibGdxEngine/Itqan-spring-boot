import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "إتقان للتفسير — تعلّم تفسير القرآن الكريم",
    short_name: "إتقان للتفسير",
    description:
      "تعلّم تفسير القرآن الكريم وتدبّر آياته والعلوم الشرعية أونلاين",
    start_url: "/",
    display: "standalone",
    lang: "ar",
    dir: "rtl",
    background_color: "#f5f4ed",
    theme_color: "#c96442",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
