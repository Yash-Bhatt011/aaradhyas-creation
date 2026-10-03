const express = require("express");
const crypto = require("crypto");
const { read, write } = require("../db");
const { pushOrderToShiprocket } = require("../services/shiprocket");
const { sendOrderConfirmationEmail, sendAdminNewOrderAlert } = require("../services/email");

const router = express.Router();

function isRazorpayConfigured() {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function getRazorpayInstance() {
  const Razorpay = require("razorpay");
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

// GET public key for the frontend checkout widget
router.get("/razorpay/key", (req, res) => {
  res.json({ keyId: process.env.RAZORPAY_KEY_ID || null, configured: isRazorpayConfigured() });
});

// Create a Razorpay order to attach to the checkout widget
router.post("/razorpay/create-order", async (req, res) => {
  const { amount, receipt } = req.body || {};
  if (!amount || amount <= 0) return res.status(400).json({ error: "A positive amount (in rupees) is required" });

  if (!isRazorpayConfigured()) {
    // Mock mode: lets the frontend keep working before real keys are added.
    return res.json({
      mock: true,
      id: `order_mock_${Date.now()}`,
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: receipt || `receipt_${Date.now()}`
    });
  }

  try {
    const instance = getRazorpayInstance();
    const order = await instance.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt: receipt || `receipt_${Date.now()}`
    });
    res.json({ mock: false, ...order });
  } catch (e) {
    console.error("Razorpay create-order failed:", e);
    res.status(500).json({ error: "Could not create Razorpay order" });
  }
});

// Verify the payment signature returned by Razorpay Checkout after payment
router.post("/razorpay/verify", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

  if (!isRazorpayConfigured()) {
    // Mock mode: accept any payload that looks complete.
    const ok = razorpay_order_id && razorpay_payment_id;
    return res.json({ verified: !!ok, mock: true });
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing Razorpay verification fields" });
  }

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const verified = expected === razorpay_signature;
  res.json({ verified });
});

// ── Razorpay Webhook ─────────────────────────────────────────────────────
// Configure this URL in your Razorpay Dashboard → Settings → Webhooks:
//   https://your-backend.onrender.com/api/payments/razorpay/webhook
// Subscribe to the "payment.captured" event, and set the webhook secret you
// choose there as RAZORPAY_WEBHOOK_SECRET in your backend .env.
//
// Why this matters: the client-side /razorpay/verify route above only runs
// if the customer's browser stays open and successfully calls it after
// payment. If they close the tab at exactly the wrong moment, Razorpay still
// has their money but your database might never record it as paid. This
// webhook is a server-to-server call from Razorpay itself, independent of
// the customer's browser — the reliable source of truth for payment status.
router.post("/razorpay/webhook", async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    // Not configured — acknowledge but do nothing, so Razorpay doesn't retry forever.
    console.warn("Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not set — ignoring.");
    return res.status(200).json({ received: true, processed: false });
  }

  const signature = req.headers["x-razorpay-signature"];
  const expected = crypto.createHmac("sha256", secret).update(req.rawBody).digest("hex");

  if (!signature || signature !== expected) {
    console.error("Razorpay webhook: signature mismatch — rejecting.");
    return res.status(400).json({ error: "Invalid signature" });
  }

  const event = req.body;

  try {
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload?.payment?.entity;
      const razorpayOrderId = payment?.order_id;
      const razorpayPaymentId = payment?.id;
      if (!razorpayOrderId) return res.status(200).json({ received: true, processed: false });

      const db = read();
      const order = db.orders.find(o => o.razorpayOrderId === razorpayOrderId);

      if (order && order.paymentStatus !== "paid") {
        order.paymentStatus = "paid";
        order.razorpayPaymentId = order.razorpayPaymentId || razorpayPaymentId;
        write(db);
        console.log(`Webhook: order ${order.orderNumber} confirmed paid via server-to-server webhook.`);

        // If the client-side flow never got a chance to push to Shiprocket
        // or send the confirmation email (e.g. browser closed early), do it now.
        if (!order.shiprocket?.pushed) {
          try {
            const result = await pushOrderToShiprocket(order);
            if (result) {
              const db2 = read();
              const o2 = db2.orders.find(o => o.id === order.id);
              if (o2) { o2.shiprocket = result; write(db2); }
            }
          } catch (e) {
            console.error("Webhook: Shiprocket push failed:", e.message);
          }
        }
        if (!order.emailSent) {
          const settings = read().settings || {};
          sendOrderConfirmationEmail(order, settings)
            .then(result => {
              if (result?.sent) {
                const db3 = read();
                const o3 = db3.orders.find(o => o.id === order.id);
                if (o3) { o3.emailSent = true; write(db3); }
              }
            })
            .catch(e => console.error("Webhook: email send failed:", e.message));
          sendAdminNewOrderAlert(order, settings).catch(() => {});
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Razorpay webhook processing error:", err);
    // Still 200 — we don't want Razorpay hammering retries for a bug on our side
    // once we've logged it; the client-side verify flow is the fallback.
    res.status(200).json({ received: true, error: "processing failed" });
  }
});

module.exports = router;
