import { useEffect, useState, useCallback } from "react";
import { Modal, Alert, LoadingSpinner, EmptyState } from "../components/ui";
import { get, post, del } from "../lib/api";

export default function AdminWarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    const { data } = await get("/warehouses");
    setWarehouses(data.warehouses || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { ok, data } = await post("/warehouses", { name: newName });
    setSubmitting(false);

    if (!ok) {
      setError(data.error);
      return;
    }

    setSuccess("Warehouse created");
    setShowAdd(false);
    setNewName("");
    loadData();
  }

  async function handleDelete(warehouse) {
    if (!confirm(`Delete "${warehouse.name}" and all its stock? This cannot be undone.`)) return;
    const { ok } = await del(`/warehouses/${warehouse.id}`);
    if (ok) {
      setSuccess("Warehouse deleted");
      loadData();
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="page-container">
        <div className="admin-page-header flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Warehouses</h1>
            <p className="text-slate-500 mt-1">{warehouses.length} locations</p>
          </div>
          <button onClick={() => { setShowAdd(true); setError(""); }} className="btn-primary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Warehouse
          </button>
        </div>

        {success && <div className="mb-4"><Alert type="success" message={success} onDismiss={() => setSuccess("")} /></div>}

        {warehouses.length === 0 ? (
          <EmptyState title="No warehouses" description="Create your first warehouse to start tracking stock" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {warehouses.map((wh) => (
              <div key={wh.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{wh.name}</h3>
                      <p className="text-xs text-slate-500">
                        Created {new Date(wh.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDelete(wh)} className="btn-danger w-full mt-4 text-sm">
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Warehouse">
        <form onSubmit={handleAdd} className="space-y-4">
          {error && <Alert type="error" message={error} />}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Warehouse Name</label>
            <input
              className="input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. North Depot"
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? "Creating..." : "Create Warehouse"}
          </button>
        </form>
      </Modal>
    </>
  );
}
