// services/shiprocket.js
// Thin wrapper around the Shiprocket API. If SHIPROCKET_EMAIL/PASSWORD are not
// set in .env, this runs in "mock" mode: it just marks the order as
// not-pushed without making any network calls, so the rest of the app keeps
// working during development.
const axios = require("axios");

const BASE_URL = "https://apiv2.shiprocket.in/v1/external";
let cachedToken = null;
let cachedTokenExpiry = 0;

function isConfigured() {
  return !!(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
}

async function getToken() {
  if (cachedToken && Date.now() < cachedTokenExpiry) return cachedToken;
  const { data } = await axios.post(`${BASE_URL}/auth/login`, {
    email: process.env.SHIPROCKET_EMAIL,
    password: process.env.SHIPROCKET_PASSWORD
  });
  cachedToken = data.token;
  // Shiprocket tokens last ~10 days; refresh after 9 to be safe.
  cachedTokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;
  return cachedToken;
}

/**
 * Pushes a confirmed order to Shiprocket as an "Adhoc Order".
 * Returns { pushed, shipmentId, awbCode, error } — never throws, so a
 * shipping hiccup never blocks the checkout flow.
 */
async function pushOrderToShiprocket(order) {
  if (!isConfigured()) {
    return { pushed: false, shipmentId: null, awbCode: null, error: "Shiprocket not configured (mock mode)" };
  }
  // Only push paid or COD-confirmed orders.
  if (order.paymentMethod === "razorpay" && order.paymentStatus !== "paid") {
    return { pushed: false, shipmentId: null, awbCode: null, error: "Order not yet paid" };
  }

  try {
    const token = await getToken();
    const payload = {
      order_id: String(order.orderNumber),
      order_date: order.createdAt.slice(0, 10),
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
      billing_customer_name: order.customer.name,
      billing_last_name: "",
      billing_address: order.customer.address || "N/A",
      billing_city: order.customer.city || "N/A",
      billing_pincode: order.customer.pincode || "000000",
      billing_state: order.customer.state || "N/A",
      billing_country: "India",
      billing_email: order.customer.email,
      billing_phone: order.customer.phone || "9999999999",
      shipping_is_billing: true,
      order_items: order.items.map(item => ({
        name: item.name,
        sku: `SKU-${item.productId}`,
        units: item.qty,
        selling_price: item.price
      })),
      payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
      sub_total: order.subtotal,
      length: 30,
      breadth: 25,
      height: 5,
      weight: 0.5
    };

    const { data } = await axios.post(`${BASE_URL}/orders/create/adhoc`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return {
      pushed: true,
      shipmentId: data.shipment_id || null,
      awbCode: data.awb_code || null,
      error: null
    };
  } catch (e) {
    return {
      pushed: false,
      shipmentId: null,
      awbCode: null,
      error: e.response?.data?.message || e.message
    };
  }
}

module.exports = { pushOrderToShiprocket, isConfigured };
