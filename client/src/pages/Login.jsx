import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, PasswordInput } from "../components/ui";
import { post } from "../lib/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [companySlug, setCompanySlug] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { ok, data } = await post("/auth/login", { companySlug, username, password });

      if (!ok) {
        setError(data.error || "Login failed");
        return;
      }

      navigate(data.user.role === "admin" ? "/admin" : "/employee");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Link
              to="/"
              className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/20"
            >
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Stock Tracker</h1>
            <p className="text-slate-500 mt-1">Sign in to manage inventory</p>
          </div>

          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            {error && <Alert type="error" message={error} onDismiss={() => setError("")} />}

            <div>
              <label htmlFor="companySlug" className="block text-sm font-medium text-slate-700 mb-1.5">
                Company Code
              </label>
              <input
                id="companySlug"
                type="text"
                className="input"
                value={companySlug}
                onChange={(e) => setCompanySlug(e.target.value)}
                placeholder="e.g. acme-hardware"
                autoComplete="organization"
                required
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">
                Username
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
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Setting up a new company?{" "}
            <Link to="/signup" className="font-medium text-brand-600 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
