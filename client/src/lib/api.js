// Paths that are allowed to return 401 without bouncing the user to the
// login page (checking the session, logging in, signing up).
const AUTH_PATHS = ["/auth/login", "/auth/register"];

function fallbackError(status) {
  if (status === 0) return "Can't reach the server. Check your connection and try again.";
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "Not found.";
  if (status === 413) return "That upload is too large.";
  if (status === 429) return "Too many attempts. Please wait a few minutes and try again.";
  return "Something went wrong. Please try again.";
}

// When a session expires mid-use, send the user back to sign in instead of
// leaving every button silently failing.
function handleExpiredSession(path, status) {
  if (status !== 401 || AUTH_PATHS.some((p) => path.startsWith(p))) return;
  if (!window.location.pathname.startsWith("/login")) {
    window.location.assign("/login");
  }
}

// Thin fetch wrapper: always sends cookies, always sends/expects JSON.
// Never throws — network failures come back as { ok: false, status: 0 } —
// and a failed response always carries a human-readable data.error.
export async function api(path, options = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      credentials: "include",
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
      ...options,
    });
  } catch {
    return { ok: false, status: 0, data: { error: fallbackError(0) } };
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (!data.error) data.error = fallbackError(res.status);
    handleExpiredSession(path, res.status);
  }
  return { ok: res.ok, status: res.status, data };
}

export const get = (path) => api(path);
export const post = (path, body) => api(path, { method: "POST", body: JSON.stringify(body) });
export const patch = (path, body) => api(path, { method: "PATCH", body: JSON.stringify(body) });
export const del = (path, body) =>
  api(path, body !== undefined ? { method: "DELETE", body: JSON.stringify(body) } : { method: "DELETE" });

// Downloads a file endpoint (e.g. an Excel export). Unlike navigating to the
// URL directly, a server error here comes back as a message the page can
// show, instead of replacing the app with a raw JSON error page.
export async function download(path, fallbackName = "download.xlsx") {
  let res;
  try {
    res = await fetch(`/api${path}`, { credentials: "include" });
  } catch {
    return { ok: false, error: fallbackError(0) };
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    handleExpiredSession(path, res.status);
    return { ok: false, error: data.error || fallbackError(res.status) };
  }

  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match ? match[1] : fallbackName;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { ok: true };
}
