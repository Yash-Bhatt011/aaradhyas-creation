import React from "react";
import { useLocation, Link, Navigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Logo } from "../components/shared.jsx";
import { rupee } from "../data/content.js";
import "../styles/storefront.css";

export default function OrderConfirmation() {
  const { state } = useLocation();
  const order = state?.order;

  if (!order) return <Navigate to="/" replace />;

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
        <p>Your order has been placed successfully. A confirmation email has been sent to {order.customer.email}.</p>
        <div className="confirm-order-id">Order #{order.orderNumber}</div>
        <p>
          {order.paymentMethod === "cod" ? "You'll pay on delivery." : "Payment received."} Total: <strong>{rupee(order.total)}</strong>
        </p>
        <Link to="/" className="btn-gold" style={{ display: "inline-block", marginTop: 24 }}>Continue Shopping</Link>
      </div>
    </div>
  );
}
