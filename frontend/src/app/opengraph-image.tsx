import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getLocale } from "next-intl/server";

export const alt = "Itqan — Authentic Islamic Studies";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Full Arabic font files trip satori's OpenType parser (GSUB lookupType 5
// substFormat 3), so request a glyph subset via text= — Google strips the
// complex shaping tables from subsets, which is the documented satori workaround.
const fontCache = new Map<string, ArrayBuffer>();

async function loadArabicFont(
  family: string,
  text: string,
): Promise<ArrayBuffer | null> {
  try {
    const subset = Array.from(new Set(Array.from(`${text} `))).join("");
    const cacheKey = `${family}:${subset}`;
    const cached = fontCache.get(cacheKey);
    if (cached) return cached;
    // No User-Agent header: UA-less requests are the only ones Google answers
    // with format('truetype') subsets — every browser UA gets woff/woff2,
    // which satori cannot parse.
    const cssRes = await fetch(
      `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@700&text=${encodeURIComponent(subset)}`,
    );
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const match = css.match(/src:\s*url\(([^)]+)\)\s*format\(['"]truetype['"]\)/);
    if (!match) return null;
    const fontRes = await fetch(match[1]);
    if (!fontRes.ok) return null;
    const data = await fontRes.arrayBuffer();
    fontCache.set(cacheKey, data);
    return data;
  } catch {
    return null;
  }
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const logoPath = path.join(process.cwd(), "public", "itqan_logo.png");
    const buffer = await readFile(logoPath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

// Families verified to survive satori's OpenType parser as Google TTF
// subsets. Noto Kufi Arabic, Noto Sans Arabic, and Amiri all fail with
// "lookupType: 5 - substFormat: 3" — do not add them back.
// IBM Plex Sans Arabic is also the site's own Arabic UI font.
const ARABIC_FONT_FAMILIES = ["IBM Plex Sans Arabic", "Cairo", "Tajawal"];

// satori has no bidi algorithm: it lays words out left-to-right even for
// Arabic (the `direction`/`dir` props are ignored). Pre-reversing the word
// order displays correctly as long as each string stays on a single line —
// which the card guarantees with whiteSpace: nowrap and short copy.
function rtlWords(text: string): string {
  return text.split(" ").reverse().join(" ");
}

type CardProps = {
  isAr: boolean;
  brand: string;
  tagline: string;
  subtitle: string;
  label: string;
  logoDataUrl: string | null;
};

async function renderToPng(
  element: React.ReactElement,
  fontData: ArrayBuffer | null,
): Promise<Response> {
  const image = new ImageResponse(element, {
    ...size,
    fonts: fontData
      ? [{ name: "Arabic", data: fontData, style: "normal", weight: 700 }]
      : undefined,
  });
  // Consume the body eagerly so satori font-parse errors are catchable here
  // instead of crashing while the response streams.
  const buffer = await image.arrayBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, immutable, no-transform, max-age=86400",
    },
  });
}

export default async function OgImage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const brand = isAr ? "إتقان" : "Itqan";
  const tagline = isAr ? "طريقك مع القرآن الكريم" : "Master Your Learning Journey";
  // Kept short on purpose: every line must fit unwrapped for rtlWords to be safe.
  const subtitle = isAr
    ? "تعلم القرآن والعلوم الشرعية على يد نخبة من العلماء"
    : "Authentic Islamic studies with distinguished scholars";
  const label = isAr ? "منصة العلوم الإسلامية" : "Islamic Studies Platform";

  const logoDataUrl = await loadLogoDataUrl();
  const glyphs = `${label}${brand}${tagline}${subtitle}`;
  const card: CardProps = isAr
    ? {
        isAr,
        brand,
        tagline: rtlWords(tagline),
        subtitle: rtlWords(subtitle),
        label: rtlWords(label),
        logoDataUrl,
      }
    : { isAr, brand, tagline, subtitle, label, logoDataUrl };

  for (const family of ARABIC_FONT_FAMILIES) {
    const fontData = await loadArabicFont(family, glyphs);
    if (!fontData) continue;
    try {
      return await renderToPng(buildCard(card), fontData);
    } catch {
      // font parsed by Google but rejected by satori — try the next family
    }
  }

  // Last resort: Latin-only card rendered with next/og's bundled default font.
  const latin: CardProps = {
    ...card,
    isAr: false,
    brand: "Itqan",
    tagline: "Master Your Learning Journey",
    subtitle: "Authentic Islamic studies with distinguished scholars",
    label: "Islamic Studies Platform",
  };
  return renderToPng(buildCard(latin), null);
}

function buildCard({ isAr, brand, tagline, subtitle, label, logoDataUrl }: CardProps) {
  return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#141413",
          padding: "0 80px",
          fontFamily: "Arabic, sans-serif",
          position: "relative",
        }}
      >
        {/* Background radial glows */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(201,100,66,0.18), transparent 40%), radial-gradient(circle at 80% 70%, rgba(201,100,66,0.12), transparent 45%)",
          }}
        />

        {/* Thin terracotta accent bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            backgroundColor: "#c96442",
          }}
        />

        {/* Text content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: isAr ? "flex-end" : "flex-start",
            textAlign: isAr ? "right" : "left",
            flex: 1,
            gap: 24,
            zIndex: 1,
            order: isAr ? 2 : 1,
          }}
        >
          <div
            style={{
              color: "#c96442",
              fontSize: 26,
              letterSpacing: 2,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
          <div
            style={{
              color: "#faf9f5",
              fontSize: 130,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {brand}
          </div>
          <div
            style={{
              color: "#faf9f5",
              fontSize: 48,
              fontWeight: 700,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
            }}
          >
            {tagline}
          </div>
          <div
            style={{
              color: "#b0aea5",
              fontSize: 26,
              lineHeight: 1.5,
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Logo chip */}
        {logoDataUrl ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#faf9f5",
              borderRadius: 32,
              padding: 28,
              width: 220,
              height: 220,
              flexShrink: 0,
              zIndex: 1,
              order: isAr ? 1 : 2,
              marginLeft: isAr ? 0 : 60,
              marginRight: isAr ? 60 : 0,
              boxShadow: "0 8px 40px rgba(201,100,66,0.25)",
            }}
          >
            <img
              src={logoDataUrl}
              alt="Itqan Logo"
              width={164}
              height={164}
              style={{ objectFit: "contain" }}
            />
          </div>
        ) : null}
      </div>
  );
}
