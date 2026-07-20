const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { read, write, nextId } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

router.get("/", (req, res) => {
  const db = read();
  res.json(db.banners || []);
});

router.post("/", requireAuth, upload.single("image"), (req, res) => {
  const db = read();
  const id = nextId(db, "banner");
  const banner = {
    id,
    label: req.body.label || "Banner",
    url: req.file ? `/uploads/${req.file.filename}` : req.body.url || "",
    createdAt: new Date().toISOString()
  };
  db.banners = [...(db.banners || []), banner];
  write(db);
  res.status(201).json(banner);
});

router.delete("/:id", requireAuth, (req, res) => {
  const db = read();
  db.banners = (db.banners || []).filter(b => String(b.id) !== String(req.params.id));
  write(db);
  res.json({ success: true });
});

module.exports = router;

// Dedicated site-image upload (hero, occasion, fabric, gallery)
// Returns a URL under /uploads/site/ to keep separate from products
const siteUploadDir = require('path').join(__dirname, '..', 'uploads', 'site');
const fsSite = require('fs');
if (!fsSite.existsSync(siteUploadDir)) fsSite.mkdirSync(siteUploadDir, { recursive: true });

const storageSite = multer.diskStorage({
  destination: (req, file, cb) => cb(null, siteUploadDir),
  filename: (req, file, cb) => {
    const ext = require('path').extname(file.originalname).toLowerCase();
    cb(null, `site-${Date.now()}-${Math.round(Math.random()*1e6)}${ext}`);
  }
});
const uploadSite = multer({ storage: storageSite, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/site-image', requireAuth, uploadSite.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image received' });
  res.json({ url: `/uploads/site/${req.file.filename}` });
});
