import { useState } from "react";
import { Modal, Alert, PasswordInput } from "./ui";
import { NewPasswordFields, passwordsReady } from "./PasswordFields";
import { post } from "../lib/api";

// Three uses:
//   - change your own password (asks for the current one)
//   - set a first password on a Google-only account (hasPassword=false)
//   - an admin resetting an employee's password (resetUserId)
export function ChangePasswordModal({ open, onClose, resetUserId, resetUsername, hasPassword = true, onSaved }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isReset = !!resetUserId;
  const needsCurrent = !isReset && hasPassword;

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
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setSubmitting(true);
    const body = { newPassword };
    if (needsCurrent) body.currentPassword = currentPassword;
    if (isReset) body.userId = resetUserId;

    const { ok, data } = await post("/users/password", body);
    setSubmitting(false);

    if (!ok) {
      setError(data.error);
      return;
    }

    setSuccess(
      isReset
        ? `Password reset. ${resetUsername} has been signed out and will choose their own password next time they sign in.`
        : "Password saved. You've been signed out on your other devices."
    );
    onSaved?.();
    setTimeout(handleClose, isReset ? 2500 : 1800);
  }

  const title = isReset ? `Reset password — ${resetUsername}` : hasPassword ? "Change password" : "Set a password";

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {isReset && (
          <p className="text-sm text-slate-500">
            Give {resetUsername} this temporary password in person. They'll be asked to replace it with their own when they next sign in.
          </p>
        )}
        {!isReset && !hasPassword && (
          <p className="text-sm text-slate-500">
            You sign in with Google. Add a password to also sign in with your email.
          </p>
        )}

        {needsCurrent && (
          <div>
            <label htmlFor="current-password" className="block text-sm font-semibold text-ink mb-1.5">
              Current password
            </label>
            <PasswordInput
              id="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
        )}

        <NewPasswordFields
          password={newPassword}
          confirm={confirmPassword}
          onPassword={setNewPassword}
          onConfirm={setConfirmPassword}
          label={isReset ? "Temporary password" : "New password"}
          confirmLabel={isReset ? "Confirm temporary password" : "Confirm new password"}
          idPrefix={isReset ? "reset" : "change"}
        />

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={submitting || !!success || !passwordsReady(newPassword, confirmPassword) || (needsCurrent && !currentPassword)}
        >
          {submitting ? "Saving…" : isReset ? "Reset password" : "Save password"}
        </button>
      </form>
    </Modal>
  );
}
