import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { BrandLogo } from "../../components/Brand";
import { SiteFooter } from "../../components/SiteFooter";
import { SITE } from "../../lib/site";

// Shared shell for Terms and Privacy: title, "last updated", a contents
// list that jumps to each section, and the sections themselves.
//   sections: [{ id, title, body: <JSX> }]
export function LegalLayout({ title, intro, sections }) {
  const { hash } = useLocation();

  useEffect(() => {
    document.title = `${title} · ${SITE.name}`;
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
    return () => {
      document.title = "WareSync — Inventory management for shops & warehouses";
    };
  }, [title, hash]);

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <BrandLogo />
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link to="/terms" className="hidden sm:inline text-slate-500 hover:text-ink">Terms</Link>
            <Link to="/privacy" className="hidden sm:inline text-slate-500 hover:text-ink">Privacy</Link>
            <Link to="/login" className="btn-secondary !min-h-0 !py-2">Sign in</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-10 sm:py-14 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        <aside className="hidden lg:block">
          <nav aria-label="On this page" className="sticky top-24 text-sm">
            <p className="font-semibold text-ink mb-3">On this page</p>
            <ol className="space-y-2 text-slate-500">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="hover:text-ink">
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="max-w-3xl">
          <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-ink">{title}</h1>
          <p className="mt-3 text-sm text-slate-500">Last updated: {SITE.legalUpdated}</p>
          <div className="mt-6 text-slate-700 leading-relaxed space-y-4">{intro}</div>

          <div className="mt-10 space-y-10">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="font-display font-bold text-xl text-ink">
                  {i + 1}. {s.title}
                </h2>
                <div className="mt-3 text-slate-700 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-brand-700 [&_a]:font-medium hover:[&_a]:underline [&_strong]:text-ink">
                  {s.body}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}

export function Email() {
  return <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>;
}
