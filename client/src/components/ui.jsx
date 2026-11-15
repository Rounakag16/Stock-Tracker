import { useEffect, useState } from "react";

// Internal action/type values stay "add" / "deduct" / "move" throughout the
// app (matches the database), but "deduct" reads as "Sale" to the user.
const ACTION_WORDS = { add: "Add", deduct: "Sale", move: "Move" };
export function actionWord(type) {
  return ACTION_WORDS[type] || type;
}

// --- Entry dates ---
// Stock entries carry a business date as "YYYY-MM-DD" (local calendar day).
export function todayKey() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function shiftDateKey(key, days) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

// "2026-11-15" → "15 Nov 2026". Parsed as UTC parts so the browser's
// timezone can never shift it to the previous/next day.
export function formatDateKey(key) {
  if (!key) return "—";
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Date picker for an entry date. Can't pick a future day.
export function DateField({ label = "Date", value, onChange, hint }) {
  const today = todayKey();
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input
        type="date"
        className="input"
        value={value}
        max={today}
        onChange={(e) => onChange(e.target.value)}
        required
      />
      {value && value !== today && (
        <p className="text-xs text-amber-700 mt-1.5">Backdated — this will be recorded on {formatDateKey(value)}.</p>
      )}
      {hint && <p className="text-xs text-slate-500 mt-1.5">{hint}</p>}
    </div>
  );
}

// A password <input> with a show/hide eye toggle. Accepts the same props
// as a normal input (value, onChange, placeholder, required, etc.) and
// spreads any extras through.
export function PasswordInput({ className = "input", ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input type={visible ? "text" : "password"} className={`${className} pr-11`} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {visible ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  // Lock the page behind the sheet so scrolling a long form on a phone
  // doesn't scroll the page underneath; Escape closes on keyboards.
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md card rounded-b-none sm:rounded-2xl p-5 sm:p-6 pb-safe-5 sm:pb-6 max-h-[90dvh] overflow-y-auto overscroll-contain">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-slate-900 min-w-0 break-words">{title}</h2>
          <button onClick={onClose} className="p-2 -mr-2 rounded-lg hover:bg-slate-100 text-slate-500" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Alert({ type, message, onDismiss }) {
  const styles = {
    error: "bg-red-50 text-red-800 border-red-200",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    info: "bg-brand-50 text-brand-800 border-brand-200",
  };

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles[type]} flex items-start justify-between gap-2`}>
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-paper border border-line flex items-center justify-center">
        <svg className="w-8 h-8 text-ink/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
    </div>
  );
}

export function QuantityBadge({ quantity, threshold }) {
  const effectiveThreshold = threshold ?? 10;
  const color =
    quantity === 0
      ? ACTION_TONES.danger.badge
      : quantity <= effectiveThreshold
        ? ACTION_TONES.adjusted.badge
        : ACTION_TONES.added.badge;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-mono font-bold ${color}`}>
      {quantity}
    </span>
  );
}

// One colour per kind of stock action, used for badges, numbers and table
// cells everywhere. `badge` = tinted chip, `text` = number on white (AA).
// Blue is reserved for interaction, so it never marks a stock action.
export const ACTION_TONES = {
  added: { badge: "bg-emerald-100 text-emerald-800", text: "text-emerald-700" },
  sale: { badge: "bg-orange-100 text-orange-800", text: "text-orange-700" },
  moved: { badge: "bg-violet-100 text-violet-800", text: "text-violet-700" },
  adjusted: { badge: "bg-amber-100 text-amber-800", text: "text-amber-700" },
  danger: { badge: "bg-red-100 text-red-800", text: "text-red-700" },
  neutral: { badge: "bg-slate-100 text-slate-700", text: "text-slate-700" },
};

// Request actions (add / deduct / move) mapped to their tone.
export const REQUEST_TONE = { add: "added", deduct: "sale", move: "moved" };

const ACTION_LABELS = {
  create_item: { text: "Created", tone: "added" },
  delete_item: { text: "Deleted", tone: "danger" },
  edit_item: { text: "Edited Item", tone: "neutral" },
  add_quantity: { text: "Added", tone: "added" },
  deduct_quantity: { text: "Sale", tone: "sale" },
  edit_quantity: { text: "Edited Qty", tone: "adjusted" },
  transfer_out: { text: "Moved Out", tone: "moved" },
  transfer_in: { text: "Moved In", tone: "moved" },
  create_warehouse: { text: "New Warehouse", tone: "added" },
  delete_warehouse: { text: "Del Warehouse", tone: "danger" },
  rename_warehouse: { text: "Renamed Warehouse", tone: "neutral" },
  create_employee: { text: "New Employee", tone: "added" },
  delete_employee: { text: "Removed Employee", tone: "danger" },
  change_password: { text: "Password", tone: "neutral" },
  request_submitted: { text: "Requested", tone: "adjusted" },
  request_approved: { text: "Approved", tone: "added" },
  request_denied: { text: "Denied", tone: "danger" },
  request_edited: { text: "Edited", tone: "adjusted" },
};

// Ordered {value, label} list for filter UIs (e.g. the Logs page filter
// panel) — derived from the same map ActionLabel uses, so labels always
// match what's shown on each log entry.
export const LOG_ACTION_OPTIONS = Object.entries(ACTION_LABELS).map(([value, { text }]) => ({
  value,
  label: text,
}));

export function ActionLabel({ action }) {
  const label = ACTION_LABELS[action] || { text: action, tone: "neutral" };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${ACTION_TONES[label.tone].badge}`}>
      {label.text}
    </span>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    pending: ACTION_TONES.adjusted.badge,
    approved: ACTION_TONES.added.badge,
    denied: ACTION_TONES.danger.badge,
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md capitalize ${styles[status] || "bg-slate-100"}`}>
      {status}
    </span>
  );
}
