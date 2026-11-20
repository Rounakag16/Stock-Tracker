import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Alert, PasswordInput } from "../components/ui";
import { AuthLayout, Field } from "../components/AuthLayout";
import { GoogleButton, OrDivider } from "../components/GoogleButton";
import { post } from "../lib/api";
import { useAuthConfig } from "../lib/authConfig";

// Remember, on this device, which way the person signs in and their
// company code — the field people forget most.
const CODE_KEY = "st:lastCompanyCode";
const MODE_KEY = "waresync:loginMode";
function readStored(key, fallback = "") {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}
function store(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked — nothing to remember.
  }
}

function destination(user) {
  return user.role === "admin" ? "/admin" : "/employee";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const config = useAuthConfig();

  const [mode, setMode] = useState(() => readStored(MODE_KEY, "email")); // email | code
  const [email, setEmail] = useState("");
  const [companySlug, setCompanySlug] = useState(() => readStored(CODE_KEY));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const notice = location.state?.notice;

  function switchMode(next) {
    setMode(next);
    setError("");
    setPassword("");
    store(MODE_KEY, next);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const body = mode === "email" ? { email, password } : { companySlug, username, password };
    const { ok, data } = await post("/auth/login", body);
    setLoading(false);

    if (!ok) {
      setError(data.error || "Sign-in failed");
      return;
    }
    if (mode === "code") store(CODE_KEY, companySlug.trim().toLowerCase());
    navigate(destination(data.user), { replace: true });
  }

  async function handleGoogle(credential) {
    setError("");
    setLoading(true);
    const { ok, data } = await post("/auth/google", { credential });
    setLoading(false);
    if (!ok) {
      setError(data.error);
      return;
    }
    if (data.needsWorkspace) {
      navigate("/signup", { state: { google: { signupToken: data.signupToken, email: data.email, name: data.name } } });
      return;
    }
    navigate(destination(data.user), { replace: true });
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle={mode === "email" ? "Welcome back. Sign in to manage your workspace." : "Employees sign in with the company code from their admin."}
      topLink={{ text: "New to WareSync?", label: "Create a workspace", to: "/signup" }}
      panelTitle="Every sale, receipt and transfer — approved and on record."
      panelPoints={[
        "Approve your team's entries before stock changes",
        "Opening and closing stock for any day, per warehouse",
        "Alerts before an item runs out",
      ]}
      footer={
        mode === "email" ? (
          <>
            By continuing, you agree to WareSync's{" "}
            <Link to="/terms" className="font-medium text-ink hover:underline">Terms of Service</Link> and{" "}
            <Link to="/privacy" className="font-medium text-ink hover:underline">Privacy Policy</Link>.
          </>
        ) : (
          <>
            <span className="font-semibold text-ink">Forgot your password?</span> Ask your admin to reset it from the Team page.
          </>
        )
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="How do you sign in?">
          {[
            { id: "email", label: "Owner / admin" },
            { id: "code", label: "Employee" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={mode === tab.id}
              onClick={() => switchMode(tab.id)}
              className={`rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                mode === tab.id ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {notice && <Alert type="success" message={notice} />}
        {error && <Alert type="error" message={error} onDismiss={() => setError("")} />}

        {mode === "email" && config?.googleClientId && (
          <>
            <GoogleButton clientId={config.googleClientId} onCredential={handleGoogle} text="signin_with" />
            <OrDivider />
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "email" ? (
            <Field id="email" label="Email">
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
              />
            </Field>
          ) : (
            <>
              <Field id="companySlug" label="Company code" hint="Your admin can find it under Settings, e.g. sharma-hardware.">
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
            </>
          )}

          <Field
            id="password"
            label="Password"
            aside={
              mode === "email" && config?.emailEnabled ? (
                <Link to="/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">
                  Forgot password?
                </Link>
              ) : null
            }
          >
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
        </form>

        {mode === "email" && (
          <p className="text-xs text-slate-500 text-center">
            Created your workspace before email sign-in?{" "}
            <button type="button" onClick={() => switchMode("code")} className="font-semibold text-brand-700 hover:underline">
              Use your company code
            </button>
            , then add an email in Settings.
          </p>
        )}
      </div>
    </AuthLayout>
  );
}
