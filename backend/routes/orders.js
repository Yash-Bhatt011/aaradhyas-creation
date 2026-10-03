const express = require("express");
const { read, write, nextId } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { pushOrderToShiprocket } = require("../services/shiprocket");
const { sendOrderConfirmationEmail, sendAdminNewOrderAlert } = require("../services/email");
const { generateInvoicePDF } = require("../services/invoice");
const { processRefund } = require("../services/refund");
const { computeOrderProfit, computeProfitSummary } = require("../services/profitCalculator");

const router = express.Router();

function upsertCustomer(db, order) {
  const email = order.customer?.email?.toLowerCase();
  if (!email) return;
  let customer = db.customers.find(c => c.email.toLowerCase() === email);
  if (!customer) {
    customer = { id: db.customers.length + 1, name: order.customer.name, email: order.customer.email,
      phone: order.customer.phone || "", city: order.customer.city || "", orders: 0, spent: 0, lastOrder: null };
    db.customers.push(customer);
  }
  customer.orders += 1;
  customer.spent += order.total;
  customer.lastOrder = order.createdAt;
}

function blankCancellation() {
  return {
    status: null, reason: null, customerNote: null, requestedAt: null,
    reviewedAt: null, reviewedBy: null, adminNotes: [], inventoryRestored: false,
    refund: { status: "not_applicable", method: null, refundId: null, amount: 0, processedAt: null, note: null },
    history: []
  };
}

function addHistory(order, action, by, note) {
  if (!order.cancellation) order.cancellation = blankCancellation();
  order.cancellation.history.push({ action, by: by || "system", at: new Date().toISOString(), note: note || null });
}

router.post("/", async (req, res) => {
  const db = read();
  const body = req.body || {};
  if (!body.customer?.name || !body.customer?.email || !Array.isArray(body.items) || body.items.length === 0) {
    return res.status(400).json({ error: "customer (name, email) and items[] are required" });
  }

  const id = nextId(db, "order");
  const settings = db.settings || {};

  // Snapshot cost/GST/HSN at order time so historical profit reports stay
  // accurate even if the product's cost or GST rate is edited later.
  const items = body.items.map(reqItem => {
    const product = db.products.find(p => String(p.id) === String(reqItem.productId));
    return {
      productId: reqItem.productId, name: reqItem.name,
      price: Number(reqItem.price) || 0, qty: Number(reqItem.qty) || 1, seed: reqItem.seed,
      cost: Number(product?.cost) || 0,
      gstPct: Number(product?.gstPct ?? settings.defaultGstPct) || 5,
      hsnCode: product?.hsnCode || settings.defaultHsnCode || ""
    };
  });

  const order = {
    id, orderNumber: `AC-${id}`, items, customer: body.customer,
    subtotal: Number(body.subtotal) || 0, shipping: Number(body.shipping) || 0,
    discount: Number(body.discount) || 0, total: Number(body.total) || 0,
    couponCode: body.couponCode || null,
    paymentMethod: body.paymentMethod || "cod",
    paymentStatus: body.paymentStatus || "pending",
    razorpayOrderId: body.razorpayOrderId || null,
    razorpayPaymentId: body.razorpayPaymentId || null,
    status: "placed",
    shiprocket: { pushed: false, shipmentId: null, awbCode: null, error: null },
    emailSent: false, cancellation: blankCancellation(),
    createdAt: new Date().toISOString()
  };

  db.orders.unshift(order);
  upsertCustomer(db, order);
  order.items.forEach(item => {
    const p = db.products.find(p => String(p.id) === String(item.productId));
    if (p) p.stock = Math.max(0, p.stock - item.qty);
  });
  write(db);

  try {
    const result = await pushOrderToShiprocket(order);
    if (result) {
      const db2 = read();
      const o = db2.orders.find(o => o.id === id);
      if (o) { o.shiprocket = result; write(db2); }
    }
  } catch (e) { console.error("Shiprocket push failed:", e.message); }

  res.status(201).json(order);

  (async () => {
    const settings2 = read().settings || {};
    const [customerResult] = await Promise.all([
      sendOrderConfirmationEmail(order, settings2),
      sendAdminNewOrderAlert(order, settings2)
    ]);
    if (customerResult?.sent) {
      const db3 = read();
      const o3 = db3.orders.find(o => o.id === id);
      if (o3) { o3.emailSent = true; write(db3); }
    }
  })().catch(e => console.error("Post-order email dispatch failed:", e.message));
});

router.get("/", requireAuth, (req, res) => res.json(read().orders));

router.get("/profit-summary", requireAuth, (req, res) => {
  const db = read();
  const { from, to } = req.query;
  res.json(computeProfitSummary(db.orders, db.settings || {}, { from, to }));
});

router.get("/cancellations", requireAuth, (req, res) => {
  const db = read();
  let orders = db.orders.filter(o => o.cancellation?.status);
  if (req.query.status) orders = orders.filter(o => o.cancellation.status === req.query.status);
  res.json(orders);
});

router.get("/:id/customer", (req, res) => {
  const db = read();
  const order = db.orders.find(o => String(o.id) === String(req.params.id));
  if (!order) return res.status(404).json({ error: "Order not found" });
  const email = String(req.query.email || "").toLowerCase().trim();
  if (!email || email !== order.customer.email.toLowerCase()) {
    return res.status(403).json({ error: "Email does not match this order" });
  }
  res.json(order);
});

router.get("/:id", requireAuth, (req, res) => {
  const order = read().orders.find(o => String(o.id) === String(req.params.id));
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

router.get("/:id/profit", requireAuth, (req, res) => {
  const db = read();
  const order = db.orders.find(o => String(o.id) === String(req.params.id));
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(computeOrderProfit(order, db.settings || {}));
});

router.put("/:id", requireAuth, (req, res) => {
  const db = read();
  const idx = db.orders.findIndex(o => String(o.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Order not found" });
  db.orders[idx] = { ...db.orders[idx], ...req.body, id: db.orders[idx].id };
  write(db);
  res.json(db.orders[idx]);
});

const CANCELLABLE_STATUSES = ["placed", "confirmed"];

router.post("/:id/cancel-request", (req, res) => {
  const db = read();
  const order = db.orders.find(o => String(o.id) === String(req.params.id));
  if (!order) return res.status(404).json({ error: "Order not found" });

  const email = String(req.body.email || "").toLowerCase().trim();
  if (!email || email !== order.customer.email.toLowerCase()) {
    return res.status(403).json({ error: "Email does not match this order" });
  }
  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    return res.status(400).json({ error: `This order can no longer be cancelled (current status: ${order.status}).` });
  }
  if (order.cancellation?.status === "requested") {
    return res.status(409).json({ error: "A cancellation request is already pending for this order." });
  }
  if (order.cancellation?.status === "approved") {
    return res.status(409).json({ error: "This order has already been cancelled." });
  }

  const reason = String(req.body.reason || "").trim();
  if (!reason) return res.status(400).json({ error: "A cancellation reason is required." });

  if (!order.cancellation) order.cancellation = blankCancellation();
  order.cancellation.status = "requested";
  order.cancellation.reason = reason;
  order.cancellation.customerNote = String(req.body.note || "").trim() || null;
  order.cancellation.requestedAt = new Date().toISOString();
  order.status = "cancellation_requested";
  addHistory(order, "cancellation_requested", order.customer.name, reason);

  write(db);
  res.json({ success: true, order });

  sendAdminNewOrderAlert({ ...order, orderNumber: `${order.orderNumber} — CANCELLATION REQUESTED` }, db.settings || {}).catch(() => {});
});

router.put("/:id/cancel-approve", requireAuth, async (req, res) => {
  const db = read();
  const idx = db.orders.findIndex(o => String(o.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Order not found" });
  const order = db.orders[idx];

  if (order.cancellation?.status === "approved") {
    return res.status(409).json({ error: "This cancellation has already been approved." });
  }
  if (!order.cancellation || order.cancellation.status !== "requested") {
    return res.status(400).json({ error: "This order has no pending cancellation request." });
  }

  const adminName = req.admin?.name || req.admin?.email || "admin";

  order.status = "cancelled";
  order.cancellation.status = "approved";
  order.cancellation.reviewedAt = new Date().toISOString();
  order.cancellation.reviewedBy = adminName;
  if (req.body.adminNote) {
    order.cancellation.adminNotes.push({ note: req.body.adminNote, by: adminName, at: new Date().toISOString() });
  }
  addHistory(order, "cancellation_approved", adminName, req.body.adminNote);

  // Idempotency guard: never restore stock twice
  if (!order.cancellation.inventoryRestored) {
    order.items.forEach(item => {
      const p = db.products.find(p => String(p.id) === String(item.productId));
      if (p) p.stock = p.stock + item.qty;
    });
    order.cancellation.inventoryRestored = true;
    addHistory(order, "inventory_restored", adminName, `Restored stock for ${order.items.length} item(s)`);
  }

  // Idempotency guard: never refund twice
  if (order.cancellation.refund.status !== "processed") {
    const refundAmount = req.body.refundAmount != null ? Number(req.body.refundAmount) : order.total;
    const result = await processRefund(order, refundAmount);
    order.cancellation.refund = {
      status: result.status, method: result.method, refundId: result.refundId, amount: result.amount,
      processedAt: result.status === "processed" ? new Date().toISOString() : null,
      note: result.note || result.error
    };
    addHistory(order, `refund_${result.status}`, adminName, result.note || result.error);
  }

  write(db);
  res.json(order);
});

router.put("/:id/cancel-reject", requireAuth, (req, res) => {
  const db = read();
  const idx = db.orders.findIndex(o => String(o.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Order not found" });
  const order = db.orders[idx];

  if (!order.cancellation || order.cancellation.status !== "requested") {
    return res.status(400).json({ error: "This order has no pending cancellation request to reject." });
  }

  const adminName = req.admin?.name || req.admin?.email || "admin";
  order.cancellation.status = "rejected";
  order.cancellation.reviewedAt = new Date().toISOString();
  order.cancellation.reviewedBy = adminName;
  if (req.body.adminNote) {
    order.cancellation.adminNotes.push({ note: req.body.adminNote, by: adminName, at: new Date().toISOString() });
  }
  order.status = "confirmed";
  addHistory(order, "cancellation_rejected", adminName, req.body.adminNote);

  write(db);
  res.json(order);
});

router.put("/:id/refund-mark", requireAuth, (req, res) => {
  const db = read();
  const idx = db.orders.findIndex(o => String(o.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Order not found" });
  const order = db.orders[idx];

  if (!order.cancellation) return res.status(400).json({ error: "This order has no cancellation record." });
  if (order.cancellation.refund.status === "processed") {
    return res.status(409).json({ error: "This refund has already been marked as processed." });
  }

  const adminName = req.admin?.name || req.admin?.email || "admin";
  const amount = Number(req.body.amount) || order.cancellation.refund.amount || order.total;

  order.cancellation.refund = {
    status: "processed", method: req.body.method || "manual", refundId: req.body.reference || null,
    amount, processedAt: new Date().toISOString(),
    note: req.body.note || "Marked as manually processed by admin"
  };
  addHistory(order, "refund_processed_manually", adminName, req.body.note);

  write(db);
  res.json(order);
});

router.get("/:id/invoice", requireAuth, async (req, res) => {
  const db = read();
  const order = db.orders.find(o => String(o.id) === String(req.params.id));
  if (!order) return res.status(404).json({ error: "Order not found" });
  try {
    const pdfBuffer = await generateInvoicePDF(order, db.settings || {});
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Invoice-${order.orderNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (e) {
    console.error("Invoice generation failed:", e);
    res.status(500).json({ error: "Could not generate invoice" });
  }
});

router.get("/:id/invoice/customer", async (req, res) => {
  const db = read();
  const order = db.orders.find(o => String(o.id) === String(req.params.id));
  if (!order) return res.status(404).json({ error: "Order not found" });
  const email = String(req.query.email || "").toLowerCase().trim();
  if (!email || email !== order.customer.email.toLowerCase()) {
    return res.status(403).json({ error: "Email does not match this order" });
  }
  try {
    const pdfBuffer = await generateInvoicePDF(order, db.settings || {});
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Invoice-${order.orderNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (e) {
    console.error("Invoice generation failed:", e);
    res.status(500).json({ error: "Could not generate invoice" });
  }
});

module.exports = router;
