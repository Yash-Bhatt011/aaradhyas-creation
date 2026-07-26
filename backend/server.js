require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const db = require("./db");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const collectionRoutes = require("./routes/collections");
const orderRoutes = require("./routes/orders");
const customerRoutes = require("./routes/customers");
const discountRoutes = require("./routes/discounts");
const settingsRoutes = require("./routes/settings");
const bannerRoutes = require("./routes/banners");
const adsRoutes      = require("./routes/ads");
const paymentRoutes = require("./routes/payments");

const app = express();

// In development: allow any localhost port (Vite picks 5173, 5174, 5175 etc.)
// In production: set FRONTEND_URL=https://yourdomain.com in .env for your custom domain.
// Vercel preview URLs (per-branch, per-commit) change constantly, so any *.vercel.app
// subdomain is auto-trusted below — they're all your own deployments.
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map(s => s.trim())
  : [];

const LOCALHOST_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const VERCEL_RE     = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl, Postman, mobile apps, server-to-server
    if (allowedOrigins.includes(origin)) return cb(null, true); // explicit FRONTEND_URL match
    if (VERCEL_RE.test(origin))          return cb(null, true); // any Vercel deployment (prod + previews)
    if (LOCALHOST_RE.test(origin))       return cb(null, true); // local dev, any port
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/ads",      adsRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await db.init(); // connects to MongoDB if MONGODB_URI is set, else no-op

    // Auto-seed on first boot: if there's no admin account yet, populate
    // starter content + create the admin from ADMIN_EMAIL/ADMIN_PASSWORD.
    // This makes deploys self-healing on free hosting tiers with no Shell
    // access — you never need to run `npm run seed` manually.
    const current = db.read();
    if (!current.admins || current.admins.length === 0) {
      console.log("No admin account found — running first-boot seed...");
      const { runSeed } = require("./seedData");
      await runSeed(current);
      await db.write(current);
      console.log(`First-boot seed complete. Admin: ${process.env.ADMIN_EMAIL || "admin@aaradhyascreation.com"}`);
    } else if (process.env.RESET_ADMIN === "true") {
      // Escape hatch for free-tier hosts with no Shell access: set RESET_ADMIN=true
      // in your environment variables to force-recreate the admin account from
      // ADMIN_EMAIL/ADMIN_PASSWORD, then remove the variable and redeploy again.
      const bcrypt = require("bcryptjs");
      const email = process.env.ADMIN_EMAIL || "admin@aaradhyascreation.com";
      const password = process.env.ADMIN_PASSWORD || "ChangeThisPassword123!";
      const passwordHash = await bcrypt.hash(password, 10);
      const idx = current.admins.findIndex(a => a.email === email);
      if (idx !== -1) {
        current.admins[idx].passwordHash = passwordHash;
        console.log(`RESET_ADMIN: password updated for existing admin ${email}`);
      } else {
        current.admins.push({ id: Date.now(), name: "Aaradhya Admin", email, passwordHash, role: "owner" });
        console.log(`RESET_ADMIN: created new admin ${email}`);
      }
      await db.write(current);
      console.log("⚠  Remove the RESET_ADMIN environment variable now, then redeploy — leaving it set is a security risk.");
    }

    app.listen(PORT, () => {
      console.log(`Aaradhya's Creation API running on port ${PORT}`);
      console.log(`Storage mode: ${db.USE_MONGO ? "MongoDB (persistent)" : "Local JSON file (data/db.json)"}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();
