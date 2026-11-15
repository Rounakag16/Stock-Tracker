import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, PasswordInput } from "../components/ui";
import { AuthLayout, Field } from "../components/AuthLayout";
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
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your company's workspace."
      panelTitle={
        <>
          Your stock, <span className="text-brand-500">always in sync.</span>
        </>
      }
      panelPoints={[
        "Approve your team's sales, receipts and transfers",
        "See opening and closing stock for any day",
        "Get alerted before an item runs out",
      ]}
      footer={
        <>
          New to Stock Tracker?{" "}
          <Link to="/signup" className="font-semibold text-brand-700 hover:underline">
            Create a workspace
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert type="error" message={error} onDismiss={() => setError("")} />}

        <Field id="companySlug" label="Company code" hint="Your admin shares this — it's shown on their Settings page.">
          <input
            id="companySlug"
            type="text"
            className="input font-mono"
            value={companySlug}
            onChange={(e) => setCompanySlug(e.target.value)}
            placeholder="e.g. sharma-hardware"
            autoComplete="organization"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </Field>

        <Field id="username" label="Username">
          <input
            id="username"
            type="text"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </Field>

        <Field id="password" label="Password">
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            required
          />
        </Field>

        <button type="submit" className="btn-primary w-full !py-3.5 text-base" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>

        {/* Password recovery exists in the codebase (ForgotPassword.jsx,
            ResetPassword.jsx, server/src/routes/auth.js) but isn't wired up
            to a real email service yet, so the link stays hidden until it is.
            Until then, an admin can reset an employee's password from Team. */}
        <p className="text-center text-xs text-ink/50">
          Forgot your password? Ask your admin to reset it from the Team page.
        </p>
      </form>
    </AuthLayout>
  );
}
