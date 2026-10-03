// services/email.js
// Dual-mode, same pattern as db.js / imageUpload.js:
//   - SMTP_HOST + SMTP_USER + SMTP_PASS set → sends real emails
//   - not set → logs to console and no-ops, so the app keeps working
//     in local dev without needing an email account configured.
const nodemailer = require("nodemailer");
const { generateInvoicePDF } = require("./invoice");

const SMTP_CONFIGURED = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
function getTransporter() {
  if (!SMTP_CONFIGURED) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports (STARTTLS)
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  return transporter;
}

function rupee(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

function itemsHtml(items) {
  return (items || []).map(i => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;">${i.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${i.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${rupee(i.price * i.qty)}</td>
    </tr>`).join("");
}

function orderConfirmationHtml(order, storeName) {
  return `
  <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#2a2118;">
    <div style="background:#4C0E1B;padding:28px 32px;text-align:center;">
      <h1 style="color:#fbf6ec;font-size:22px;margin:0;font-weight:normal;letter-spacing:0.04em;">${storeName}</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#4C0E1B;font-size:20px;margin:0 0 8px;">Thank you, ${order.customer.name.split(" ")[0]}!</h2>
      <p style="color:#5a4d41;font-size:14px;line-height:1.6;">Your order has been placed successfully. Here's a summary:</p>
      <p style="background:#f7f2ec;padding:10px 16px;border-radius:4px;font-size:13px;color:#4C0E1B;font-weight:bold;display:inline-block;">
        Order #${order.orderNumber}
      </p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:13px;">
        <thead>
          <tr>
            <th style="text-align:left;padding-bottom:8px;border-bottom:2px solid #C8A158;color:#8a7a68;font-size:11px;text-transform:uppercase;">Item</th>
            <th style="text-align:center;padding-bottom:8px;border-bottom:2px solid #C8A158;color:#8a7a68;font-size:11px;text-transform:uppercase;">Qty</th>
            <th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #C8A158;color:#8a7a68;font-size:11px;text-transform:uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml(order.items)}</tbody>
      </table>
      <table style="width:100%;font-size:13px;">
        <tr><td style="padding:3px 0;color:#5a4d41;">Subtotal</td><td style="padding:3px 0;text-align:right;">${rupee(order.subtotal)}</td></tr>
        <tr><td style="padding:3px 0;color:#5a4d41;">Shipping</td><td style="padding:3px 0;text-align:right;">${order.shipping > 0 ? rupee(order.shipping) : "Free"}</td></tr>
        ${order.discount > 0 ? `<tr><td style="padding:3px 0;color:#2f6e4e;">Discount</td><td style="padding:3px 0;text-align:right;color:#2f6e4e;">-${rupee(order.discount)}</td></tr>` : ""}
        <tr><td style="padding:10px 0 0;font-weight:bold;font-size:16px;color:#4C0E1B;">Total</td><td style="padding:10px 0 0;text-align:right;font-weight:bold;font-size:16px;color:#4C0E1B;">${rupee(order.total)}</td></tr>
      </table>
      <p style="color:#5a4d41;font-size:13px;margin-top:24px;">
        ${order.paymentMethod === "cod" ? "You'll pay on delivery." : "Payment received — thank you!"}
      </p>
      <p style="color:#5a4d41;font-size:13px;">Your invoice is attached to this email as a PDF.</p>
      <p style="color:#8a7a68;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:16px;">
        Shipping to: ${order.customer.address}, ${order.customer.city} ${order.customer.pincode}
      </p>
    </div>
  </div>`;
}

function adminAlertHtml(order, storeName) {
  return `
  <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#2a2118;">
    <h2 style="color:#4C0E1B;">🎉 New Order — ${storeName}</h2>
    <p><strong>Order #${order.orderNumber}</strong></p>
    <p>Customer: ${order.customer.name} (${order.customer.email}, ${order.customer.phone})</p>
    <p>Items: ${(order.items || []).map(i => `${i.name} × ${i.qty}`).join(", ")}</p>
    <p>Total: <strong>${rupee(order.total)}</strong></p>
    <p>Payment: ${order.paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay"} (${order.paymentStatus})</p>
    <p>Ship to: ${order.customer.address}, ${order.customer.city} ${order.customer.pincode}</p>
  </div>`;
}

/**
 * Sends the order confirmation email to the customer, with the invoice PDF attached.
 * Never throws — logs and returns silently on any failure so it can never block checkout.
 */
async function sendOrderConfirmationEmail(order, storeSettings = {}) {
  const storeName = storeSettings.storeName || "Aaradhya's Creation";
  const t = getTransporter();

  if (!t) {
    console.log(`[email] SMTP not configured — would have sent order confirmation for ${order.orderNumber} to ${order.customer.email}`);
    return { sent: false, reason: "SMTP not configured" };
  }

  try {
    const pdfBuffer = await generateInvoicePDF(order, storeSettings);
    await t.sendMail({
      from: process.env.SMTP_FROM || `"${storeName}" <${process.env.SMTP_USER}>`,
      to: order.customer.email,
      subject: `Order Confirmed — ${order.orderNumber} | ${storeName}`,
      html: orderConfirmationHtml(order, storeName),
      attachments: [
        { filename: `Invoice-${order.orderNumber}.pdf`, content: pdfBuffer, contentType: "application/pdf" }
      ]
    });
    return { sent: true };
  } catch (err) {
    console.error("[email] Failed to send order confirmation:", err.message);
    return { sent: false, reason: err.message };
  }
}

/**
 * Alerts the store owner of a new order via email. Never throws.
 */
async function sendAdminNewOrderAlert(order, storeSettings = {}) {
  const storeName = storeSettings.storeName || "Aaradhya's Creation";
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
  const t = getTransporter();

  if (!t || !adminEmail) {
    console.log(`[email] SMTP or ADMIN_NOTIFY_EMAIL not configured — would have alerted admin of new order ${order.orderNumber}`);
    return { sent: false };
  }

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || `"${storeName}" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `🎉 New Order ${order.orderNumber} — ${rupee(order.total)}`,
      html: adminAlertHtml(order, storeName)
    });
    return { sent: true };
  } catch (err) {
    console.error("[email] Failed to send admin alert:", err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendOrderConfirmationEmail, sendAdminNewOrderAlert, SMTP_CONFIGURED };
