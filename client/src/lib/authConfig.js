import { useEffect, useState } from "react";
import { get } from "./api";

// What the server says the sign-in screens can offer (Google sign-in,
// email-based password reset). Fetched once per page load and shared.
let cached = null;
let pending = null;

function load() {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    pending = get("/auth/config").then(({ ok, data }) => {
      cached = ok ? data : { googleClientId: null, emailEnabled: false };
      return cached;
    });
  }
  return pending;
}

export function useAuthConfig() {
  const [config, setConfig] = useState(cached);
  useEffect(() => {
    let alive = true;
    load().then((c) => alive && setConfig(c));
    return () => {
      alive = false;
    };
  }, []);
  return config;
}
