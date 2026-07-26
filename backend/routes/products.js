const express = require("express");
const { read, write, nextId } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { upload, uploadBuffer } = require("../services/imageUpload");

const router = express.Router();

// Public: list products (storefront only sees active ones unless admin)
router.get("/", (req, res) => {
  const db = read();
  const isAdminRequest = req.query.all === "1";
  const products = isAdminRequest ? db.products : db.products.filter(p => p.active);
  res.json(products);
});

router.get("/:id", (req, res) => {
  const db = read();
  const product = db.products.find(p => String(p.id) === String(req.params.id));
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

// Admin: create
router.post("/", requireAuth, (req, res) => {
  const db = read();
  const id = nextId(db, "product");
  const body = req.body || {};
  const product = {
    id,
    name: body.name || "Untitled Product",
    fabric: body.fabric || "",
    category: body.category || "saree", // "saree" | "kurti"
    collection: body.collection || "",
    price: Number(body.price) || 0,
    mrp: Number(body.mrp) || 0,
    cost: Number(body.cost) || 0,
    rating: Number(body.rating) || 5,
    stock: Number(body.stock) || 0,
    sku: body.sku || "",
    weight: Number(body.weight) || 0,
    tags: Array.isArray(body.tags) ? body.tags : [],
    description: body.description || "",
    seoTitle: body.seoTitle || "",
    seoDesc: body.seoDesc || "",
    packagingCost: Number(body.packagingCost) || 0,
    shippingCost: Number(body.shippingCost) || 0,
    paymentGatewayPct: body.paymentGatewayPct ?? "2.36",
    platformFeePct: body.platformFeePct ?? "0",
    gstPct: body.gstPct ?? "5",
    returnRatePct: body.returnRatePct ?? "3",
    marketingPct: body.marketingPct ?? "0",
    active: body.active !== undefined ? !!body.active : true,
    featured: !!body.featured,
    seed: body.seed || `prod${id}`,
    images: body.images || []
  };
  db.products.push(product);
  write(db);
  res.status(201).json(product);
});

// Admin: update
router.put("/:id", requireAuth, (req, res) => {
  const db = read();
  const idx = db.products.findIndex(p => String(p.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Product not found" });
  db.products[idx] = { ...db.products[idx], ...req.body, id: db.products[idx].id };
  write(db);
  res.json(db.products[idx]);
});

// Admin: delete
router.delete("/:id", requireAuth, (req, res) => {
  const db = read();
  const before = db.products.length;
  db.products = db.products.filter(p => String(p.id) !== String(req.params.id));
  if (db.products.length === before) return res.status(404).json({ error: "Product not found" });
  write(db);
  res.json({ success: true });
});

// Admin: upload product image(s) — returns array of persistent URLs
// POST /api/products/upload-images  (multipart, field name: "images", up to 5 files)
router.post("/upload-images", requireAuth, upload.array("images", 5), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No images received" });
  }
  try {
    const urls = await Promise.all(
      req.files.map(f => uploadBuffer(f.buffer, "products", f.originalname))
    );
    res.json({ urls });
  } catch (e) {
    console.error("Product image upload failed:", e);
    res.status(500).json({ error: "Image upload failed" });
  }
});


// Admin: reorder product images
router.put("/:id/reorder-images", requireAuth, (req, res) => {
  const db = read();
  const idx = db.products.findIndex(p => String(p.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Product not found" });
  const { images } = req.body;
  if (!Array.isArray(images)) return res.status(400).json({ error: "images[] required" });
  db.products[idx].images = images;
  write(db);
  res.json(db.products[idx]);
});

// Admin: bulk action (activate / deactivate / feature / delete)
router.post("/bulk", requireAuth, (req, res) => {
  const { ids, action } = req.body || {};
  if (!Array.isArray(ids) || !action) return res.status(400).json({ error: "ids[] and action required" });
  const db = read();
  let affected = 0;
  if (action === "delete") {
    const before = db.products.length;
    db.products = db.products.filter(p => !ids.includes(String(p.id)));
    affected = before - db.products.length;
  } else {
    db.products.forEach(p => {
      if (ids.includes(String(p.id))) {
        if (action === "activate")   p.active   = true;
        if (action === "deactivate") p.active   = false;
        if (action === "feature")    p.featured = true;
        if (action === "unfeature")  p.featured = false;
        affected++;
      }
    });
  }
  write(db);
  res.json({ success: true, affected });
});

module.exports = router;

// ── Reviews (nested under products) ──────────────────────────────────
// GET  /api/products/:id/reviews
router.get("/:id/reviews", (req, res) => {
  const db = read();
  const reviews = (db.reviews || []).filter(r => String(r.productId) === String(req.params.id));
  res.json(reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// POST /api/products/:id/reviews  (public — any customer can submit)
router.post("/:id/reviews", upload.array("images", 4), async (req, res) => {
  const db = read();
  const product = db.products.find(p => String(p.id) === String(req.params.id));
  if (!product) return res.status(404).json({ error: "Product not found" });

  const id = (db.nextIds.review = (db.nextIds.review || 1));
  db.nextIds.review += 1;

  let images = [];
  try {
    images = await Promise.all(
      (req.files || []).map(f => uploadBuffer(f.buffer, "reviews", f.originalname))
    );
  } catch (e) {
    console.error("Review image upload failed:", e);
    // Continue without images rather than failing the whole review
  }

  const review = {
    id,
    productId: Number(req.params.id),
    name:    req.body.name    || "Anonymous",
    city:    req.body.city    || "",
    rating:  Math.min(5, Math.max(1, Number(req.body.rating) || 5)),
    title:   req.body.title   || "",
    text:    req.body.text    || "",
    images,
    verified: false,
    createdAt: new Date().toISOString()
  };

  db.reviews = [...(db.reviews || []), review];

  // Update product aggregate rating
  const allReviews = db.reviews.filter(r => String(r.productId) === String(req.params.id));
  const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
  const pidx = db.products.findIndex(p => String(p.id) === String(req.params.id));
  if (pidx !== -1) db.products[pidx].rating = Math.round(avg * 10) / 10;

  write(db);
  res.status(201).json(review);
});

// Admin: list all reviews (GET /api/products/all-reviews)
router.get("/all-reviews", requireAuth, (req, res) => {
  const db = read();
  res.json((db.reviews || []).sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)));
});

// Admin: delete a review
router.delete("/reviews/:reviewId", requireAuth, (req, res) => {
  const db = read();
  const before = (db.reviews||[]).length;
  db.reviews = (db.reviews||[]).filter(r => String(r.id) !== String(req.params.reviewId));
  if (db.reviews.length === before) return res.status(404).json({ error:"Review not found" });
  write(db);
  res.json({ success: true });
});

// Admin: verify a review
router.put("/reviews/:reviewId/verify", requireAuth, (req, res) => {
  const db = read();
  const r = (db.reviews||[]).find(r => String(r.id) === String(req.params.reviewId));
  if (!r) return res.status(404).json({ error:"Review not found" });
  r.verified = !r.verified;
  write(db);
  res.json(r);
});
