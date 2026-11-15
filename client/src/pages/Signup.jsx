import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, PasswordInput } from "../components/ui";
import { AuthLayout, Field } from "../components/AuthLayout";
import { post } from "../lib/api";

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

export default function SignupPage() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [companySlug, setCompanySlug] = useState(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

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

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(companySlug);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (e.g. non-HTTPS); the code is still visible.
    }
  }

  if (companySlug) {
    return (
      <AuthLayout
        title="Your workspace is ready"
        subtitle="Share this company code with your employees — they'll enter it when they sign in."
        panelTitle="You're all set. Next, add some stock."
        panelPoints={PANEL_POINTS}
      >
        <div className="space-y-6">
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

  const slug = previewSlug(companyName);

  return (
    <AuthLayout
      title="Create your workspace"
      subtitle="Set up stock tracking for your business. It takes about a minute."
      topLink={{ text: "Already have a workspace?", label: "Sign in", to: "/login" }}
      panelTitle="Know what's on the shelf, at every location."
      panelPoints={PANEL_POINTS}
      footer={
        <>
          You'll be the admin. Employees don't sign up here — you create their logins from the Team page.
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert type="error" message={error} onDismiss={() => setError("")} />}

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
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Sharma Hardware"
            autoComplete="organization"
            required
          />
        </Field>

        <Field id="username" label="Admin username" hint="You'll use this to sign in.">
          <input
            id="username"
            type="text"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. rounak"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </Field>

        <Field id="password" label="Password" hint="At least 6 characters.">
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            minLength={6}
            autoComplete="new-password"
            required
          />
        </Field>

        <button type="submit" className="btn-primary w-full !py-3.5 text-base" disabled={loading}>
          {loading ? "Creating workspace…" : "Create workspace"}
        </button>
      </form>
    </AuthLayout>
  );
}
