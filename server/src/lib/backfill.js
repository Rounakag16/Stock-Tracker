const ActivityLog = require("../models/ActivityLog");
const StockRequest = require("../models/StockRequest");
const { toDateKey } = require("./dates");

// One-time, idempotent migration: rows written before entryDate existed get
// it derived from createdAt (in APP_TIMEZONE). Only touches rows still
// missing it, so after the first run this is a single cheap empty query.
async function backfillModel(Model) {
  const cursor = Model.find({ $or: [{ entryDate: null }, { entryDate: { $exists: false } }] })
    .select("_id createdAt")
    .lean()
    .cursor();

  let ops = [];
  let count = 0;
  for await (const doc of cursor) {
    ops.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { entryDate: toDateKey(doc.createdAt || new Date()) } },
      },
    });
    if (ops.length >= 500) {
      await Model.bulkWrite(ops, { ordered: false });
      count += ops.length;
      ops = [];
    }
  }
  if (ops.length) {
    await Model.bulkWrite(ops, { ordered: false });
    count += ops.length;
  }
  return count;
}

async function backfillEntryDates() {
  const logs = await backfillModel(ActivityLog);
  const requests = await backfillModel(StockRequest);
  if (logs || requests) {
    console.log(`Backfilled entryDate on ${logs} log(s) and ${requests} request(s)`);
  }
}

module.exports = { backfillEntryDates };
