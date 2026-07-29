const mongoose = require("mongoose");

let connected = false;

async function connectDb() {
  if (connected) return;
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/stock-tracker";
  await mongoose.connect(uri);
  connected = true;
  console.log("Connected to MongoDB");
}

module.exports = { connectDb };
