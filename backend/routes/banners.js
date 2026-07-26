const express = require("express");
const { read, write, nextId } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { upload, uploadBuffer } = require("../services/imageUpload");

const router = express.Router();

router.get("/", (req, res) => {
  const db = read();
  res.json(db.banners || []);
});

router.post("/", requireAuth, upload.single("image"), async (req, res) => {
  try {
    const db = read();
    const id = nextId(db, "banner");
    const url = req.file
      ? await uploadBuffer(req.file.buffer, "banners", req.file.originalname)
      : (req.body.url || "");

    const banner = {
      id,
      label: req.body.label || "Banner",
      url,
      createdAt: new Date().toISOString()
    };
    db.banners = [...(db.banners || []), banner];
    write(db);
    res.status(201).json(banner);
  } catch (e) {
    console.error("Banner upload failed:", e);
    res.status(500).json({ error: "Image upload failed" });
  }
});

router.delete("/:id", requireAuth, (req, res) => {
  const db = read();
  db.banners = (db.banners || []).filter(b => String(b.id) !== String(req.params.id));
  write(db);
  res.json({ success: true });
});

module.exports = router;
