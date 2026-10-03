import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { admin, loading, authError } = useAuth();

  // Show a real loading state instead of a blank screen. This matters a lot on
  // free hosting tiers (Render spins the backend down after inactivity, and the
  // first request can take 30-50s to wake it) — previously this rendered null,
  // so a refresh looked like a broken white page.
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 14,
        background: "#faf7f2", fontFamily: "'Lato', sans-serif"
      }}>
        <div style={{
          width: 34, height: 34, border: "3px solid #e3e5e8",
          borderTopColor: "#C8A158", borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }} />
        <p style={{ fontSize: 13.5, color: "#8a7a68", margin: 0 }}>Signing you in…</p>
        <p style={{ fontSize: 12, color: "#b0a596", margin: 0, maxWidth: 320, textAlign: "center" }}>
          If this is the first visit in a while, the server may take up to a minute to wake up.
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Backend unreachable (asleep/restarting) — don't bounce the admin to the
  // login page, since their token is probably still valid. Let them retry.
  if (authError && !admin) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 14,
        background: "#faf7f2", fontFamily: "'Lato', sans-serif", padding: 20, textAlign: "center"
      }}>
        <p style={{ fontSize: 15, color: "#4C0E1B", fontWeight: 600, margin: 0 }}>Can't reach the server</p>
        <p style={{ fontSize: 13, color: "#8a7a68", margin: 0, maxWidth: 360 }}>{authError}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 6, padding: "10px 22px", background: "#4C0E1B", color: "#fff",
            border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13,
            fontFamily: "'Cinzel', serif", letterSpacing: "0.06em"
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!admin) return <Navigate to="/login" replace />;
  return children;
}
