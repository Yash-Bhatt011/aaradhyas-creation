import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, IndianRupee } from "lucide-react";
import { api } from "../../api/client.js";
import { rupee } from "../../data/content.js";

const STATUS_FILTERS = [
  { key: "requested", label: "Pending" }, { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" }, { key: "", label: "All" },
];

export default function Cancellations() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("requested");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [acting, setActing] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundModalOrder, setRefundModalOrder] = useState(null);
  const [refundMethod, setRefundMethod] = useState("bank_transfer");
  const [refundRef, setRefundRef] = useState("");
  const [refundNote, setRefundNote] = useState("");

  const load = () => {
    setLoading(true);
    api.getCancellations(filter || undefined).then(setRequests).finally(() => setLoading(false));
  };
  useEffect(load, [filter]);

  const openDetail = (order) => { setDetail(order); setAdminNote(""); setRefundAmount(String(order.total)); };

  const approve = async () => {
    setActing(true);
    try {
      const updated = await api.approveCancellation(detail.id, adminNote, refundAmount ? Number(refundAmount) : undefined);
      setDetail(updated); load();
    } catch (e) { alert(e.message); } finally { setActing(false); }
  };

  const reject = async () => {
    if (!adminNote.trim()) { alert("Please add a note explaining why this is being rejected."); return; }
    setActing(true);
    try { const updated = await api.rejectCancellation(detail.id, adminNote); setDetail(updated); load(); }
    catch (e) { alert(e.message); } finally { setActing(false); }
  };

  const markRefund = async () => {
    setActing(true);
    try {
      await api.markRefundProcessed(refundModalOrder.id, {
        amount: refundModalOrder.cancellation.refund.amount,
        method: refundMethod, reference: refundRef, note: refundNote
      });
      setRefundModalOrder(null); setDetail(null); load();
    } catch (e) { alert(e.message); } finally { setActing(false); }
  };

  const visible = requests.filter(o => {
    const q = search.toLowerCase();
    return !q || o.orderNumber.toLowerCase().includes(q) ||
      o.customer.name.toLowerCase().includes(q) || o.customer.email.toLowerCase().includes(q);
  });

  const statusIcon = (s) => s === "requested" ? <Clock size={13} color="#b98900" />
    : s === "approved" ? <CheckCircle2 size={13} color="#2f9e5b" />
    : s === "rejected" ? <XCircle size={13} color="#d94f4f" /> : null;

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1>Cancellation Requests</h1>
          <p>{requests.length} {filter ? STATUS_FILTERS.find(f=>f.key===filter)?.label.toLowerCase() : "total"} request{requests.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="sfy-filter-bar">
        <div className="sfy-status-tabs">
          {STATUS_FILTERS.map(f => (
            <button key={f.key} className={`sfy-status-tab ${filter === f.key ? "active" : ""}`} onClick={() => setFilter(f.key)}>{f.label}</button>
          ))}
        </div>
        <div className="adm-filters" style={{ marginBottom: 0 }}>
          <input className="adm-search" placeholder="Search by order #, customer name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? <div className="adm-loading">Loading…</div> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Order</th><th>Customer</th><th>Reason</th><th>Payment</th><th>Amount</th><th>Status</th><th>Requested</th><th>Actions</th></tr></thead>
            <tbody>
              {visible.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--adm-muted)" }}>No cancellation requests found.</td></tr>}
              {visible.map(o => (
                <tr key={o.id} onClick={() => openDetail(o)} style={{ cursor: "pointer" }}>
                  <td><span className="adm-order-id">{o.orderNumber}</span></td>
                  <td>{o.customer.name}<br /><span style={{ fontSize: 11, color: "var(--adm-muted)" }}>{o.customer.email}</span></td>
                  <td style={{ maxWidth: 180, fontSize: 12.5 }}>{o.cancellation.reason}</td>
                  <td style={{ fontSize: 12 }}>{o.paymentMethod === "cod" ? "COD" : "Razorpay"} · <span className={`adm-badge ${o.paymentStatus}`}>{o.paymentStatus}</span></td>
                  <td style={{ fontWeight: 600 }}>{rupee(o.total)}</td>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>
                      {statusIcon(o.cancellation.status)} {o.cancellation.status}
                    </span>
                    {o.cancellation.status === "approved" && (
                      <div style={{ fontSize: 10.5, color: "var(--adm-muted)", marginTop: 2 }}>
                        Refund: {o.cancellation.refund.status === "processed" ? "✓ Done" : "Pending"}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: 11, color: "var(--adm-muted)", whiteSpace: "nowrap" }}>
                    {new Date(o.cancellation.requestedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="adm-btn adm-btn-ghost" style={{ fontSize: 11, padding: "5px 12px" }} onClick={() => openDetail(o)}>Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div className="adm-modal-overlay" onClick={() => setDetail(null)}>
          <div className="adm-modal adm-modal-wide" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-head">
              <h3>Cancellation — {detail.orderNumber}</h3>
              <button className="adm-close-btn" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="adm-order-detail">
              <div className="adm-order-section">
                <h4>Customer &amp; Order</h4>
                <p><strong>{detail.customer.name}</strong></p>
                <p>{detail.customer.email} · {detail.customer.phone}</p>
                <p>{detail.items.length} item{detail.items.length !== 1 ? "s" : ""} · {rupee(detail.total)}</p>
                <p>Payment: {detail.paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay"} ({detail.paymentStatus})</p>
              </div>
              <div className="adm-order-section">
                <h4>Cancellation Request</h4>
                <p><strong>Reason:</strong> {detail.cancellation.reason}</p>
                {detail.cancellation.customerNote && <p><strong>Note:</strong> {detail.cancellation.customerNote}</p>}
                <p><strong>Requested:</strong> {new Date(detail.cancellation.requestedAt).toLocaleString("en-IN")}</p>
                <p><strong>Status:</strong> <span style={{ textTransform: "capitalize" }}>{detail.cancellation.status}</span></p>
              </div>

              {detail.cancellation.status === "approved" && (
                <div className="adm-order-section" style={{ gridColumn: "1/-1" }}>
                  <h4>Refund &amp; Inventory</h4>
                  <p><strong>Inventory restored:</strong> {detail.cancellation.inventoryRestored ? "✓ Yes" : "No"}</p>
                  <p><strong>Refund status:</strong> {detail.cancellation.refund.status}</p>
                  {detail.cancellation.refund.note && <p style={{ fontSize: 12, color: "var(--adm-muted)" }}>{detail.cancellation.refund.note}</p>}
                  {detail.cancellation.refund.status === "processed" && (
                    <p><strong>Refunded:</strong> {rupee(detail.cancellation.refund.amount)} via {detail.cancellation.refund.method}{detail.cancellation.refund.refundId ? ` (${detail.cancellation.refund.refundId})` : ""}</p>
                  )}
                  {detail.cancellation.refund.status !== "processed" && (
                    <button className="adm-btn adm-btn-gold" style={{ marginTop: 8 }} onClick={() => { setRefundModalOrder(detail); setRefundRef(""); setRefundNote(""); }}>
                      <IndianRupee size={13} style={{ marginRight: 5 }} /> Mark Refund as Processed
                    </button>
                  )}
                </div>
              )}

              {detail.cancellation.status === "requested" && (
                <div className="adm-order-section" style={{ gridColumn: "1/-1" }}>
                  <h4>Take Action</h4>
                  <div className="adm-field" style={{ marginBottom: 12 }}>
                    <label>Admin Note (required for rejection, optional for approval)</label>
                    <textarea rows={2} value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="e.g. Order not yet shipped, approving cancellation" />
                  </div>
                  <div className="adm-field" style={{ marginBottom: 14, maxWidth: 220 }}>
                    <label>Refund Amount (₹)</label>
                    <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} />
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="adm-btn adm-btn-gold" onClick={approve} disabled={acting}>
                      <CheckCircle2 size={13} style={{ marginRight: 5 }} /> {acting ? "Processing…" : "Approve Cancellation"}
                    </button>
                    <button className="adm-btn adm-btn-danger" onClick={reject} disabled={acting}>
                      <XCircle size={13} style={{ marginRight: 5 }} /> Reject Request
                    </button>
                  </div>
                </div>
              )}

              {detail.cancellation.adminNotes?.length > 0 && (
                <div className="adm-order-section" style={{ gridColumn: "1/-1" }}>
                  <h4>Admin Notes History</h4>
                  {detail.cancellation.adminNotes.map((n, i) => (
                    <p key={i} style={{ fontSize: 12.5, marginBottom: 6 }}>
                      <span style={{ color: "var(--adm-muted)" }}>{new Date(n.at).toLocaleString("en-IN")} — {n.by}:</span> {n.note}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {refundModalOrder && (
        <div className="adm-modal-overlay" onClick={() => setRefundModalOrder(null)}>
          <div className="adm-modal adm-modal-sm" onClick={e => e.stopPropagation()}>
            <h3>Mark Refund as Processed</h3>
            <p style={{ marginTop: 8, color: "var(--adm-muted)", fontSize: 13 }}>
              Confirm you've refunded {rupee(refundModalOrder.cancellation.refund.amount)} to {refundModalOrder.customer.name} outside the app (bank transfer, UPI, etc.)
            </p>
            <div className="adm-field" style={{ marginTop: 16, marginBottom: 12 }}>
              <label>Method</label>
              <select value={refundMethod} onChange={e => setRefundMethod(e.target.value)}>
                <option value="bank_transfer">Bank Transfer</option><option value="upi">UPI</option>
                <option value="cash">Cash</option><option value="other">Other</option>
              </select>
            </div>
            <div className="adm-field" style={{ marginBottom: 12 }}>
              <label>Reference / Transaction ID (optional)</label>
              <input value={refundRef} onChange={e => setRefundRef(e.target.value)} placeholder="UPI ref, transaction ID, etc." />
            </div>
            <div className="adm-field"><label>Note (optional)</label><input value={refundNote} onChange={e => setRefundNote(e.target.value)} /></div>
            <div className="adm-modal-foot" style={{ marginTop: 20 }}>
              <button className="adm-btn adm-btn-ghost" onClick={() => setRefundModalOrder(null)}>Cancel</button>
              <button className="adm-btn adm-btn-gold" onClick={markRefund} disabled={acting}>{acting ? "Saving…" : "Confirm Refund"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
