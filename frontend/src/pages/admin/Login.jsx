/**
 * Login page — looks like a normal customer account sign-in.
 * Admin credentials silently redirect to /admin.
 * Regular customers see "customer portal coming soon".
 */
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Logo } from "../../components/shared.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import "../../styles/storefront.css";

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [note,     setNote]     = useState(null); // non-admin message

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setNote(null); setLoading(true);
    try {
      await login(email, password);
      navigate("/admin");           // admin creds → go to panel
    } catch (err) {
      // If error looks like wrong credentials rather than network, show generic note
      if (err.status === 401) {
        setNote("Customer accounts are coming soon. If you're looking to track an order, please contact us on WhatsApp.");
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ac-root" style={{ background:"var(--ivory)", minHeight:"100vh" }}>
      {/* Minimal nav */}
      <nav style={{ padding:"16px 5vw", borderBottom:"1px solid var(--beige)", display:"flex", alignItems:"center", gap:12 }}>
        <Link to="/" style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Logo size={30}/>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:18, color:"var(--wine)" }}>
            Aaradhya's Creation
          </span>
        </Link>
      </nav>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"calc(100vh - 64px)", padding:"40px 20px" }}>
        <div style={{ width:"100%", maxWidth:400 }}>

          {/* Header */}
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <Lock size={32} color="var(--gold)" strokeWidth={1.5} style={{ margin:"0 auto 12px" }}/>
            <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:28, color:"var(--wine)", margin:"0 0 6px" }}>
              Sign In
            </h1>
            <p style={{ fontSize:13, color:"#8a7a68", margin:0 }}>
              Access your Aaradhya's Creation account
            </p>
          </div>

          {/* Form card */}
          <div style={{ background:"#fff", border:"1px solid var(--beige)", borderRadius:8, padding:"32px 28px", boxShadow:"0 2px 16px rgba(0,0,0,0.06)" }}>
            {error && (
              <div style={{ background:"#fce8e6", border:"1px solid #f4b9b2", borderRadius:6, padding:"10px 14px", fontSize:13, color:"#d72c0d", marginBottom:16 }}>
                {error}
              </div>
            )}
            {note && (
              <div style={{ background:"#fff5e3", border:"1px solid rgba(200,161,88,0.4)", borderRadius:6, padding:"12px 14px", fontSize:13, color:"#6b5d4f", marginBottom:16, lineHeight:1.6 }}>
                {note}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:16 }}>
                <label style={{ fontSize:12, fontWeight:600, color:"var(--ink)", letterSpacing:"0.01em" }}>
                  Email Address
                </label>
                <input
                  type="email" required autoComplete="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{ padding:"10px 14px", border:"1px solid var(--beige)", borderRadius:6, fontSize:14, outline:"none", fontFamily:"'Lato',sans-serif" }}
                />
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:24 }}>
                <label style={{ fontSize:12, fontWeight:600, color:"var(--ink)" }}>Password</label>
                <div style={{ position:"relative" }}>
                  <input
                    type={showPwd ? "text" : "password"} required autoComplete="current-password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width:"100%", padding:"10px 40px 10px 14px", border:"1px solid var(--beige)", borderRadius:6, fontSize:14, outline:"none", fontFamily:"'Lato',sans-serif" }}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#8a7a68", display:"flex" }}>
                    {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{ width:"100%", padding:"12px", background:"linear-gradient(135deg,var(--wine),#6b1224)", color:"#fff", border:"none", borderRadius:6, fontSize:14, fontFamily:"'Cinzel',serif", letterSpacing:"0.08em", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          </div>

          <p style={{ textAlign:"center", marginTop:18, fontSize:12.5, color:"#8a7a68" }}>
            <Link to="/" style={{ color:"var(--gold-dark)" }}>← Back to store</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
