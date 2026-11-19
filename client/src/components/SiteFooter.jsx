import { Link } from "react-router-dom";
import { BRAND_NAME, BrandLogo } from "./Brand";
import { SITE } from "../lib/site";

// Footer for public pages (landing, legal, 404).
export function SiteFooter({ links = [] }) {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <BrandLogo size="sm" />
          <p className="mt-3 text-sm text-slate-500 max-w-xs">Inventory management for shops, godowns and warehouses.</p>
        </div>
        <nav aria-label="Product" className="text-sm">
          <p className="font-semibold text-ink mb-3">Product</p>
          <ul className="space-y-2 text-slate-500">
            {links.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="hover:text-ink">{n.label}</a>
              </li>
            ))}
            <li><Link to="/signup" className="hover:text-ink">Create a workspace</Link></li>
            <li><Link to="/login" className="hover:text-ink">Sign in</Link></li>
          </ul>
        </nav>
        <nav aria-label="Legal" className="text-sm">
          <p className="font-semibold text-ink mb-3">Legal & support</p>
          <ul className="space-y-2 text-slate-500">
            <li><Link to="/terms" className="hover:text-ink">Terms of Service</Link></li>
            <li><Link to="/privacy" className="hover:text-ink">Privacy Policy</Link></li>
            <li><Link to="/privacy#cookies" className="hover:text-ink">Cookies</Link></li>
            <li><a href={`mailto:${SITE.supportEmail}`} className="hover:text-ink break-all">{SITE.supportEmail}</a></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 sm:px-6 py-5 text-xs text-slate-400">
          © {new Date().getFullYear()} {BRAND_NAME}. Warely is a record-keeping tool and does not provide accounting, tax or legal advice.
        </p>
      </div>
    </footer>
  );
}
