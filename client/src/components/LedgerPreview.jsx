import { ACTION_TONES } from "./ui";

// Static sample of the Daily Stock report, used as product imagery on the
// landing and auth pages. The numbers add up: opening + added − sold ± moved = closing.
const ROWS = [
  { name: "Cement OPC 53 · 50 kg", opening: 120, added: 40, sold: 35, moved: -10, closing: 115 },
  { name: "TMT Bar 12 mm", opening: 300, added: 0, sold: 48, moved: 20, closing: 272 },
  { name: "PVC Pipe 1 in · 6 m", opening: 85, added: 50, sold: 22, moved: 0, closing: 113 },
  { name: "Wall Putty · 20 kg", opening: 18, added: 0, sold: 12, moved: 0, closing: 6, low: true },
];

const TOTALS = { opening: 523, added: 90, sold: 117, moved: 10, closing: 506 };

function Num({ value, tone, sign }) {
  if (!value) return <span className="text-slate-300">—</span>;
  const text = sign === "±" ? `${value > 0 ? "+" : "−"}${Math.abs(value)}` : `${sign}${value}`;
  return <span className={`font-semibold ${ACTION_TONES[tone].text}`}>{text}</span>;
}

export function LedgerPreview({ compact = false, className = "" }) {
  const rows = compact ? ROWS.slice(0, 3) : ROWS;
  return (
    <div className={`rounded-2xl bg-white border border-line shadow-xl shadow-slate-900/10 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-line">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Daily stock</p>
          <p className="font-display font-bold text-ink truncate">Main Godown · 14 Nov 2026</p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-xs font-medium text-slate-600">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Excel
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm font-mono tabular-nums">
          <thead>
            <tr className="text-[11px] font-sans font-semibold uppercase tracking-wide text-slate-500 bg-slate-50">
              <th className="text-left px-4 sm:px-5 py-2.5 font-semibold">Item</th>
              <th className="text-right px-2 py-2.5 font-semibold">Open</th>
              <th className="text-right px-2 py-2.5 font-semibold">Added</th>
              <th className="text-right px-2 py-2.5 font-semibold">Sold</th>
              {!compact && <th className="text-right px-2 py-2.5 font-semibold">Moved</th>}
              <th className="text-right px-4 sm:px-5 py-2.5 font-semibold">Close</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.name}>
                <td className="px-4 sm:px-5 py-2.5 font-sans text-ink whitespace-nowrap">{r.name}</td>
                <td className="px-2 py-2.5 text-right text-slate-600">{r.opening}</td>
                <td className="px-2 py-2.5 text-right"><Num value={r.added} tone="added" sign="+" /></td>
                <td className="px-2 py-2.5 text-right"><Num value={r.sold} tone="sale" sign="−" /></td>
                {!compact && <td className="px-2 py-2.5 text-right"><Num value={r.moved} tone="moved" sign="±" /></td>}
                <td className="px-4 sm:px-5 py-2.5 text-right">
                  <span className={`font-bold ${r.low ? "text-amber-700" : "text-brand-700"}`}>{r.closing}</span>
                  {r.low && <span className="ml-1.5 align-middle font-sans text-[10px] font-semibold rounded bg-amber-100 text-amber-800 px-1.5 py-0.5">LOW</span>}
                </td>
              </tr>
            ))}
          </tbody>
          {!compact && (
            <tfoot>
              <tr className="border-t-2 border-line bg-slate-50 font-semibold">
                <td className="px-4 sm:px-5 py-2.5 font-sans text-ink">Total</td>
                <td className="px-2 py-2.5 text-right text-slate-700">{TOTALS.opening}</td>
                <td className="px-2 py-2.5 text-right"><Num value={TOTALS.added} tone="added" sign="+" /></td>
                <td className="px-2 py-2.5 text-right"><Num value={TOTALS.sold} tone="sale" sign="−" /></td>
                <td className="px-2 py-2.5 text-right"><Num value={TOTALS.moved} tone="moved" sign="±" /></td>
                <td className="px-4 sm:px-5 py-2.5 text-right font-bold text-brand-700">{TOTALS.closing}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
