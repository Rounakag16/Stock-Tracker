import { useEffect, useState } from "react";
import { SettingsSkeleton } from "../components/Skeleton";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { Alert, PasswordInput } from "../components/ui";
import { ChangePasswordModal } from "../components/ChangePasswordModal";
import { get, patch, post, del } from "../lib/api";
import { useAuthConfig } from "../lib/authConfig";
import { SITE } from "../lib/site";

function StatusPill({ tone, children }) {
  const tones = {
    good: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warn: "bg-accent-50 text-accent-900 border-accent-200",
    muted: "bg-slate-50 text-slate-600 border-line",
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

// The signed-in admin's own account: sign-in email, password, Google, and
// signing out everywhere.
function AccountCard({ user, reloadUser }) {
  const config = useAuthConfig();
  const navigate = useNavigate();
  const [editingEmail, setEditingEmail] = useState(false);
  const [email, setEmail] = useState(user.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resending, setResending] = useState(false);

  async function saveEmail(e) {
    e.preventDefault();
    setEmailError("");
    setSaving(true);
    const { ok, data } = await patch("/auth/email", { email, currentPassword });
    setSaving(false);
    if (!ok) return setEmailError(data.error);
    setEditingEmail(false);
    setCurrentPassword("");
    setNotice(config?.emailEnabled ? `Saved. We've sent a confirmation link to ${email.trim()}.` : "Email saved.");
    reloadUser();
  }

  function cancelEmail() {
    setEditingEmail(false);
    setEmailError("");
    setEmail(user.email || "");
  }

  async function resend() {
    setResending(true);
    const { ok, data } = await post("/auth/resend-verification", {});
    setResending(false);
    setNotice(ok ? `Confirmation link sent to ${user.email}.` : data.error);
  }

  async function signOutEverywhere() {
    if (!confirm("Sign out of WareSync on every device, including this one?")) return;
    await post("/auth/logout-all", {});
    navigate("/login", { replace: true });
  }

  return (
    <div className="card p-5 sm:p-6 mb-6">
      <h2 className="font-bold text-slate-900 mb-1">Your account</h2>
      <p className="text-sm text-slate-500 mb-5">How you sign in to WareSync as {user.username}.</p>

      {notice && (
        <div className="mb-4">
          <Alert type="info" message={notice} onDismiss={() => setNotice("")} />
        </div>
      )}

      <div className="divide-y divide-line border-y border-line">
        <div className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Email</p>
              <p className="text-sm text-slate-500 break-all">{user.email || "Not set. You can only sign in with your company code."}</p>
            </div>
            <div className="flex items-center gap-2">
              {user.email && (user.emailVerified ? <StatusPill tone="good">Confirmed</StatusPill> : <StatusPill tone="warn">Not confirmed</StatusPill>)}
              {!editingEmail && (
                <button type="button" className="btn-secondary !min-h-0 !py-2 text-sm" onClick={() => setEditingEmail(true)}>
                  {user.email ? "Change" : "Add email"}
                </button>
              )}
            </div>
          </div>
          {user.email && !user.emailVerified && config?.emailEnabled && !editingEmail && (
            <button type="button" onClick={resend} disabled={resending} className="mt-2 text-sm font-semibold text-brand-700 hover:underline">
              {resending ? "Sending…" : "Resend confirmation link"}
            </button>
          )}
          {editingEmail && (
            <form onSubmit={saveEmail} className="mt-4 space-y-3">
              {emailError && <Alert type="error" message={emailError} />}
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                autoComplete="email"
                required
              />
              {user.hasPassword && (
                <PasswordInput
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password, to confirm it's you"
                  autoComplete="current-password"
                  required
                />
              )}
              {user.googleLinked && user.email && (
                <p className="text-xs text-slate-500">Changing your email disconnects Google sign-in until you sign in with Google using the new address.</p>
              )}
              <div className="flex gap-2">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving…" : "Save email"}
                </button>
                <button type="button" className="btn-ghost" onClick={cancelEmail}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Password</p>
            <p className="text-sm text-slate-500">{user.hasPassword ? "Set" : "Not set. You sign in with Google."}</p>
          </div>
          <button type="button" className="btn-secondary !min-h-0 !py-2 text-sm" onClick={() => setShowPassword(true)}>
            {user.hasPassword ? "Change password" : "Set password"}
          </button>
        </div>

        {(config?.googleClientId || user.googleLinked) && (
          <div className="py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">Google</p>
              <p className="text-sm text-slate-500">
                {user.googleLinked
                  ? "Connected. You can use “Continue with Google” to sign in."
                  : user.email
                    ? `To connect, sign out and choose “Continue with Google” with ${user.email}.`
                    : "Add an email first, then sign in with Google using that address."}
              </p>
            </div>
            {user.googleLinked ? <StatusPill tone="good">Connected</StatusPill> : <StatusPill tone="muted">Not connected</StatusPill>}
          </div>
        )}

        <div className="py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">Signed-in devices</p>
            <p className="text-sm text-slate-500">Lost a phone or used a shared computer? Sign out everywhere.</p>
          </div>
          <button type="button" className="btn-secondary !min-h-0 !py-2 text-sm" onClick={signOutEverywhere}>
            Sign out everywhere
          </button>
        </div>
      </div>

      <ChangePasswordModal open={showPassword} onClose={() => setShowPassword(false)} hasPassword={user.hasPassword} onSaved={reloadUser} />
    </div>
  );
}

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
  const { user, reloadUser } = useOutletContext();

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

  if (loading) return <SettingsSkeleton />;

  return (
    <div className="page-container max-w-2xl">
      <div className="admin-page-header">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Your account and company</p>
      </div>

      <AccountCard user={user} reloadUser={reloadUser} />

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
          <code className="flex-1 min-w-0 break-all font-mono text-base sm:text-lg font-bold px-4 py-3 rounded-xl bg-slate-50 border border-line">
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
          Permanently deletes this company, every warehouse, item, request, log and user account. This cannot be
          undone, so download anything you need first (Stock and Logs both export to Excel).
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

      <p className="mt-8 text-sm text-slate-500 flex flex-wrap gap-x-5 gap-y-2">
        <Link to="/terms" className="hover:text-ink">Terms of Service</Link>
        <Link to="/privacy" className="hover:text-ink">Privacy Policy</Link>
        <a href={`mailto:${SITE.supportEmail}`} className="hover:text-ink">Contact support</a>
      </p>
    </div>
  );
}
