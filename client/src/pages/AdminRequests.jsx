import { useEffect, useState, useCallback } from "react";
import { Modal, Alert, LoadingSpinner, EmptyState, actionWord } from "../components/ui";
import { get, post, patch } from "../lib/api";

function RequestActionBadge({ action }) {
  const styles = {
    add: "bg-emerald-100 text-emerald-700",
    deduct: "bg-orange-100 text-orange-700",
    move: "bg-purple-100 text-purple-700",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${styles[action] || "bg-slate-100 text-slate-700"}`}>
      {actionWord(action)}
    </span>
  );
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(null);
  const [denyTarget, setDenyTarget] = useState(null);
  const [denyNote, setDenyNote] = useState("");

  const [editTarget, setEditTarget] = useState(null);
  const [editType, setEditType] = useState("add");
  const [editAmount, setEditAmount] = useState("");
  const [editParty, setEditParty] = useState("");
  const [editMoveTo, setEditMoveTo] = useState("");
  const [editError, setEditError] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    get("/warehouses").then(({ data }) => setWarehouses(data.warehouses || []));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data } = await get(`/stock/requests?status=${filter}`);
    setRequests(data.requests || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleReview(id, action, note, edits) {
    setError("");
    setSubmitting(id);

    const { ok, data } = await post(`/stock/requests/${id}`, { action, note, edits });
    setSubmitting(null);

    if (!ok) {
      setError(data.error);
      return;
    }

    setSuccess(action === "approve" ? "Request approved" : "Request denied");
    setDenyTarget(null);
    setDenyNote("");
    setEditTarget(null);
    loadData();
  }

  function openEdit(req) {
    setEditTarget(req);
    setEditType(req.action);
    setEditAmount(String(req.quantity));
    setEditParty(req.party_name);
    setEditMoveTo(req.to_warehouse_id ? String(req.to_warehouse_id) : "");
    setEditError("");
  }

  function buildEditPayload() {
    const payload = {
      type: editType,
      amount: parseInt(editAmount, 10),
      partyName: editParty,
    };
    if (editType === "move") payload.toWarehouseId = editMoveTo;
    return payload;
  }

  async function handleSaveEdit() {
    if (!editTarget) return;
    setEditError("");
    setEditSubmitting(true);

    const { ok, data } = await patch(`/stock/requests/${editTarget.id}`, buildEditPayload());
    setEditSubmitting(false);

    if (!ok) {
      setEditError(data.error);
      return;
    }

    setSuccess("Request updated");
    setEditTarget(null);
    loadData();
  }

  async function handleSaveAndApprove() {
    if (!editTarget) return;
    setEditError("");
    setEditSubmitting(true);

    const { ok, data } = await post(`/stock/requests/${editTarget.id}`, {
      action: "approve",
      edits: buildEditPayload(),
    });
    setEditSubmitting(false);

    if (!ok) {
      setEditError(data.error);
      return;
    }

    setSuccess("Request updated and approved");
    setEditTarget(null);
    loadData();
  }

  return (
    <div className="page-container">
      <div className="admin-page-header">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Pending Requests</h1>
        <p className="text-slate-500 mt-1">Review employee stock change requests</p>
      </div>

      {success && <div className="mb-4"><Alert type="success" message={success} onDismiss={() => setSuccess("")} /></div>}
      {error && <div className="mb-4"><Alert type="error" message={error} onDismiss={() => setError("")} /></div>}

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {["pending", "approved", "denied"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap capitalize ${
              filter === s ? "bg-brand-600 text-white" : "bg-white border border-line text-slate-600 hover:bg-slate-50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : requests.length === 0 ? (
        <EmptyState
          title={`No ${filter} requests`}
          description={filter === "pending" ? "Employee submissions will appear here for approval" : undefined}
        />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="card p-4 lg:p-5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-semibold text-slate-900">{req.requester_name}</span>
                    <RequestActionBadge action={req.action} />
                    {filter !== "pending" && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                        req.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}>
                        {req.status}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-900 font-medium">{req.item_name}</p>
                  <div className="mt-2 space-y-1 text-sm text-slate-600">
                    <p><span className="text-slate-500">Quantity:</span> <strong className="font-mono tabular-nums">{req.quantity}</strong></p>
                    <p><span className="text-slate-500">Party:</span> <strong>{req.party_name}</strong></p>
                    <p>
                      <span className="text-slate-500">Warehouse:</span> {req.from_warehouse_name}
                      {req.action === "move" && req.to_warehouse_name && <> → {req.to_warehouse_name}</>}
                    </p>
                    <p className="text-xs text-slate-400">Submitted {new Date(req.created_at).toLocaleString()}</p>
                    {req.review_note && <p className="text-xs text-slate-500 italic">Note: {req.review_note}</p>}
                    {req.reviewer_name && req.reviewed_at && (
                      <p className="text-xs text-slate-400">
                        Reviewed by {req.reviewer_name} on {new Date(req.reviewed_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {filter === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(req)} className="btn-secondary text-sm" disabled={submitting === req.id}>
                      Edit
                    </button>
                    <button onClick={() => handleReview(req.id, "approve")} className="btn-success text-sm" disabled={submitting === req.id}>
                      {submitting === req.id ? "..." : "Approve"}
                    </button>
                    <button onClick={() => { setDenyTarget(req); setDenyNote(""); }} className="btn-danger text-sm" disabled={submitting === req.id}>
                      Deny
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!denyTarget} onClose={() => setDenyTarget(null)} title="Deny Request">
        {denyTarget && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Deny {denyTarget.requester_name}&apos;s request to {actionWord(denyTarget.action)} {denyTarget.quantity} of {denyTarget.item_name}?
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason (optional)</label>
              <input className="input" value={denyNote} onChange={(e) => setDenyNote(e.target.value)} placeholder="e.g. Incorrect quantity" />
            </div>
            <button
              onClick={() => handleReview(denyTarget.id, "deny", denyNote)}
              className="btn-danger w-full"
              disabled={submitting === denyTarget.id}
            >
              {submitting === denyTarget.id ? "Denying..." : "Confirm Deny"}
            </button>
          </div>
        )}
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Request">
        {editTarget && (
          <div className="space-y-4">
            {editError && <Alert type="error" message={editError} />}
            <p className="text-sm text-slate-600">
              Editing {editTarget.requester_name}&apos;s request for {editTarget.item_name}.
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Party Name</label>
              <input className="input" value={editParty} onChange={(e) => setEditParty(e.target.value)} />
            </div>

            {editType === "move" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">To Warehouse</label>
                <select className="select" value={editMoveTo} onChange={(e) => setEditMoveTo(e.target.value)}>
                  <option value="">Select destination</option>
                  {warehouses
                    .filter((wh) => String(wh.id) !== String(editTarget.from_warehouse_id))
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
              />
            </div>

            <div className="flex gap-2">
              <button onClick={handleSaveEdit} className="btn-secondary flex-1 text-sm" disabled={editSubmitting}>
                {editSubmitting ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={handleSaveAndApprove} className="btn-success flex-1 text-sm" disabled={editSubmitting}>
                {editSubmitting ? "Saving..." : "Save & Approve"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
