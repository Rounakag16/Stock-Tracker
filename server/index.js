require("dotenv").config();
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { connectDb } = require("./src/lib/db");

const authRoutes = require("./src/routes/auth");
const companyRoutes = require("./src/routes/company");
const warehouseRoutes = require("./src/routes/warehouses");
const stockRoutes = require("./src/routes/stock");
const stockRequestRoutes = require("./src/routes/stockRequests");
const userRoutes = require("./src/routes/users");
const passwordRoutes = require("./src/routes/password");
const dashboardRoutes = require("./src/routes/dashboard");
const logRoutes = require("./src/routes/logs");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cookieParser());

// In development the React app runs on its own Vite dev server (port 5173)
// and needs CORS + credentials to call this API. In production the React
// build is served by this same Express app, so CORS isn't needed there.
if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
      credentials: true,
    })
  );
}

app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/stock/requests", stockRequestRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/users/password", passwordRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/logs", logRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Serve the built React app (npm run build in /client outputs to
// /client/dist). Any route that isn't an API call falls through to
// index.html so React Router can handle client-side routing.
const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

// Final safety net: every route handler above is wrapped in asyncHandler
// (see src/lib/asyncHandler.js), which forwards any error here via next(err)
// instead of letting it crash the process. This turns "one bad request" —
// e.g. a malformed date or an invalid id — into a clean error response
// instead of an outage for every company using the app.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: status === 500 ? "Something went wrong" : err.message });
});

// Absolute last resort — logs anything that somehow still slips through
// (e.g. a throw outside any request, in a timer or event handler) instead
// of taking the whole server down.
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
