import { Link } from "react-router-dom";

export const BRAND_NAME = "WareSync";

// The WareSync mark: a "W" whose middle is an open box. Same geometry as
// public/favicon.svg (both drawn on a 100×100 grid).
const GLYPH_PATH =
  "M14.04 32.06 L16.43 29.67 L25.68 34.13 L27.27 36.84 L27.27 55.18 L33.01 50.72 L33.01 37.8 L47.61 44.82 L47.61 52.63 L52.39 52.63 L52.39 44.82 L66.99 37.8 L66.99 50.72 L72.73 55.18 L72.73 36.84 L74.32 34.13 L83.57 29.67 L85.96 32.06 L86.12 63.8 L84.21 67.46 L76.24 72.73 L72.09 72.57 L50 58.05 L27.91 72.57 L23.76 72.73 L15.79 67.46 L14.04 63.8 Z M50 23.92 L66.67 31.74 L50 39.71 L33.33 31.74 Z";

const SIZES = {
  sm: { box: "w-8 h-8", text: "text-base" },
  md: { box: "w-9 h-9", text: "text-lg" },
  lg: { box: "w-10 h-10", text: "text-xl" },
};

// Blue tile with the white W-box glyph — the app's mark.
export function BrandMark({ size = "md", className = "" }) {
  const s = SIZES[size];
  return (
    <svg className={`${s.box} shrink-0 ${className}`} viewBox="0 0 100 100" aria-hidden="true">
      <rect width="100" height="100" rx="22" className="fill-brand-600" />
      <path d={GLYPH_PATH} fill="#fff" />
    </svg>
  );
}

// Mark + wordmark, linking home. `tone="light"` is for dark backgrounds.
export function BrandLogo({ size = "md", tone = "dark", to = "/" }) {
  const s = SIZES[size];
  return (
    <Link to={to} className="inline-flex items-center gap-2.5" aria-label={`${BRAND_NAME} home`}>
      <BrandMark size={size} />
      <span className={`font-display font-bold tracking-tight whitespace-nowrap ${s.text} ${tone === "light" ? "text-white" : "text-ink"}`}>
        {BRAND_NAME}
      </span>
    </Link>
  );
}
