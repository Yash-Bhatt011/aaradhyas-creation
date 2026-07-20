const express = require("express");
const crypto = require("crypto");

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

module.exports = router;
