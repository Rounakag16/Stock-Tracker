import { useState } from "react";
import { Modal, Alert, PasswordInput } from "./ui";
import { post } from "../lib/api";

export function ChangePasswordModal({ open, onClose, resetUserId, resetUsername }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isReset = !!resetUserId;

  function handleClose() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);

    const body = { newPassword };
    if (!isReset) body.currentPassword = currentPassword;
    if (isReset) body.userId = resetUserId;

    const { ok, data } = await post("/users/password", body);
    setSubmitting(false);

    if (!ok) {
      setError(data.error);
      return;
    }

    setSuccess(isReset ? "Password reset successfully" : "Password changed successfully");
    setTimeout(handleClose, 1200);
  }

  return (
    <Modal open={open} onClose={handleClose} title={isReset ? `Reset Password — ${resetUsername}` : "Change Password"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {!isReset && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
            <PasswordInput
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
          <PasswordInput
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={submitting || !!success}>
          {submitting ? "Saving..." : isReset ? "Reset Password" : "Change Password"}
        </button>
      </form>
    </Modal>
  );
}
