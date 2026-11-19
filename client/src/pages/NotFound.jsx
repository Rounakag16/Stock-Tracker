import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../components/Brand";
import { SiteFooter } from "../components/SiteFooter";

export default function NotFoundPage() {
  useEffect(() => {
    document.title = "Page not found · Warely";
    // Tell search engines not to index the client-side 404.
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => {
      meta.remove();
      document.title = "Warely — Inventory management for shops & warehouses";
    };
  }, []);

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <header className="mx-auto w-full max-w-6xl px-4 sm:px-6 h-16 flex items-center">
        <BrandLogo />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-md">
          <p className="font-mono text-sm font-semibold text-brand-700">404</p>
          <h1 className="mt-2 font-display font-bold text-3xl tracking-tight text-ink">We couldn't find that page</h1>
          <p className="mt-3 text-slate-500">The link may be broken, or the page may have moved.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="btn-primary">Go to the homepage</Link>
            <Link to="/login" className="btn-secondary">Sign in</Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
