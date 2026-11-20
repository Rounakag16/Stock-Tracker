import { useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "../components/ui";
import { AuthLayout, Field } from "../components/AuthLayout";
import { post } from "../lib/api";

const PANEL = {
  panelTitle: "Locked out? It happens.",
  panelPoints: [
    "Reset links work once and expire after an hour",
    "Every other device is signed out when you reset",
    "Employees: your admin can reset your password from the Team page",
  ],
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { ok, data } = await post("/auth/forgot-password", { email });
    setSubmitting(false);
    if (!ok) {
      setError(data.error);
      return;
    }
    setSentTo(email.trim());
  }

  if (sentTo) {
    return (
      <AuthLayout title="Check your email" subtitle={`If ${sentTo} belongs to a WareSync account, a reset link is on its way.`} {...PANEL}>
        <div className="space-y-5">
          <ul className="space-y-2 text-sm text-slate-600 list-disc pl-5">
            <li>The link expires in 1 hour and can be used once.</li>
            <li>Can't find it? Check your spam or promotions folder.</li>
            <li>Still nothing after a few minutes? Make sure you typed the email you signed up with.</li>
          </ul>
          <Link to="/login" className="btn-primary w-full !py-3.5 text-base">
            Back to sign in
          </Link>
          <button type="button" onClick={() => setSentTo("")} className="btn-ghost w-full">
            Try a different email
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email you sign in with and we'll send you a link to choose a new password."
      topLink={{ text: "Remembered it?", label: "Sign in", to: "/login" }}
      footer={
        <>
          <span className="font-semibold text-ink">Employee?</span> You sign in with a company code, so ask your admin to
          reset your password from the Team page.
        </>
      }
      {...PANEL}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert type="error" message={error} onDismiss={() => setError("")} />}
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
            autoFocus
            required
          />
        </Field>
        <button type="submit" className="btn-primary w-full !py-3.5 text-base" disabled={submitting}>
          {submitting ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthLayout>
  );
}
