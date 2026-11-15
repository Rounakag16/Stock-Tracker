// Business-date helpers.
//
// Every stock entry carries an `entryDate` — the calendar day the user says
// the add/sale/move happened on, stored as a plain "YYYY-MM-DD" string.
// A string (rather than a Date) means "which day is this" never shifts with
// the server's timezone, and ISO-formatted strings sort and range-compare
// correctly ("2026-01-09" < "2026-01-10"), so $gte/$lte/$sort all just work.
//
// "Today" is resolved in APP_TIMEZONE (default Asia/Kolkata), not the
// server's local zone — hosts like Render run in UTC, which would otherwise
// make anything recorded between 00:00 and 05:30 IST land on the previous day.

const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Converts a JS Date (an instant) to the calendar day it falls on in
// APP_TIMEZONE. "en-CA" formats as YYYY-MM-DD.
function toDateKey(date) {
  return formatter.format(date);
}

function todayKey() {
  return toDateKey(new Date());
}

function isValidDateKey(value) {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

// Validates a user-supplied entry date. Missing/empty means "today".
// Future dates are rejected — stock can't be sold tomorrow.
function resolveEntryDate(value, label = "Date") {
  if (value === undefined || value === null || value === "") return todayKey();
  if (!isValidDateKey(value)) throw badRequest(`${label} must be a valid date (YYYY-MM-DD)`);
  if (value > todayKey()) throw badRequest(`${label} can't be in the future`);
  return value;
}

// Validates a date used only for filtering/reporting (future allowed).
function parseDateKeyParam(value, label = "Date") {
  if (!isValidDateKey(value)) throw badRequest(`${label} is not a valid date`);
  return value;
}

// Shifts a YYYY-MM-DD key by whole days (pure calendar math, no timezone).
function addDays(key, days) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

module.exports = {
  APP_TIMEZONE,
  toDateKey,
  todayKey,
  isValidDateKey,
  resolveEntryDate,
  parseDateKeyParam,
  addDays,
};
