const express = require("express");
const { read } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, (req, res) => {
  const db = read();
  const sorted = [...db.customers].sort((a, b) => b.spent - a.spent);
  res.json(sorted);
});

module.exports = router;
