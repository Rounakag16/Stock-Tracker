import { Link } from "react-router-dom";
import { BrandLogo } from "../components/Brand";
import { LedgerPreview } from "../components/LedgerPreview";
import { ACTION_TONES } from "../components/ui";

function Icon({ path, className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={path} />
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
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  arrowRight: "M5 12h14 M13 6l6 6-6 6",
  check: "M5 13l4 4L19 7",
  x: "M6 18L18 6M6 6l12 12",
};

const NAV = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#report", label: "Daily report" },
  { href: "#faq", label: "FAQ" },
];

// Everything listed here is something the app actually does today.
const FEATURES = [
  {
    icon: "shieldCheck",
    title: "Approval before anything changes",
    body: "Employees submit stock added, sales and transfers. Quantities only change once an admin approves — and admins can correct a request in the same step.",
  },
  {
    icon: "warehouse",
    title: "Every warehouse in one place",
    body: "Track quantities per location and move stock between warehouses. Both sides of a transfer are recorded.",
  },
  {
    icon: "calendar",
    title: "Opening & closing stock, any day",
    body: "Pick a date to see opening stock, what was added, sold and moved, and the closing count — per item and in total.",
  },
  {
    icon: "table",
    title: "Excel in, Excel out",
    body: "Upload an .xlsx to add stock in bulk, and export current stock, the daily report or the activity log for your accountant.",
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

const COMPARISON = [
  { row: "Who changed the stock, and when", old: "Whoever wrote last in the register", now: "Every entry has a name, party and date" },
  { row: "Staff entries", old: "Go straight into the book", now: "Wait for admin approval" },
  { row: "Stock at another godown", old: "A phone call", now: "Live, per warehouse" },
  { row: "Yesterday's closing stock", old: "Added up by hand", now: "One click, any day" },
  { row: "Running low", old: "Found out at the counter", now: "Alert at the reorder point" },
];

const STEPS = [
  {
    icon: "phone",
    title: "Staff record it",
    body: "From their phone, an employee picks the item and taps Add, Sale or Move — with quantity, party name and date.",
    sample: (
      <div className="flex gap-2">
        <span className="btn-add !min-h-0 !py-1.5 text-xs flex-1">Add</span>
        <span className="btn-sale !min-h-0 !py-1.5 text-xs flex-1">Sale</span>
        <span className="btn-move !min-h-0 !py-1.5 text-xs flex-1">Move</span>
      </div>
    ),
  },
  {
    icon: "shieldCheck",
    title: "You approve it",
    body: "The request waits for you. Approve it, fix the quantity first, or deny it with a note the employee can see.",
    sample: (
      <div className="flex gap-2">
        <span className="flex-1 text-center rounded-lg border border-line py-1.5 text-xs font-semibold text-slate-600">Deny</span>
        <span className="flex-1 text-center rounded-lg bg-emerald-700 py-1.5 text-xs font-semibold text-white">Approve</span>
      </div>
    ),
  },
  {
    icon: "clock",
    title: "It's on the record",
    body: "Stock updates on the date it happened. The activity log and daily report pick it up automatically.",
    sample: (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-1.5 text-xs">
        <span className={`inline-flex px-2 py-0.5 rounded-md font-semibold ${ACTION_TONES.sale.badge}`}>Sale</span>
        <span className={`font-mono font-semibold ${ACTION_TONES.sale.text}`}>−12</span>
        <span className="text-slate-500">by Ravi</span>
      </div>
    ),
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
  {
    q: "Do my employees need a computer?",
    a: "No. The employee screen is built for phones: find the item, tap Add, Sale or Move, enter the quantity and party, and submit.",
  },
];

// Pending requests as the admin sees them — the hero image.
function RequestsPreview() {
  const requests = [
    { tone: "sale", label: "Sale", item: "Cement OPC 53 · 50 kg", qty: "12 bags", who: "Ravi", party: "Gupta Constructions" },
    { tone: "added", label: "Add", item: "PVC Pipe 1 in · 6 m", qty: "50 pcs", who: "Suresh", party: "Supreme Pipes" },
    { tone: "moved", label: "Move", item: "TMT Bar 12 mm", qty: "20 pcs", who: "Ravi", party: "To City Store" },
  ];
  return (
    <div className="rounded-2xl bg-white border border-line shadow-xl shadow-slate-900/10 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
        <p className="font-display font-bold text-ink">Pending requests</p>
        <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${ACTION_TONES.adjusted.badge}`}>3 waiting</span>
      </div>
      <ul className="divide-y divide-line">
        {requests.map((r) => (
          <li key={r.item} className="px-5 py-4 flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${ACTION_TONES[r.tone].badge}`}>{r.label}</span>
                <span className="font-mono text-sm font-semibold text-ink">{r.qty}</span>
              </div>
              <p className="mt-1 text-sm font-medium text-ink truncate">{r.item}</p>
              <p className="text-xs text-slate-500 truncate">
                {r.who} · {r.party}
              </p>
            </div>
            <div className="hidden sm:flex gap-2 shrink-0">
              <span className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slate-600">Deny</span>
              <span className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white">Approve</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionHeading({ eyebrow, title, body, light = false }) {
  return (
    <div className="max-w-2xl">
      <p className={`text-sm font-semibold ${light ? "text-brand-300" : "text-brand-700"}`}>{eyebrow}</p>
      <h2 className={`mt-2 font-display font-bold text-3xl sm:text-4xl tracking-tight ${light ? "text-white" : "text-ink"}`}>{title}</h2>
      {body && <p className={`mt-4 text-lg leading-relaxed ${light ? "text-slate-300" : "text-slate-600"}`}>{body}</p>}
    </div>
  );
}

function IconTile({ name }) {
  return (
    <span className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
      <Icon path={ICONS[name]} />
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-ink">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <BrandLogo />
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-ink">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to="/login" className="btn-ghost !min-h-0 !py-2 !px-3 whitespace-nowrap max-[359px]:hidden">
              Sign in
            </Link>
            <Link to="/signup" className="btn-primary !min-h-0 !py-2 !px-3.5 whitespace-nowrap">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="bg-paper border-b border-line">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20 lg:py-24 grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-sm font-medium text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600" aria-hidden="true" />
                For shops, godowns & warehouses
              </p>
              <h1 className="mt-6 font-display font-bold text-4xl sm:text-5xl lg:text-[3.4rem] tracking-tight leading-[1.08]">
                Stock records you can trust, at every location.
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl">
                Your team records what came in, what was sold and what moved. You approve it. Stock Tracker keeps the
                count, the history and the opening and closing stock for every day.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/signup" className="btn-primary !px-6 !py-3.5 text-base">
                  Create your workspace
                  <Icon path={ICONS.arrowRight} className="w-4 h-4" />
                </Link>
                <Link to="/login" className="btn-secondary !px-6 !py-3.5 text-base">
                  Sign in
                </Link>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                {["Set up in a minute", "Works on any phone", "Import from Excel"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Icon path={ICONS.check} className="w-4 h-4 text-emerald-700" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative sm:mb-10">
              <RequestsPreview />
              <div className="hidden sm:flex absolute -bottom-14 left-4 lg:-left-6 items-center gap-3 rounded-xl bg-ink text-white px-4 py-3 shadow-xl">
                <span className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center">
                  <Icon path={ICONS.check} className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Approved · stock updated</p>
                  <p className="text-xs text-slate-400 font-mono">Cement OPC 53 · 127 → 115</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Built for */}
        <section className="border-b border-line">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-7 flex flex-col md:flex-row md:items-center gap-4 md:gap-10">
            <p className="text-sm font-semibold text-slate-500 shrink-0">Built for</p>
            <ul className="grid grid-cols-2 md:flex md:flex-1 md:justify-between gap-x-6 gap-y-3 text-sm font-medium text-slate-700">
              {["Hardware & building supplies", "Distributors & wholesalers", "Retail shops", "Godowns & warehouses"].map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
            <SectionHeading
              eyebrow="How it works"
              title="One entry, checked once, recorded for good."
              body="Your staff don't need training. They tap what happened; you decide whether it counts."
            />
            <ol className="mt-12 grid md:grid-cols-3 gap-6">
              {STEPS.map((step, i) => (
                <li key={step.title} className="card p-6 flex flex-col">
                  <div className="flex items-center justify-between">
                    <IconTile name={step.icon} />
                    <span className="font-mono text-sm text-slate-400">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 font-display font-bold text-lg">{step.title}</h3>
                  <p className="mt-2 text-slate-600 leading-relaxed flex-1">{step.body}</p>
                  <div className="mt-6 pt-5 border-t border-line">{step.sample}</div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Comparison */}
        <section className="bg-paper border-y border-line">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24 grid lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
            <SectionHeading
              eyebrow="Why switch"
              title="Retire the register book."
              body="A paper register or a shared spreadsheet works until two people write in it. Then nobody knows which number is right."
            />
            <div className="card overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-[1.2fr_1fr_1fr] text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-line">
                <span className="hidden sm:block px-4 py-3" />
                <span className="px-4 py-3">Register / Excel</span>
                <span className="px-4 py-3 text-brand-700">Stock Tracker</span>
              </div>
              {COMPARISON.map((c) => (
                <div key={c.row} className="grid grid-cols-2 sm:grid-cols-[1.2fr_1fr_1fr] text-sm border-b border-line last:border-0">
                  <span className="col-span-2 sm:col-span-1 px-4 pt-3.5 sm:py-3.5 font-semibold sm:font-medium text-ink">{c.row}</span>
                  <span className="px-4 py-3.5 text-slate-500 flex gap-2">
                    <Icon path={ICONS.x} className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />
                    {c.old}
                  </span>
                  <span className="px-4 py-3.5 text-ink flex gap-2">
                    <Icon path={ICONS.check} className="w-4 h-4 mt-0.5 text-emerald-700 shrink-0" />
                    {c.now}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
            <SectionHeading eyebrow="Features" title="Everything a stock book should do." />
            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-line rounded-2xl overflow-hidden">
              {FEATURES.map((f) => (
                <div key={f.title} className="p-6 sm:p-7 border-r border-b border-line bg-white">
                  <IconTile name={f.icon} />
                  <h3 className="mt-5 font-display font-bold text-lg">{f.title}</h3>
                  <p className="mt-2 text-slate-600 leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Daily report spotlight */}
        <section id="report" className="scroll-mt-16 bg-ink text-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24 grid lg:grid-cols-[1fr_1.25fr] gap-12 items-center">
            <div>
              <SectionHeading
                light
                eyebrow="Daily stock report"
                title="Opening to closing, for any day."
                body="Choose a date and a warehouse. See where every item started, what was added, sold and moved, and where it ended — then download it as Excel."
              />
              <ul className="mt-8 space-y-3 text-slate-300">
                {["Backdated entries land on the right day", "Filter by warehouse, item or action", "Totals that always add up"].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <Icon path={ICONS.check} className="w-5 h-5 mt-0.5 text-brand-400 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <LedgerPreview className="shadow-2xl shadow-black/40 border-slate-700" />
          </div>
        </section>

        {/* Portals */}
        <section>
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
            <SectionHeading eyebrow="Two portals" title="The right screen for each person." />
            <div className="mt-12 grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: "shieldCheck",
                  title: "Admin",
                  body: "For the owner or manager.",
                  points: ["Approve, edit or deny requests", "Stock, warehouses, tags and team", "Daily report, logs and Excel export", "Low-stock alerts"],
                },
                {
                  icon: "user",
                  title: "Employee",
                  body: "For counter and godown staff, on their phone.",
                  points: ["Search items across warehouses", "Record stock added, sales and moves", "Edit a request while it's pending", "See what was approved or denied"],
                },
              ].map((p) => (
                <div key={p.title} className="card p-7">
                  <div className="flex items-center gap-3">
                    <IconTile name={p.icon} />
                    <div>
                      <h3 className="font-display font-bold text-lg">{p.title}</h3>
                      <p className="text-sm text-slate-500">{p.body}</p>
                    </div>
                  </div>
                  <ul className="mt-6 grid sm:grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-slate-700">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2">
                        <Icon path={ICONS.check} className="w-4 h-4 mt-0.5 text-emerald-700 shrink-0" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-16 bg-paper border-t border-line">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24 grid lg:grid-cols-[1fr_1.6fr] gap-12">
            <SectionHeading eyebrow="FAQ" title="Common questions" />
            <div className="card divide-y divide-line">
              {FAQS.map((f) => (
                <details key={f.q} className="group px-5 sm:px-6 py-5">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-ink [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <svg className="w-5 h-5 text-slate-400 shrink-0 transition-transform group-open:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" />
                    </svg>
                  </summary>
                  <p className="mt-3 text-slate-600 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-line">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
            <div className="rounded-2xl bg-brand-600 text-white px-6 py-12 sm:px-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div>
                <h2 className="font-display font-bold text-3xl tracking-tight">Start your stock book today.</h2>
                <p className="mt-2 text-brand-50 text-lg">Create a workspace, add your items and invite your team.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Link to="/signup" className="btn bg-white text-brand-700 hover:bg-brand-50 !px-6 !py-3.5 text-base">
                  Create your workspace
                </Link>
                <Link to="/login" className="btn border border-white/40 text-white hover:bg-white/10 !px-6 !py-3.5 text-base">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <BrandLogo size="sm" />
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-ink">
                {n.label}
              </a>
            ))}
            <Link to="/login" className="hover:text-ink">
              Sign in
            </Link>
          </nav>
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} Stock Tracker</p>
        </div>
      </footer>
    </div>
  );
}
