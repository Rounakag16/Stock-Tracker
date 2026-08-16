import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { EmployeeNav } from "../components/Nav";
import { Modal, Alert, LoadingSpinner, EmptyState, QuantityBadge, StatusBadge, actionWord } from "../components/ui";
import { get, post, patch } from "../lib/api";

export default function EmployeePage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [username, setUsername] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [search, setSearch] = useState("");
  const [showRequests, setShowRequests] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [requestType, setRequestType] = useState("add");
  const [amount, setAmount] = useState("");
  const [partyName, setPartyName] = useState("");
  const [moveTo, setMoveTo] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingRequest, setEditingRequest] = useState(null);
  const [editType, setEditType] = useState("add");
  const [editAmount, setEditAmount] = useState("");
  const [editParty, setEditParty] = useState("");
  const [editMoveTo, setEditMoveTo] = useState("");
  const [editError, setEditError] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const loadWarehouses = useCallback(async () => {
    const { data: authData } = await get("/auth/login");
    if (!authData.user) {
      navigate("/login", { replace: true });
      return [];
    }
    if (authData.user.role !== "employee") {
      navigate("/admin", { replace: true });
      return [];
    }
    setUsername(authData.user.username || "Employee");
    setCompanyName(authData.user.companyName || "");

    const { data } = await get("/warehouses");
    const list = data.warehouses || [];
    setWarehouses(list);
    return list;
  }, [navigate]);

  const loadStock = useCallback(async (warehouseId) => {
    if (!warehouseId) return;
    const { data } = await get(`/stock?warehouseId=${warehouseId}`);
    setItems(data.items || []);
  }, []);

  const loadRequests = useCallback(async () => {
    const { data } = await get("/stock/requests?status=pending");
    setMyRequests(data.requests || []);
  }, []);

  useEffect(() => {
    async function init() {
      const list = await loadWarehouses();
      await loadRequests();
      if (list.length > 0) {
        const firstId = String(list[0].id);
        setSelectedWarehouse(firstId);
        await loadStock(firstId);
      }
      setLoading(false);
    }
    init();
  }, [loadWarehouses, loadStock, loadRequests]);

  async function handleWarehouseChange(warehouseId) {
    setSelectedWarehouse(warehouseId);
    setLoading(true);
    await loadStock(warehouseId);
    setLoading(false);
  }

  const currentWarehouse = warehouses.find((wh) => String(wh.id) === selectedWarehouse);

  const filtered = items.filter(
    (item) =>
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.party_name?.toLowerCase().includes(search.toLowerCase())
  );

  function openRequest(item, type) {
    setSelectedItem(item);
    setRequestType(type);
    setAmount("");
    setPartyName(item.party_name || "");
    setMoveTo("");
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedItem) return;
    setError("");
    setSubmitting(true);

    const body = {
      itemId: selectedItem.id,
      amount: parseInt(amount, 10),
      type: requestType,
      partyName,
    };
    if (requestType === "move") body.toWarehouseId = moveTo;

    const { ok, data } = await post("/stock/requests", body);
    setSubmitting(false);

    if (!ok) {
      setError(data.error);
      return;
    }

    setSuccess("Request submitted — waiting for admin approval");
    setShowModal(false);
    loadRequests();
  }

  function openEdit(req) {
    setEditingRequest(req);
    setEditType(req.action);
    setEditAmount(String(req.quantity));
    setEditParty(req.party_name);
    setEditMoveTo(req.to_warehouse_id ? String(req.to_warehouse_id) : "");
    setEditError("");
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!editingRequest) return;
    setEditError("");
    setEditSubmitting(true);

    const body = {
      type: editType,
      amount: parseInt(editAmount, 10),
      partyName: editParty,
    };
    if (editType === "move") body.toWarehouseId = editMoveTo;

    const { ok, data } = await patch(`/stock/requests/${editingRequest.id}`, body);
    setEditSubmitting(false);

    if (!ok) {
      setEditError(data.error);
      return;
    }

    setSuccess("Request updated");
    setEditingRequest(null);
    loadRequests();
  }

  const modalTitles = {
    add: "Request Add Stock",
    deduct: "Request Sale",
    move: "Request Move Stock",
  };

  if (loading && warehouses.length === 0) {
    return (
      <>
        <EmployeeNav username="" companyName={companyName} />
        <LoadingSpinner />
      </>
    );
  }

  return (
    <>
      <EmployeeNav username={username} companyName={companyName} />
      <div className="page-container max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Stock</h1>
          <p className="text-slate-500 mt-1">
            Submit change requests — admin must approve before stock updates
          </p>
        </div>

        {success && (
          <div className="mb-4">
            <Alert type="success" message={success} onDismiss={() => setSuccess("")} />
          </div>
        )}

        {myRequests.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowRequests(!showRequests)}
              className="w-full card p-4 flex items-center justify-between text-left"
            >
              <div>
                <p className="font-semibold text-slate-900">Pending requests</p>
                <p className="text-sm text-amber-600">{myRequests.length} awaiting approval</p>
              </div>
              <svg
                className={`w-5 h-5 text-slate-400 transition-transform ${showRequests ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showRequests && (
              <div className="mt-2 space-y-2">
                {myRequests.map((req) => (
                  <div key={req.id} className="card p-3 text-sm">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium">{actionWord(req.action)}</span>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={req.status} />
                        {req.status === "pending" && (
                          <button onClick={() => openEdit(req)} className="text-xs font-semibold text-brand-600 hover:underline">
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-700">{req.item_name} × <span className="font-mono">{req.quantity}</span></p>
                    <p className="text-slate-500">Party: {req.party_name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {warehouses.length === 0 ? (
          <EmptyState title="No warehouses" description="Ask an admin to set up warehouses first" />
        ) : (
          <>
            <div className="flex flex-col gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Warehouse</label>
                <select className="select" value={selectedWarehouse} onChange={(e) => handleWarehouseChange(e.target.value)}>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                  ))}
                </select>
              </div>
              <input
                type="search"
                className="input"
                placeholder={`Search in ${currentWarehouse?.name || "warehouse"}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : filtered.length === 0 ? (
              <EmptyState title="No stock items" description={`No items in ${currentWarehouse?.name || "this warehouse"}`} />
            ) : (
              <div className="space-y-3 pb-6">
                {filtered.map((item) => (
                  <div key={item.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 text-lg">{item.name}</h3>
                        {item.party_name && <p className="text-sm text-slate-500">Party: {item.party_name}</p>}
                      </div>
                      <QuantityBadge quantity={item.quantity} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => openRequest(item, "add")} className="btn-success text-sm">Add</button>
                      <button
                        onClick={() => openRequest(item, "deduct")}
                        className="btn-danger text-sm"
                        disabled={item.quantity === 0}
                      >
                        Sale
                      </button>
                      <button
                        onClick={() => openRequest(item, "move")}
                        className="btn-secondary text-sm"
                        disabled={item.quantity === 0 || warehouses.length < 2}
                      >
                        Move
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={modalTitles[requestType]}>
        {selectedItem && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert type="error" message={error} />}
            <div className="p-4 rounded-xl bg-slate-50 space-y-1 text-sm">
              <p><span className="text-slate-500">Item:</span> <strong>{selectedItem.name}</strong></p>
              <p><span className="text-slate-500">Warehouse:</span> {selectedItem.warehouse_name}</p>
              <p><span className="text-slate-500">Current stock:</span> {selectedItem.quantity}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Party Name <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                placeholder="Customer or supplier name"
                required
              />
            </div>

            {requestType === "move" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">To Warehouse</label>
                <select className="select" value={moveTo} onChange={(e) => setMoveTo(e.target.value)} required>
                  <option value="">Select destination</option>
                  {warehouses
                    .filter((wh) => String(wh.id) !== String(selectedItem.warehouse_id))
                    .map((wh) => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantity</label>
              <input
                type="number"
                min="1"
                max={requestType !== "add" ? selectedItem.quantity : undefined}
                className="input text-lg text-center font-mono font-bold"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit for Approval"}
            </button>
          </form>
        )}
      </Modal>

      <Modal open={!!editingRequest} onClose={() => setEditingRequest(null)} title="Edit Pending Request">
        {editingRequest && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {editError && <Alert type="error" message={editError} />}
            <p className="text-sm text-slate-500">
              You can edit this request until an admin approves or declines it.
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
              <select className="select" value={editType} onChange={(e) => setEditType(e.target.value)}>
                <option value="add">Add</option>
                <option value="deduct">Sale</option>
                <option value="move">Move</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Party Name <span className="text-red-500">*</span>
              </label>
              <input className="input" value={editParty} onChange={(e) => setEditParty(e.target.value)} required />
            </div>

            {editType === "move" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">To Warehouse</label>
                <select className="select" value={editMoveTo} onChange={(e) => setEditMoveTo(e.target.value)} required>
                  <option value="">Select destination</option>
                  {warehouses
                    .filter((wh) => String(wh.id) !== String(editingRequest.from_warehouse_id))
                    .map((wh) => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantity</label>
              <input
                type="number"
                min="1"
                className="input text-lg text-center font-mono font-bold"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={editSubmitting}>
              {editSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </Modal>
    </>
  );
}
