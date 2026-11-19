import { PasswordInput } from "./ui";

export const MIN_PASSWORD = 8;

// A rough strength estimate for the meter — length matters most, variety a
// little. The server makes the real decision (including a breach check);
// this only nudges people toward longer passwords while they type.
export function passwordScore(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= MIN_PASSWORD) score += 1;
  if (pw.length >= 12) score += 1;
  if (pw.length >= 16) score += 1;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(pw)).length;
  if (kinds >= 3) score += 1;
  if (/^(.)\1+$/.test(pw) || /^(?:0123|1234|abcd|qwer|pass)/i.test(pw)) score = Math.min(score, 1);
  return Math.min(score, 4);
}

const LEVELS = [
  { label: "Too short", bar: "bg-slate-200", text: "text-slate-500" },
  { label: "Weak", bar: "bg-red-500", text: "text-red-700" },
  { label: "Fair", bar: "bg-amber-500", text: "text-amber-700" },
  { label: "Good", bar: "bg-emerald-500", text: "text-emerald-700" },
  { label: "Strong", bar: "bg-emerald-600", text: "text-emerald-700" },
];

function StrengthMeter({ password }) {
  const score = password.length < MIN_PASSWORD ? 0 : Math.max(1, passwordScore(password));
  const level = LEVELS[score];
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= score ? level.bar : "bg-slate-200"}`} />
        ))}
      </div>
      <p className={`text-xs mt-1.5 ${level.text}`}>
        {password ? (
          <>
            <span className="font-semibold">{level.label}</span>
            {score === 0 && ` — use at least ${MIN_PASSWORD} characters`}
            {score > 0 && score < 3 && " — a longer password, or a short phrase, is harder to guess"}
          </>
        ) : (
          `At least ${MIN_PASSWORD} characters. A short phrase you'll remember works well.`
        )}
      </p>
    </div>
  );
}

// "New password" + "Confirm password", with a strength meter and a live
// match check. The parent owns both values; use passwordsReady() to gate
// the submit button.
export function NewPasswordFields({
  password,
  confirm,
  onPassword,
  onConfirm,
  label = "Password",
  confirmLabel = "Confirm password",
  idPrefix = "new",
  autoFocus = false,
}) {
  const mismatch = confirm.length > 0 && confirm !== password;
  const matches = confirm.length > 0 && confirm === password;
  return (
    <>
      <div>
        <label htmlFor={`${idPrefix}-password`} className="block text-sm font-semibold text-ink mb-1.5">
          {label}
        </label>
        <PasswordInput
          id={`${idPrefix}-password`}
          value={password}
          onChange={(e) => onPassword(e.target.value)}
          placeholder={`At least ${MIN_PASSWORD} characters`}
          minLength={MIN_PASSWORD}
          maxLength={72}
          autoComplete="new-password"
          autoFocus={autoFocus}
          required
        />
        <StrengthMeter password={password} />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-confirm`} className="block text-sm font-semibold text-ink mb-1.5">
          {confirmLabel}
        </label>
        <PasswordInput
          id={`${idPrefix}-confirm`}
          value={confirm}
          onChange={(e) => onConfirm(e.target.value)}
          placeholder="Type it again"
          autoComplete="new-password"
          aria-invalid={mismatch || undefined}
          required
        />
        {mismatch && <p className="text-xs text-red-700 mt-1.5">Passwords don't match</p>}
        {matches && <p className="text-xs text-emerald-700 mt-1.5">Passwords match</p>}
      </div>
    </>
  );
}

export function passwordsReady(password, confirm) {
  return password.length >= MIN_PASSWORD && password === confirm;
}
