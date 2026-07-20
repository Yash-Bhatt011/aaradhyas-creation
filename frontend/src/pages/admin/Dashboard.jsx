import React, { useEffect, useState } from "react";
import { ShoppingBag, Users, Package, TrendingUp, AlertCircle } from "lucide-react";
import { api } from "../../api/client.js";
import { rupee } from "../../data/content.js";

function StatCard({ icon: Icon, label, value, sub, colorClass = "gold" }) {
  return (
    <div className={`adm-stat-card ${colorClass}`}>
      <div className="adm-stat-icon"><Icon size={36}/></div>
      <p className="adm-stat-label">{label}</p>
      <h3 className="adm-stat-value">{value}</h3>
      {sub && <p className="adm-stat-sub">{sub}</p>}
    </div>
  );
}

const STATUS_COLORS = {
  placed: "#e8a838", confirmed: "#4f8ef7", shipped: "#7c5cbf",
  delivered: "#2f9e5b", cancelled: "#d94f4f"
};

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getOrders(), api.getProducts(true), api.getCustomers()])
      .then(([o, p, c]) => { setOrders(o); setProducts(p); setCustomers(c); })
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = orders.filter(o => o.paymentStatus === "paid").reduce((s, o) => s + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === "placed").length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 3);

  const recentOrders = orders.slice(0, 8);

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <h1>Dashboard</h1>
        <p>Welcome back. Here's what's happening with your store today.</p>
      </div>

      {loading ? <div className="adm-loading">Loading…</div> : (
        <>
          <div className="adm-stats-grid">
            <StatCard icon={TrendingUp} label="Total Revenue" value={rupee(totalRevenue)} sub={`${orders.filter(o => o.paymentStatus === "paid").length} paid orders`} colorClass="gold" />
            <StatCard icon={ShoppingBag} label="Total Orders" value={orders.length} sub={`${pendingOrders} pending`} colorClass="blue" />
            <StatCard icon={Users} label="Customers" value={customers.length} sub="All time" colorClass="wine" />
            <StatCard icon={Package} label="Products" value={products.length} sub={`${products.filter(p => p.active).length} active`} colorClass="green" />
          </div>

          {lowStock.length > 0 && (
            <div className="adm-alert">
              <AlertCircle size={16} />
              <strong>Low Stock Alert:</strong>
              {lowStock.map(p => `${p.name} (${p.stock} left)`).join(" · ")}
            </div>
          )}

          <div className="adm-section-head"><h2>Recent Orders</h2></div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", color: "#6b5d4f" }}>No orders yet.</td></tr>}
                {recentOrders.map(o => (
                  <tr key={o.id}>
                    <td><span className="adm-order-id">{o.orderNumber}</span></td>
                    <td>{o.customer?.name}<br /><span style={{ fontSize: 11, color: "#8a7a68" }}>{o.customer?.city}</span></td>
                    <td>{o.items?.length} item{o.items?.length !== 1 ? "s" : ""}</td>
                    <td style={{ fontWeight: 600 }}>{rupee(o.total)}</td>
                    <td><span className={`adm-badge ${o.paymentStatus}`}>{o.paymentStatus}</span></td>
                    <td><span className="adm-status-dot" style={{ background: STATUS_COLORS[o.status] || "#aaa" }} />{o.status}</td>
                    <td style={{ fontSize: 11, color: "#8a7a68" }}>{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="adm-2col" style={{ marginTop: 32 }}>
            <div>
              <div className="adm-section-head"><h2>Top Customers</h2></div>
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead><tr><th>Name</th><th>Orders</th><th>Total Spent</th></tr></thead>
                  <tbody>
                    {customers.slice(0, 5).map(c => (
                      <tr key={c.id}>
                        <td>{c.name}<br /><span style={{ fontSize: 11, color: "#8a7a68" }}>{c.email}</span></td>
                        <td>{c.orders}</td>
                        <td style={{ fontWeight: 600 }}>{rupee(c.spent)}</td>
                      </tr>
                    ))}
                    {customers.length === 0 && <tr><td colSpan={3} style={{ textAlign: "center", color: "#6b5d4f" }}>No customers yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <div className="adm-section-head"><h2>Low Stock Products</h2></div>
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead><tr><th>Product</th><th>Collection</th><th>Stock</th></tr></thead>
                  <tbody>
                    {lowStock.length === 0 && <tr><td colSpan={3} style={{ textAlign: "center", color: "#6b5d4f" }}>All products well stocked.</td></tr>}
                    {lowStock.map(p => (
                      <tr key={p.id}>
                        <td>{p.name}</td><td>{p.collection}</td>
                        <td><span style={{ color: "#d94f4f", fontWeight: 600 }}>{p.stock} left</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
