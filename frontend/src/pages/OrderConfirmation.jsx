import React from "react";
import { useLocation, Link, Navigate } from "react-router-dom";
import { CheckCircle, Download, Mail } from "lucide-react";
import { Logo } from "../components/shared.jsx";
import { rupee } from "../data/content.js";
import { API_URL } from "../api/client.js";
import "../styles/storefront.css";

export default function OrderConfirmation() {
  const { state } = useLocation();
  const order = state?.order;

  if (!order) return <Navigate to="/" replace />;

  const invoiceUrl = `${API_URL}/orders/${order.id}/invoice/customer?email=${encodeURIComponent(order.customer.email)}`;

  return (
    <div className="ac-root" style={{ background: "var(--ivory)", minHeight: "100vh" }}>
      <div style={{ padding: "20px 5vw", borderBottom: "1px solid var(--beige)" }}>
        <Link to="/" className="ac-logo" style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
          <Logo size={32} />Aaradhya's Creation
        </Link>
      </div>
      <div className="confirm-wrap">
        <CheckCircle size={48} color="#2f6e4e" />
        <h1>Thank you, {order.customer.name.split(" ")[0]}!</h1>
        <p>Your order has been placed successfully.</p>
        <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13.5, color: "#5a4d41" }}>
          <Mail size={14} /> A confirmation email with your invoice is on its way to {order.customer.email}
        </p>
        <div className="confirm-order-id">Order #{order.orderNumber}</div>
        <p>
          {order.paymentMethod === "cod" ? "You'll pay on delivery." : "Payment received."} Total: <strong>{rupee(order.total)}</strong>
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
          <a
            href={invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <Download size={15} /> Download Invoice
          </a>
          <Link to="/" className="btn-gold" style={{ display: "inline-block" }}>Continue Shopping</Link>
        </div>

        <p style={{ fontSize: 12, color: "#8a7a68", marginTop: 20 }}>
          Didn't get the email? Check your spam folder, or download your invoice directly above.
        </p>
      </div>
    </div>
  );
}
