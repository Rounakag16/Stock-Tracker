import { BrandLogo } from "./Brand";

const CHECK = "M5 13l4 4L19 7";

// Split layout for sign in / sign up: a charcoal brand panel on large
// screens, and just the form (with the logo above it) on phones.
export function AuthLayout({ title, subtitle, children, footer, panelTitle, panelPoints = [] }) {
  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Brand panel (desktop) */}
      <aside className="hidden lg:flex relative overflow-hidden bg-ink text-paper flex-col justify-between p-12 xl:p-16">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-40 -left-24 w-96 h-96 rounded-full bg-accent-500/15 blur-3xl" aria-hidden="true" />

        <div className="relative">
          <BrandLogo tone="light" />
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display font-extrabold text-4xl xl:text-5xl tracking-tight leading-[1.1]">{panelTitle}</h2>
          <ul className="mt-10 space-y-4">
            {panelPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 text-paper/75">
                <span className="mt-0.5 w-6 h-6 rounded-full bg-accent-500/15 text-accent-400 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={CHECK} />
                  </svg>
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-paper/40">Inventory for shops, godowns & warehouses</p>
      </aside>

      {/* Form side */}
      <main className="min-h-screen flex flex-col px-4 py-8 sm:px-6 lg:px-12">
        <div className="lg:hidden">
          <BrandLogo />
        </div>
        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">{title}</h1>
            {subtitle && <p className="text-ink/60 mt-2">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-8 text-sm text-ink/60">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}

// Label + control + optional hint, so every auth field lines up the same way.
export function Field({ id, label, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-ink/50 mt-1.5">{hint}</p>}
    </div>
  );
}
