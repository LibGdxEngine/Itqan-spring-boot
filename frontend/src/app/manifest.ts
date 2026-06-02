import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "إتقان — منصة العلوم الإسلامية",
    short_name: "إتقان",
    description:
      "تعلم القرآن الكريم والعلوم الإسلامية على يد نخبة من العلماء والمشايخ",
    start_url: "/",
    display: "standalone",
    lang: "ar",
    dir: "rtl",
    background_color: "#f5f4ed",
    theme_color: "#c96442",
    icons: [],
  };
}
