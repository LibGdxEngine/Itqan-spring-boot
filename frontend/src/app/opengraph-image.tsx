import { ImageResponse } from "next/og";
import { getLocale, getTranslations } from "next-intl/server";

export const alt = "Itqan — Authentic Islamic Studies";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadArabicFont(): Promise<ArrayBuffer | null> {
  try {
    const cssRes = await fetch(
      "https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@700&display=swap",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:60.0) Gecko/20100101 Firefox/60.0",
        },
      },
    );
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const match = css.match(/src:\s*url\(([^)]+)\)\s*format\(['"]truetype['"]\)/);
    if (!match) return null;
    const fontRes = await fetch(match[1]);
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OgImage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const t = await getTranslations({ locale, namespace: "seo.home" });
  const brand = isAr ? "إتقان" : "Itqan";
  const tagline = isAr ? "طريقك مع القرآن الكريم" : "Master Your Learning Journey";
  const subtitle = t("description");

  const fontData = await loadArabicFont();

  return new ImageResponse(
    (
      <div
        dir={isAr ? "rtl" : "ltr"}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#141413",
          padding: 80,
          fontFamily: "Arabic, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(201,100,66,0.18), transparent 40%), radial-gradient(circle at 80% 70%, rgba(201,100,66,0.12), transparent 45%)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: isAr ? "flex-end" : "flex-start",
            textAlign: isAr ? "right" : "left",
            width: "100%",
            gap: 32,
            zIndex: 1,
          }}
        >
          <div
            style={{
              color: "#c96442",
              fontSize: 28,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {isAr ? "منصة العلوم الإسلامية" : "Islamic Studies Platform"}
          </div>
          <div
            style={{
              color: "#faf9f5",
              fontSize: 140,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {brand}
          </div>
          <div
            style={{
              color: "#faf9f5",
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.2,
              maxWidth: 1000,
            }}
          >
            {tagline}
          </div>
          <div
            style={{
              color: "#b0aea5",
              fontSize: 26,
              lineHeight: 1.5,
              maxWidth: 1000,
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [
            {
              name: "Arabic",
              data: fontData,
              style: "normal",
              weight: 700,
            },
          ]
        : undefined,
    },
  );
}
