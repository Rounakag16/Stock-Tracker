import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LoadingSpinner, ActionLabel } from "../components/ui";
import { get } from "../lib/api";

function ActivityRow({ log }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-slate-900">{log.username}</span>
          <ActionLabel action={log.action} />
        </div>
        <p className="text-sm text-slate-600 mt-0.5">
          {log.item_name}
          {log.warehouse_name && ` · ${log.warehouse_name}`}
          {log.quantity_change != null && (
            <span className={log.quantity_change > 0 ? " text-emerald-600" : " text-red-600"}>
              {" "}({log.quantity_change > 0 ? "+" : ""}{log.quantity_change})
            </span>
          )}
        </p>
      </div>
      <time className="text-xs text-slate-400 shrink-0">
        {new Date(log.created_at).toLocaleString()}
      </time>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get("/dashboard").then(({ data }) => {
      setStats(data.stats);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div className="admin-page-header">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your inventory</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 mb-6 lg:mb-8">
        <div className="stat-card">
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Total Items</p>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mt-1 tabular-nums">
            {stats?.totalItems ?? 0}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Total Quantity</p>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-600 mt-1 tabular-nums">
            {stats?.totalQuantity ?? 0}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Warehouses</p>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mt-1 tabular-nums">
            {stats?.warehouseCount ?? 0}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Low Stock</p>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-600 mt-1 tabular-nums">
            {stats?.lowStock?.length ?? 0}
          </p>
        </div>
        <Link to="/admin/requests" className="stat-card hover:border-brand-300 transition-colors block">
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Pending Requests</p>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-600 mt-1 tabular-nums">
            {stats?.pendingRequests ?? 0}
          </p>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 lg:mb-8">
        <div className="card p-4 sm:p-5 lg:p-6">
          <h2 className="font-bold text-slate-900 mb-4">By Warehouse</h2>
          {stats?.byWarehouse && stats.byWarehouse.length > 0 ? (
            <div className="space-y-2">
              {stats.byWarehouse.map((wh) => (
                <div key={wh.name} className="flex items-center justify-between p-3 lg:p-4 rounded-xl bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-900">{wh.name}</p>
                    <p className="text-xs text-slate-500">{wh.item_count} items</p>
                  </div>
                  <p className="text-lg lg:text-xl font-bold text-brand-600 tabular-nums">{wh.total_qty}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No warehouses yet</p>
          )}
        </div>

        <div className="card p-4 sm:p-5 lg:p-6">
          <h2 className="font-bold text-slate-900 mb-4">Low Stock Alerts</h2>
          {stats?.lowStock && stats.lowStock.length > 0 ? (
            <div className="space-y-2">
              {stats.lowStock.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 lg:p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <div>
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.warehouse_name}</p>
                  </div>
                  <span className="font-bold text-amber-700 tabular-nums">{item.quantity}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">All items are well stocked</p>
          )}
        </div>
      </div>

      <div className="card p-4 sm:p-5 lg:p-6">
        <h2 className="font-bold text-slate-900 mb-4">Recent Activity</h2>
        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <>
            <div className="space-y-2 lg:hidden">
              {stats.recentActivity.map((log) => (
                <ActivityRow key={log.id} log={log} />
              ))}
            </div>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="pb-3 pr-4 font-semibold text-slate-500">User</th>
                    <th className="pb-3 pr-4 font-semibold text-slate-500">Action</th>
                    <th className="pb-3 pr-4 font-semibold text-slate-500">Item</th>
                    <th className="pb-3 pr-4 font-semibold text-slate-500">Change</th>
                    <th className="pb-3 font-semibold text-slate-500 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.recentActivity.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="py-3 pr-4 font-medium text-slate-900 whitespace-nowrap">{log.username}</td>
                      <td className="py-3 pr-4"><ActionLabel action={log.action} /></td>
                      <td className="py-3 pr-4 text-slate-600">
                        {log.item_name}
                        {log.warehouse_name && <span className="text-slate-400"> · {log.warehouse_name}</span>}
                      </td>
                      <td className="py-3 pr-4 tabular-nums">
                        {log.quantity_change != null ? (
                          <span className={log.quantity_change > 0 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                            {log.quantity_change > 0 ? "+" : ""}{log.quantity_change}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 text-slate-400 text-right whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">No activity yet</p>
        )}
      </div>
    </div>
  );
}
