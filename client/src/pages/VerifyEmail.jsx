import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert } from "../components/ui";
import { AuthLayout } from "../components/AuthLayout";
import { post } from "../lib/api";

const PANEL = {
  panelTitle: "One less thing to worry about.",
  panelPoints: ["A confirmed email lets you reset your password yourself", "We only email you about your account — never marketing without asking"],
};

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [state, setState] = useState(token ? "working" : "error");
  const [message, setMessage] = useState(token ? "" : "This link is incomplete. Open it straight from the email.");
  const sent = useRef(false);

  useEffect(() => {
    // StrictMode runs effects twice in development; the token is single-use.
    if (!token || sent.current) return;
    sent.current = true;
    post("/auth/verify-email", { token }).then(({ ok, data }) => {
      if (ok) {
        setState("done");
        setMessage(`${data.email} is confirmed.`);
      } else {
        setState("error");
        setMessage(data.error);
      }
    });
  }, [token]);

  return (
    <AuthLayout title={state === "done" ? "Email confirmed" : state === "working" ? "Confirming…" : "Couldn't confirm your email"} {...PANEL}>
      <div className="space-y-5">
        {state === "working" && <div className="skeleton h-12 w-full rounded-xl" />}
        {state === "done" && <Alert type="success" message={message} />}
        {state === "error" && <Alert type="error" message={message} />}
        {state !== "working" && (
          <Link to="/admin/settings" className="btn-primary w-full !py-3.5 text-base">
            {state === "done" ? "Continue to WareSync" : "Go to Settings to send a new link"}
          </Link>
        )}
      </div>
    </AuthLayout>
  );
}
