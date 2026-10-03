import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard, Package, FolderOpen, ShoppingBag, Users,
  Image, Tag, Settings, LogOut, Star, ExternalLink, Store, Megaphone, AlertTriangle
} from "lucide-react";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "../../styles/admin.css";

const MAIN_NAV = [
  { to: "/admin",             end: true, icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/products",               icon: Package,          label: "Products" },
  { to: "/admin/collections",            icon: FolderOpen,       label: "Collections" },
];
const MANAGE_NAV = [
  { to: "/admin/orders",     icon: ShoppingBag, label: "Orders" },
  { to: "/admin/customers",  icon: Users,        label: "Customers" },
  { to: "/admin/reviews",    icon: Star,         label: "Reviews" },
  { to: "/admin/discounts",  icon: Tag,          label: "Discounts" },
  { to: "/admin/ads",        icon: Megaphone,    label: "Ad Manager" },
  { to: "/admin/banners",    icon: Image,        label: "Banners & Media" },
  { to: "/admin/settings",   icon: Settings,     label: "Settings" },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingCancellations, setPendingCancellations] = useState(0);
  const handleLogout = () => { logout(); navigate("/"); };

  useEffect(() => {
    const fetchPending = () => api.getCancellations("requested").then(r => setPendingCancellations(r.length)).catch(() => {});
    fetchPending();
    const interval = setInterval(fetchPending, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="adm-root">
      {/* ── Sidebar ── */}
      <aside className="adm-sidebar">
        <div className="adm-sidebar-logo">
          <div className="adm-sidebar-brand">
            <img src="/logo.svg" alt=""/>
            <h2>Aaradhya's</h2>
          </div>
          <p>Store Administration</p>
        </div>

        <nav className="adm-nav">
          <div className="adm-nav-section">Store</div>
          {MAIN_NAV.map(({ to, end, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `adm-nav-item ${isActive ? "active" : ""}`}>
              <Icon size={16}/>{label}
            </NavLink>
          ))}
          <div className="adm-nav-section">Manage</div>
          {MANAGE_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `adm-nav-item ${isActive ? "active" : ""}`}>
              <Icon size={16}/>{label}
            </NavLink>
          ))}
          <NavLink to="/admin/cancellations"
            className={({ isActive }) => `adm-nav-item ${isActive ? "active" : ""}`}
            style={{ justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <AlertTriangle size={16}/>Cancellations
            </span>
            {pendingCancellations > 0 && (
              <span style={{ background: "#d94f4f", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 100, padding: "1px 7px", minWidth: 18, textAlign: "center" }}>
                {pendingCancellations}
              </span>
            )}
          </NavLink>
        </nav>

        <div className="adm-exit" onClick={handleLogout}>
          <LogOut size={15}/>Sign out
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="adm-main">
        {/* Top bar */}
        <div className="adm-topbar">
          <span className="adm-topbar-title" />
          <Link to="/" className="adm-topbar-store" target="_blank">
            <Store size={14}/>View Store<ExternalLink size={11}/>
          </Link>
          <div className="adm-topbar-user">
            <div className="adm-topbar-avatar">
              {(admin?.name?.[0] || "A").toUpperCase()}
            </div>
            <span>{admin?.name || "Admin"}</span>
          </div>
        </div>

        <Outlet/>
      </div>
    </div>
  );
}
