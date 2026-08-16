import { Link } from "react-router-dom";

const BoxLogo = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
);

function Icon({ path, className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d={path} />
    </svg>
  );
}

const ICONS = {
  layers: "M12 3l8 4-8 4-8-4 8-4z M4 11l8 4 8-4 M4 15l8 4 8-4",
  warehouse: "M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-4v-6.5H9V21H4a1 1 0 0 1-1-1V10.5z",
  shieldCheck: "M12 3l7 3v5c0 4.7-3 8.4-7 10-4-1.6-7-5.3-7-10V6l7-3z M9 12l2 2 4-4",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7.5V12l3 2",
  pencil: "M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
  phone: "M8 2h8a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z M11 19h2",
  building: "M4 21V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v15M12 21V10a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v11M4 21h16 M8 8h.01 M8 12h.01 M8 16h.01 M16 12h.01 M16 16h.01",
  arrowRight: "M5 12h14 M13 6l6 6-6 6",
  check: "M5 13l4 4L19 7",
};

const FEATURES = [
  {
    icon: "layers",
    title: "Multi-tenant workspaces",
    body: "Every company gets its own workspace at signup. Users, warehouses, stock, and logs never cross tenant lines.",
  },
  {
    icon: "warehouse",
    title: "Multi-warehouse tracking",
    body: "Track quantities per location and move stock between warehouses with a full transfer record.",
  },
  {
    icon: "shieldCheck",
    title: "Approval workflow",
    body: "Employees submit add, sale, or move requests. Nothing touches the count until an admin approves it.",
  },
  {
    icon: "clock",
    title: "Full audit trail",
    body: "Every create, edit, approval, and denial is logged with who did it and when — no guessing later.",
  },
  {
    icon: "pencil",
    title: "Editable pending requests",
    body: "Employees can fix a request while it's still pending. Admins can edit details in the same step as approving.",
  },
  {
    icon: "phone",
    title: "Built for the floor",
    body: "Mobile-first from the ground up, so counting stock doesn't mean walking back to a desktop.",
  },
];

const STEPS = [
  {
    title: "Create your workspace",
    body: "Set a company name and your admin login. You'll get a company code to hand out.",
  },
  {
    title: "Employees log requests",
    body: "Add stock, log a sale, or move it between warehouses — each request carries a party name.",
  },
  {
    title: "You review and approve",
    body: "Approve, deny, or correct a request. The count only changes once you sign off, and it's logged either way.",
  },
];

function ManifestCard() {
  const rows = [
    { name: "Cordless Drill 18V", loc: "Downtown", qty: 42, tone: "ok" },
    { name: "Safety Gloves (L)", loc: "North Dock", qty: 6, tone: "low" },
    { name: "Packing Tape 48mm", loc: "Downtown", qty: 128, tone: "ok" },
  ];
  const toneClass = { ok: "bg-brand-100 text-brand-700", low: "bg-rust-100 text-rust-700" };

  return (
    <div className="relative mx-auto w-full max-w-sm animate-float-tag">
      <div className="rounded-2xl bg-white border border-line shadow-xl shadow-ink/10 overflow-hidden -rotate-3">
        {/* Perforated header strip */}
        <div className="bg-ink px-1 pt-3">
          <div className="perforation pb-3">
            {Array.from({ length: 14 }).map((_, i) => (
              <span key={i} />
            ))}
          </div>
        </div>
        <div className="bg-ink px-5 pb-4 flex items-center justify-between text-paper">
          <span className="font-mono text-[11px] tracking-widest uppercase text-paper/70">
            Manifest
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-brand-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-400" />
            </span>
            live
          </span>
        </div>

        {/* Barcode strip */}
        <div className="flex items-end gap-[3px] px-5 py-4 border-b border-dashed border-line">
          {[3, 1, 2, 1, 4, 1, 1, 3, 2, 1, 5, 1, 2, 4, 1, 1, 3].map((w, i) => (
            <span
              key={i}
              className="bg-ink/80"
              style={{ width: `${w}px`, height: i % 5 === 0 ? "28px" : "18px" }}
            />
          ))}
        </div>

        {/* Ledger rows */}
        <div className="divide-y divide-line">
          {rows.map((r) => (
            <div key={r.name} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{r.name}</p>
                <p className="text-xs text-ink/50 font-mono">{r.loc}</p>
              </div>
              <span className={`shrink-0 font-mono text-sm font-bold px-2 py-1 rounded-md ${toneClass[r.tone]}`}>
                {r.qty}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="tear-rule flex items-center justify-between px-5 py-3 bg-paper">
          <span className="font-mono text-[11px] text-ink/50">CODE: ACME-HDW</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700">
            <Icon path={ICONS.check} className="w-3.5 h-3.5" />
            approved
          </span>
        </div>
      </div>

      {/* Floating delta badge */}
      <div className="absolute -right-4 top-10 rotate-6 rounded-lg bg-white border border-line shadow-lg px-2.5 py-1.5 animate-rise-in" style={{ animationDelay: "0.4s" }}>
        <span className="font-mono text-xs font-bold text-brand-600">+12 received</span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
        <div className="page-container flex items-center justify-between py-3.5">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-ink flex items-center justify-center text-paper">
              <BoxLogo className="w-5 h-5" />
            </span>
            <span className="font-display font-extrabold text-lg tracking-tight">Stock Tracker</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className="btn-ghost !min-h-0 !py-2 !px-3 sm:!px-4 text-sm">
              Sign in
            </Link>
            <Link to="/signup" className="btn-primary !min-h-0 !py-2 !px-3 sm:!px-4 text-sm">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="page-container pt-12 pb-16 sm:pt-16 sm:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="animate-rise-in">
            <span className="tag-chip">Multi-tenant · Multi-warehouse</span>
            <h1 className="font-display font-extrabold tracking-tight text-[2.5rem] leading-[1.05] sm:text-5xl lg:text-[3.25rem] mt-5">
              Know what's on the shelf, at every location, all the time.
            </h1>
            <p className="text-ink/60 text-lg mt-5 max-w-md">
              Employees log stock changes. Admins review and approve them. Every
              adjustment lands in a permanent audit trail — no spreadsheet
              required.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <Link to="/signup" className="btn-primary">
                Create your workspace
                <Icon path={ICONS.arrowRight} className="w-4 h-4" />
              </Link>
              <Link to="/login" className="btn-secondary">
                Sign in
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 mt-8">
              {["Self-hosted", "Open source", "MERN stack", "Role-based access"].map((t) => (
                <span key={t} className="tag-chip">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <ManifestCard />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-line bg-white">
        <div className="page-container py-16 sm:py-20">
          <div className="max-w-lg">
            <span className="tag-chip">The workflow</span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mt-4">
              Three steps, and nothing moves without a sign-off.
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 mt-12">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative">
                <span className="font-display text-5xl font-black text-brand-100 select-none">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display font-bold text-lg mt-2">{step.title}</h3>
                <p className="text-ink/60 mt-2 text-[15px] leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles split */}
      <section className="page-container py-16 sm:py-20">
        <div className="max-w-lg">
          <span className="tag-chip">Two portals, one workspace</span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mt-4">
            Built around who's asking, and who's approving.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <div className="stamp-card">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-ink text-paper flex items-center justify-center">
                <Icon path={ICONS.building} className="w-5 h-5" />
              </span>
              <h3 className="font-display font-bold text-xl">Admin portal</h3>
            </div>
            <ul className="mt-5 space-y-2.5 text-[15px] text-ink/70">
              {[
                "Dashboard overview across all warehouses",
                "Create and manage stock items and warehouses",
                "Approve, deny, or edit incoming requests",
                "Manage employee accounts and access",
                "Full, filterable activity log",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Icon path={ICONS.check} className="w-4 h-4 mt-0.5 text-brand-600 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="stamp-card">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center">
                <Icon path={ICONS.warehouse} className="w-5 h-5" />
              </span>
              <h3 className="font-display font-bold text-xl">Employee portal</h3>
            </div>
            <ul className="mt-5 space-y-2.5 text-[15px] text-ink/70">
              {[
                "Submit add, sale, or move requests",
                "Attach a party name to every request",
                "Edit a request while it's still pending",
                "See the status of past submissions",
                "Nothing but the day's job — no admin clutter",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Icon path={ICONS.check} className="w-4 h-4 mt-0.5 text-brand-600 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-line bg-white">
        <div className="page-container py-16 sm:py-20">
          <div className="max-w-lg">
            <span className="tag-chip">What's inside</span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mt-4">
              Everything an inventory system needs, nothing it doesn't.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
            {FEATURES.map((f) => (
              <div key={f.title} className="stamp-card">
                <span className="w-10 h-10 rounded-xl bg-paper border border-line flex items-center justify-center text-brand-700">
                  <Icon path={ICONS[f.icon]} />
                </span>
                <h3 className="font-display font-bold mt-4">{f.title}</h3>
                <p className="text-ink/60 text-[15px] mt-1.5 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="page-container py-16 sm:py-20">
        <div className="rounded-3xl bg-ink text-paper px-6 py-14 sm:px-14 sm:py-16 text-center relative overflow-hidden">
          <p className="font-mono text-xs tracking-widest uppercase text-brand-300">Ready when you are</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight mt-4 max-w-xl mx-auto">
            Set up your workspace and hand out the company code.
          </h2>
          <p className="text-paper/60 mt-3 max-w-md mx-auto">
            Takes about a minute. No credit card, no sales call — just a company
            name and an admin login.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link to="/signup" className="btn bg-brand-500 text-white hover:bg-brand-400">
              Create your workspace
              <Icon path={ICONS.arrowRight} className="w-4 h-4" />
            </Link>
            <Link to="/login" className="btn bg-white/5 text-paper border border-white/15 hover:bg-white/10">
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="page-container py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-ink flex items-center justify-center text-paper">
              <BoxLogo className="w-4 h-4" />
            </span>
            <span className="font-display font-bold text-sm">Stock Tracker</span>
            <span className="text-ink/40 text-sm hidden sm:inline">— multi-tenant inventory, MERN stack</span>
          </div>
          <div className="flex items-center gap-5 text-sm text-ink/60">
            <Link to="/login" className="hover:text-ink">Sign in</Link>
            <Link to="/signup" className="hover:text-ink">Create account</Link>
            <a
              href="https://github.com/Rounakag16/Stock-Tracker"
              target="_blank"
              rel="noreferrer"
              className="hover:text-ink"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
