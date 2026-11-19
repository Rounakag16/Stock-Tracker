import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, PasswordInput } from "../components/ui";
import { AuthLayout, Field } from "../components/AuthLayout";
import { post } from "../lib/api";

// The company code is the field people forget, so remember it on this device.
const CODE_KEY = "st:lastCompanyCode";
function readSavedCode() {
  try {
    return localStorage.getItem(CODE_KEY) || "";
  } catch {
    return "";
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [companySlug, setCompanySlug] = useState(readSavedCode);
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

      try {
        localStorage.setItem(CODE_KEY, companySlug.trim().toLowerCase());
      } catch {
        // Storage blocked — nothing to remember.
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
      title="Sign in"
      subtitle="Admins and employees both sign in here with your company code."
      topLink={{ text: "New to Warely?", label: "Create a workspace", to: "/signup" }}
      panelTitle="Every sale, receipt and transfer — approved and on record."
      panelPoints={[
        "Approve your team's entries before stock changes",
        "Opening and closing stock for any day, per warehouse",
        "Alerts before an item runs out",
      ]}
      footer={
        <>
          <span className="font-semibold text-ink">Forgot your password?</span> Ask your admin to reset it from the
          Team page.
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert type="error" message={error} onDismiss={() => setError("")} />}

        <Field id="companySlug" label="Company code" hint="Shown on your admin's Settings page, e.g. sharma-hardware.">
          <input
            id="companySlug"
            type="text"
            className="input font-mono"
            value={companySlug}
            onChange={(e) => setCompanySlug(e.target.value)}
            placeholder="your-company"
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
            to a real email service yet, so the footer points to the admin. */}
      </form>
    </AuthLayout>
  );
}
