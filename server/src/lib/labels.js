// Internal action values stay "add" / "deduct" / "move" everywhere in the
// database (StockRequest.action, ActivityLog.action) so existing records
// and queries keep working unchanged. This maps them to the word we want
// to show people — currently "Deduct" reads as "Sale" everywhere.
const ACTION_WORDS = { add: "add", deduct: "sale", move: "move" };

function actionWord(type) {
  return ACTION_WORDS[type] || type;
}

// Display labels for ActivityLog.action values — mirrors
// client/src/components/ui.jsx's ACTION_LABELS so the CSV export reads the
// same way the UI does.
const ACTIVITY_ACTION_LABELS = {
  create_item: "Created",
  delete_item: "Deleted",
  add_quantity: "Added",
  deduct_quantity: "Sale",
  edit_quantity: "Edited Qty",
  transfer_out: "Moved Out",
  transfer_in: "Moved In",
  create_warehouse: "New Warehouse",
  delete_warehouse: "Deleted Warehouse",
  create_employee: "New Employee",
  change_password: "Password Changed",
  request_submitted: "Requested",
  request_approved: "Approved",
  request_denied: "Denied",
  request_edited: "Edited",
};

function activityActionLabel(action) {
  return ACTIVITY_ACTION_LABELS[action] || action;
}

module.exports = { actionWord, ACTIVITY_ACTION_LABELS, activityActionLabel };
