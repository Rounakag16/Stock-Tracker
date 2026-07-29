import { useEffect, useState, useCallback } from "react";
import { LoadingSpinner, EmptyState, ActionLabel } from "../components/ui";
import { get } from "../lib/api";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const loadData = useCallback(async (currentOffset) => {
    setLoading(true);
    const { data } = await get(`/logs?limit=${limit}&offset=${currentOffset}`);

    if (currentOffset === 0) {
      setLogs(data.logs || []);
    } else {
      setLogs((prev) => [...prev, ...(data.logs || [])]);
    }
    setTotal(data.total || 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData(0);
  }, [loadData]);

  function loadMore() {
    const newOffset = offset + limit;
    setOffset(newOffset);
    loadData(newOffset);
  }

  if (loading && logs.length === 0) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div className="admin-page-header">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Activity Logs</h1>
        <p className="text-slate-500 mt-1">{total} total entries</p>
      </div>

      {logs.length === 0 ? (
        <EmptyState title="No activity logs" description="Actions by employees and admins will appear here" />
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
                      <p className="text-xs text-slate-500 mt-1">
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
                  <time className="text-xs text-slate-400 shrink-0 text-right">
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
