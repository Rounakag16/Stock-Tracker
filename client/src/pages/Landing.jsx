import { Link } from "react-router-dom";
import { BrandLogo } from "../components/Brand";

function Icon({ path, className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={path} />
    </svg>
  );
}

const ICONS = {
  shieldCheck: "M12 3l7 3v5c0 4.7-3 8.4-7 10-4-1.6-7-5.3-7-10V6l7-3z M9 12l2 2 4-4",
  warehouse: "M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-4v-6.5H9V21H4a1 1 0 0 1-1-1V10.5z",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  table: "M3 10h18M3 14h18M10 3v18M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z",
  bell: "M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3C7.7 6.2 6 8.4 6 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7.5V12l3 2",
  phone: "M8 2h8a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z M11 19h2",
  lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  building: "M4 21V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v15M12 21V10a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v11M4 21h16 M8 8h.01 M8 12h.01 M8 16h.01 M16 12h.01 M16 16h.01",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  arrowRight: "M5 12h14 M13 6l6 6-6 6",
  check: "M5 13l4 4L19 7",
  plus: "M12 5v14M5 12h14",
};

// Everything listed here is something the app actually does today.
const FEATURES = [
  {
    icon: "shieldCheck",
    title: "Approval before anything changes",
    body: "Employees submit add, sale and move requests. Stock only changes once an admin approves — and admins can correct a request in the same step.",
  },
  {
    icon: "warehouse",
    title: "Every warehouse in one place",
    body: "Track quantities per location and move stock between warehouses. Both sides of a transfer are recorded.",
  },
  {
    icon: "calendar",
    title: "Daily opening & closing stock",
    body: "Pick any day to see opening stock, what was added, sold and moved, and the closing count — per item and in total.",
  },
  {
    icon: "table",
    title: "Excel in, Excel out",
    body: "Upload an .xlsx to add stock in bulk, and export current stock or any slice of the activity log for your accountant.",
  },
  {
    icon: "bell",
    title: "Low-stock alerts",
    body: "Set a reorder point per item. Admins are notified the moment an item drops to it — or runs out.",
  },
  {
    icon: "clock",
    title: "A permanent audit trail",
    body: "Every entry records who did it, for which party, and on which date — including backdated entries.",
  },
];

const STEPS = [
  {
    title: "Create your workspace",
    body: "Enter your business name and an admin login. You get a company code to share with your team.",
  },
  {
    title: "Your team logs requests",
    body: "From any phone, employees record stock received, sales and transfers — each with a party name and date.",
  },
  {
    title: "You approve, stock updates",
    body: "Review, edit or deny each request. Approved changes post on the date they happened and land in the log.",
  },
];

const FAQS = [
  {
    q: "Can employees change stock directly?",
    a: "No. Employees submit requests; only an admin's approval changes a quantity. Admins can also adjust stock themselves, and every change is logged either way.",
  },
  {
    q: "Is our data separate from other businesses?",
    a: "Yes. Each company gets its own workspace — users, warehouses, stock and logs are never shared between companies.",
  },
  {
    q: "Can I record something that happened yesterday?",
    a: "Yes. Every entry has a date, so you can backdate a sale or delivery. Future dates aren't allowed, and a backdated sale can't push stock below zero on any day.",
  },
  {
    q: "We already keep stock in Excel. Can we bring it in?",
    a: "Yes. Download the upload template, fill in your items per warehouse, and upload the .xlsx — new items are created and existing ones are topped up.",
  },
];

// Illustrative product preview built from plain markup (no screenshot), so
// it stays crisp at any size and always matches the current palette.
function ProductPreview() {
  const rows = [
    { name: "UltraTech Cement 50kg", wh: "Main Warehouse", qty: 120, tone: "ok" },
    { name: "PVC Pipe 4 inch", wh: "Godown 2", qty: 8, tone: "low" },
    { name: "Copper Wire 2.5mm", wh: "Main Warehouse", qty: 0, tone: "out" },
    { name: "Ceramic Tiles 2×2", wh: "Godown 2", qty: 250, tone: "ok" },
  ];
  const tone = {
    ok: "bg-accent-50 text-accent-700",
    low: "bg-amber-100 text-amber-700",
    out: "bg-red-100 text-red-700",
  };

  return (
    <div className="relative mx-auto w-full max-w-lg" aria-hidden="true">
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-brand-200/60 via-transparent to-accent-200/50 blur-2xl" />

      <div className="relative rounded-2xl border border-line bg-white shadow-2xl shadow-ink/10 overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-line bg-paper/60">
          <span className="w-2.5 h-2.5 rounded-full bg-ink/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-ink/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-ink/15" />
          <span className="ml-3 text-[11px] font-medium text-ink/40">Stock · All warehouses</span>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-3 divide-x divide-line border-b border-line">
          {[
            ["Items", "128", "text-ink"],
            ["Low stock", "6", "text-amber-600"],
            ["Pending", "3", "text-brand-600"],
          ].map(([label, value, color]) => (
            <div key={label} className="px-4 py-3">
              <p className="text-[11px] text-ink/50 font-medium">{label}</p>
              <p className={`font-mono text-xl font-bold tabular-nums ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Stock rows */}
        <div className="divide-y divide-line">
          {rows.map((r) => (
            <div key={r.name} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{r.name}</p>
                <p className="text-[11px] text-ink/45">{r.wh}</p>
              </div>
              <span className={`shrink-0 font-mono text-xs font-bold px-2 py-1 rounded-md tabular-nums ${tone[r.tone]}`}>
                {r.qty}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating approval card */}
      <div className="absolute -bottom-20 -left-3 sm:-left-10 w-60 rounded-xl border border-line bg-white shadow-xl shadow-ink/10 p-3.5 animate-float-tag">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-brand-100 text-brand-800">Sale</span>
          <span className="text-xs text-ink/50">from Ravi</span>
        </div>
        <p className="text-sm font-semibold text-ink mt-1.5">10 × Cement 50kg</p>
        <p className="text-[11px] text-ink/45">Party: Mehta Builders</p>
        <div className="grid grid-cols-2 gap-2 mt-2.5">
          <span className="rounded-lg bg-brand-500 text-ink text-xs font-semibold py-1.5 text-center">Approve</span>
          <span className="rounded-lg border border-line text-ink/60 text-xs font-semibold py-1.5 text-center">Deny</span>
        </div>
      </div>

      {/* Floating toast */}
      <div
        className="absolute -top-4 -right-2 sm:-right-6 flex items-center gap-2 rounded-full bg-ink text-paper pl-2 pr-3.5 py-1.5 shadow-lg animate-rise-in"
        style={{ animationDelay: "0.5s" }}
      >
        <span className="w-5 h-5 rounded-full bg-accent-500 text-ink flex items-center justify-center">
          <Icon path={ICONS.check} className="w-3 h-3" />
        </span>
        <span className="text-xs font-semibold">Stock updated</span>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, body, center = false, tone = "dark" }) {
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      <p className={`text-sm font-semibold ${tone === "light" ? "text-brand-400" : "text-brand-700"}`}>{eyebrow}</p>
      <h2
        className={`font-display font-extrabold text-3xl sm:text-4xl tracking-tight mt-2 ${
          tone === "light" ? "text-paper" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {body && <p className={`mt-4 text-lg ${tone === "light" ? "text-paper/60" : "text-ink/60"}`}>{body}</p>}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper text-ink overflow-x-clip">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/80 backdrop-blur-lg">
        <div className="page-container flex items-center justify-between gap-4 py-3">
          <BrandLogo />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-ink/60">
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#how-it-works" className="hover:text-ink">How it works</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Link to="/login" className="btn-ghost !min-h-0 !py-2 !px-2.5 sm:!px-3 text-sm whitespace-nowrap">
              Sign in
            </Link>
            <Link to="/signup" className="btn-primary !min-h-0 !py-2 !px-3.5 sm:!px-4 text-sm whitespace-nowrap">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="page-container pt-12 pb-32 sm:pt-20 sm:pb-36">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-16 lg:gap-12 items-center">
          <div className="animate-rise-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-800">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
              Inventory for shops, godowns & warehouses
            </span>
            <h1 className="font-display font-extrabold tracking-tight text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-[3.4rem] xl:text-6xl mt-6">
              Every item, every warehouse,{" "}
              <span className="text-brand-500">accounted for.</span>
            </h1>
            <p className="text-ink/60 text-lg sm:text-xl mt-6 max-w-xl leading-relaxed">
              Your team records stock received, sales and transfers from their phones. You approve
              each one — and always know exactly what's on the shelf.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-9">
              <Link to="/signup" className="btn-primary !px-6 !py-3.5 text-base">
                Create your free workspace
                <Icon path={ICONS.arrowRight} className="w-4 h-4" />
              </Link>
              <Link to="/login" className="btn-secondary !px-6 !py-3.5 text-base">
                Sign in
              </Link>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 mt-8 text-sm text-ink/60">
              {["Set up in about a minute", "Works on any phone", "No credit card"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Icon path={ICONS.check} className="w-4 h-4 text-accent-600" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <ProductPreview />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 bg-white border-y border-line">
        <div className="page-container py-20 sm:py-24">
          <SectionHeading
            eyebrow="Features"
            title="Everything you need to run stock with confidence"
            body="Built for businesses where stock moves every day and mistakes cost money."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12 mt-14">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <span className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
                  <Icon path={ICONS[f.icon]} />
                </span>
                <h3 className="font-display font-bold text-lg mt-5">{f.title}</h3>
                <p className="text-ink/60 mt-2 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 bg-ink text-paper">
        <div className="page-container py-20 sm:py-24">
          <SectionHeading
            tone="light"
            eyebrow="How it works"
            title="Three steps. Nothing moves without a sign-off."
          />
          <ol className="grid md:grid-cols-3 gap-6 mt-14">
            {STEPS.map((step, i) => (
              <li key={step.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
                <span className="w-10 h-10 rounded-full bg-brand-500 text-ink font-display font-extrabold flex items-center justify-center">
                  {i + 1}
                </span>
                <h3 className="font-display font-bold text-lg mt-5">{step.title}</h3>
                <p className="text-paper/60 mt-2 leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Two portals */}
      <section className="page-container py-20 sm:py-24">
        <SectionHeading
          eyebrow="Two portals, one workspace"
          title="The right tools for whoever's holding the phone"
        />
        <div className="grid md:grid-cols-2 gap-6 mt-14">
          {[
            {
              icon: "building",
              title: "For owners & admins",
              iconClass: "bg-ink text-brand-500",
              items: [
                "Dashboard across every warehouse",
                "Approve, edit or deny requests",
                "Daily opening & closing stock report",
                "Excel upload and export",
                "Manage employees and their access",
              ],
            },
            {
              icon: "user",
              title: "For your team",
              iconClass: "bg-accent-500 text-ink",
              items: [
                "Record received stock, sales and moves",
                "Add the party name and date to each entry",
                "Fix a request while it's still pending",
                "See which requests were approved or denied",
                "Simple screens built for a phone",
              ],
            },
          ].map((portal) => (
            <div key={portal.title} className="rounded-2xl border border-line bg-white p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${portal.iconClass}`}>
                  <Icon path={ICONS[portal.icon]} />
                </span>
                <h3 className="font-display font-bold text-xl">{portal.title}</h3>
              </div>
              <ul className="mt-6 space-y-3">
                {portal.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-ink/70">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-accent-50 text-accent-700 flex items-center justify-center shrink-0">
                      <Icon path={ICONS.check} className="w-3 h-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Trust row */}
      <section className="border-y border-line bg-white">
        <div className="page-container py-10 grid sm:grid-cols-3 gap-6">
          {[
            ["lock", "Separate workspace per company", "Your data is never mixed with anyone else's."],
            ["phone", "Mobile-first", "Every screen works one-handed on a phone."],
            ["clock", "Nothing is ever lost", "Edits, approvals and deletions are all logged."],
          ].map(([icon, title, body]) => (
            <div key={title} className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-lg bg-paper border border-line flex items-center justify-center text-ink/70 shrink-0">
                <Icon path={ICONS[icon]} className="w-[18px] h-[18px]" />
              </span>
              <div>
                <p className="font-semibold text-ink">{title}</p>
                <p className="text-sm text-ink/55 mt-0.5">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 page-container py-20 sm:py-24">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" center />
        <div className="max-w-3xl mx-auto mt-12 divide-y divide-line border-y border-line">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="w-8 h-8 rounded-full border border-line flex items-center justify-center shrink-0 text-ink/50 transition-transform group-open:rotate-45">
                  <Icon path={ICONS.plus} className="w-4 h-4" />
                </span>
              </summary>
              <p className="text-ink/60 mt-3 pr-12 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="page-container pb-20 sm:pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-14 sm:px-14 sm:py-16 text-center">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand-500/20 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-accent-500/15 blur-3xl" aria-hidden="true" />
          <h2 className="relative font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-paper max-w-2xl mx-auto">
            Stop guessing what's in stock.
          </h2>
          <p className="relative text-paper/60 mt-4 max-w-md mx-auto text-lg">
            Create your workspace, invite your team, and see every movement from today on.
          </p>
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3 mt-9">
            <Link to="/signup" className="btn-primary !px-6 !py-3.5 text-base w-full sm:w-auto">
              Create your free workspace
              <Icon path={ICONS.arrowRight} className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="btn !px-6 !py-3.5 text-base w-full sm:w-auto bg-white/5 text-paper border border-white/15 hover:bg-white/10"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line bg-white">
        <div className="page-container py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo size="sm" />
          <div className="flex items-center gap-6 text-sm text-ink/60">
            <Link to="/login" className="hover:text-ink">Sign in</Link>
            <Link to="/signup" className="hover:text-ink">Create account</Link>
            <a href="https://github.com/Rounakag16/Stock-Tracker" target="_blank" rel="noreferrer" className="hover:text-ink">
              GitHub
            </a>
          </div>
          <p className="text-sm text-ink/40">© {new Date().getFullYear()} Stock Tracker</p>
        </div>
      </footer>
    </div>
  );
}
