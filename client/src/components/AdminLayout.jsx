import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { AdminNav } from "./Nav";
import { AdminShellSkeleton } from "./Skeleton";
import { AccountGate, needsGate } from "./AccountGate";
import { get, post } from "../lib/api";
import { useAuthConfig } from "../lib/authConfig";

// A slim strip above every admin page while the admin's account has no
// confirmed email — without one they can't recover it if they're locked out.
function EmailBanner({ user }) {
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const [dismissed, setDismissed] = useState(false);
  const location = useLocation();
  const config = useAuthConfig();
  // With email delivery switched off there's no link to send, so only
  // nudge admins who have no email at all.
  if (user.email && !config?.emailEnabled) return null;
  if (dismissed || user.emailVerified || location.pathname.startsWith("/admin/settings")) return null;

  async function resend() {
    setState("sending");
    const { ok } = await post("/auth/resend-verification", {});
    setState(ok ? "sent" : "error");
  }

  return (
    <div className="bg-accent-50 border-b border-accent-200 text-accent-900 text-sm">
      <div className="page-container !py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        {user.email ? (
          <span className="flex-1 min-w-0">
            {state === "sent" ? (
              <>Sent — check <span className="font-semibold">{user.email}</span> for the confirmation link.</>
            ) : (
              <>Confirm <span className="font-semibold break-all">{user.email}</span> so you can reset your password if you forget it.</>
            )}
          </span>
        ) : (
          <span className="flex-1 min-w-0">Add an email to your account so you can sign in with it and recover your password.</span>
        )}
        {user.email ? (
          state !== "sent" && (
            <button type="button" onClick={resend} disabled={state === "sending"} className="font-semibold underline underline-offset-2">
              {state === "sending" ? "Sending…" : state === "error" ? "Try again" : "Resend link"}
            </button>
          )
        ) : (
          <Link to="/admin/settings" className="font-semibold underline underline-offset-2">
            Add email
          </Link>
        )}
        <button type="button" onClick={() => setDismissed(true)} className="text-accent-800/70 hover:text-accent-900" aria-label="Dismiss">
          ✕
        </button>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const [status, setStatus] = useState("loading"); // loading | ok | denied | wrong-role
  const [user, setUser] = useState(null);

  const load = useCallback(async () => {
    const { data } = await get("/auth/login");
    if (!data.user) return setStatus("denied");
    if (data.user.role !== "admin") return setStatus("wrong-role");
    setUser(data.user);
    setStatus("ok");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (status === "loading") return <AdminShellSkeleton />;
  if (status === "denied") return <Navigate to="/login" replace />;
  if (status === "wrong-role") return <Navigate to="/employee" replace />;
  if (needsGate(user)) return <AccountGate user={user} onDone={load} />;

  return (
    <div className="min-h-screen bg-paper">
      <AdminNav username={user.username} companyName={user.companyName || ""} hasPassword={user.hasPassword} />
      <div className="admin-content">
        <EmailBanner user={user} />
        <Outlet context={{ user, reloadUser: load }} />
      </div>
    </div>
  );
}
