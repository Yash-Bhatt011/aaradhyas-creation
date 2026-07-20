require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

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

// In development allow ANY localhost port (Vite picks 5173, 5174, 5175 etc.)
// In production set FRONTEND_URL=https://yourdomain.com in .env
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map(s => s.trim())
  : null;

const LOCALHOST_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl, Postman, mobile apps
    if (allowedOrigins) {              // production whitelist
      return allowedOrigins.includes(origin)
        ? cb(null, true)
        : cb(new Error("CORS: origin not allowed — set FRONTEND_URL in .env"));
    }
    // development: allow any localhost / 127.0.0.1 on any port
    return LOCALHOST_RE.test(origin)
      ? cb(null, true)
      : cb(new Error("CORS: only localhost is allowed without FRONTEND_URL set"));
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
app.listen(PORT, () => {
  console.log(`Aaradhya's Creation API running on port ${PORT}`);
});
