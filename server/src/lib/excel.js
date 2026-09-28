const ExcelJS = require("exceljs");

// Builds a single-sheet .xlsx workbook and returns it as a Buffer, ready
// to send straight over HTTP. A bolded header row plus content-based
// column widths — ExcelJS doesn't auto-size columns, so without this
// every column would open at its default (narrow) width.
async function buildWorkbookBuffer(sheetName, header, rows) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.addRow(header);
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));

  sheet.columns.forEach((column) => {
    let maxLength = 10;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const length = cell.value ? String(cell.value).length : 0;
      if (length > maxLength) maxLength = length;
    });
    column.width = Math.min(maxLength + 2, 40);
  });

  return workbook.xlsx.writeBuffer();
}

// Reads the first sheet of an uploaded .xlsx buffer into an array of
// plain objects keyed by the header row — the same shape parseCsvObjects
// used to return, so callers didn't need to change when this replaced
// CSV parsing for uploads.
async function parseWorkbookRows(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const header = [];
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    header[colNumber - 1] = String(cellText(cell.value)).trim();
  });

  const rows = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const obj = {};
    let hasValue = false;

    header.forEach((key, idx) => {
      if (!key) return;
      const text = cellText(row.getCell(idx + 1).value).trim();
      if (text) hasValue = true;
      obj[key] = text;
    });

    if (hasValue) rows.push(obj);
  }
  return rows;
}

// ExcelJS cell values aren't always plain strings/numbers — rich text and
// formula cells come back as objects. This normalizes any of those to the
// text a user would actually see in the cell, and always returns a string
// so callers can safely call .trim() regardless of the cell's original type.
function cellText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("text" in value) return String(value.text); // rich text
    if ("result" in value) return String(value.result); // formula
    if (value instanceof Date) return value.toISOString();
  }
  return String(value);
}

module.exports = { buildWorkbookBuffer, parseWorkbookRows };
