import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Alert, PasswordInput } from "./ui";
import { BrandLogo } from "./Brand";
import { NewPasswordFields, passwordsReady } from "./PasswordFields";
import { get, post, del } from "../lib/api";
import { SITE } from "../lib/site";

function GateShell({ title, subtitle, children }) {
  async function signOut() {
    await del("/auth/login");
    window.location.assign("/login");
  }
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <header className="flex items-center justify-between gap-4 px-4 sm:px-8 py-5">
        <BrandLogo />
        <button type="button" onClick={signOut} className="text-sm font-medium text-slate-500 hover:text-ink">
          Sign out
        </button>
      </header>
      <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-8">
        <div className="card w-full max-w-md p-6 sm:p-8">
          <h1 className="font-display font-bold text-2xl tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="text-slate-500 mt-2 leading-relaxed">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}

function AcceptTerms({ firstTime, onDone }) {
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function accept(e) {
    e.preventDefault();
    setSaving(true);
    const { ok, data } = await post("/auth/accept-terms", { accept: true });
    setSaving(false);
    if (!ok) return setError(data.error);
    onDone();
  }

  return (
    <GateShell
      title={firstTime ? "Welcome to Warely" : "We've updated our terms"}
      subtitle={
        firstTime
          ? "Before you start, please read and accept the terms for using Warely."
          : `Our Terms of Service and Privacy Policy were updated on ${SITE.legalUpdated}. Please review and accept them to keep using Warely.`
      }
    >
      <form onSubmit={accept} className="space-y-5">
        {error && <Alert type="error" message={error} />}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/terms" target="_blank" className="btn-secondary">Terms of Service</Link>
          <Link to="/privacy" target="_blank" className="btn-secondary">Privacy Policy</Link>
        </div>
        <label className="flex items-start gap-3 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            required
          />
          <span>I have read and agree to the Terms of Service and Privacy Policy.</span>
        </label>
        <button type="submit" className="btn-primary w-full !py-3.5 text-base" disabled={!checked || saving}>
          {saving ? "Saving…" : "Agree and continue"}
        </button>
      </form>
    </GateShell>
  );
}

function ReplacePassword({ onDone }) {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("Passwords don't match");
    setSaving(true);
    const { ok, data } = await post("/users/password", { currentPassword: current, newPassword: password });
    setSaving(false);
    if (!ok) return setError(data.error);
    onDone();
  }

  return (
    <GateShell
      title="Choose your own password"
      subtitle="Your admin set a temporary password for you. Replace it with one only you know — your admin won't be able to see it."
    >
      <form onSubmit={save} className="space-y-5">
        {error && <Alert type="error" message={error} onDismiss={() => setError("")} />}
        <div>
          <label htmlFor="temp-password" className="block text-sm font-semibold text-ink mb-1.5">
            Temporary password
          </label>
          <PasswordInput
            id="temp-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            placeholder="The one your admin gave you"
            required
          />
        </div>
        <NewPasswordFields
          password={password}
          confirm={confirm}
          onPassword={setPassword}
          onConfirm={setConfirm}
          label="New password"
          confirmLabel="Confirm new password"
        />
        <button
          type="submit"
          className="btn-primary w-full !py-3.5 text-base"
          disabled={saving || !current || !passwordsReady(password, confirm)}
        >
          {saving ? "Saving…" : "Save and continue"}
        </button>
      </form>
    </GateShell>
  );
}

// Shown instead of the app while a signed-in user still has a required
// step: accepting the Terms, or replacing a password their admin chose.
// Returns null when nothing is pending.
export function AccountGate({ user, onDone }) {
  if (user.needsTerms) return <AcceptTerms firstTime={user.role === "employee" && user.mustChangePassword} onDone={onDone} />;
  if (user.mustChangePassword) return <ReplacePassword onDone={onDone} />;
  return null;
}

export function needsGate(user) {
  return !!user && (user.needsTerms || user.mustChangePassword);
}

// Route wrapper for pages that do their own loading (the employee screen):
// checks the session first and runs the gate before rendering the page.
export function RequireReadyAccount({ role, children }) {
  const [user, setUser] = useState(undefined);

  async function load() {
    const { data } = await get("/auth/login");
    setUser(data.user || null);
  }

  useEffect(() => {
    load();
  }, []);

  if (user === undefined) return <div className="min-h-screen bg-paper" />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === "admin" ? "/admin" : "/employee"} replace />;
  if (needsGate(user)) return <AccountGate user={user} onDone={load} />;
  return children;
}
