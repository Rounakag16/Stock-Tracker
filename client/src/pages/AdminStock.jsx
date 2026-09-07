import { useEffect, useState, useCallback, useRef } from "react";
import { Modal, Alert, LoadingSpinner, EmptyState, QuantityBadge, ActionLabel } from "../components/ui";
import { get, post, patch, del } from "../lib/api";

// Summary shown before an admin action actually runs — admin actions apply
// immediately with no second approver, so this stands in for that missing
// check. `rows` is a list of {label, value} pairs describing what's about
// to happen.
function ConfirmSummary({ rows, onBack, onConfirm, confirmLabel, submitting, danger }) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
        <p className="text-sm font-semibold text-amber-800 mb-2">Review before saving</p>
        <dl className="space-y-1.5 text-sm">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-3">
              <dt className="text-slate-500">{r.label}</dt>
              <dd className="font-medium text-slate-900 text-right font-mono">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-secondary flex-1" disabled={submitting}>
          Back
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`flex-1 ${danger ? "btn-danger" : "btn-primary"}`}
          disabled={submitting}
        >
          {submitting ? "Saving..." : confirmLabel}
        </button>
      </div>
    </div>
  );
}

export default function AdminStockPage() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterWarehouse, setFilterWarehouse] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [newName, setNewName] = useState("");
  const [newParty, setNewParty] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newThreshold, setNewThreshold] = useState("");
  const [newWarehouse, setNewWarehouse] = useState("");

  const [adjustType, setAdjustType] = useState("add");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustParty, setAdjustParty] = useState("");
  const [adjustStep, setAdjustStep] = useState("form");

  const [moveTo, setMoveTo] = useState("");
  const [moveQty, setMoveQty] = useState("");
  const [moveStep, setMoveStep] = useState("form");

  const [editName, setEditName] = useState("");
  const [editParty, setEditParty] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editThreshold, setEditThreshold] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editStep, setEditStep] = useState("form");

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

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

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))].sort();

  const filtered = items.filter((item) => {
    const matchWarehouse = !filterWarehouse || String(item.warehouse_id) === filterWarehouse;
    const matchCategory = !filterCategory || item.category === filterCategory;
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.party_name?.toLowerCase().includes(search.toLowerCase());
    return matchWarehouse && matchCategory && matchSearch;
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
      category: newCategory,
      lowStockThreshold: newThreshold === "" ? null : newThreshold,
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
    setNewCategory("");
    setNewThreshold("");
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

  // --- Add stock / Record sale ---

  function openAdjust(item, type) {
    setSelectedItem(item);
    setAdjustType(type);
    setAdjustAmount("");
    setAdjustParty(item.party_name || "");
    setAdjustStep("form");
    setError("");
    setShowAdjust(true);
  }

  function reviewAdjust(e) {
    e.preventDefault();
    setError("");
    setAdjustStep("confirm");
  }

  async function confirmAdjust() {
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
      setAdjustStep("form");
      return;
    }

    setSuccess(adjustType === "add" ? "Stock added" : "Sale recorded");
    setShowAdjust(false);
    setSelectedItem(null);
    setAdjustAmount("");
    setAdjustParty("");
    loadData();
  }

  // --- Move stock ---

  function openMove(item) {
    setSelectedItem(item);
    setMoveTo("");
    setMoveQty("");
    setMoveStep("form");
    setError("");
    setShowMove(true);
  }

  function reviewMove(e) {
    e.preventDefault();
    setError("");
    setMoveStep("confirm");
  }

  async function confirmMove() {
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
      setMoveStep("form");
      return;
    }

    setSuccess("Move completed");
    setShowMove(false);
    setSelectedItem(null);
    setMoveTo("");
    setMoveQty("");
    loadData();
  }

  // --- Edit item (name, party, category, threshold, and/or exact quantity) ---

  function openEdit(item) {
    setSelectedItem(item);
    setEditName(item.name);
    setEditParty(item.party_name || "");
    setEditCategory(item.category || "");
    setEditThreshold(item.low_stock_threshold ?? "");
    setEditQty(String(item.quantity));
    setEditStep("form");
    setError("");
    setShowEdit(true);
  }

  function reviewEdit(e) {
    e.preventDefault();
    setError("");
    const qty = parseInt(editQty, 10);
    if (Number.isNaN(qty) || qty < 0) {
      setError("Enter a quantity of zero or more");
      return;
    }
    if (!editName.trim()) {
      setError("Item name is required");
      return;
    }
    setEditStep("confirm");
  }

  async function confirmEdit() {
    if (!selectedItem) return;
    setError("");
    setSubmitting(true);

    const qty = parseInt(editQty, 10);
    const requests = [];

    // Details (name/party/category/threshold) and quantity are two
    // different endpoints server-side — quantity changes always need to be
    // logged distinctly from a details correction, even when both happen
    // in the same "Edit" click here.
    requests.push(
      patch(`/stock/${selectedItem.id}`, {
        name: editName.trim(),
        partyName: editParty,
        category: editCategory,
        lowStockThreshold: editThreshold === "" ? null : editThreshold,
      })
    );
    if (qty !== selectedItem.quantity) {
      requests.push(post("/stock/adjust", { itemId: selectedItem.id, amount: qty, type: "set" }));
    }

    const results = await Promise.all(requests);
    setSubmitting(false);

    const failed = results.find((r) => !r.ok);
    if (failed) {
      setError(failed.data.error);
      setEditStep("form");
      return;
    }

    setSuccess("Item updated");
    setShowEdit(false);
    setSelectedItem(null);
    loadData();
  }

  // --- Per-item history ---

  async function openHistory(item) {
    setSelectedItem(item);
    setShowHistory(true);
    setHistoryLoading(true);
    const { ok, data } = await get(`/logs?itemId=${item.id}`);
    setHistory(ok ? data.logs || [] : []);
    setHistoryLoading(false);
  }

  // --- CSV export / import ---

  function handleExport() {
    window.location.href = "/api/stock/export";
  }

  function openImport() {
    setImportText("");
    setImportResult(null);
    setImportError("");
    setShowImport(true);
  }

  function handleFileChosen(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImportText(String(reader.result || ""));
    reader.readAsText(file);
  }

  async function handleImport(e) {
    e.preventDefault();
    setImportError("");
    setImportResult(null);
    if (!importText.trim()) {
      setImportError("Choose a CSV file or paste CSV text first");
      return;
    }

    setImporting(true);
    const { ok, data } = await post("/stock/import", { csv: importText });
    setImporting(false);

    if (!ok) {
      setImportError(data.error);
      return;
    }

    setImportResult(data);
    loadData();
  }

  if (loading) return <LoadingSpinner />;

  const moveToName = warehouses.find((wh) => String(wh.id) === String(moveTo))?.name || "—";
  const editDelta = selectedItem ? parseInt(editQty, 10) - selectedItem.quantity : 0;

  return (
    <>
      <div className="page-container">
        <div className="admin-page-header flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Stock Management</h1>
            <p className="text-slate-500 mt-1">{filtered.length} items</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={openImport} className="btn-secondary">
              Import CSV
            </button>
            <button onClick={handleExport} className="btn-secondary">
              Export CSV
            </button>
            <button onClick={() => { setShowAdd(true); setError(""); }} className="btn-primary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          </div>
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
          {categories.length > 0 && (
            <select className="select sm:w-48" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900 truncate">{item.name}</h3>
                        {item.category && (
                          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {item.category}
                          </span>
                        )}
                      </div>
                      {item.party_name && <p className="text-xs text-slate-500">Party: {item.party_name}</p>}
                      <p className="text-sm text-slate-500">{item.warehouse_name}</p>
                    </div>
                    <QuantityBadge quantity={item.quantity} threshold={item.low_stock_threshold} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
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
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button onClick={() => openMove(item)} className="btn-secondary text-xs px-1">
                      Move
                    </button>
                    <button onClick={() => openEdit(item)} className="btn-secondary text-xs px-1">
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button onClick={() => openHistory(item)} className="btn-secondary text-xs px-1">
                      History
                    </button>
                    <button onClick={() => handleDelete(item)} className="btn-danger text-xs px-1">Delete</button>
                  </div>
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
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {item.name}
                        {item.category && (
                          <span className="ml-2 text-[11px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {item.category}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{item.party_name || "—"}</td>
                      <td className="px-5 py-4 text-slate-600">{item.warehouse_name}</td>
                      <td className="px-5 py-4"><QuantityBadge quantity={item.quantity} threshold={item.low_stock_threshold} /></td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button onClick={() => openAdjust(item, "add")} className="btn-secondary text-xs py-1.5 px-2.5 min-h-0">
                            Add
                          </button>
                          <button
                            onClick={() => openAdjust(item, "deduct")}
                            className="btn-secondary text-xs py-1.5 px-2.5 min-h-0"
                            disabled={item.quantity === 0}
                          >
                            Sale
                          </button>
                          <button onClick={() => openMove(item)} className="btn-secondary text-xs py-1.5 px-2.5 min-h-0">
                            Move
                          </button>
                          <button onClick={() => openEdit(item)} className="btn-secondary text-xs py-1.5 px-2.5 min-h-0">
                            Edit
                          </button>
                          <button onClick={() => openHistory(item)} className="btn-secondary text-xs py-1.5 px-2.5 min-h-0">
                            History
                          </button>
                          <button onClick={() => handleDelete(item)} className="btn-danger text-xs py-1.5 px-2.5 min-h-0">
                            Delete
                          </button>
                        </div>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <input className="input" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Low Stock At</label>
              <input type="number" min="0" className="input" value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)} placeholder="Default: 10" />
            </div>
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
        {selectedItem && adjustStep === "form" && (
          <form onSubmit={reviewAdjust} className="space-y-4">
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

            <button type="submit" className="btn-primary w-full">
              Review
            </button>
          </form>
        )}

        {selectedItem && adjustStep === "confirm" && (
          <>
            {error && <div className="mb-4"><Alert type="error" message={error} /></div>}
            <ConfirmSummary
              submitting={submitting}
              onBack={() => setAdjustStep("form")}
              onConfirm={confirmAdjust}
              confirmLabel={adjustType === "add" ? "Confirm & Add" : "Confirm & Record Sale"}
              rows={[
                { label: "Item", value: selectedItem.name },
                { label: "Warehouse", value: selectedItem.warehouse_name },
                { label: "Party", value: adjustParty || "—" },
                { label: "Quantity", value: `${adjustType === "add" ? "+" : "-"}${adjustAmount || 0}` },
                {
                  label: "New stock",
                  value:
                    adjustType === "add"
                      ? selectedItem.quantity + (parseInt(adjustAmount, 10) || 0)
                      : selectedItem.quantity - (parseInt(adjustAmount, 10) || 0),
                },
              ]}
            />
          </>
        )}
      </Modal>

      <Modal open={showMove} onClose={() => setShowMove(false)} title="Move Stock">
        {selectedItem && moveStep === "form" && (
          <form onSubmit={reviewMove} className="space-y-4">
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
            <button type="submit" className="btn-primary w-full">
              Review
            </button>
          </form>
        )}

        {selectedItem && moveStep === "confirm" && (
          <>
            {error && <div className="mb-4"><Alert type="error" message={error} /></div>}
            <ConfirmSummary
              submitting={submitting}
              onBack={() => setMoveStep("form")}
              onConfirm={confirmMove}
              confirmLabel="Confirm & Move"
              rows={[
                { label: "Item", value: selectedItem.name },
                { label: "From", value: selectedItem.warehouse_name },
                { label: "To", value: moveToName },
                { label: "Quantity", value: moveQty || 0 },
                { label: `Remaining in ${selectedItem.warehouse_name}`, value: selectedItem.quantity - (parseInt(moveQty, 10) || 0) },
              ]}
            />
          </>
        )}
      </Modal>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Item">
        {selectedItem && editStep === "form" && (
          <form onSubmit={reviewEdit} className="space-y-4">
            {error && <Alert type="error" message={error} />}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Item Name</label>
              <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                <input className="input" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Low Stock At</label>
                <input type="number" min="0" className="input" value={editThreshold} onChange={(e) => setEditThreshold(e.target.value)} placeholder="Default: 10" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Party Name</label>
              <input className="input" value={editParty} onChange={(e) => setEditParty(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantity</label>
              <input
                type="number"
                min="0"
                className="input text-lg text-center font-mono font-bold"
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
                required
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Changing this corrects the count directly — it won't be logged as a sale or purchase.
              </p>
            </div>
            <button type="submit" className="btn-primary w-full">
              Review
            </button>
          </form>
        )}

        {selectedItem && editStep === "confirm" && (
          <>
            {error && <div className="mb-4"><Alert type="error" message={error} /></div>}
            <ConfirmSummary
              submitting={submitting}
              onBack={() => setEditStep("form")}
              onConfirm={confirmEdit}
              confirmLabel="Confirm & Update"
              rows={[
                { label: "Name", value: editName },
                { label: "Category", value: editCategory || "—" },
                { label: "Party", value: editParty || "—" },
                { label: "Low stock at", value: editThreshold === "" ? "Default (10)" : editThreshold },
                { label: "Quantity", value: `${selectedItem.quantity} → ${editQty}${editDelta !== 0 ? ` (${editDelta > 0 ? "+" : ""}${editDelta})` : ""}` },
              ]}
            />
          </>
        )}
      </Modal>

      <Modal open={showHistory} onClose={() => setShowHistory(false)} title={selectedItem ? `History — ${selectedItem.name}` : "History"}>
        {historyLoading ? (
          <LoadingSpinner />
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No activity recorded for this item yet.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-50 text-sm">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <ActionLabel action={log.action} />
                  <span className="text-xs text-slate-400 font-mono">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                {log.details && <p className="text-slate-600">{log.details}</p>}
                <p className="text-xs text-slate-400 mt-1">by {log.username || "—"}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal open={showImport} onClose={() => setShowImport(false)} title="Import Stock from CSV">
        <form onSubmit={handleImport} className="space-y-4">
          {importError && <Alert type="error" message={importError} />}
          {importResult && (
            <Alert
              type={importResult.errors.length > 0 ? "info" : "success"}
              message={`Created ${importResult.created}, updated ${importResult.updated} of ${importResult.totalRows} rows.${importResult.errors.length > 0 ? ` ${importResult.errors.length} row(s) had errors — see below.` : ""}`}
            />
          )}
          {importResult?.errors?.length > 0 && (
            <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto bg-red-50 rounded-lg p-3">
              {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
          <p className="text-xs text-slate-500">
            Columns: <span className="font-mono">Item, Warehouse, Quantity</span>, and optionally{" "}
            <span className="font-mono">Category, Party, Low Stock Threshold</span>. Warehouse must match an
            existing warehouse name exactly.
          </p>
          <div>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileChosen} className="text-sm" />
          </div>
          <textarea
            className="input font-mono text-xs h-32"
            placeholder="Or paste CSV text here"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <button type="submit" className="btn-primary w-full" disabled={importing || !importText.trim()}>
            {importing ? "Importing..." : "Import"}
          </button>
        </form>
      </Modal>
    </>
  );
}
