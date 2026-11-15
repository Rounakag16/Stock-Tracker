import { Link } from "react-router-dom";

export const BOX_PATH = "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4";

const SIZES = {
  sm: { box: "w-8 h-8 rounded-lg", icon: "w-4 h-4", text: "text-base" },
  md: { box: "w-9 h-9 rounded-lg", icon: "w-5 h-5", text: "text-lg" },
  lg: { box: "w-12 h-12 rounded-xl", icon: "w-6 h-6", text: "text-xl" },
};

// Blue tile with a white box glyph — the app's mark.
export function BrandMark({ size = "md", className = "" }) {
  const s = SIZES[size];
  return (
    <span className={`${s.box} bg-brand-600 flex items-center justify-center shrink-0 ${className}`}>
      <svg className={`${s.icon} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={BOX_PATH} />
      </svg>
    </span>
  );
}

// Mark + wordmark, linking home. `tone="light"` is for dark backgrounds.
export function BrandLogo({ size = "md", tone = "dark", to = "/" }) {
  const s = SIZES[size];
  return (
    <Link to={to} className="inline-flex items-center gap-2.5" aria-label="Stock Tracker home">
      <BrandMark size={size} />
      <span className={`font-display font-bold tracking-tight whitespace-nowrap ${s.text} ${tone === "light" ? "text-white" : "text-ink"}`}>
        Stock Tracker
      </span>
    </Link>
  );
}
