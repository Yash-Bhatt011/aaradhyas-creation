const express = require("express");
const { read, write } = require("../db");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

router.get("/",        requireAuth, (req, res) => { const db=read(); res.json(db.ads||[]); });
router.post("/",       requireAuth, (req, res) => {
  const db=read(); if(!db.ads)db.ads=[];
  const id=(db.nextIds.ad=(db.nextIds.ad||1)); db.nextIds.ad++;
  const b = req.body || {};
  const ad = {
    id,
    name: b.name || "Untitled Campaign",
    platform: b.platform || "Google Ads",
    status: b.status || "Active",
    budget: Number(b.budget) || 0,
    spend: Number(b.spend) || 0,
    clicks: Number(b.clicks) || 0,
    impressions: Number(b.impressions) || 0,
    conversions: Number(b.conversions) || 0,
    startDate: b.startDate || null,
    endDate: b.endDate || null,
    utmLink: b.utmLink || "",
    notes: b.notes || "",
    createdAt: new Date().toISOString()
  };
  db.ads.push(ad); write(db); res.status(201).json(ad);
});
router.put("/:id",     requireAuth, (req, res) => {
  const db=read(); const idx=db.ads.findIndex(a=>String(a.id)===String(req.params.id));
  if(idx===-1) return res.status(404).json({error:"Ad not found"});
  const b = req.body || {};
  const numericFields = ["budget","spend","clicks","impressions","conversions"];
  const coerced = { ...b };
  numericFields.forEach(f => { if (f in coerced) coerced[f] = Number(coerced[f]) || 0; });
  db.ads[idx] = { ...db.ads[idx], ...coerced, id: db.ads[idx].id };
  write(db); res.json(db.ads[idx]);
});
router.delete("/:id",  requireAuth, (req, res) => {
  const db=read(); db.ads=(db.ads||[]).filter(a=>String(a.id)!==String(req.params.id));
  write(db); res.json({success:true});
});
module.exports = router;
