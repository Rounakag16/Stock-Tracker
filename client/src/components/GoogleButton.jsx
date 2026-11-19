import { useEffect, useRef, useState } from "react";

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";
let scriptPromise = null;

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error("Google sign-in couldn't load"));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

// Google's own "Sign in with Google" button (Google Identity Services).
// Google requires its rendered button rather than a look-alike, and it
// handles the account picker. onCredential receives the ID token, which
// the server verifies — the browser's word is never trusted on its own.
// The script is only loaded on pages that show this button.
export function GoogleButton({ clientId, onCredential, text = "continue_with" }) {
  const ref = useRef(null);
  const callbackRef = useRef(onCredential);
  const [failed, setFailed] = useState(false);
  callbackRef.current = onCredential;

  useEffect(() => {
    if (!clientId) return undefined;
    let cancelled = false;

    function render() {
      if (cancelled || !ref.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (res) => res?.credential && callbackRef.current(res.credential),
        ux_mode: "popup",
        context: text === "signup_with" ? "signup" : "signin",
      });
      const width = Math.min(400, Math.max(200, ref.current.offsetWidth || 320));
      ref.current.innerHTML = "";
      window.google.accounts.id.renderButton(ref.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text,
        logo_alignment: "center",
        width,
      });
    }

    loadGoogleScript()
      .then(render)
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
    };
  }, [clientId, text]);

  if (!clientId) return null;
  if (failed) {
    return <p className="text-xs text-slate-500 text-center">Google sign-in couldn't load. Check your connection or use your email below.</p>;
  }
  return <div ref={ref} className="w-full min-h-[44px] flex justify-center" />;
}

export function OrDivider({ label = "or" }) {
  return (
    <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400" role="separator">
      <span className="h-px flex-1 bg-line" />
      {label}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
