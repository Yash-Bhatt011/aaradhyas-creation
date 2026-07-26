const express = require("express");
const { read, write } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { upload, uploadBuffer } = require("../services/imageUpload");

const router = express.Router();

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
router.post("/upload-image", requireAuth, upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image received" });
  const key = req.body.key;
  if (!key) return res.status(400).json({ error: "key is required" });

  try {
    const url = await uploadBuffer(req.file.buffer, "site", req.file.originalname);

    const db = read();
    db.settings = db.settings || {};
    db.settings.siteImages = db.settings.siteImages || {};
    db.settings.siteImages[key] = url;
    write(db);

    res.json({ url, key });
  } catch (e) {
    console.error("Site image upload failed:", e);
    res.status(500).json({ error: "Image upload failed" });
  }
});

module.exports = router;
