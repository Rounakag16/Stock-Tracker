import { Link } from "react-router-dom";
import { BRAND_NAME, BrandLogo } from "./Brand";
import { LedgerPreview } from "./LedgerPreview";

const CHECK = "M5 13l4 4L19 7";

// Sign in / sign up shell. Phones get the form only; large screens add an
// ink panel on the right with a real-looking sample of the product.
//   topLink: { text, label, to } — the "switch to the other form" link in the header.
export function AuthLayout({ title, subtitle, children, footer, topLink, panelTitle, panelPoints = [] }) {
  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Form side */}
      <div className="min-h-screen flex flex-col px-4 sm:px-8 lg:px-12 xl:px-16">
        <header className="flex items-center justify-between gap-4 py-5 [&>a]:shrink-0">
          <BrandLogo />
          {topLink && (
            <p className="text-sm text-slate-500 text-right">
              <span className="hidden sm:inline">{topLink.text} </span>
              <Link to={topLink.to} className="font-semibold text-brand-700 hover:underline sm:whitespace-nowrap">
                {topLink.label}
              </Link>
            </p>
          )}
        </header>

        <main className="flex-1 flex items-center justify-center py-8 sm:py-12">
          <div className="w-full max-w-[400px]">
            <h1 className="font-display font-bold text-3xl tracking-tight text-ink">{title}</h1>
            {subtitle && <p className="text-slate-500 mt-2 leading-relaxed">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-8 pt-6 border-t border-line text-sm text-slate-500">{footer}</div>}
          </div>
        </main>

        <footer className="py-5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>© {new Date().getFullYear()} {BRAND_NAME}</span>
          <span className="inline-flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Each company's data is kept separate
          </span>
        </footer>
      </div>

      {/* Product panel (desktop) */}
      <aside className="hidden lg:flex flex-col justify-center bg-ink text-white px-12 xl:px-20 py-16 border-l border-slate-800">
        <div className="max-w-lg w-full mx-auto">
          <h2 className="font-display font-bold text-3xl xl:text-4xl tracking-tight leading-tight">{panelTitle}</h2>
          <ul className="mt-6 space-y-3">
            {panelPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 text-slate-300">
                <svg className="w-5 h-5 mt-0.5 text-brand-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={CHECK} />
                </svg>
                {point}
              </li>
            ))}
          </ul>
          <LedgerPreview className="mt-10 shadow-2xl shadow-black/40 border-slate-700" />
        </div>
      </aside>
    </div>
  );
}

// Label + control + optional hint, so every auth field lines up the same way.
export function Field({ id, label, hint, children, aside }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <label htmlFor={id} className="block text-sm font-semibold text-ink">
          {label}
        </label>
        {aside}
      </div>
      {children}
      {hint && <p className="text-xs text-slate-500 mt-1.5">{hint}</p>}
    </div>
  );
}
