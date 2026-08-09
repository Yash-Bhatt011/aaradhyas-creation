import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { api, API_URL, getToken } from "../../api/client.js";
import { rupee } from "../../data/content.js";

const STATUSES = ["placed", "confirmed", "shipped", "delivered", "cancelled"];
const STATUS_COLORS = {
  placed: "#e8a838", confirmed: "#4f8ef7", shipped: "#7c5cbf",
  delivered: "#2f9e5b", cancelled: "#d94f4f"
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [detail, setDetail] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const downloadInvoice = async (order) => {
    setDownloadingInvoice(true);
    try {
      const res = await fetch(`${API_URL}/orders/${order.id}/invoice`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error("Failed to generate invoice");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${order.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Could not download invoice: " + e.message);
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const load = () => {
    setLoading(true);
    api.getOrders().then(setOrders).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const updateStatus = async (id, status) => {
    setUpdating(true);
    await api.updateOrder(id, { status });
    setUpdating(false);
    const updated = await api.getOrders();
    setOrders(updated);
    if (detail?.id === id) setDetail(updated.find(o => o.id === id));
  };

  const visible = orders.filter(o => {
    const matchSearch =
      o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div><h1>Orders</h1><p>{orders.length} total orders</p></div>
      </div>

      <div className="adm-filters">
        <input className="adm-search" placeholder="Search by order #, customer name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="adm-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {loading ? <div className="adm-loading">Loading orders…</div> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Order #</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Shiprocket</th><th>Action</th></tr>
            </thead>
            <tbody>
              {visible.length === 0 && <tr><td colSpan={9} style={{ textAlign: "center", padding: 28, color: "#8a7a68" }}>No orders found.</td></tr>}
              {visible.map(o => (
                <tr key={o.id} onClick={() => setDetail(o)} style={{ cursor: "pointer" }}>
                  <td><span className="adm-order-id">{o.orderNumber}</span></td>
                  <td style={{ fontSize: 11, color: "#8a7a68", whiteSpace: "nowrap" }}>{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                  <td>{o.customer?.name}<br /><span style={{ fontSize: 11, color: "#8a7a68" }}>{o.customer?.city}</span></td>
                  <td>{o.items?.length}</td>
                  <td style={{ fontWeight: 600 }}>{rupee(o.total)}</td>
                  <td><span className={`adm-badge ${o.paymentStatus}`}>{o.paymentStatus}</span></td>
                  <td onClick={e => e.stopPropagation()}>
                    <select
                      className="adm-select-sm"
                      value={o.status}
                      style={{ borderLeftColor: STATUS_COLORS[o.status] }}
                      onChange={e => updateStatus(o.id, e.target.value)}
                      disabled={updating}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ fontSize: 11 }}>
                    {o.shiprocket?.pushed
                      ? <span style={{ color: "#2f9e5b" }}>✓ AWB: {o.shiprocket.awbCode || "—"}</span>
                      : <span style={{ color: "#8a7a68" }}>{o.shiprocket?.error?.includes("mock") ? "Mock mode" : "Pending"}</span>}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="adm-btn adm-btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => setDetail(o)}>View</button>
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
              <h3>Order {detail.orderNumber}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  className="adm-btn adm-btn-ghost"
                  style={{ fontSize: 12, padding: "6px 14px" }}
                  onClick={() => downloadInvoice(detail)}
                  disabled={downloadingInvoice}
                >
                  <Download size={13} style={{ marginRight: 5 }} />
                  {downloadingInvoice ? "Generating…" : "Invoice"}
                </button>
                <button className="adm-close-btn" onClick={() => setDetail(null)}>✕</button>
              </div>
            </div>
            <div className="adm-order-detail">
              <div className="adm-order-section">
                <h4>Customer</h4>
                <p>{detail.customer?.name}</p>
                <p>{detail.customer?.email} · {detail.customer?.phone}</p>
                <p>{detail.customer?.address}, {detail.customer?.city}, {detail.customer?.pincode}</p>
              </div>
              <div className="adm-order-section">
                <h4>Items</h4>
                {detail.items?.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e8e0d4", fontSize: 13 }}>
                    <span>{item.name} × {item.qty}</span>
                    <span>{rupee(item.price * item.qty)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontWeight: 600 }}>
                  <span>Total</span><span>{rupee(detail.total)}</span>
                </div>
              </div>
              <div className="adm-order-section">
                <h4>Payment & Shipping</h4>
                <p>Method: {detail.paymentMethod}</p>
                <p>Status: <span className={`adm-badge ${detail.paymentStatus}`}>{detail.paymentStatus}</span></p>
                {detail.razorpayPaymentId && <p>Razorpay ID: {detail.razorpayPaymentId}</p>}
                {detail.shiprocket?.awbCode && <p>AWB Code: {detail.shiprocket.awbCode}</p>}
                {detail.shiprocket?.shipmentId && <p>Shipment ID: {detail.shiprocket.shipmentId}</p>}
                {detail.couponCode && <p>Coupon: {detail.couponCode} (−{rupee(detail.discount)})</p>}
                <p>Confirmation Email: {detail.emailSent ? <span style={{ color: "#2f9e5b" }}>✓ Sent</span> : <span style={{ color: "#8a7a68" }}>Not sent</span>}</p>
              </div>
              <div className="adm-order-section">
                <h4>Update Status</h4>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  {STATUSES.map(s => (
                    <button
                      key={s}
                      className={`adm-btn ${detail.status === s ? "adm-btn-gold" : "adm-btn-ghost"}`}
                      style={{ fontSize: 12, padding: "6px 14px" }}
                      onClick={() => updateStatus(detail.id, s)}
                      disabled={updating}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
