import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Alert, LoadingSpinner, EmptyState, PasswordInput } from "../components/ui";
import { ChangePasswordModal } from "../components/ChangePasswordModal";
import { get, post, del } from "../lib/api";

export default function AdminEmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companySlug, setCompanySlug] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [resetTarget, setResetTarget] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showDeleteCompany, setShowDeleteCompany] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    const { data } = await get("/users");
    setEmployees(data.employees || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    get("/company").then(({ data }) => {
      setCompanySlug(data.company?.slug || "");
      setCompanyName(data.company?.name || "");
    });
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { ok, data } = await post("/users", { username: newUsername, password: newPassword });
    setSubmitting(false);

    if (!ok) {
      setError(data.error);
      return;
    }

    setSuccess(`Employee "${newUsername}" created`);
    setShowCreate(false);
    setNewUsername("");
    setNewPassword("");
    loadData();
  }

  async function handleDeleteCompany() {
    setDeleteError("");
    setDeleteSubmitting(true);

    const { ok, data } = await del("/company", { confirmCompanyName: deleteConfirmText });
    setDeleteSubmitting(false);

    if (!ok) {
      setDeleteError(data.error);
      return;
    }

    navigate("/", { replace: true });
  }

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="page-container">
        <div className="admin-page-header flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Team</h1>
            <p className="text-slate-500 mt-1">Manage employee accounts</p>
          </div>
          <button onClick={() => { setShowCreate(true); setError(""); }} className="btn-primary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            New Employee
          </button>
        </div>

        {companySlug && (
          <div className="card p-4 mb-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs text-slate-500">Company Code — employees need this to sign in</p>
              <p className="text-lg font-mono font-bold text-brand-600 tracking-wide">{companySlug}</p>
            </div>
            <button onClick={() => navigator.clipboard?.writeText(companySlug)} className="btn-secondary text-sm">
              Copy
            </button>
          </div>
        )}

        {success && <div className="mb-4"><Alert type="success" message={success} onDismiss={() => setSuccess("")} /></div>}

        {employees.length === 0 ? (
          <EmptyState title="No employees yet" description="Create an employee account so they can manage stock" />
        ) : (
          <div className="space-y-3">
            {employees.map((emp) => (
              <div key={emp.id} className="card p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                    <span className="text-brand-700 font-bold text-sm">{emp.username.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{emp.username}</p>
                    <p className="text-xs text-slate-500">Joined {new Date(emp.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={() => setResetTarget(emp)} className="btn-secondary text-sm shrink-0">
                  Reset password
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 card p-4 sm:p-5 border-red-200 bg-red-50/40">
          <h2 className="font-bold text-red-700">Danger Zone</h2>
          <p className="text-sm text-slate-600 mt-1 mb-4">
            Permanently delete this company's account. This removes every employee, warehouse, stock item,
            request, and activity log — for everyone. This cannot be undone.
          </p>
          <button
            onClick={() => { setShowDeleteCompany(true); setDeleteConfirmText(""); setDeleteError(""); }}
            className="btn-danger text-sm"
          >
            Delete Company Account
          </button>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Employee">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <Alert type="error" message={error} />}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
            <input className="input" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="e.g. john" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
              minLength={6}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? "Creating..." : "Create Employee"}
          </button>
        </form>
      </Modal>

      {resetTarget && (
        <ChangePasswordModal
          open={!!resetTarget}
          onClose={() => setResetTarget(null)}
          resetUserId={resetTarget.id}
          resetUsername={resetTarget.username}
        />
      )}

      <Modal open={showDeleteCompany} onClose={() => setShowDeleteCompany(false)} title="Delete Company Account">
        <div className="space-y-4">
          {deleteError && <Alert type="error" message={deleteError} />}
          <Alert
            type="error"
            message={`This will permanently delete "${companyName}" and everything in it — every employee account, warehouse, stock item, request, and log. There is no undo.`}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Type <span className="font-mono font-bold">{companyName}</span> to confirm
            </label>
            <input
              className="input"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={companyName}
              autoComplete="off"
            />
          </div>
          <button
            onClick={handleDeleteCompany}
            className="btn-danger w-full"
            disabled={deleteSubmitting || deleteConfirmText !== companyName}
          >
            {deleteSubmitting ? "Deleting..." : "Permanently Delete Company"}
          </button>
        </div>
      </Modal>
    </>
  );
}
