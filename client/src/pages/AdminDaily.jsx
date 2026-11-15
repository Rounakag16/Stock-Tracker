import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  LoadingSpinner,
  EmptyState,
  ActionLabel,
  Alert,
  todayKey,
  shiftDateKey,
  formatDateKey,
  LOG_ACTION_OPTIONS,
} from "../components/ui";
import { get, download } from "../lib/api";

// Movement columns, in display order. "removed" (stock lost when an item or
// warehouse was deleted) only shows up when that day actually had some.
const MOVEMENT_COLUMNS = [
  { key: "added", label: "Added", sign: "+", color: "text-emerald-700" },
  { key: "sold", label: "Sold", sign: "−", color: "text-orange-700" },
  { key: "movedIn", label: "Moved In", sign: "+", color: "text-indigo-700" },
  { key: "movedOut", label: "Moved Out", sign: "−", color: "text-purple-700" },
  { key: "adjusted", label: "Adjusted", sign: "±", color: "text-amber-700" },
  { key: "removed", label: "Removed", sign: "−", color: "text-red-700" },
];

function Movement({ value, sign, color }) {
  if (!value) return <span className="text-slate-300">—</span>;
  const text = sign === "±" ? `${value > 0 ? "+" : "−"}${Math.abs(value)}` : `${sign}${value}`;
  return <span className={`font-mono tabular-nums font-semibold ${color}`}>{text}</span>;
}

function StatCard({ label, value, color = "text-slate-900", sub }) {
  return (
    <div className="stat-card">
      <p className="text-xs sm:text-sm text-slate-500 font-medium">{label}</p>
      <p className={`text-2xl sm:text-3xl font-mono font-bold mt-1 tabular-nums ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminDailyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const today = todayKey();
  const date = searchParams.get("date") || today;

  const [report, setReport] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [itemFilter, setItemFilter] = useState(null); // {item_id, name} to narrow the day's logs
  const [logAction, setLogAction] = useState("");

  useEffect(() => {
    get("/warehouses").then(({ data }) => setWarehouses(data.warehouses || []));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ date });
      if (warehouseId) params.set("warehouseId", warehouseId);
      const { ok, data } = await get(`/reports/day?${params}`);
      if (cancelled) return;
      if (!ok) {
        setError(data.error || "Could not load the report");
        setReport(null);
      } else {
        setReport(data);
      }
      setLoading(false);
    }
    load();
    setItemFilter(null);
    setLogAction("");
    return () => {
      cancelled = true;
    };
  }, [date, warehouseId]);

  function goTo(newDate) {
    if (!newDate) return;
    setSearchParams(newDate === today ? {} : { date: newDate });
  }

  const items = useMemo(() => {
    if (!report) return [];
    const q = search.trim().toLowerCase();
    return report.items.filter(
      (i) => (!activeOnly || i.has_activity) && (!q || i.name.toLowerCase().includes(q))
    );
  }, [report, search, activeOnly]);

  const visibleColumns = MOVEMENT_COLUMNS.filter((c) => c.key !== "removed" || report?.totals.removed);

  const logs = useMemo(() => {
    if (!report) return [];
    return report.logs.filter(
      (l) =>
        (!itemFilter || String(l.item_id) === String(itemFilter.item_id)) &&
        (!logAction || l.action === logAction)
    );
  }, [report, itemFilter, logAction]);

  const actionsToday = useMemo(
    () => (report ? [...new Set(report.logs.map((l) => l.action))] : []),
    [report]
  );

  const totals = report?.totals;
  const isToday = date === today;

  function exportDayLogs() {
    const params = new URLSearchParams({ startDate: date, endDate: date });
    if (warehouseId) params.set("warehouseId", warehouseId);
    download(`/logs/export?${params}`, `activity-logs-${date}.xlsx`).then((r) => !r.ok && setError(r.error));
  }

  return (
    <div className="page-container">
      <div className="admin-page-header flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Daily Stock</h1>
          <p className="text-slate-500 mt-1">
            Opening and closing stock for {formatDateKey(date)}
            {isToday && " (today)"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => goTo(shiftDateKey(date, -1))} className="btn-secondary px-3" aria-label="Previous day">
            ◀
          </button>
          <input
            type="date"
            className="input w-auto"
            value={date}
            max={today}
            onChange={(e) => goTo(e.target.value)}
          />
          <button
            onClick={() => goTo(shiftDateKey(date, 1))}
            className="btn-secondary px-3"
            disabled={date >= today}
            aria-label="Next day"
          >
            ▶
          </button>
          {!isToday && (
            <button onClick={() => goTo(today)} className="btn-ghost">
              Today
            </button>
          )}
          <select className="select w-auto" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
            <option value="">All warehouses</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>{wh.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="mb-4"><Alert type="error" message={error} onDismiss={() => setError("")} /></div>}

      {loading && !report ? (
        <LoadingSpinner />
      ) : report ? (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
            <StatCard label="Opening Stock" value={totals.opening} sub="start of day" />
            <StatCard label="Added" value={`+${totals.added}`} color="text-emerald-700" />
            <StatCard label="Sold" value={`−${totals.sold}`} color="text-orange-700" />
            <StatCard
              label="Moved"
              value={`${totals.movedIn}/${totals.movedOut}`}
              color="text-purple-700"
              sub="in / out"
            />
            <StatCard
              label="Adjusted"
              value={`${totals.adjusted > 0 ? "+" : totals.adjusted < 0 ? "−" : ""}${Math.abs(totals.adjusted)}`}
              color="text-amber-700"
              sub={totals.removed ? `${totals.removed} removed` : "count corrections"}
            />
            <StatCard label="Closing Stock" value={totals.closing} color="text-brand-600" sub="end of day" />
          </div>

          <div className="card mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-line">
              <h2 className="font-bold text-slate-900 flex-1">Items</h2>
              <input
                type="search"
                className="input sm:w-56"
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <label className="flex items-center gap-2 text-sm text-slate-600 whitespace-nowrap">
                <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
                Only with activity
              </label>
            </div>

            {items.length === 0 ? (
              <EmptyState
                title="No items"
                description={activeOnly ? "Nothing was added, sold or moved on this day" : "No stock on this day"}
              />
            ) : (
              <>
                {/* Mobile cards */}
                <div className="lg:hidden divide-y divide-line">
                  {items.map((i) => (
                    <button
                      key={`${i.item_id}-${i.warehouse_id}-${i.name}`}
                      onClick={() => setItemFilter(i.item_id ? { item_id: i.item_id, name: i.name } : null)}
                      className="w-full text-left p-4 hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {i.name}
                            {i.deleted && <span className="ml-2 text-xs font-medium text-red-600">deleted</span>}
                          </p>
                          <p className="text-xs text-slate-500">{i.warehouse_name}</p>
                        </div>
                        <p className="text-sm font-mono tabular-nums shrink-0">
                          {i.opening} → <strong>{i.closing}</strong>
                        </p>
                      </div>
                      {i.has_activity && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
                          {visibleColumns.filter((c) => i[c.key]).map((c) => (
                            <span key={c.key}>
                              <span className="text-slate-500">{c.label}: </span>
                              <Movement value={i[c.key]} sign={c.sign} color={c.color} />
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-line">
                        <th className="px-5 py-3 font-semibold">Item</th>
                        <th className="px-5 py-3 font-semibold">Warehouse</th>
                        <th className="px-5 py-3 font-semibold text-right">Opening</th>
                        {visibleColumns.map((c) => (
                          <th key={c.key} className="px-5 py-3 font-semibold text-right">{c.label}</th>
                        ))}
                        <th className="px-5 py-3 font-semibold text-right">Closing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {items.map((i) => {
                        const selected = itemFilter && String(itemFilter.item_id) === String(i.item_id);
                        return (
                          <tr
                            key={`${i.item_id}-${i.warehouse_id}-${i.name}`}
                            onClick={() => setItemFilter(i.item_id ? { item_id: i.item_id, name: i.name } : null)}
                            className={`cursor-pointer ${selected ? "bg-brand-50" : "hover:bg-slate-50"}`}
                            title="Show this item's entries for the day"
                          >
                            <td className="px-5 py-3 font-medium text-slate-900">
                              {i.name}
                              {i.deleted && <span className="ml-2 text-xs font-medium text-red-600">deleted</span>}
                            </td>
                            <td className="px-5 py-3 text-slate-600">{i.warehouse_name}</td>
                            <td className="px-5 py-3 text-right font-mono tabular-nums">{i.opening}</td>
                            {visibleColumns.map((c) => (
                              <td key={c.key} className="px-5 py-3 text-right">
                                <Movement value={i[c.key]} sign={c.sign} color={c.color} />
                              </td>
                            ))}
                            <td className="px-5 py-3 text-right font-mono tabular-nums font-bold">{i.closing}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-line">
              <div className="flex-1">
                <h2 className="font-bold text-slate-900">Entries on {formatDateKey(date)}</h2>
                {itemFilter && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Showing {itemFilter.name} only ·{" "}
                    <button onClick={() => setItemFilter(null)} className="underline">show all</button>
                  </p>
                )}
              </div>
              {actionsToday.length > 1 && (
                <select className="select sm:w-48" value={logAction} onChange={(e) => setLogAction(e.target.value)}>
                  <option value="">All actions</option>
                  {actionsToday.map((a) => (
                    <option key={a} value={a}>{LOG_ACTION_OPTIONS.find((o) => o.value === a)?.label || a}</option>
                  ))}
                </select>
              )}
              <button onClick={exportDayLogs} className="btn-secondary text-sm" disabled={report.logs.length === 0}>
                Export day
              </button>
            </div>

            {logs.length === 0 ? (
              <EmptyState title="No entries" description="Nothing was recorded for this day" />
            ) : (
              <div className="divide-y divide-line">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <ActionLabel action={log.action} />
                        <span className="font-medium text-slate-900">{log.item_name}</span>
                        {log.warehouse_name && <span className="text-xs text-slate-500">· {log.warehouse_name}</span>}
                      </div>
                      {log.details && <p className="text-sm text-slate-600">{log.details}</p>}
                      <p className="text-xs text-slate-400 mt-1">
                        by {log.username}
                        {log.party_name && ` · Party: ${log.party_name}`}
                        {" · recorded "}
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                    {log.quantity_change != null && (
                      <div className="text-right shrink-0">
                        <p className={`font-mono font-bold tabular-nums ${log.quantity_change >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                          {log.quantity_change > 0 ? "+" : ""}{log.quantity_change}
                        </p>
                        {log.quantity_before != null && log.quantity_after != null && (
                          <p className="text-xs text-slate-400 font-mono">{log.quantity_before} → {log.quantity_after}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
