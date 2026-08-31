import { useEffect, useState, useCallback } from "react";
import { Modal, Alert, LoadingSpinner, EmptyState, QuantityBadge } from "../components/ui";
import { get, post, del } from "../lib/api";

export default function AdminStockPage() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterWarehouse, setFilterWarehouse] = useState("");
  const [search, setSearch] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [newName, setNewName] = useState("");
  const [newParty, setNewParty] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newWarehouse, setNewWarehouse] = useState("");

  const [adjustType, setAdjustType] = useState("add");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustParty, setAdjustParty] = useState("");

  const [moveTo, setMoveTo] = useState("");
  const [moveQty, setMoveQty] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    const [stockRes, whRes] = await Promise.all([get("/stock"), get("/warehouses")]);
    setItems(stockRes.data.items || []);
    setWarehouses(whRes.data.warehouses || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = items.filter((item) => {
    const matchWarehouse = !filterWarehouse || String(item.warehouse_id) === filterWarehouse;
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.party_name?.toLowerCase().includes(search.toLowerCase());
    return matchWarehouse && matchSearch;
  });

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { ok, data } = await post("/stock", {
      warehouseId: newWarehouse,
      name: newName,
      quantity: parseInt(newQty, 10) || 0,
      partyName: newParty,
    });
    setSubmitting(false);

    if (!ok) {
      setError(data.error);
      return;
    }

    setSuccess("Item added successfully");
    setShowAdd(false);
    setNewName("");
    setNewParty("");
    setNewQty("");
    loadData();
  }

  async function handleDelete(item) {
    if (!confirm(`Delete "${item.name}" from ${item.warehouse_name}?`)) return;
    const { ok } = await del(`/stock/${item.id}`);
    if (ok) {
      setSuccess("Item deleted");
      loadData();
    }
  }

  function openAdjust(item, type) {
    setSelectedItem(item);
    setAdjustType(type);
    setAdjustAmount("");
    setAdjustParty(item.party_name || "");
    setError("");
    setShowAdjust(true);
  }

  async function handleAdjust(e) {
    e.preventDefault();
    if (!selectedItem) return;
    setError("");
    setSubmitting(true);

    const { ok, data } = await post("/stock/adjust", {
      itemId: selectedItem.id,
      amount: parseInt(adjustAmount, 10),
      type: adjustType,
      partyName: adjustParty,
    });
    setSubmitting(false);

    if (!ok) {
      setError(data.error);
      return;
    }

    setSuccess(adjustType === "add" ? "Stock added" : "Sale recorded");
    setShowAdjust(false);
    setSelectedItem(null);
    setAdjustAmount("");
    setAdjustParty("");
    loadData();
  }

  async function handleMove(e) {
    e.preventDefault();
    if (!selectedItem) return;
    setError("");
    setSubmitting(true);

    const { ok, data } = await post("/stock/transfer", {
      itemId: selectedItem.id,
      fromWarehouseId: selectedItem.warehouse_id,
      toWarehouseId: moveTo,
      quantity: parseInt(moveQty, 10),
    });
    setSubmitting(false);

    if (!ok) {
      setError(data.error);
      return;
    }

    setSuccess("Move completed");
    setShowMove(false);
    setSelectedItem(null);
    setMoveTo("");
    setMoveQty("");
    loadData();
  }

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="page-container">
        <div className="admin-page-header flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Stock Management</h1>
            <p className="text-slate-500 mt-1">{filtered.length} items</p>
          </div>
          <button onClick={() => { setShowAdd(true); setError(""); }} className="btn-primary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Item
          </button>
        </div>

        {success && <div className="mb-4"><Alert type="success" message={success} onDismiss={() => setSuccess("")} /></div>}

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="search"
            className="input flex-1"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="select sm:w-48" value={filterWarehouse} onChange={(e) => setFilterWarehouse(e.target.value)}>
            <option value="">All warehouses</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>{wh.name}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No stock items" description="Add your first item to get started" />
        ) : (
          <>
            <div className="space-y-3 lg:hidden">
              {filtered.map((item) => (
                <div key={item.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{item.name}</h3>
                      {item.party_name && <p className="text-xs text-slate-500">Party: {item.party_name}</p>}
                      <p className="text-sm text-slate-500">{item.warehouse_name}</p>
                    </div>
                    <QuantityBadge quantity={item.quantity} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <button onClick={() => openAdjust(item, "add")} className="btn-secondary text-xs px-1">
                      Add
                    </button>
                    <button
                      onClick={() => openAdjust(item, "deduct")}
                      className="btn-secondary text-xs px-1"
                      disabled={item.quantity === 0}
                    >
                      Sale
                    </button>
                    <button onClick={() => { setSelectedItem(item); setShowMove(true); setError(""); }} className="btn-secondary text-xs px-1">
                      Move
                    </button>
                  </div>
                  <button onClick={() => handleDelete(item)} className="btn-danger w-full text-xs mt-2">Delete</button>
                </div>
              ))}
            </div>

            <div className="hidden lg:block card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Item</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Party</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Warehouse</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Quantity</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4 font-medium text-slate-900">{item.name}</td>
                      <td className="px-5 py-4 text-slate-600">{item.party_name || "—"}</td>
                      <td className="px-5 py-4 text-slate-600">{item.warehouse_name}</td>
                      <td className="px-5 py-4"><QuantityBadge quantity={item.quantity} /></td>
                      <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                        <button onClick={() => openAdjust(item, "add")} className="btn-secondary text-xs py-2 min-h-0">
                          Add
                        </button>
                        <button
                          onClick={() => openAdjust(item, "deduct")}
                          className="btn-secondary text-xs py-2 min-h-0"
                          disabled={item.quantity === 0}
                        >
                          Sale
                        </button>
                        <button onClick={() => { setSelectedItem(item); setShowMove(true); setError(""); }} className="btn-secondary text-xs py-2 min-h-0">
                          Move
                        </button>
                        <button onClick={() => handleDelete(item)} className="btn-danger text-xs py-2 min-h-0">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Stock Item">
        <form onSubmit={handleAdd} className="space-y-4">
          {error && <Alert type="error" message={error} />}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Warehouse</label>
            <select className="select" value={newWarehouse} onChange={(e) => setNewWarehouse(e.target.value)} required>
              <option value="">Select warehouse</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Item Name</label>
            <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Unique name per warehouse" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Party Name</label>
            <input className="input" value={newParty} onChange={(e) => setNewParty(e.target.value)} placeholder="Customer or supplier (optional)" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Initial Quantity</label>
            <input type="number" min="0" className="input" value={newQty} onChange={(e) => setNewQty(e.target.value)} placeholder="0" />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? "Adding..." : "Add Item"}
          </button>
        </form>
      </Modal>

      <Modal
        open={showAdjust}
        onClose={() => setShowAdjust(false)}
        title={adjustType === "add" ? "Add Stock" : "Record Sale"}
      >
        {selectedItem && (
          <form onSubmit={handleAdjust} className="space-y-4">
            {error && <Alert type="error" message={error} />}
            <div className="p-3 rounded-xl bg-slate-50 text-sm">
              <p><span className="text-slate-500">Item:</span> <strong>{selectedItem.name}</strong></p>
              <p><span className="text-slate-500">Warehouse:</span> {selectedItem.warehouse_name}</p>
              <p><span className="text-slate-500">Current stock:</span> <span className="font-mono">{selectedItem.quantity}</span></p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100">
              <button
                type="button"
                onClick={() => setAdjustType("add")}
                className={`rounded-lg py-2 text-sm font-semibold transition-colors ${adjustType === "add" ? "bg-white shadow-sm text-emerald-700" : "text-slate-500"}`}
              >
                Add Stock
              </button>
              <button
                type="button"
                onClick={() => setAdjustType("deduct")}
                className={`rounded-lg py-2 text-sm font-semibold transition-colors ${adjustType === "deduct" ? "bg-white shadow-sm text-red-700" : "text-slate-500"}`}
              >
                Record Sale
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Party Name</label>
              <input
                className="input"
                value={adjustParty}
                onChange={(e) => setAdjustParty(e.target.value)}
                placeholder="Customer or supplier (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantity</label>
              <input
                type="number"
                min="1"
                max={adjustType === "deduct" ? selectedItem.quantity : undefined}
                className="input text-lg text-center font-mono font-bold"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                required
                autoFocus
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? "Saving..." : adjustType === "add" ? "Add Stock" : "Record Sale"}
            </button>
          </form>
        )}
      </Modal>

      <Modal open={showMove} onClose={() => setShowMove(false)} title="Move Stock">
        {selectedItem && (
          <form onSubmit={handleMove} className="space-y-4">
            {error && <Alert type="error" message={error} />}
            <div className="p-3 rounded-xl bg-slate-50 text-sm">
              <p><span className="text-slate-500">Item:</span> <strong>{selectedItem.name}</strong></p>
              <p><span className="text-slate-500">From:</span> {selectedItem.warehouse_name}</p>
              <p><span className="text-slate-500">Available:</span> {selectedItem.quantity}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">To Warehouse</label>
              <select className="select" value={moveTo} onChange={(e) => setMoveTo(e.target.value)} required>
                <option value="">Select destination</option>
                {warehouses.filter((wh) => String(wh.id) !== String(selectedItem.warehouse_id)).map((wh) => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantity</label>
              <input type="number" min="1" max={selectedItem.quantity} className="input" value={moveQty} onChange={(e) => setMoveQty(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? "Moving..." : "Move Stock"}
            </button>
          </form>
        )}
      </Modal>
    </>
  );
}
