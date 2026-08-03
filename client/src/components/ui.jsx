import { useState } from "react";

// Internal action/type values stay "add" / "deduct" / "move" throughout the
// app (matches the database), but "deduct" reads as "Sale" to the user.
const ACTION_WORDS = { add: "Add", deduct: "Sale", move: "Move" };
export function actionWord(type) {
  return ACTION_WORDS[type] || type;
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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md card rounded-b-none sm:rounded-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
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
    info: "bg-blue-50 text-blue-800 border-blue-200",
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

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
    </div>
  );
}

export function QuantityBadge({ quantity }) {
  const color =
    quantity === 0
      ? "bg-red-100 text-red-700"
      : quantity <= 10
        ? "bg-amber-100 text-amber-700"
        : "bg-emerald-100 text-emerald-700";

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold ${color}`}>
      {quantity}
    </span>
  );
}

const ACTION_LABELS = {
  create_item: { text: "Created", color: "bg-blue-100 text-blue-700" },
  delete_item: { text: "Deleted", color: "bg-red-100 text-red-700" },
  add_quantity: { text: "Added", color: "bg-emerald-100 text-emerald-700" },
  deduct_quantity: { text: "Sale", color: "bg-orange-100 text-orange-700" },
  transfer_out: { text: "Moved Out", color: "bg-purple-100 text-purple-700" },
  transfer_in: { text: "Moved In", color: "bg-indigo-100 text-indigo-700" },
  create_warehouse: { text: "New Warehouse", color: "bg-teal-100 text-teal-700" },
  delete_warehouse: { text: "Del Warehouse", color: "bg-red-100 text-red-700" },
  create_employee: { text: "New Employee", color: "bg-cyan-100 text-cyan-700" },
  change_password: { text: "Password", color: "bg-slate-100 text-slate-700" },
  request_submitted: { text: "Requested", color: "bg-yellow-100 text-yellow-800" },
  request_approved: { text: "Approved", color: "bg-emerald-100 text-emerald-700" },
  request_denied: { text: "Denied", color: "bg-red-100 text-red-700" },
  request_edited: { text: "Edited", color: "bg-sky-100 text-sky-700" },
};

// Ordered {value, label} list for filter UIs (e.g. the Logs page filter
// panel) — derived from the same map ActionLabel uses, so labels always
// match what's shown on each log entry.
export const LOG_ACTION_OPTIONS = Object.entries(ACTION_LABELS).map(([value, { text }]) => ({
  value,
  label: text,
}));

export function ActionLabel({ action }) {
  const label = ACTION_LABELS[action] || { text: action, color: "bg-slate-100 text-slate-700" };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${label.color}`}>
      {label.text}
    </span>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-700",
    denied: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md capitalize ${styles[status] || "bg-slate-100"}`}>
      {status}
    </span>
  );
}
