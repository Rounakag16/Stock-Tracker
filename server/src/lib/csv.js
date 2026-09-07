// Small dependency-free CSV helpers. Good enough for the simple flat rows
// this app exports/imports (no nested structures) — a real library would
// be overkill here.

// Wraps a field in quotes and escapes internal quotes, only when needed —
// keeps plain fields readable while staying safe for anything containing
// a comma, quote, or newline.
function csvField(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(header, rows) {
  const lines = [header.map(csvField).join(",")];
  for (const row of rows) {
    lines.push(row.map(csvField).join(","));
  }
  return lines.join("\r\n");
}

// Parses CSV text into an array of row-arrays, handling quoted fields
// (including embedded commas, newlines, and escaped "" quotes). Does not
// handle every RFC 4180 edge case, but covers what Excel/Sheets produce.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  // Normalize line endings so \r\n inside/outside quotes behaves the same.
  const input = text.replace(/\r\n/g, "\n");

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  // Last field/row if the text doesn't end with a newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

// Parses CSV text with a header row into an array of objects keyed by the
// (trimmed) header names.
function parseCsvObjects(text) {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((row) => {
    const obj = {};
    header.forEach((key, idx) => {
      obj[key] = (row[idx] ?? "").trim();
    });
    return obj;
  });
}

module.exports = { csvField, toCsv, parseCsv, parseCsvObjects };
