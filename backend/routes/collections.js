const express = require("express");
const { read, write } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", (req, res) => {
  const db = read();
  const isAdminRequest = req.query.all === "1";
  const collections = isAdminRequest ? db.collections : db.collections.filter(c => c.active);
  res.json(collections);
});

router.post("/", requireAuth, (req, res) => {
  const db = read();
  const body = req.body || {};
  const id = body.id || body.title?.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-") || `coll-${Date.now()}`;
  if (db.collections.some(c => c.id === id)) {
    return res.status(409).json({ error: "A collection with this id already exists" });
  }
  const collection = {
    id,
    title: body.title || "Untitled Collection",
    sub: body.sub || "",
    seed: body.seed || id,
    active: body.active !== undefined ? !!body.active : true,
    count: Number(body.count) || 0
  };
  db.collections.push(collection);
  write(db);
  res.status(201).json(collection);
});

router.put("/:id", requireAuth, (req, res) => {
  const db = read();
  const idx = db.collections.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Collection not found" });
  db.collections[idx] = { ...db.collections[idx], ...req.body, id: db.collections[idx].id };
  write(db);
  res.json(db.collections[idx]);
});

router.delete("/:id", requireAuth, (req, res) => {
  const db = read();
  const before = db.collections.length;
  db.collections = db.collections.filter(c => c.id !== req.params.id);
  if (db.collections.length === before) return res.status(404).json({ error: "Collection not found" });
  write(db);
  res.json({ success: true });
});

module.exports = router;
