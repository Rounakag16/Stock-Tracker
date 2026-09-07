import { useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "../components/ui";
import { post } from "../lib/api";

export default function ForgotPasswordPage() {
  const [companySlug, setCompanySlug] = useState("");
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { ok, data } = await post("/auth/forgot-password", { companySlug, username });
    setSubmitting(false);

    if (!ok) {
      setError(data.error);
      return;
    }
    setDone(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-paper">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link
            to="/"
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-ink flex items-center justify-center shadow-lg shadow-ink/20"
          >
            <svg className="w-8 h-8 text-paper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Reset your password</h1>
          <p className="text-slate-500 mt-1">We'll generate a reset link for your account</p>
        </div>

        <div className="card p-6">
          {done ? (
            <div className="text-center space-y-3">
              <Alert type="success" message="If that account exists, a reset link has been generated. Ask whoever runs your server to check its logs for the link — it expires in an hour." />
              <Link to="/login" className="btn-secondary w-full">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert type="error" message={error} />}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Code</label>
                <input className="input" value={companySlug} onChange={(e) => setCompanySlug(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                {submitting ? "Sending..." : "Send reset link"}
              </button>
              <Link to="/login" className="block text-center text-sm text-slate-500 hover:text-slate-700">
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
