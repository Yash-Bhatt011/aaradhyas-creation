import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Package, MessageCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Logo } from "../components/shared.jsx";
import { api } from "../api/client.js";
import { rupee } from "../data/content.js";
import "../styles/storefront.css";

const CANCEL_REASONS = [
  "Ordered by mistake", "Found a better price elsewhere", "Delivery is taking too long",
  "Changed my mind", "Wrong size / color selected", "Other"
];

export default function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [settings, setSettings] = useState({});

  useEffect(() => { api.getSettings().then(setSettings).catch(() => {}); }, []);

  const lookup = async (e) => {
    e.preventDefault();
    setError(null); setOrder(null); setLoading(true);
    try {
      const cleanId = orderId.trim().replace(/^AC-/i, "");
      setOrder(await api.getOrderForCustomer(cleanId, email.trim()));
    } catch (err) {
      setError(err.status === 403 ? "That email doesn't match this order." : "Order not found. Check your Order ID and try again.");
    } finally { setLoading(false); }
  };

  const submitCancellation = async (e) => {
    e.preventDefault();
    setCancelError(null); setSubmitting(true);
    try {
      const result = await api.requestCancellation(order.id, email.trim(), reason, note.trim());
      setOrder(result.order); setCancelSuccess(true); setShowCancelForm(false);
    } catch (err) {
      setCancelError(err.message || "Could not submit cancellation request. Please try WhatsApp instead.");
    } finally { setSubmitting(false); }
  };

  const canCancel = order && ["placed", "confirmed"].includes(order.status);
  const cancellationPending = order?.cancellation?.status === "requested";
  const cancellationApproved = order?.cancellation?.status === "approved";
  const whatsappNumber = (settings.whatsapp || "+91 98765 43210").replace(/[^\d]/g, "");
  const whatsappMessage = order ? encodeURIComponent(
    `Hi, I'd like to request cancellation for my order.\n\nOrder ID: ${order.orderNumber}\nName: ${order.customer.name}\nReason: ${reason}\n` +
    (note ? `Note: ${note}\n` : "") + `\nPlease confirm the cancellation and refund process. Thank you.`) : "";

  return (
    <div className="ac-root" style={{ background: "var(--ivory)", minHeight: "100vh" }}>
      <div style={{ padding: "20px 5vw", borderBottom: "1px solid var(--beige)" }}>
        <Link to="/" className="ac-logo" style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
          <Logo size={32} />Aaradhya's Creation
        </Link>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 5vw 100px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Package size={34} color="var(--gold)" strokeWidth={1.5} />
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 30, color: "var(--wine)", margin: "10px 0 6px" }}>Track Your Order</h1>
          <p style={{ fontSize: 13.5, color: "#8a7a68" }}>Enter your order ID and email to view status or request a cancellation.</p>
        </div>

        {!order && (
          <form onSubmit={lookup} style={{ background: "#fff", border: "1px solid var(--beige)", borderRadius: 8, padding: "28px 26px" }}>
            {error && <div className="checkout-error" style={{ marginBottom: 16 }}>{error}</div>}
            <div className="checkout-field" style={{ marginBottom: 14 }}>
              <label>Order ID</label>
              <input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="AC-1000" required />
            </div>
            <div className="checkout-field" style={{ marginBottom: 20 }}>
              <label>Email used at checkout</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <button className="btn-gold" type="submit" disabled={loading} style={{ width: "100%", textAlign: "center" }}>
              <Search size={14} style={{ marginRight: 6, verticalAlign: -2 }} />{loading ? "Searching…" : "Find My Order"}
            </button>
          </form>
        )}

        {order && (
          <div style={{ background: "#fff", border: "1px solid var(--beige)", borderRadius: 8, padding: "28px 26px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <p style={{ fontFamily: "'Cinzel',serif", fontSize: 12, color: "var(--gold-dark)", letterSpacing: "0.06em" }}>ORDER {order.orderNumber}</p>
                <p style={{ fontSize: 12.5, color: "#8a7a68", marginTop: 4 }}>Placed {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              <span className="adm-badge" style={{ textTransform: "capitalize", background: "#f1f2f4", color: "#4a4a4a" }}>{order.status.replace(/_/g, " ")}</span>
            </div>

            <div style={{ borderTop: "1px solid var(--beige)", borderBottom: "1px solid var(--beige)", padding: "14px 0", margin: "14px 0" }}>
              {order.items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "4px 0" }}>
                  <span>{item.name} × {item.qty}</span><span>{rupee(item.price * item.qty)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15, marginTop: 8, color: "var(--wine)" }}>
                <span>Total</span><span>{rupee(order.total)}</span>
              </div>
            </div>

            {cancellationPending && (
              <div style={{ background: "#fff8e8", border: "1px solid #f0d78c", borderRadius: 6, padding: "14px 16px", marginBottom: 16, display: "flex", gap: 10 }}>
                <AlertTriangle size={18} color="#b98900" style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13.5, color: "#7a5f00" }}>Cancellation request pending</p>
                  <p style={{ fontSize: 12.5, color: "#8a7a68", marginTop: 3 }}>We've received your request and our team will review it shortly. You'll be notified once it's processed.</p>
                </div>
              </div>
            )}
            {cancellationApproved && (
              <div style={{ background: "#e9f7ee", border: "1px solid #a8dcb8", borderRadius: 6, padding: "14px 16px", marginBottom: 16, display: "flex", gap: 10 }}>
                <CheckCircle2 size={18} color="#2f9e5b" style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13.5, color: "#1e6b3e" }}>Order cancelled</p>
                  <p style={{ fontSize: 12.5, color: "#8a7a68", marginTop: 3 }}>Refund status: <strong>{order.cancellation.refund.status === "processed" ? "Refunded" : "Being processed"}</strong></p>
                </div>
              </div>
            )}

            {canCancel && !cancellationPending && (
              !showCancelForm ? (
                <button className="btn-outline" style={{ width: "100%", textAlign: "center" }} onClick={() => setShowCancelForm(true)}>Request Cancellation</button>
              ) : (
                <form onSubmit={submitCancellation} style={{ background: "var(--cream)", borderRadius: 6, padding: 18, marginTop: 4 }}>
                  <p style={{ fontSize: 13, color: "#5a4d41", marginBottom: 14, lineHeight: 1.6 }}>
                    We'll review your request and process the cancellation and any refund manually — this is not instant.
                  </p>
                  {cancelError && <div className="checkout-error" style={{ marginBottom: 12 }}>{cancelError}</div>}
                  <div className="checkout-field" style={{ marginBottom: 12 }}>
                    <label>Reason for cancellation</label>
                    <select value={reason} onChange={e => setReason(e.target.value)}>
                      {CANCEL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="checkout-field" style={{ marginBottom: 16 }}>
                    <label>Additional note (optional)</label>
                    <input value={note} onChange={e => setNote(e.target.value)} placeholder="Anything else we should know?" />
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button className="btn-gold" type="submit" disabled={submitting} style={{ flex: 1, textAlign: "center", minWidth: 160 }}>
                      {submitting ? "Submitting…" : "Submit Request"}
                    </button>
                    <a href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer"
                      className="btn-outline" style={{ flex: 1, textAlign: "center", minWidth: 160, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <MessageCircle size={14} /> Contact on WhatsApp
                    </a>
                  </div>
                </form>
              )
            )}

            {!canCancel && !cancellationPending && !cancellationApproved && (
              <p style={{ fontSize: 12.5, color: "#8a7a68", textAlign: "center" }}>
                This order can no longer be self-cancelled. Please contact us on WhatsApp for help.
              </p>
            )}

            <button onClick={() => { setOrder(null); setOrderId(""); setEmail(""); setCancelSuccess(false); setShowCancelForm(false); }}
              style={{ background: "none", border: "none", color: "#8a7a68", fontSize: 12.5, cursor: "pointer", display: "block", margin: "16px auto 0" }}>
              ← Look up a different order
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
