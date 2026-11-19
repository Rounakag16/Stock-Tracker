// Public details used by the legal pages and footers. Set these as
// environment variables on the host (Render → Environment) — Vite reads
// VITE_* variables at build time — or edit the fallbacks here.
//
//   VITE_SUPPORT_EMAIL   address for support, privacy and grievance requests
//   VITE_LEGAL_NAME      the person (or company) that operates Warely
//   VITE_LEGAL_CITY      city whose courts have jurisdiction, e.g. "Kolkata"
//   VITE_SITE_URL        public URL, e.g. https://warelyy.onrender.com

const env = import.meta.env;

export const SITE = {
  name: "Warely",
  url: (env.VITE_SITE_URL || "https://warelyy.onrender.com").replace(/\/+$/, ""),
  supportEmail: env.VITE_SUPPORT_EMAIL || "support@warely.example",
  legalName: env.VITE_LEGAL_NAME || "the operator of Warely",
  legalCity: env.VITE_LEGAL_CITY || "India",
  country: "India",
  // Keep in step with TERMS_VERSION in server/src/middleware/auth.js.
  legalUpdated: "19 November 2026",
};
