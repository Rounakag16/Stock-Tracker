import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert } from "../components/ui";
import { post } from "../lib/api";

export default function SignupPage() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [companySlug, setCompanySlug] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { ok, data } = await post("/auth/register", { companyName, username, password });

      if (!ok) {
        setError(data.error || "Could not create company");
        return;
      }

      setCompanySlug(data.companySlug);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (companySlug) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-sm text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">You're all set</h1>
            <p className="text-slate-500 mt-1 mb-6">
              Share this company code with your employees — they'll need it to sign in.
            </p>

            <div className="card p-5 mb-6">
              <p className="text-xs text-slate-500 mb-1">Company Code</p>
              <p className="text-2xl font-mono font-bold text-brand-600 tracking-wide">{companySlug}</p>
            </div>

            <button onClick={() => navigate("/admin")} className="btn-primary w-full">
              Go to Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/20">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Create your company</h1>
            <p className="text-slate-500 mt-1">Set up a workspace for your shop or team</p>
          </div>

          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            {error && <Alert type="error" message={error} onDismiss={() => setError("")} />}

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-1.5">
                Company Name
              </label>
              <input
                id="companyName"
                type="text"
                className="input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Hardware"
                autoComplete="organization"
                required
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">
                Your Admin Username
              </label>
              <input
                id="username"
                type="text"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                minLength={6}
                autoComplete="new-password"
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Company"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Already have a company?{" "}
            <Link to="/" className="font-medium text-brand-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
