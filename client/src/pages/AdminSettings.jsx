import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, LoadingSpinner } from "../components/ui";
import { get, patch, del } from "../lib/api";

export default function AdminSettingsPage() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    get("/company").then(({ ok, data }) => {
      if (ok) {
        setCompany(data.company);
        setName(data.company.name);
      }
      setLoading(false);
    });
  }, []);

  async function handleRename(e) {
    e.preventDefault();
    setNameError("");
    setNameSuccess("");
    if (!name.trim() || name.trim() === company.name) return;

    setSavingName(true);
    const { ok, data } = await patch("/company", { name: name.trim() });
    setSavingName(false);

    if (!ok) {
      setNameError(data.error);
      return;
    }
    setCompany(data.company);
    setNameSuccess("Company name updated");
  }

  function copyCode() {
    navigator.clipboard.writeText(company.slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDeleteCompany(e) {
    e.preventDefault();
    setDeleteError("");
    setDeleting(true);

    const { ok, data } = await del("/company", { confirmCompanyName: confirmName });
    setDeleting(false);

    if (!ok) {
      setDeleteError(data.error);
      return;
    }
    navigate("/", { replace: true });
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container max-w-2xl">
      <div className="admin-page-header">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your company</p>
      </div>

      <div className="card p-5 sm:p-6 mb-6">
        <h2 className="font-bold text-slate-900 mb-1">Company Name</h2>
        <p className="text-sm text-slate-500 mb-4">Shown throughout the app — doesn't affect your company code.</p>
        <form onSubmit={handleRename} className="space-y-3">
          {nameError && <Alert type="error" message={nameError} />}
          {nameSuccess && <Alert type="success" message={nameSuccess} onDismiss={() => setNameSuccess("")} />}
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          <button
            type="submit"
            className="btn-primary"
            disabled={savingName || !name.trim() || name.trim() === company.name}
          >
            {savingName ? "Saving..." : "Save"}
          </button>
        </form>
      </div>

      <div className="card p-5 sm:p-6 mb-6">
        <h2 className="font-bold text-slate-900 mb-1">Company Code</h2>
        <p className="text-sm text-slate-500 mb-4">
          Employees enter this alongside their username to sign in. Share it, don't publish it.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 font-mono text-lg font-bold px-4 py-3 rounded-xl bg-slate-50 border border-line">
            {company.slug}
          </code>
          <button onClick={copyCode} className="btn-secondary shrink-0">
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="card p-5 sm:p-6 border-red-200">
        <h2 className="font-bold text-red-700 mb-1">Danger Zone</h2>
        <p className="text-sm text-slate-500 mb-4">
          Permanently deletes this company, every warehouse, item, request, and log. This cannot be undone.
        </p>
        <form onSubmit={handleDeleteCompany} className="space-y-3">
          {deleteError && <Alert type="error" message={deleteError} />}
          <label className="block text-sm font-medium text-slate-700">
            Type <span className="font-mono font-bold">{company.name}</span> to confirm
          </label>
          <input
            className="input"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={company.name}
          />
          <button
            type="submit"
            className="btn-danger"
            disabled={deleting || confirmName !== company.name}
          >
            {deleting ? "Deleting..." : "Delete Company"}
          </button>
        </form>
      </div>
    </div>
  );
}
