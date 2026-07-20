const express = require("express");
const { read, write, nextId } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Public: validate a coupon code at checkout
router.post("/validate", (req, res) => {
  const { code } = req.body || {};
  const db = read();
  const discount = db.discounts.find(d => d.code.toLowerCase() === String(code || "").toLowerCase());
  if (!discount) return res.status(404).json({ valid: false, error: "Invalid coupon code" });
  if (!discount.active) return res.status(400).json({ valid: false, error: "This coupon has expired" });
  if (discount.expires && new Date(discount.expires) < new Date()) {
    return res.status(400).json({ valid: false, error: "This coupon has expired" });
  }
  if (discount.maxUses !== null && discount.uses >= discount.maxUses) {
    return res.status(400).json({ valid: false, error: "This coupon has reached its usage limit" });
  }
  res.json({ valid: true, discount });
});

// Admin: list
router.get("/", requireAuth, (req, res) => {
  const db = read();
  res.json(db.discounts);
});

// Admin: create
router.post("/", requireAuth, (req, res) => {
  const db = read();
  const id = nextId(db, "discount");
  const body = req.body || {};
  const discount = {
    id,
    code: (body.code || `CODE${id}`).toUpperCase(),
    type: body.type === "fixed" ? "fixed" : "percentage",
    value: Number(body.value) || 0,
    maxUses: body.maxUses === null || body.maxUses === undefined || body.maxUses === "" ? null : Number(body.maxUses),
    uses: 0,
    expires: body.expires || null,
    active: body.active !== undefined ? !!body.active : true
  };
  db.discounts.push(discount);
  write(db);
  res.status(201).json(discount);
});

// Admin: update
router.put("/:id", requireAuth, (req, res) => {
  const db = read();
  const idx = db.discounts.findIndex(d => String(d.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Discount not found" });
  db.discounts[idx] = { ...db.discounts[idx], ...req.body, id: db.discounts[idx].id };
  write(db);
  res.json(db.discounts[idx]);
});

// Admin: delete
router.delete("/:id", requireAuth, (req, res) => {
  const db = read();
  const before = db.discounts.length;
  db.discounts = db.discounts.filter(d => String(d.id) !== String(req.params.id));
  if (db.discounts.length === before) return res.status(404).json({ error: "Discount not found" });
  write(db);
  res.json({ success: true });
});

module.exports = router;
