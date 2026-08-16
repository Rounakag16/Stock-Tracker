import { useEffect, useState, useCallback } from "react";
import { LoadingSpinner, EmptyState, ActionLabel, Alert, LOG_ACTION_OPTIONS } from "../components/ui";
import { get } from "../lib/api";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedActions, setSelectedActions] = useState([]);

  const [error, setError] = useState("");

  function buildQuery(currentOffset) {
    const params = new URLSearchParams();
    params.set("limit", limit);
    params.set("offset", currentOffset);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (selectedActions.length > 0) params.set("actions", selectedActions.join(","));
    return params.toString();
  }

  const loadData = useCallback(
    async (currentOffset) => {
      setLoading(true);
      const { ok, data } = await get(`/logs?${buildQuery(currentOffset)}`);

      if (!ok) {
        setError(data.error || "Could not load logs");
        setLoading(false);
        return;
      }

      setError("");
      if (currentOffset === 0) {
        setLogs(data.logs || []);
      } else {
        setLogs((prev) => [...prev, ...(data.logs || [])]);
      }
      setTotal(data.total || 0);
      setLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startDate, endDate, selectedActions]
  );

  useEffect(() => {
    setOffset(0);
    loadData(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, selectedActions]);

  function loadMore() {
    const newOffset = offset + limit;
    setOffset(newOffset);
    loadData(newOffset);
  }

  function toggleAction(value) {
    setSelectedActions((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
    );
  }

  function clearFilters() {
    setStartDate("");
    setEndDate("");
    setSelectedActions([]);
  }

  function handleExport() {
    window.location.href = `/api/logs/export?${buildQuery(0)}`;
  }

  const hasActiveFilters = startDate || endDate || selectedActions.length > 0;

  if (loading && logs.length === 0 && !hasActiveFilters) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div className="admin-page-header flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Activity Logs</h1>
          <p className="text-slate-500 mt-1">{total} matching entries</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary text-sm">
            Filters{hasActiveFilters ? ` (${selectedActions.length + (startDate ? 1 : 0) + (endDate ? 1 : 0)})` : ""}
          </button>
          <button onClick={handleExport} className="btn-primary text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export to Excel
          </button>
        </div>
      </div>

      {error && <div className="mb-4"><Alert type="error" message={error} onDismiss={() => setError("")} /></div>}

      {showFilters && (
        <div className="card p-4 sm:p-5 mb-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">From date</label>
              <input
                type="date"
                className="input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min="2000-01-01"
                max="2100-12-31"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">To date</label>
              <input
                type="date"
                className="input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min="2000-01-01"
                max="2100-12-31"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Action type</label>
            <div className="flex flex-wrap gap-2">
              {LOG_ACTION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleAction(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    selectedActions.includes(opt.value)
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white text-slate-600 border-line hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-sm font-medium text-slate-500 hover:text-slate-700">
              Clear all filters
            </button>
          )}
        </div>
      )}

      {logs.length === 0 && !loading ? (
        <EmptyState
          title={hasActiveFilters ? "No matching activity" : "No activity logs"}
          description={hasActiveFilters ? "Try widening your date range or action filters" : "Actions by employees and admins will appear here"}
        />
      ) : (
        <>
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-slate-900">{log.username}</span>
                      <ActionLabel action={log.action} />
                    </div>
                    <p className="text-sm font-medium text-slate-800">{log.item_name}</p>
                    {log.warehouse_name && <p className="text-xs text-slate-500 mt-0.5">{log.warehouse_name}</p>}
                    {log.details && <p className="text-sm text-slate-600 mt-1">{log.details}</p>}
                    {(log.quantity_before != null || log.quantity_after != null) && (
                      <p className="text-xs text-slate-500 mt-1 font-mono">
                        {log.quantity_before != null && `Before: ${log.quantity_before}`}
                        {log.quantity_before != null && log.quantity_after != null && " → "}
                        {log.quantity_after != null && `After: ${log.quantity_after}`}
                        {log.quantity_change != null && (
                          <span className={log.quantity_change > 0 ? " text-emerald-600 font-medium" : " text-red-600 font-medium"}>
                            {" "}({log.quantity_change > 0 ? "+" : ""}{log.quantity_change})
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <time className="text-xs text-slate-400 shrink-0 text-right font-mono">
                    {new Date(log.created_at).toLocaleString()}
                  </time>
                </div>
              </div>
            ))}
          </div>

          {logs.length < total && (
            <div className="mt-6 text-center">
              <button onClick={loadMore} className="btn-secondary" disabled={loading}>
                {loading ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
