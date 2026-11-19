import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Alert } from "../components/ui";
import { AuthLayout } from "../components/AuthLayout";
import { NewPasswordFields, passwordsReady } from "../components/PasswordFields";
import { post } from "../lib/api";

const PANEL = {
  panelTitle: "Pick something you'll remember.",
  panelPoints: [
    "Longer beats complicated — a short phrase works well",
    "Don't reuse a password from another site",
    "You'll be signed out on every other device",
  ],
};

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setSubmitting(true);
    const { ok, data } = await post("/auth/reset-password", { token, newPassword: password });
    setSubmitting(false);
    if (!ok) {
      setError(data.error);
      return;
    }
    navigate("/login", { replace: true, state: { notice: "Your password has been reset. Sign in with your new password." } });
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Set a new password for your Warely account." {...PANEL}>
      {!token ? (
        <div className="space-y-5">
          <Alert type="error" message="This link is incomplete. Request a new one and open it straight from the email." />
          <Link to="/forgot-password" className="btn-primary w-full">
            Request a new link
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="space-y-2">
              <Alert type="error" message={error} onDismiss={() => setError("")} />
              {/expired|invalid/i.test(error) && (
                <Link to="/forgot-password" className="text-sm font-semibold text-brand-700 hover:underline">
                  Request a new link
                </Link>
              )}
            </div>
          )}
          <NewPasswordFields
            password={password}
            confirm={confirm}
            onPassword={setPassword}
            onConfirm={setConfirm}
            label="New password"
            confirmLabel="Confirm new password"
            autoFocus
          />
          <button type="submit" className="btn-primary w-full !py-3.5 text-base" disabled={submitting || !passwordsReady(password, confirm)}>
            {submitting ? "Saving…" : "Set new password"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
