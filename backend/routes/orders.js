const express = require("express");
const { read, write, nextId } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { pushOrderToShiprocket } = require("../services/shiprocket");

const router = express.Router();

function upsertCustomer(db, order) {
  const email = order.customer?.email?.toLowerCase();
  if (!email) return;
  let customer = db.customers.find(c => c.email.toLowerCase() === email);
  if (!customer) {
    customer = {
      id: db.customers.length + 1,
      name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone || "",
      city: order.customer.city || "",
      orders: 0,
      spent: 0,
      lastOrder: null
    };
    db.customers.push(customer);
  }
  customer.orders += 1;
  customer.spent += order.total;
  customer.lastOrder = order.createdAt;
}

// Public: create order (called from checkout, after payment confirmation or for COD)
router.post("/", async (req, res) => {
  const db = read();
  const body = req.body || {};
  if (!body.customer?.name || !body.customer?.email || !Array.isArray(body.items) || body.items.length === 0) {
    return res.status(400).json({ error: "customer (name, email) and items[] are required" });
  }

  const id = nextId(db, "order");
  const order = {
    id,
    orderNumber: `AC-${id}`,
    items: body.items, // [{ productId, name, price, qty, seed }]
    customer: body.customer, // { name, email, phone, city, address, pincode }
    subtotal: Number(body.subtotal) || 0,
    shipping: Number(body.shipping) || 0,
    discount: Number(body.discount) || 0,
    total: Number(body.total) || 0,
    couponCode: body.couponCode || null,
    paymentMethod: body.paymentMethod || "cod", // 'razorpay' | 'cod'
    paymentStatus: body.paymentStatus || "pending", // 'pending' | 'paid' | 'failed'
    razorpayOrderId: body.razorpayOrderId || null,
    razorpayPaymentId: body.razorpayPaymentId || null,
    status: "placed", // placed -> confirmed -> shipped -> delivered -> cancelled
    shiprocket: { pushed: false, shipmentId: null, awbCode: null, error: null },
    createdAt: new Date().toISOString()
  };

  db.orders.unshift(order);
  upsertCustomer(db, order);

  // decrement stock
  order.items.forEach(item => {
    const p = db.products.find(p => String(p.id) === String(item.productId));
    if (p) p.stock = Math.max(0, p.stock - item.qty);
  });

  write(db);

  // Best-effort push to Shiprocket (won't block order creation if it fails / not configured)
  try {
    const result = await pushOrderToShiprocket(order);
    if (result) {
      const db2 = read();
      const o = db2.orders.find(o => o.id === id);
      if (o) {
        o.shiprocket = result;
        write(db2);
      }
    }
  } catch (e) {
    console.error("Shiprocket push failed:", e.message);
  }

  res.status(201).json(order);
});

// Admin: list all orders
router.get("/", requireAuth, (req, res) => {
  const db = read();
  res.json(db.orders);
});

router.get("/:id", requireAuth, (req, res) => {
  const db = read();
  const order = db.orders.find(o => String(o.id) === String(req.params.id));
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

// Admin: update order status
router.put("/:id", requireAuth, (req, res) => {
  const db = read();
  const idx = db.orders.findIndex(o => String(o.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Order not found" });
  db.orders[idx] = { ...db.orders[idx], ...req.body, id: db.orders[idx].id };
  write(db);
  res.json(db.orders[idx]);
});

module.exports = router;
