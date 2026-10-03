function isRazorpayConfigured() {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function getRazorpayInstance() {
  const Razorpay = require("razorpay");
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
}

async function processRefund(order, amount) {
  const isPaidOnline = order.paymentMethod === "razorpay" && order.paymentStatus === "paid";

  if (!isPaidOnline) {
    return { status: "manual_required", method: "manual", refundId: null, amount, error: null,
      note: order.paymentMethod === "cod"
        ? "Cash on Delivery order — no online payment to auto-refund. Process the refund manually (bank transfer/UPI) and mark it below."
        : "Order was not marked as paid online — refund must be processed manually." };
  }
  if (!isRazorpayConfigured()) {
    return { status: "manual_required", method: "manual", refundId: null, amount, error: null,
      note: "Razorpay is not configured on this server — process the refund manually from your Razorpay dashboard and mark it below." };
  }
  if (!order.razorpayPaymentId) {
    return { status: "manual_required", method: "manual", refundId: null, amount, error: null,
      note: "No Razorpay payment ID recorded on this order — process the refund manually." };
  }
  try {
    const instance = getRazorpayInstance();
    const refund = await instance.payments.refund(order.razorpayPaymentId, {
      amount: Math.round(amount * 100), speed: "normal",
      notes: { orderNumber: order.orderNumber, reason: "Order cancellation" }
    });
    return { status: "processed", method: "razorpay", refundId: refund.id, amount, error: null,
      note: `Refunded automatically via Razorpay (${refund.id})` };
  } catch (err) {
    return { status: "failed", method: "razorpay", refundId: null, amount,
      error: err.error?.description || err.message || "Razorpay refund failed",
      note: "Automatic refund failed — please process manually and mark it below." };
  }
}

module.exports = { processRefund, isRazorpayConfigured };
