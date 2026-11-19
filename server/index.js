require("dotenv").config();
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const { connectDb } = require("./src/lib/db");
const { backfillEntryDates } = require("./src/lib/backfill");

const authRoutes = require("./src/routes/auth");
const companyRoutes = require("./src/routes/company");
const warehouseRoutes = require("./src/routes/warehouses");
const stockRoutes = require("./src/routes/stock");
const stockRequestRoutes = require("./src/routes/stockRequests");
const userRoutes = require("./src/routes/users");
const passwordRoutes = require("./src/routes/password");
const dashboardRoutes = require("./src/routes/dashboard");
const logRoutes = require("./src/routes/logs");
const notificationRoutes = require("./src/routes/notifications");
const tagRoutes = require("./src/routes/tags");
const reportRoutes = require("./src/routes/reports");

const app = express();
const PORT = process.env.PORT || 4000;

// Render (and most PaaS hosts) put the app behind a single reverse proxy,
// which sets X-Forwarded-For. Without telling Express to trust that one
// hop, express-rate-limit refuses to use the header at all — since it
// can't tell whether it's genuine or spoofed by the client — and throws
// on every rate-limited request (login, register) instead of silently
// falling back to something wrong. `1` means "trust exactly one hop",
// which matches Render's setup; a deployment behind more than one proxy
// would need a higher number here instead.
app.set("trust proxy", 1);
app.disable("x-powered-by");

// Security headers. The Content Security Policy only allows scripts, styles
// and frames from this site plus the two outside services the app really
// uses: Google Fonts and Google Sign-In.
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'", "https://accounts.google.com/gsi/client"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com/gsi/style"],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
        "img-src": ["'self'", "data:", "blob:", "https://*.googleusercontent.com"],
        "frame-src": ["https://accounts.google.com/gsi/"],
        "connect-src": ["'self'", "https://accounts.google.com/gsi/"],
        "form-action": ["'self'"],
        "frame-ancestors": ["'none'"],
        ...(process.env.NODE_ENV === "production" ? {} : { "upgrade-insecure-requests": null }),
      },
    },
    // Google Sign-In opens a popup that has to message this page back.
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

// Stock uploads arrive as a base64-encoded .xlsx inside the JSON body, so
// the default 100kb limit would reject any real-world spreadsheet.
app.use(express.json({ limit: "10mb" }));
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

// Defence in depth against cross-site request forgery: the session cookie
// is already SameSite=Lax, and on top of that any state-changing API call
// that comes from a different website is refused outright.
const allowedOrigins = new Set(
  [process.env.APP_URL, process.env.CLIENT_ORIGIN, "http://localhost:5173", "http://localhost:4000"]
    .filter(Boolean)
    .map((o) => o.replace(/\/+$/, ""))
);
app.use("/api", (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("origin");
  if (!origin) return next(); // same-origin requests from older browsers, curl, tests
  const self = `${req.protocol}://${req.get("host")}`;
  if (origin === self || allowedOrigins.has(origin)) return next();
  return res.status(403).json({ error: "Cross-site request blocked" });
});

// API responses are per-user and must never be cached by the browser or a
// proxy (a shared computer's back button would otherwise show stock data).
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/stock/requests", stockRequestRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/users/password", passwordRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/reports", reportRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Unknown API routes get a JSON 404 rather than an HTML page the client
// can't parse.
app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

// Serve the built React app (npm run build in /client outputs to
// /client/dist). Any route that isn't an API call falls through to
// index.html so React Router can handle client-side routing.
const clientDist = path.join(__dirname, "..", "client", "dist");
// Vite fingerprints everything under /assets, so those can be cached for a
// year; index.html must always be revalidated so a deploy shows up at once.
app.use(
  "/assets",
  express.static(path.join(clientDist, "assets"), { immutable: true, maxAge: "1y", fallthrough: false })
);
app.use(express.static(clientDist, { index: false, maxAge: "1h" }));
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.set("Cache-Control", "no-cache");
  res.sendFile(path.join(clientDist, "index.html"));
});

// Final safety net: every route handler above is wrapped in asyncHandler
// (see src/lib/asyncHandler.js), which forwards any error here via next(err)
// instead of letting it crash the process. This turns "one bad request" —
// e.g. a malformed date or an invalid id — into a clean error response
// instead of an outage for every company using the app.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Malformed ids (e.g. /api/stock/not-an-id) are client errors, not
  // server faults — answer 400 instead of logging a 500.
  if (err.name === "CastError") {
    return res.status(400).json({ error: `Invalid ${err.path || "value"}` });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "That upload is too large (max 10 MB)" });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Request body is not valid JSON" });
  }
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  return res.status(status).json({ error: status >= 500 ? "Something went wrong" : err.message });
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
  .then(async () => {
    try {
      await backfillEntryDates();
    } catch (err) {
      // Non-fatal: the app still works, older rows just won't show up in
      // date filters until the next successful start.
      console.error("entryDate backfill failed:", err.message);
    }
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
