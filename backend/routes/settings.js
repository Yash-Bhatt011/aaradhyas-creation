const express = require("express");
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const { read, write } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads", "site");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `site-${Date.now()}-${Math.round(Math.random()*1e6)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 12*1024*1024 } });

router.get("/", (req, res) => {
  const db = read();
  res.json(db.settings || {});
});

router.put("/", requireAuth, (req, res) => {
  const db = read();
  db.settings = { ...db.settings, ...req.body };
  write(db);
  res.json(db.settings);
});

// Upload a single site image and immediately save its URL into settings.siteImages[key]
router.post("/upload-image", requireAuth, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image received" });
  const key = req.body.key;
  if (!key) return res.status(400).json({ error: "key is required" });

  const url = `/uploads/site/${req.file.filename}`;

  const db = read();
  db.settings = db.settings || {};
  db.settings.siteImages = db.settings.siteImages || {};
  db.settings.siteImages[key] = url;
  write(db);

  res.json({ url, key });
});

module.exports = router;
