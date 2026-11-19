import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Alert } from "../components/ui";
import { AuthLayout, Field } from "../components/AuthLayout";
import { GoogleButton, OrDivider } from "../components/GoogleButton";
import { NewPasswordFields, passwordsReady } from "../components/PasswordFields";
import { post } from "../lib/api";
import { useAuthConfig } from "../lib/authConfig";

// Mirrors server/src/lib/slugify.js so people can see their company code
// before signing up. The server may still add a "-2" if the code is taken.
function previewSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const PANEL_POINTS = [
  "A private workspace just for your business",
  "Add warehouses, items and employees in minutes",
  "Bring existing stock in from an Excel sheet",
];

const NEXT_STEPS = [
  { title: "Add your warehouses and items", body: "Or upload your existing stock from Excel." },
  { title: "Create logins for your team", body: "On the Team page — share the company code with them." },
  { title: "Approve requests as they come in", body: "Stock only changes once you approve." },
];

function TermsCheckbox({ checked, onChange }) {
  return (
    <label className="flex items-start gap-3 text-sm text-slate-600 cursor-pointer">
      <input
        type="checkbox"
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required
      />
      <span>
        I agree to the{" "}
        <Link to="/terms" target="_blank" className="font-semibold text-brand-700 hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link to="/privacy" target="_blank" className="font-semibold text-brand-700 hover:underline">
          Privacy Policy
        </Link>
        , and confirm I'm at least 18 and allowed to sign up for this business.
      </span>
    </label>
  );
}

function BusinessNameField({ value, onChange }) {
  const slug = previewSlug(value);
  return (
    <Field
      id="companyName"
      label="Business name"
      hint={
        slug ? (
          <>
            Your company code will be <span className="font-mono font-semibold text-ink">{slug}</span>
          </>
        ) : (
          "You can rename it later in Settings."
        )
      }
    >
      <input
        id="companyName"
        type="text"
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Sharma Hardware"
        autoComplete="organization"
        maxLength={80}
        required
      />
    </Field>
  );
}

function WorkspaceReady({ companySlug, email, verifySent }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(companySlug);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (e.g. non-HTTPS); the code is still visible.
    }
  }

  return (
    <AuthLayout
      title="Your workspace is ready"
      subtitle="Share this company code with your employees — they'll enter it when they sign in."
      panelTitle="You're all set. Next, add some stock."
      panelPoints={PANEL_POINTS}
    >
      <div className="space-y-6">
        {verifySent && (
          <Alert
            type="info"
            message={`We've sent a link to ${email} to confirm your email address. Confirming it lets you reset your password if you ever forget it.`}
          />
        )}
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">Company code</p>
          <div className="flex items-center justify-between gap-3 mt-2">
            <p className="font-mono text-xl font-bold text-ink break-all">{companySlug}</p>
            <button type="button" onClick={copyCode} className="btn-secondary !min-h-0 !py-2 text-sm shrink-0">
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-brand-800 mt-3">You can always find it later under Settings.</p>
        </div>

        <ol className="space-y-4">
          {NEXT_STEPS.map((step, i) => (
            <li key={step.title} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full border border-line text-slate-600 text-xs font-bold font-mono flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{step.title}</p>
                <p className="text-sm text-slate-500">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <button onClick={() => navigate("/admin")} className="btn-primary w-full !py-3.5 text-base">
          Go to your dashboard
        </button>
      </div>
    </AuthLayout>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const config = useAuthConfig();

  // Set when the person arrived from "Continue with Google" without an
  // account yet — only the business name and Terms are still needed.
  const [google, setGoogle] = useState(location.state?.google || null);

  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null); // { companySlug, email, verifySent }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!accepted) {
      setError("Please accept the Terms of Service and Privacy Policy to continue");
      return;
    }

    if (google) {
      setLoading(true);
      const { ok, data } = await post("/auth/google/register", {
        signupToken: google.signupToken,
        companyName,
        acceptTerms: true,
      });
      setLoading(false);
      if (!ok) {
        setError(data.error);
        return;
      }
      setDone({ companySlug: data.companySlug, email: google.email, verifySent: false });
      return;
    }

    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    const { ok, data } = await post("/auth/register", { companyName, name, email, password, acceptTerms: true });
    setLoading(false);
    if (!ok) {
      setError(data.error || "Could not create your workspace");
      return;
    }
    setDone({ companySlug: data.companySlug, email: email.trim(), verifySent: !!config?.emailEnabled });
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
      setGoogle({ signupToken: data.signupToken, email: data.email, name: data.name });
      return;
    }
    // Already has an account — just sign them in.
    navigate(data.user.role === "admin" ? "/admin" : "/employee", { replace: true });
  }

  if (done) return <WorkspaceReady {...done} />;

  const canSubmit = google
    ? companyName.trim() && accepted
    : companyName.trim() && email.trim() && passwordsReady(password, confirm) && accepted;

  return (
    <AuthLayout
      title={google ? "Name your workspace" : "Create your workspace"}
      subtitle={
        google
          ? `Signed in with Google as ${google.email}. One last step.`
          : "Set up inventory management for your business. It takes about a minute."
      }
      topLink={{ text: "Already have a workspace?", label: "Sign in", to: "/login" }}
      panelTitle="Know what's on the shelf, at every location."
      panelPoints={PANEL_POINTS}
      footer={<>You'll be the admin. Employees don't sign up here — you create their logins from the Team page.</>}
    >
      <div className="space-y-5">
        {error && <Alert type="error" message={error} onDismiss={() => setError("")} />}

        {!google && config?.googleClientId && (
          <>
            <GoogleButton clientId={config.googleClientId} onCredential={handleGoogle} text="signup_with" />
            <OrDivider />
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <BusinessNameField value={companyName} onChange={setCompanyName} />

          {!google && (
            <>
              <Field id="name" label="Your name" hint="Shown to your team in requests and logs.">
                <input
                  id="name"
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rohit Sharma"
                  autoComplete="name"
                  maxLength={60}
                  required
                />
              </Field>

              <Field id="email" label="Work email" hint="You'll sign in with this, and we'll use it for password resets.">
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

              <NewPasswordFields password={password} confirm={confirm} onPassword={setPassword} onConfirm={setConfirm} />
            </>
          )}

          <TermsCheckbox checked={accepted} onChange={setAccepted} />

          <button type="submit" className="btn-primary w-full !py-3.5 text-base" disabled={loading || !canSubmit}>
            {loading ? "Creating workspace…" : "Create workspace"}
          </button>

          {google && (
            <button type="button" className="btn-ghost w-full" onClick={() => setGoogle(null)}>
              Use an email and password instead
            </button>
          )}
        </form>
      </div>
    </AuthLayout>
  );
}
