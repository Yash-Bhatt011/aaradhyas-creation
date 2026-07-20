import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Heart, User, ShoppingBag, Menu, X, Star, ChevronLeft, ChevronRight,
  Sparkles, Truck, ShieldCheck, RotateCcw, Gem, Gift, PackageCheck, Phone,
  LayoutDashboard, Package, FolderOpen, Tag, Image, Settings, LogOut,
  Plus, Edit2, Trash2, Eye, TrendingUp, Users, DollarSign, BarChart2,
  Upload, Save, ArrowLeft, CheckCircle, AlertCircle, ToggleLeft, ToggleRight,
  ChevronDown, Filter, Download, Bell, Grid, List
} from "lucide-react";

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const img = (seed, w = 900, h = 1200) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const rupee = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

const INITIAL_COLLECTIONS = [
  { id: "bridal", title: "Bridal Sarees", sub: "Heirlooms for the big day", seed: "aaradhya-bridal", active: true, count: 48 },
  { id: "banarasi", title: "Banarasi Sarees", sub: "Woven on ancient looms", seed: "aaradhya-banarasi", active: true, count: 63 },
  { id: "kanjivaram", title: "Kanjivaram Sarees", sub: "Temple silk, South heritage", seed: "aaradhya-kanji", active: true, count: 37 },
  { id: "silk", title: "Pure Silk Sarees", sub: "Lustre that lasts generations", seed: "aaradhya-silk", active: true, count: 55 },
  { id: "organza", title: "Organza Sarees", sub: "Featherlight grandeur", seed: "aaradhya-organza", active: true, count: 29 },
  { id: "designer", title: "Designer Sarees", sub: "Couture, reimagined", seed: "aaradhya-designer", active: false, count: 18 },
  { id: "festive", title: "Festive Edit", sub: "For every shubh moment", seed: "aaradhya-festive", active: true, count: 42 },
  { id: "handloom", title: "Handloom Sarees", sub: "By artisan hand, thread by thread", seed: "aaradhya-handloom", active: true, count: 31 },
];

const INITIAL_PRODUCTS = [
  { id: 1, name: "Meherunisa Banarasi", fabric: "Pure Katan Silk", collection: "banarasi", price: 42500, mrp: 52000, rating: 4.9, stock: 8, active: true, seed: "na1", featured: true },
  { id: 2, name: "Rajeshwari Kanjivaram", fabric: "Temple Border Silk", collection: "kanjivaram", price: 58900, mrp: 68000, rating: 5.0, stock: 4, active: true, seed: "na2", featured: true },
  { id: 3, name: "Anaisha Organza", fabric: "Hand-painted Organza", collection: "organza", price: 28750, mrp: 33500, rating: 4.8, stock: 12, active: true, seed: "na3", featured: false },
  { id: 4, name: "Vasundhara Zari", fabric: "Tissue Silk, Pure Zari", collection: "silk", price: 36200, mrp: 41000, rating: 4.9, stock: 6, active: true, seed: "na4", featured: true },
  { id: 5, name: "Indrani Bridal Red", fabric: "Pure Silk Zari", collection: "bridal", price: 64500, mrp: 75000, rating: 5.0, stock: 3, active: true, seed: "bs1", featured: true },
  { id: 6, name: "Suhana Emerald Silk", fabric: "Pure Mulberry Silk", collection: "silk", price: 31900, mrp: 38000, rating: 4.7, stock: 9, active: true, seed: "bs2", featured: false },
  { id: 7, name: "Padmini Georgette", fabric: "French Georgette", collection: "designer", price: 18750, mrp: 22000, rating: 4.6, stock: 15, active: false, seed: "bs3", featured: false },
  { id: 8, name: "Kiyara Ivory Zari", fabric: "Ivory Katan Silk", collection: "banarasi", price: 26400, mrp: 30000, rating: 4.8, stock: 7, active: true, seed: "bs4", featured: false },
];

const OCCASIONS = ["Wedding", "Reception", "Festive Wear", "Mehendi", "Sangeet", "Party Wear", "Office Elegance", "Casual Grace"];
const FABRICS = [
  { name: "Silk", seed: "fab-silk" }, { name: "Banarasi Silk", seed: "fab-banarasi" },
  { name: "Kanjivaram Silk", seed: "fab-kanji" }, { name: "Organza", seed: "fab-organza" },
  { name: "Chiffon", seed: "fab-chiffon" }, { name: "Georgette", seed: "fab-georgette" },
  { name: "Linen", seed: "fab-linen" }, { name: "Tissue", seed: "fab-tissue" },
];
const TESTIMONIALS = [
  { name: "Ritika Sharma", city: "Mumbai", rating: 5, text: "My bridal Kanjivaram from Aaradhya's Creation was the most precious gift I gave myself. The zari work, the drape, the weight of the silk — every guest asked where it was from." },
  { name: "Anushka Rao", city: "Hyderabad", rating: 5, text: "I have bought four sarees over two years and each one arrived wrapped like a jewel. The Banarasi is now my mother's favourite too — she wears it every Diwali." },
  { name: "Devika Menon", city: "Bengaluru", rating: 5, text: "The styling support team helped me choose the right drape and blouse design for my reception. It felt like having a personal stylist, not just a store." },
];
const GALLERY = ["ig1","ig2","ig3","ig4","ig5","ig6"];
const WHY_US = [
  { icon: Gem, title: "Pure Quality Fabrics", text: "Hand-verified silk, zari and weaves." },
  { icon: Sparkles, title: "Handcrafted Detailing", text: "Every border finished by artisan hand." },
  { icon: ShieldCheck, title: "Secure Checkout", text: "Bank-grade encryption, always." },
  { icon: Truck, title: "Worldwide Shipping", text: "Delivered safely, anywhere you are." },
  { icon: RotateCcw, title: "Easy Returns", text: "7-day hassle-free return window." },
  { icon: User, title: "Bridal Styling Support", text: "One-on-one drape & blouse consults." },
  { icon: Gift, title: "Premium Packaging", text: "Wrapped in signature gold silk boxes." },
  { icon: PackageCheck, title: "Exclusive Festive Edits", text: "Limited drops, never mass-produced." },
];

/* ─────────────────────────────────────────
   SHARED HELPERS
───────────────────────────────────────── */
function ZariDivider({ flip }) {
  return (
    <div className="zari-divider" aria-hidden="true">
      <svg viewBox="0 0 1200 40" preserveAspectRatio="none" style={{ transform: flip ? "scaleY(-1)" : "none" }}>
        <path d="M0 20 Q 50 2, 100 20 T 200 20 T 300 20 T 400 20 T 500 20 T 600 20 T 700 20 T 800 20 T 900 20 T 1000 20 T 1100 20 T 1200 20"
          fill="none" stroke="url(#zariGrad)" strokeWidth="1.4" />
        <defs>
          <linearGradient id="zariGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#C8A158" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#C8A158" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#C8A158" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        {[100, 300, 500, 700, 900, 1100].map((x) => (
          <circle key={x} cx={x} cy="20" r="3" fill="#C8A158" />
        ))}
      </svg>
    </div>
  );
}

function Eyebrow({ children, className = "" }) {
  return <p className={`eyebrow ${className}`}>{children}</p>;
}
function StarRow({ rating = 5 }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={13} fill={i < Math.round(rating) ? "#C8A158" : "none"} stroke="#C8A158" strokeWidth={1.3} />
      ))}
    </div>
  );
}
function Reveal({ children, delay = 0, className = "", as: Tag = "div", style = {} }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`reveal-up ${visible ? "is-visible" : ""} ${className}`} style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </Tag>
  );
}
function Monogram({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="ac-monogram">
      <circle cx="32" cy="32" r="30.5" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="32" cy="32" r="26.5" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
      <text x="32" y="40" textAnchor="middle" fontFamily="'Cormorant Garamond', serif" fontStyle="italic" fontSize="26" fill="currentColor">AC</text>
    </svg>
  );
}

/* ─────────────────────────────────────────
   3D SPINNING SAREE BOX
───────────────────────────────────────── */
function SareeBox3D() {
  const boxRef = useRef(null);
  const animRef = useRef(null);
  const rotX = useRef(15);
  const rotY = useRef(-20);
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let t = 0;
    const animate = () => {
      if (!dragging.current) {
        rotY.current += 0.4;
      }
      if (boxRef.current) {
        boxRef.current.style.transform = `rotateX(${rotX.current}deg) rotateY(${rotY.current}deg)`;
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const onMouseDown = (e) => { dragging.current = true; lastMouse.current = { x: e.clientX, y: e.clientY }; };
  const onMouseMove = (e) => {
    if (!dragging.current) return;
    rotY.current += (e.clientX - lastMouse.current.x) * 0.6;
    rotX.current -= (e.clientY - lastMouse.current.y) * 0.3;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseUp = () => { dragging.current = false; };

  return (
    <div className="box3d-scene" onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
      <div className="box3d-cube" ref={boxRef}>
        <div className="box3d-face front">
          <div className="box3d-face-inner">
            <div className="box3d-logo">AC</div>
            <div className="box3d-tag">Luxury Collection</div>
          </div>
        </div>
        <div className="box3d-face back">
          <div className="box3d-face-inner">
            <div className="box3d-logo">✦</div>
            <div className="box3d-tag">Since 2009</div>
          </div>
        </div>
        <div className="box3d-face left">
          <div className="box3d-face-inner" style={{writingMode:'vertical-rl'}}>Handwoven</div>
        </div>
        <div className="box3d-face right">
          <div className="box3d-face-inner" style={{writingMode:'vertical-rl'}}>Surat · India</div>
        </div>
        <div className="box3d-face top">
          <div className="box3d-ribbon-h"/>
          <div className="box3d-ribbon-v"/>
          <div className="box3d-bow">✦</div>
        </div>
        <div className="box3d-face bottom"></div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   3D FLOATING FABRIC CARDS
───────────────────────────────────────── */
function Card3D({ children, className = "" }) {
  const ref = useRef(null);
  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    ref.current.style.transform = `perspective(800px) rotateY(${x * 14}deg) rotateX(${-y * 10}deg) translateZ(8px)`;
    ref.current.style.boxShadow = `${-x * 18}px ${y * 18}px 40px rgba(76,14,27,0.2)`;
  };
  const handleLeave = () => {
    ref.current.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0)";
    ref.current.style.boxShadow = "";
  };
  return (
    <div ref={ref} className={`card3d ${className}`} onMouseMove={handleMove} onMouseLeave={handleLeave}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────
   3D PARALLAX HERO PARTICLES
───────────────────────────────────────── */
function GoldParticles() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 2.2 + 0.4, vx: (Math.random() - 0.5) * 0.3,
      vy: Math.random() * -0.5 - 0.1, opacity: Math.random() * 0.7 + 0.2, pulse: Math.random() * Math.PI * 2
    }));
    let af;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.pulse += 0.02; p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10 || p.x > canvas.width + 10) p.vx *= -1;
        const alpha = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,161,88,${alpha})`;
        ctx.fill();
      });
      af = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(af);
  }, []);
  return <canvas ref={canvasRef} className="gold-particles" />;
}

/* ─────────────────────────────────────────
   3D ROTATING MANDALA
───────────────────────────────────────── */
function Mandala3D() {
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    const af = setInterval(() => setAngle(a => a + 0.3), 16);
    return () => clearInterval(af);
  }, []);
  const r = 80, petals = 12;
  const pts = Array.from({ length: petals }, (_, i) => {
    const a = (i / petals) * Math.PI * 2 + (angle * Math.PI / 180);
    return { x: 120 + Math.cos(a) * r, y: 120 + Math.sin(a) * r };
  });
  return (
    <svg viewBox="0 0 240 240" width="240" height="240" className="mandala3d">
      <defs>
        <radialGradient id="mGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C8A158" stopOpacity="0.9"/>
          <stop offset="60%" stopColor="#9C7A33" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#C8A158" stopOpacity="0"/>
        </radialGradient>
        <filter id="mGlow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="120" cy="120" r="115" fill="none" stroke="rgba(200,161,88,0.15)" strokeWidth="0.5"/>
      <circle cx="120" cy="120" r="88" fill="none" stroke="rgba(200,161,88,0.2)" strokeWidth="0.5"/>
      {pts.map((p, i) => {
        const next = pts[(i + 1) % petals];
        const a2 = ((i + 0.5) / petals) * Math.PI * 2 + (angle * Math.PI / 180);
        const mid = { x: 120 + Math.cos(a2) * r * 0.55, y: 120 + Math.sin(a2) * r * 0.55 };
        return (
          <g key={i} filter="url(#mGlow)">
            <path d={`M 120 120 Q ${mid.x} ${mid.y} ${p.x} ${p.y}`} fill="none" stroke="rgba(200,161,88,0.6)" strokeWidth="0.8"/>
            <circle cx={p.x} cy={p.y} r={i % 3 === 0 ? 3 : 1.5} fill="#C8A158" opacity="0.8"/>
          </g>
        );
      })}
      <g transform={`rotate(${angle * 2}, 120, 120)`}>
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return <line key={i} x1={120 + Math.cos(a)*20} y1={120 + Math.sin(a)*20} x2={120 + Math.cos(a)*48} y2={120 + Math.sin(a)*48} stroke="rgba(200,161,88,0.4)" strokeWidth="0.7"/>;
        })}
      </g>
      <circle cx="120" cy="120" r="18" fill="url(#mGrad)" opacity="0.9"/>
      <text x="120" y="126" textAnchor="middle" fontFamily="'Cormorant Garamond', serif" fontStyle="italic" fontSize="13" fill="#C8A158" opacity="0.9">AC</text>
    </svg>
  );
}

/* ─────────────────────────────────────────
   ADMIN PANEL
───────────────────────────────────────── */
function AdminPanel({ onExit, products: initProducts, collections: initCollections, onSave }) {
  const [tab, setTab] = useState("dashboard");
  const [products, setProducts] = useState(initProducts);
  const [collections, setCollections] = useState(initCollections);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCollection, setEditingCollection] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [searchQ, setSearchQ] = useState("");
  const [filterCol, setFilterCol] = useState("all");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const totalRevenue = products.filter(p => p.active).reduce((s, p) => s + p.price, 0);
  const activeProducts = products.filter(p => p.active).length;
  const activeCollections = collections.filter(c => c.active).length;
  const lowStock = products.filter(p => p.stock <= 4 && p.active).length;

  const BLANK_PRODUCT = { id: Date.now(), name: "", fabric: "", collection: "silk", price: 0, mrp: 0, rating: 4.5, stock: 10, active: true, seed: `prod${Date.now()}`, featured: false };
  const BLANK_COLLECTION = { id: `col${Date.now()}`, title: "", sub: "", seed: `col${Date.now()}`, active: true, count: 0 };

  const saveProduct = (p) => {
    setProducts(prev => prev.find(x => x.id === p.id) ? prev.map(x => x.id === p.id ? p : x) : [...prev, p]);
    setEditingProduct(null); showToast("Product saved successfully");
  };
  const deleteProduct = (id) => { setProducts(prev => prev.filter(p => p.id !== id)); setConfirmDelete(null); showToast("Product deleted", "error"); };
  const toggleProductActive = (id) => { setProducts(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p)); };

  const saveCollection = (c) => {
    setCollections(prev => prev.find(x => x.id === c.id) ? prev.map(x => x.id === c.id ? c : x) : [...prev, c]);
    setEditingCollection(null); showToast("Collection saved successfully");
  };
  const deleteCollection = (id) => { setCollections(prev => prev.filter(c => c.id !== id)); setConfirmDelete(null); showToast("Collection deleted", "error"); };
  const toggleCollectionActive = (id) => { setCollections(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c)); };

  const filteredProducts = products.filter(p => {
    const matchQ = p.name.toLowerCase().includes(searchQ.toLowerCase()) || p.fabric.toLowerCase().includes(searchQ.toLowerCase());
    const matchC = filterCol === "all" || p.collection === filterCol;
    return matchQ && matchC;
  });

  return (
    <div className="adm-root">
      <style>{`
        .adm-root { display:flex; min-height:100vh; font-family:'Lato',sans-serif; background:#0f0a08; color:#e8ddd0; }
        .adm-sidebar { width:240px; flex-shrink:0; background:#1a100c; border-right:1px solid rgba(200,161,88,0.15); display:flex; flex-direction:column; position:sticky; top:0; height:100vh; overflow-y:auto; }
        .adm-sidebar-logo { padding:28px 22px 20px; border-bottom:1px solid rgba(200,161,88,0.12); }
        .adm-sidebar-logo h2 { font-family:'Cormorant Garamond',serif; font-style:italic; font-size:20px; color:#C8A158; margin:0 0 3px; }
        .adm-sidebar-logo p { font-size:10px; letter-spacing:0.2em; color:rgba(200,161,88,0.5); font-family:'Cinzel',serif; text-transform:uppercase; margin:0; }
        .adm-nav { flex:1; padding:14px 0; }
        .adm-nav-item { display:flex; align-items:center; gap:12px; padding:12px 22px; cursor:pointer; font-size:13px; color:rgba(232,221,208,0.65); transition:all .2s; border-left:2px solid transparent; }
        .adm-nav-item:hover { color:#e8ddd0; background:rgba(200,161,88,0.06); }
        .adm-nav-item.active { color:#C8A158; background:rgba(200,161,88,0.1); border-left-color:#C8A158; }
        .adm-nav-section { padding:18px 22px 6px; font-size:10px; letter-spacing:0.22em; color:rgba(200,161,88,0.35); font-family:'Cinzel',serif; text-transform:uppercase; }
        .adm-exit { padding:18px 22px; border-top:1px solid rgba(200,161,88,0.12); display:flex; align-items:center; gap:10px; cursor:pointer; font-size:12px; color:rgba(232,221,208,0.5); transition:color .2s; }
        .adm-exit:hover { color:#e8ddd0; }
        .adm-main { flex:1; overflow-y:auto; padding:32px 36px; }
        .adm-page-title { font-family:'Cormorant Garamond',serif; font-style:italic; font-size:28px; color:#C8A158; margin:0 0 6px; }
        .adm-page-sub { font-size:13px; color:rgba(232,221,208,0.5); margin:0 0 28px; }
        .adm-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; margin-bottom:32px; }
        @media(max-width:900px){.adm-stats{grid-template-columns:repeat(2,1fr);}}
        .adm-stat-card { background:#1a100c; border:1px solid rgba(200,161,88,0.15); border-radius:4px; padding:22px; position:relative; overflow:hidden; }
        .adm-stat-card::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg, rgba(200,161,88,0.06) 0%, transparent 60%); }
        .adm-stat-label { font-size:11px; letter-spacing:0.15em; color:rgba(200,161,88,0.55); font-family:'Cinzel',serif; text-transform:uppercase; margin-bottom:10px; }
        .adm-stat-val { font-family:'Cormorant Garamond',serif; font-size:32px; color:#e8ddd0; line-height:1; }
        .adm-stat-sub { font-size:11px; color:rgba(232,221,208,0.4); margin-top:6px; }
        .adm-stat-icon { position:absolute; right:16px; top:16px; opacity:0.18; }
        .adm-toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; gap:12px; flex-wrap:wrap; }
        .adm-search { background:#1a100c; border:1px solid rgba(200,161,88,0.2); padding:10px 14px; color:#e8ddd0; font-size:13px; border-radius:3px; outline:none; width:240px; font-family:'Lato',sans-serif; }
        .adm-search::placeholder { color:rgba(232,221,208,0.3); }
        .adm-search:focus { border-color:rgba(200,161,88,0.5); }
        .adm-select { background:#1a100c; border:1px solid rgba(200,161,88,0.2); padding:10px 14px; color:#e8ddd0; font-size:13px; border-radius:3px; outline:none; cursor:pointer; }
        .adm-btn { display:inline-flex; align-items:center; gap:7px; padding:10px 18px; font-family:'Cinzel',serif; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; cursor:pointer; border-radius:3px; border:none; transition:all .2s; }
        .adm-btn-gold { background:linear-gradient(135deg,#C8A158,#9C7A33); color:#0f0a08; }
        .adm-btn-gold:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(200,161,88,0.3); }
        .adm-btn-ghost { background:transparent; color:rgba(232,221,208,0.7); border:1px solid rgba(200,161,88,0.2); }
        .adm-btn-ghost:hover { border-color:rgba(200,161,88,0.5); color:#e8ddd0; }
        .adm-btn-danger { background:rgba(139,30,30,0.2); color:#e87070; border:1px solid rgba(139,30,30,0.3); }
        .adm-btn-danger:hover { background:rgba(139,30,30,0.35); }
        .adm-table { width:100%; border-collapse:collapse; background:#1a100c; border-radius:4px; overflow:hidden; border:1px solid rgba(200,161,88,0.12); }
        .adm-table th { padding:12px 16px; text-align:left; font-family:'Cinzel',serif; font-size:10px; letter-spacing:0.15em; color:rgba(200,161,88,0.6); text-transform:uppercase; background:rgba(200,161,88,0.06); border-bottom:1px solid rgba(200,161,88,0.12); }
        .adm-table td { padding:13px 16px; font-size:13px; border-bottom:1px solid rgba(200,161,88,0.07); color:rgba(232,221,208,0.8); vertical-align:middle; }
        .adm-table tr:last-child td { border-bottom:none; }
        .adm-table tr:hover td { background:rgba(200,161,88,0.04); }
        .adm-prod-thumb { width:44px; height:58px; object-fit:cover; border-radius:2px; border:1px solid rgba(200,161,88,0.2); }
        .adm-badge { display:inline-block; padding:3px 9px; border-radius:2px; font-size:10px; letter-spacing:0.07em; font-family:'Cinzel',serif; text-transform:uppercase; }
        .adm-badge-active { background:rgba(20,75,60,0.3); color:#5ecfa0; border:1px solid rgba(94,207,160,0.2); }
        .adm-badge-inactive { background:rgba(76,14,27,0.3); color:#e87070; border:1px solid rgba(232,112,112,0.2); }
        .adm-badge-low { background:rgba(180,100,0,0.3); color:#f0a050; border:1px solid rgba(240,160,80,0.3); }
        .adm-badge-featured { background:rgba(200,161,88,0.15); color:#C8A158; border:1px solid rgba(200,161,88,0.25); }
        .adm-actions { display:flex; gap:8px; align-items:center; }
        .adm-icon-btn { background:none; border:none; cursor:pointer; color:rgba(232,221,208,0.45); padding:5px; border-radius:3px; transition:all .2s; display:flex; }
        .adm-icon-btn:hover { color:#C8A158; background:rgba(200,161,88,0.1); }
        .adm-icon-btn.danger:hover { color:#e87070; background:rgba(232,112,112,0.1); }
        .adm-toggle { background:none; border:none; cursor:pointer; display:flex; }
        .adm-form-overlay { position:fixed; inset:0; z-index:200; background:rgba(10,5,3,0.85); display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(4px); }
        .adm-form { background:#1a100c; border:1px solid rgba(200,161,88,0.25); border-radius:6px; width:100%; max-width:600px; max-height:90vh; overflow-y:auto; }
        .adm-form-header { padding:24px 28px 18px; border-bottom:1px solid rgba(200,161,88,0.12); display:flex; justify-content:space-between; align-items:center; }
        .adm-form-header h3 { font-family:'Cormorant Garamond',serif; font-style:italic; font-size:22px; color:#C8A158; margin:0; }
        .adm-form-body { padding:24px 28px; display:grid; gap:18px; }
        .adm-form-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .adm-field { display:flex; flex-direction:column; gap:6px; }
        .adm-label { font-size:11px; letter-spacing:0.12em; color:rgba(200,161,88,0.6); font-family:'Cinzel',serif; text-transform:uppercase; }
        .adm-input { background:#0f0a08; border:1px solid rgba(200,161,88,0.2); padding:11px 14px; color:#e8ddd0; font-size:13px; border-radius:3px; outline:none; font-family:'Lato',sans-serif; width:100%; }
        .adm-input:focus { border-color:rgba(200,161,88,0.55); }
        .adm-input option { background:#1a100c; }
        .adm-form-footer { padding:18px 28px 24px; display:flex; justify-content:flex-end; gap:10px; border-top:1px solid rgba(200,161,88,0.1); }
        .adm-confirm { background:#1a100c; border:1px solid rgba(200,161,88,0.2); border-radius:6px; padding:32px; max-width:360px; text-align:center; }
        .adm-confirm h4 { font-family:'Cormorant Garamond',serif; font-style:italic; font-size:20px; color:#e8ddd0; margin:0 0 10px; }
        .adm-confirm p { font-size:13px; color:rgba(232,221,208,0.55); margin:0 0 24px; }
        .adm-confirm-btns { display:flex; gap:10px; justify-content:center; }
        .adm-toast { position:fixed; bottom:28px; right:28px; z-index:300; padding:14px 22px; border-radius:4px; font-size:13px; display:flex; align-items:center; gap:10px; animation:toastIn .3s ease; }
        .adm-toast-success { background:#144B3C; color:#5ecfa0; border:1px solid rgba(94,207,160,0.25); }
        .adm-toast-error { background:#4C0E1B; color:#e87070; border:1px solid rgba(232,112,112,0.2); }
        @keyframes toastIn { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:translateY(0);} }
        .adm-coll-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:18px; }
        .adm-coll-card { background:#1a100c; border:1px solid rgba(200,161,88,0.12); border-radius:4px; overflow:hidden; transition:border-color .2s; }
        .adm-coll-card:hover { border-color:rgba(200,161,88,0.3); }
        .adm-coll-img { width:100%; height:140px; object-fit:cover; filter:brightness(0.7) saturate(0.9); }
        .adm-coll-body { padding:16px; }
        .adm-coll-title { font-family:'Cormorant Garamond',serif; font-style:italic; font-size:16px; color:#e8ddd0; margin:0 0 4px; }
        .adm-coll-sub { font-size:11px; color:rgba(232,221,208,0.45); margin:0 0 12px; }
        .adm-coll-meta { display:flex; justify-content:space-between; align-items:center; }
        .adm-chart-wrap { background:#1a100c; border:1px solid rgba(200,161,88,0.12); border-radius:4px; padding:22px; margin-bottom:20px; }
        .adm-chart-title { font-family:'Cinzel',serif; font-size:11px; letter-spacing:0.15em; color:rgba(200,161,88,0.6); text-transform:uppercase; margin-bottom:16px; }
        .adm-mini-chart { display:flex; align-items:flex-end; gap:6px; height:80px; }
        .adm-bar { flex:1; background:linear-gradient(0deg,rgba(200,161,88,0.7),rgba(200,161,88,0.25)); border-radius:2px 2px 0 0; position:relative; cursor:pointer; transition:opacity .2s; }
        .adm-bar:hover { opacity:0.8; }
        .adm-bar-label { position:absolute; bottom:-18px; left:50%; transform:translateX(-50%); font-size:9px; color:rgba(232,221,208,0.35); white-space:nowrap; font-family:'Cinzel',serif; }
        .adm-recent { background:#1a100c; border:1px solid rgba(200,161,88,0.12); border-radius:4px; padding:22px; }
        .adm-recent-title { font-family:'Cinzel',serif; font-size:11px; letter-spacing:0.15em; color:rgba(200,161,88,0.6); text-transform:uppercase; margin-bottom:16px; }
        .adm-order-row { display:flex; justify-content:space-between; align-items:center; padding:11px 0; border-bottom:1px solid rgba(200,161,88,0.07); }
        .adm-order-row:last-child { border-bottom:none; }
        .adm-order-id { font-family:'Cinzel',serif; font-size:11px; color:rgba(200,161,88,0.7); }
        .adm-order-name { font-size:13px; color:#e8ddd0; }
        .adm-order-price { font-family:'Cinzel',serif; font-size:12px; color:#C8A158; }
        .adm-dash-grid { display:grid; grid-template-columns:1.6fr 1fr; gap:20px; }
        @media(max-width:860px){.adm-dash-grid{grid-template-columns:1fr;}.adm-sidebar{width:200px;}.adm-main{padding:22px 18px;}}
        .adm-section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
        .adm-section-title { font-family:'Cormorant Garamond',serif; font-style:italic; font-size:20px; color:#C8A158; margin:0; }
        .view-toggle { display:flex; gap:4px; }
        .view-btn { background:none; border:1px solid rgba(200,161,88,0.2); padding:7px; border-radius:3px; cursor:pointer; color:rgba(232,221,208,0.45); transition:all .2s; display:flex; }
        .view-btn.active { background:rgba(200,161,88,0.12); color:#C8A158; border-color:rgba(200,161,88,0.35); }
        .adm-prod-grid-view { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px,1fr)); gap:14px; }
        .adm-prod-grid-card { background:#1a100c; border:1px solid rgba(200,161,88,0.12); border-radius:4px; overflow:hidden; cursor:pointer; transition:border-color .2s; }
        .adm-prod-grid-card:hover { border-color:rgba(200,161,88,0.3); }
        .adm-prod-grid-img { width:100%; aspect-ratio:3/4; object-fit:cover; filter:brightness(0.8); }
        .adm-prod-grid-body { padding:12px; }
        .adm-prod-grid-name { font-family:'Cormorant Garamond',serif; font-style:italic; font-size:14px; color:#e8ddd0; margin:0 0 4px; }
        .adm-prod-grid-price { font-family:'Cinzel',serif; font-size:12px; color:#C8A158; }
        .adm-prod-grid-actions { display:flex; gap:6px; margin-top:10px; }
        .adm-checkbox { display:flex; align-items:center; gap:9px; cursor:pointer; font-size:13px; color:rgba(232,221,208,0.7); }
        .adm-checkbox input { accent-color:#C8A158; width:15px; height:15px; }
        .adm-settings-section { background:#1a100c; border:1px solid rgba(200,161,88,0.12); border-radius:4px; padding:24px; margin-bottom:18px; }
        .adm-settings-title { font-family:'Cinzel',serif; font-size:11px; letter-spacing:0.15em; color:rgba(200,161,88,0.6); text-transform:uppercase; margin:0 0 18px; }
        .adm-settings-row { display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid rgba(200,161,88,0.07); }
        .adm-settings-row:last-child { border-bottom:none; }
        .adm-settings-key { font-size:13px; color:#e8ddd0; }
        .adm-settings-val { font-size:12px; color:rgba(232,221,208,0.45); }
      `}</style>

      {/* SIDEBAR */}
      <aside className="adm-sidebar">
        <div className="adm-sidebar-logo">
          <h2>Aaradhya's</h2>
          <p>Admin Panel</p>
        </div>
        <nav className="adm-nav">
          <div className="adm-nav-section">Main</div>
          {[
            { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
            { id: "products", icon: Package, label: "Products" },
            { id: "collections", icon: FolderOpen, label: "Collections" },
          ].map(({ id, icon: Icon, label }) => (
            <div key={id} className={`adm-nav-item ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
              <Icon size={16} />{label}
            </div>
          ))}
          <div className="adm-nav-section">Manage</div>
          {[
            { id: "orders", icon: ShoppingBag, label: "Orders" },
            { id: "customers", icon: Users, label: "Customers" },
            { id: "banners", icon: Image, label: "Banners & Media" },
            { id: "discounts", icon: Tag, label: "Discounts" },
            { id: "settings", icon: Settings, label: "Settings" },
          ].map(({ id, icon: Icon, label }) => (
            <div key={id} className={`adm-nav-item ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
              <Icon size={16} />{label}
            </div>
          ))}
        </nav>
        <div className="adm-exit" onClick={() => { onSave(products, collections); onExit(); }}>
          <LogOut size={15} />Back to Store
        </div>
      </aside>

      {/* MAIN */}
      <main className="adm-main">

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <>
            <h1 className="adm-page-title">Dashboard</h1>
            <p className="adm-page-sub">Welcome back. Here's what's happening at Aaradhya's Creation.</p>
            <div className="adm-stats">
              <div className="adm-stat-card">
                <div className="adm-stat-label">Total Revenue</div>
                <div className="adm-stat-val" style={{ fontSize: 22 }}>{rupee(totalRevenue)}</div>
                <div className="adm-stat-sub">From active products</div>
                <div className="adm-stat-icon"><DollarSign size={40} color="#C8A158"/></div>
              </div>
              <div className="adm-stat-card">
                <div className="adm-stat-label">Active Products</div>
                <div className="adm-stat-val">{activeProducts}</div>
                <div className="adm-stat-sub">of {products.length} total</div>
                <div className="adm-stat-icon"><Package size={40} color="#C8A158"/></div>
              </div>
              <div className="adm-stat-card">
                <div className="adm-stat-label">Collections</div>
                <div className="adm-stat-val">{activeCollections}</div>
                <div className="adm-stat-sub">of {collections.length} total</div>
                <div className="adm-stat-icon"><FolderOpen size={40} color="#C8A158"/></div>
              </div>
              <div className="adm-stat-card">
                <div className="adm-stat-label">Low Stock</div>
                <div className="adm-stat-val" style={{ color: lowStock > 0 ? "#f0a050" : "#5ecfa0" }}>{lowStock}</div>
                <div className="adm-stat-sub">items need restock</div>
                <div className="adm-stat-icon"><AlertCircle size={40} color="#C8A158"/></div>
              </div>
            </div>
            <div className="adm-dash-grid">
              <div className="adm-chart-wrap">
                <div className="adm-chart-title">Monthly Sales (₹ Lakhs)</div>
                <div className="adm-mini-chart">
                  {[38,52,44,67,58,73,82,69,91,88,76,95].map((v, i) => (
                    <div key={i} className="adm-bar" style={{ height: `${(v / 100) * 100}%` }}>
                      <span className="adm-bar-label">{["J","F","M","A","M","J","J","A","S","O","N","D"][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="adm-recent">
                <div className="adm-recent-title">Recent Orders</div>
                {[
                  { id: "#AC-2847", name: "Priya Mehta", product: "Meherunisa Banarasi", price: 42500 },
                  { id: "#AC-2846", name: "Sunita Sharma", product: "Rajeshwari Kanjivaram", price: 58900 },
                  { id: "#AC-2845", name: "Aarti Patel", product: "Indrani Bridal Red", price: 64500 },
                  { id: "#AC-2844", name: "Kavitha Rao", product: "Vasundhara Zari", price: 36200 },
                  { id: "#AC-2843", name: "Meena Joshi", product: "Anaisha Organza", price: 28750 },
                ].map(o => (
                  <div className="adm-order-row" key={o.id}>
                    <div>
                      <div className="adm-order-id">{o.id}</div>
                      <div className="adm-order-name">{o.name}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "rgba(232,221,208,0.4)" }}>{o.product}</div>
                      <div className="adm-order-price">{rupee(o.price)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="adm-chart-wrap">
              <div className="adm-chart-title">Top Collections by Revenue</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                {[
                  { name: "Bridal Sarees", pct: 88 }, { name: "Kanjivaram", pct: 74 },
                  { name: "Banarasi", pct: 68 }, { name: "Pure Silk", pct: 55 }, { name: "Organza", pct: 40 }
                ].map(c => (
                  <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 110, fontSize: 12, color: "rgba(232,221,208,0.6)" }}>{c.name}</div>
                    <div style={{ flex: 1, height: 6, background: "rgba(200,161,88,0.12)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${c.pct}%`, height: "100%", background: "linear-gradient(90deg,#C8A158,#9C7A33)", borderRadius: 3 }}/>
                    </div>
                    <div style={{ width: 36, textAlign: "right", fontSize: 11, color: "#C8A158", fontFamily: "'Cinzel',serif" }}>{c.pct}%</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* PRODUCTS */}
        {tab === "products" && (
          <>
            <div className="adm-section-header">
              <div>
                <h1 className="adm-page-title">Products</h1>
                <p className="adm-page-sub" style={{ margin: 0 }}>{products.length} total · {activeProducts} active</p>
              </div>
              <div className="adm-actions">
                <div className="view-toggle">
                  <button className={`view-btn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")}><List size={15}/></button>
                  <button className={`view-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")}><Grid size={15}/></button>
                </div>
                <button className="adm-btn adm-btn-gold" onClick={() => setEditingProduct({ ...BLANK_PRODUCT, id: Date.now(), seed: `prod${Date.now()}` })}>
                  <Plus size={14}/>Add Product
                </button>
              </div>
            </div>
            <div className="adm-toolbar">
              <input className="adm-search" placeholder="Search products…" value={searchQ} onChange={e => setSearchQ(e.target.value)}/>
              <select className="adm-select" value={filterCol} onChange={e => setFilterCol(e.target.value)}>
                <option value="all">All Collections</option>
                {collections.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>

            {viewMode === "list" ? (
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Product</th><th>Collection</th><th>Price</th><th>MRP</th><th>Stock</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <img src={img(p.seed, 120, 160)} alt={p.name} className="adm-prod-thumb"/>
                          <div>
                            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 15 }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: "rgba(232,221,208,0.4)", marginTop: 2 }}>{p.fabric}</div>
                            {p.featured && <span className="adm-badge adm-badge-featured" style={{ marginTop: 4 }}>Featured</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>{collections.find(c => c.id === p.collection)?.title || p.collection}</td>
                      <td><span style={{ fontFamily: "'Cinzel',serif", fontSize: 12, color: "#C8A158" }}>{rupee(p.price)}</span></td>
                      <td><span style={{ fontSize: 12, textDecoration: "line-through", color: "rgba(232,221,208,0.35)" }}>{rupee(p.mrp)}</span></td>
                      <td>
                        <span className={`adm-badge ${p.stock <= 4 ? "adm-badge-low" : "adm-badge-active"}`}>{p.stock} left</span>
                      </td>
                      <td>
                        <button className="adm-toggle" onClick={() => toggleProductActive(p.id)}>
                          {p.active ? <ToggleRight size={24} color="#5ecfa0"/> : <ToggleLeft size={24} color="rgba(232,221,208,0.3)"/>}
                        </button>
                      </td>
                      <td>
                        <div className="adm-actions">
                          <button className="adm-icon-btn" onClick={() => setEditingProduct(p)}><Edit2 size={14}/></button>
                          <button className="adm-icon-btn danger" onClick={() => setConfirmDelete({ type: "product", id: p.id, name: p.name })}><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="adm-prod-grid-view">
                {filteredProducts.map(p => (
                  <div className="adm-prod-grid-card" key={p.id}>
                    <div style={{ position: "relative" }}>
                      <img src={img(p.seed, 300, 400)} alt={p.name} className="adm-prod-grid-img"/>
                      {!p.active && <div style={{ position: "absolute", inset: 0, background: "rgba(10,5,3,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span className="adm-badge adm-badge-inactive">Inactive</span>
                      </div>}
                    </div>
                    <div className="adm-prod-grid-body">
                      <div className="adm-prod-grid-name">{p.name}</div>
                      <div className="adm-prod-grid-price">{rupee(p.price)}</div>
                      <div className="adm-prod-grid-actions">
                        <button className="adm-btn adm-btn-ghost" style={{ padding: "6px 10px", fontSize: 10 }} onClick={() => setEditingProduct(p)}><Edit2 size={11}/>Edit</button>
                        <button className="adm-toggle" onClick={() => toggleProductActive(p.id)}>
                          {p.active ? <ToggleRight size={20} color="#5ecfa0"/> : <ToggleLeft size={20} color="rgba(232,221,208,0.3)"/>}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* COLLECTIONS */}
        {tab === "collections" && (
          <>
            <div className="adm-section-header">
              <div>
                <h1 className="adm-page-title">Collections</h1>
                <p className="adm-page-sub" style={{ margin: 0 }}>{collections.length} collections · {activeCollections} active</p>
              </div>
              <button className="adm-btn adm-btn-gold" onClick={() => setEditingCollection({ ...BLANK_COLLECTION, id: `col${Date.now()}`, seed: `col${Date.now()}` })}>
                <Plus size={14}/>New Collection
              </button>
            </div>
            <div className="adm-coll-grid">
              {collections.map(c => (
                <div className="adm-coll-card" key={c.id}>
                  <div style={{ position: "relative" }}>
                    <img src={img(c.seed, 500, 280)} alt={c.title} className="adm-coll-img"/>
                    <div style={{ position: "absolute", top: 10, right: 10 }}>
                      <span className={`adm-badge ${c.active ? "adm-badge-active" : "adm-badge-inactive"}`}>{c.active ? "Active" : "Hidden"}</span>
                    </div>
                  </div>
                  <div className="adm-coll-body">
                    <div className="adm-coll-title">{c.title}</div>
                    <div className="adm-coll-sub">{c.sub}</div>
                    <div className="adm-coll-meta">
                      <span style={{ fontSize: 11, color: "rgba(200,161,88,0.6)", fontFamily: "'Cinzel',serif" }}>{c.count} products</span>
                      <div className="adm-actions">
                        <button className="adm-toggle" onClick={() => toggleCollectionActive(c.id)}>
                          {c.active ? <ToggleRight size={22} color="#5ecfa0"/> : <ToggleLeft size={22} color="rgba(232,221,208,0.3)"/>}
                        </button>
                        <button className="adm-icon-btn" onClick={() => setEditingCollection(c)}><Edit2 size={14}/></button>
                        <button className="adm-icon-btn danger" onClick={() => setConfirmDelete({ type: "collection", id: c.id, name: c.title })}><Trash2 size={14}/></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ORDERS (static demo) */}
        {tab === "orders" && (
          <>
            <h1 className="adm-page-title">Orders</h1>
            <p className="adm-page-sub">Manage and fulfil customer orders</p>
            <table className="adm-table">
              <thead><tr><th>Order ID</th><th>Customer</th><th>Product</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {[
                  { id:"#AC-2847", name:"Priya Mehta", city:"Mumbai", product:"Meherunisa Banarasi", date:"21 Jun 2026", price:42500, status:"Shipped" },
                  { id:"#AC-2846", name:"Sunita Sharma", city:"Delhi", product:"Rajeshwari Kanjivaram", date:"20 Jun 2026", price:58900, status:"Processing" },
                  { id:"#AC-2845", name:"Aarti Patel", city:"Surat", product:"Indrani Bridal Red", date:"19 Jun 2026", price:64500, status:"Delivered" },
                  { id:"#AC-2844", name:"Kavitha Rao", city:"Hyderabad", product:"Vasundhara Zari", date:"18 Jun 2026", price:36200, status:"Delivered" },
                  { id:"#AC-2843", name:"Meena Joshi", city:"Pune", product:"Anaisha Organza", date:"17 Jun 2026", price:28750, status:"Cancelled" },
                ].map(o => (
                  <tr key={o.id}>
                    <td><span style={{ fontFamily:"'Cinzel',serif", fontSize:11, color:"#C8A158" }}>{o.id}</span></td>
                    <td><div style={{ fontSize:13 }}>{o.name}</div><div style={{ fontSize:11, color:"rgba(232,221,208,0.4)" }}>{o.city}</div></td>
                    <td style={{ fontSize:12 }}>{o.product}</td>
                    <td style={{ fontSize:11, color:"rgba(232,221,208,0.45)" }}>{o.date}</td>
                    <td><span style={{ fontFamily:"'Cinzel',serif", fontSize:12, color:"#C8A158" }}>{rupee(o.price)}</span></td>
                    <td>
                      <span className={`adm-badge ${o.status==="Delivered"?"adm-badge-active":o.status==="Cancelled"?"adm-badge-inactive":o.status==="Shipped"?"adm-badge-featured":"adm-badge-low"}`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* CUSTOMERS */}
        {tab === "customers" && (
          <>
            <h1 className="adm-page-title">Customers</h1>
            <p className="adm-page-sub">10,000+ happy patrons across 30 countries</p>
            <table className="adm-table">
              <thead><tr><th>Name</th><th>City</th><th>Orders</th><th>Total Spent</th><th>Last Order</th></tr></thead>
              <tbody>
                {[
                  { name:"Ritika Sharma", city:"Mumbai", orders:4, spent:142300, last:"Jun 2026" },
                  { name:"Anushka Rao", city:"Hyderabad", orders:6, spent:198500, last:"May 2026" },
                  { name:"Devika Menon", city:"Bengaluru", orders:2, spent:87650, last:"Apr 2026" },
                  { name:"Priya Mehta", city:"Mumbai", orders:3, spent:115200, last:"Jun 2026" },
                  { name:"Sunita Sharma", city:"Delhi", orders:5, spent:167800, last:"Jun 2026" },
                ].map(c => (
                  <tr key={c.name}>
                    <td style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:15 }}>{c.name}</td>
                    <td style={{ fontSize:12, color:"rgba(232,221,208,0.55)" }}>{c.city}</td>
                    <td><span className="adm-badge adm-badge-featured">{c.orders} orders</span></td>
                    <td><span style={{ fontFamily:"'Cinzel',serif", fontSize:12, color:"#C8A158" }}>{rupee(c.spent)}</span></td>
                    <td style={{ fontSize:11, color:"rgba(232,221,208,0.4)" }}>{c.last}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* BANNERS */}
        {tab === "banners" && (
          <>
            <h1 className="adm-page-title">Banners & Media</h1>
            <p className="adm-page-sub">Manage hero banners, promotional images, and gallery content</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
              {["Hero Banner", "Bridal Edit Banner", "Festival Promo", "Newsletter Background"].map((b, i) => (
                <div key={b} className="adm-settings-section" style={{ padding:0, overflow:"hidden" }}>
                  <img src={img(`banner-${i+1}`, 600, 280)} alt={b} style={{ width:"100%", height:140, objectFit:"cover", filter:"brightness(0.65)" }}/>
                  <div style={{ padding:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:13, color:"#e8ddd0" }}>{b}</span>
                    <button className="adm-btn adm-btn-ghost" style={{ padding:"6px 12px", fontSize:10 }}><Upload size={11}/>Replace</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* DISCOUNTS */}
        {tab === "discounts" && (
          <>
            <div className="adm-section-header">
              <div><h1 className="adm-page-title">Discounts</h1><p className="adm-page-sub" style={{margin:0}}>Coupon codes and sale events</p></div>
              <button className="adm-btn adm-btn-gold"><Plus size={14}/>Create Code</button>
            </div>
            <table className="adm-table">
              <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Uses</th><th>Expires</th><th>Status</th></tr></thead>
              <tbody>
                {[
                  { code:"BRIDAL2026", type:"Percentage", val:"15%", uses:"48/100", exp:"31 Dec 2026", active:true },
                  { code:"FESTIVE500", type:"Fixed", val:"₹500", uses:"120/200", exp:"30 Aug 2026", active:true },
                  { code:"WELCOME10", type:"Percentage", val:"10%", uses:"340/∞", exp:"No expiry", active:true },
                  { code:"DIWALI25", type:"Percentage", val:"25%", uses:"87/87", exp:"15 Nov 2025", active:false },
                ].map(d => (
                  <tr key={d.code}>
                    <td><span style={{ fontFamily:"'Cinzel',serif", fontSize:12, color:"#C8A158", letterSpacing:"0.1em" }}>{d.code}</span></td>
                    <td style={{ fontSize:12 }}>{d.type}</td>
                    <td style={{ fontSize:13, fontWeight:600, color:"#e8ddd0" }}>{d.val}</td>
                    <td style={{ fontSize:12, color:"rgba(232,221,208,0.55)" }}>{d.uses}</td>
                    <td style={{ fontSize:11, color:"rgba(232,221,208,0.4)" }}>{d.exp}</td>
                    <td><span className={`adm-badge ${d.active?"adm-badge-active":"adm-badge-inactive"}`}>{d.active?"Active":"Expired"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <>
            <h1 className="adm-page-title">Settings</h1>
            <p className="adm-page-sub">Store configuration and preferences</p>
            {[
              { title:"Store Info", rows:[
                { key:"Store Name", val:"Aaradhya's Creation" },
                { key:"Tagline", val:"Fine Handwoven Sarees" },
                { key:"Contact Email", val:"contact@aaradhyascreation.com" },
                { key:"WhatsApp", val:"+91 98765 43210" },
                { key:"Address", val:"Ring Road, Surat, Gujarat 395002" },
              ]},
              { title:"Shipping", rows:[
                { key:"Free Shipping Above", val:"₹25,000" },
                { key:"Standard Delivery", val:"5-7 business days" },
                { key:"Express Delivery", val:"2-3 business days (₹499)" },
                { key:"International Shipping", val:"Enabled — 30+ countries" },
              ]},
              { title:"Returns & Policy", rows:[
                { key:"Return Window", val:"7 days from delivery" },
                { key:"Exchange Policy", val:"14 days, size/colour only" },
                { key:"Refund Mode", val:"Original payment method" },
              ]},
            ].map(s => (
              <div className="adm-settings-section" key={s.title}>
                <div className="adm-settings-title">{s.title}</div>
                {s.rows.map(r => (
                  <div className="adm-settings-row" key={r.key}>
                    <div className="adm-settings-key">{r.key}</div>
                    <div className="adm-settings-val">{r.val}</div>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </main>

      {/* PRODUCT FORM */}
      {editingProduct && (
        <div className="adm-form-overlay" onClick={e => e.target === e.currentTarget && setEditingProduct(null)}>
          <div className="adm-form">
            <div className="adm-form-header">
              <h3>{editingProduct.id && products.find(p => p.id === editingProduct.id) ? "Edit Product" : "Add Product"}</h3>
              <button className="adm-icon-btn" onClick={() => setEditingProduct(null)}><X size={18}/></button>
            </div>
            <div className="adm-form-body">
              <div className="adm-field">
                <label className="adm-label">Product Name</label>
                <input className="adm-input" value={editingProduct.name} onChange={e => setEditingProduct(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Meherunisa Banarasi"/>
              </div>
              <div className="adm-field">
                <label className="adm-label">Fabric Description</label>
                <input className="adm-input" value={editingProduct.fabric} onChange={e => setEditingProduct(p => ({ ...p, fabric: e.target.value }))} placeholder="e.g. Pure Katan Silk"/>
              </div>
              <div className="adm-form-row">
                <div className="adm-field">
                  <label className="adm-label">Sale Price (₹)</label>
                  <input className="adm-input" type="number" value={editingProduct.price} onChange={e => setEditingProduct(p => ({ ...p, price: Number(e.target.value) }))}/>
                </div>
                <div className="adm-field">
                  <label className="adm-label">MRP (₹)</label>
                  <input className="adm-input" type="number" value={editingProduct.mrp} onChange={e => setEditingProduct(p => ({ ...p, mrp: Number(e.target.value) }))}/>
                </div>
              </div>
              <div className="adm-form-row">
                <div className="adm-field">
                  <label className="adm-label">Stock</label>
                  <input className="adm-input" type="number" value={editingProduct.stock} onChange={e => setEditingProduct(p => ({ ...p, stock: Number(e.target.value) }))}/>
                </div>
                <div className="adm-field">
                  <label className="adm-label">Rating</label>
                  <input className="adm-input" type="number" step="0.1" min="1" max="5" value={editingProduct.rating} onChange={e => setEditingProduct(p => ({ ...p, rating: Number(e.target.value) }))}/>
                </div>
              </div>
              <div className="adm-field">
                <label className="adm-label">Collection</label>
                <select className="adm-input" value={editingProduct.collection} onChange={e => setEditingProduct(p => ({ ...p, collection: e.target.value }))}>
                  {collections.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 24 }}>
                <label className="adm-checkbox">
                  <input type="checkbox" checked={editingProduct.active} onChange={e => setEditingProduct(p => ({ ...p, active: e.target.checked }))}/>
                  Active (visible in store)
                </label>
                <label className="adm-checkbox">
                  <input type="checkbox" checked={editingProduct.featured} onChange={e => setEditingProduct(p => ({ ...p, featured: e.target.checked }))}/>
                  Featured product
                </label>
              </div>
            </div>
            <div className="adm-form-footer">
              <button className="adm-btn adm-btn-ghost" onClick={() => setEditingProduct(null)}>Cancel</button>
              <button className="adm-btn adm-btn-gold" onClick={() => saveProduct(editingProduct)}><Save size={13}/>Save Product</button>
            </div>
          </div>
        </div>
      )}

      {/* COLLECTION FORM */}
      {editingCollection && (
        <div className="adm-form-overlay" onClick={e => e.target === e.currentTarget && setEditingCollection(null)}>
          <div className="adm-form">
            <div className="adm-form-header">
              <h3>{collections.find(c => c.id === editingCollection.id) ? "Edit Collection" : "New Collection"}</h3>
              <button className="adm-icon-btn" onClick={() => setEditingCollection(null)}><X size={18}/></button>
            </div>
            <div className="adm-form-body">
              <div className="adm-field">
                <label className="adm-label">Collection Title</label>
                <input className="adm-input" value={editingCollection.title} onChange={e => setEditingCollection(c => ({ ...c, title: e.target.value }))} placeholder="e.g. Bridal Sarees"/>
              </div>
              <div className="adm-field">
                <label className="adm-label">Subtitle / Tagline</label>
                <input className="adm-input" value={editingCollection.sub} onChange={e => setEditingCollection(c => ({ ...c, sub: e.target.value }))} placeholder="e.g. Heirlooms for the big day"/>
              </div>
              <div className="adm-form-row">
                <div className="adm-field">
                  <label className="adm-label">Product Count</label>
                  <input className="adm-input" type="number" value={editingCollection.count} onChange={e => setEditingCollection(c => ({ ...c, count: Number(e.target.value) }))}/>
                </div>
              </div>
              <label className="adm-checkbox">
                <input type="checkbox" checked={editingCollection.active} onChange={e => setEditingCollection(c => ({ ...c, active: e.target.checked }))}/>
                Active (show in store)
              </label>
            </div>
            <div className="adm-form-footer">
              <button className="adm-btn adm-btn-ghost" onClick={() => setEditingCollection(null)}>Cancel</button>
              <button className="adm-btn adm-btn-gold" onClick={() => saveCollection(editingCollection)}><Save size={13}/>Save Collection</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE */}
      {confirmDelete && (
        <div className="adm-form-overlay">
          <div className="adm-confirm">
            <AlertCircle size={32} color="#e87070" style={{ marginBottom: 14 }}/>
            <h4>Delete {confirmDelete.type === "product" ? "Product" : "Collection"}?</h4>
            <p>"{confirmDelete.name}" will be permanently removed. This cannot be undone.</p>
            <div className="adm-confirm-btns">
              <button className="adm-btn adm-btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="adm-btn adm-btn-danger" onClick={() => confirmDelete.type === "product" ? deleteProduct(confirmDelete.id) : deleteCollection(confirmDelete.id)}>
                <Trash2 size={13}/>Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`adm-toast adm-toast-${toast.type}`}>
          {toast.type === "success" ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN STOREFRONT
───────────────────────────────────────── */
export default function AaradhyasCreation() {
  const [adminMode, setAdminMode] = useState(false);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [collections, setCollections] = useState(INITIAL_COLLECTIONS);
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [wishlist, setWishlist] = useState(new Set());
  const [cartCount, setCartCount] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [heroOffset, setHeroOffset] = useState(0);
  const bsRef = useRef(null);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 1500); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const fn = () => { setScrolled(window.scrollY > 24); setHeroOffset(window.scrollY * 0.28); };
    window.addEventListener("scroll", fn); return () => window.removeEventListener("scroll", fn);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 6000);
    return () => clearInterval(t);
  }, []);

  const toggleWishlist = (id) => setWishlist(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const scrollBest = (dir) => bsRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" });

  const newArrivals = products.filter(p => p.active).slice(0, 4);
  const bestsellers = products.filter(p => p.active).slice(0, 6);
  const activeCollections = collections.filter(c => c.active);

  if (adminMode) {
    return <AdminPanel onExit={() => setAdminMode(false)} products={products} collections={collections} onSave={(p, c) => { setProducts(p); setCollections(c); }}/>;
  }

  return (
    <div className="ac-root">
      {/* Preloader */}
      <div className={`ac-preloader ${!loading ? "hide" : ""}`}>
        <Mandala3D />
        <span>Aaradhya's Creation</span>
      </div>
      <div className="ac-grain" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Cinzel:wght@500;600&family=Lato:wght@300;400;600;700&display=swap');

        .ac-root { --ivory:#FBF6EC; --cream:#F2E8D8; --beige:#E7D9C2; --gold:#C8A158; --gold-dark:#9C7A33; --wine:#4C0E1B; --wine-deep:#34070F; --emerald:#144B3C; --onyx:#161210; --ink:#2A211B; font-family:'Lato',sans-serif; background:var(--ivory); color:var(--ink); width:100%; overflow-x:hidden; position:relative; }
        .ac-root * { box-sizing:border-box; }
        .ac-root ::selection { background:var(--gold); color:var(--onyx); }
        .ac-root { scroll-behavior:smooth; scrollbar-width:thin; scrollbar-color:var(--gold) transparent; }
        .ac-root ::-webkit-scrollbar { width:9px; height:9px; }
        .ac-root ::-webkit-scrollbar-thumb { background:var(--gold); border:2px solid var(--ivory); }
        .ac-root ::-webkit-scrollbar-track { background:var(--ivory); }
        .ac-grain { position:fixed; inset:0; z-index:999; pointer-events:none; opacity:0.032; mix-blend-mode:overlay; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }

        /* Preloader */
        .ac-preloader { position:fixed; inset:0; z-index:1000; background:var(--onyx); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:24px; transition:opacity .8s ease, visibility .8s ease; }
        .ac-preloader.hide { opacity:0; visibility:hidden; }
        .mandala3d { animation:mandalaSpin 0s linear; }
        .ac-preloader span { font-family:'Cinzel',serif; font-size:10px; letter-spacing:0.34em; color:rgba(251,246,236,0.5); text-transform:uppercase; }

        /* Typography */
        .ac-root h1,.ac-root h2,.ac-root h3,.ac-root h4 { font-family:'Cormorant Garamond',serif; font-weight:600; margin:0; letter-spacing:0.01em; }
        .eyebrow { font-family:'Cinzel',serif; font-size:11px; letter-spacing:0.32em; text-transform:uppercase; color:var(--gold-dark); margin:0 0 14px 0; display:flex; align-items:center; gap:12px; }
        .eyebrow::before,.eyebrow::after { content:""; height:1px; width:26px; background:var(--gold-dark); opacity:0.5; }
        .ac-head .eyebrow { justify-content:center; }
        .eyebrow.light { color:var(--gold); }
        .eyebrow.light::before,.eyebrow.light::after { background:var(--gold); opacity:0.6; }

        /* Layout */
        .ac-section { padding:96px 6vw; max-width:1440px; margin:0 auto; position:relative; }
        @media(max-width:768px){.ac-section{padding:56px 5vw;}}

        /* Reveal */
        .reveal-up { opacity:0; transform:translateY(34px); transition:opacity 1s cubic-bezier(.16,.84,.44,1), transform 1s cubic-bezier(.16,.84,.44,1); }
        .reveal-up.is-visible { opacity:1; transform:translateY(0); }
        .zari-divider { width:100%; height:30px; opacity:0.9; }
        .zari-divider svg { width:100%; height:100%; display:block; }

        /* Admin Shortcut */
        .admin-fab { position:fixed; bottom:28px; right:28px; z-index:900; background:linear-gradient(135deg,var(--gold),var(--gold-dark)); color:var(--onyx); border:none; width:52px; height:52px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 24px rgba(200,161,88,0.35); transition:transform .2s, box-shadow .2s; font-family:'Cinzel',serif; font-size:9px; }
        .admin-fab:hover { transform:scale(1.08); box-shadow:0 12px 32px rgba(200,161,88,0.5); }

        /* Topbar */
        .ac-topbar { background:var(--onyx); color:var(--cream); text-align:center; font-family:'Cinzel',serif; font-size:10.5px; letter-spacing:0.22em; padding:9px 12px; text-transform:uppercase; }

        /* Nav */
        .ac-nav { position:sticky; top:0; z-index:50; background:rgba(251,246,236,0.93); backdrop-filter:blur(12px); border-bottom:1px solid rgba(200,161,88,0.25); transition:box-shadow .3s, padding .3s; padding:18px 5vw; }
        .ac-nav.scrolled { box-shadow:0 6px 24px rgba(76,14,27,0.08); padding:11px 5vw; }
        .ac-nav-inner { display:flex; align-items:center; justify-content:space-between; max-width:1440px; margin:0 auto; }
        .ac-logo { font-family:'Cormorant Garamond',serif; font-size:28px; font-style:italic; color:var(--wine); cursor:pointer; white-space:nowrap; display:flex; align-items:center; gap:12px; }
        .ac-logo .ac-monogram { color:var(--wine); flex-shrink:0; }
        .ac-logo span { color:var(--gold-dark); font-style:normal; font-family:'Cinzel',serif; font-size:10px; display:block; letter-spacing:0.3em; margin-top:-2px; }
        .ac-links { display:flex; gap:30px; list-style:none; padding:0; margin:0; font-size:13px; letter-spacing:0.04em; }
        .ac-links li { position:relative; cursor:pointer; color:var(--ink); padding:6px 0; }
        .ac-links li:hover { color:var(--wine); }
        .ac-links li::after { content:""; position:absolute; left:0; bottom:0; height:1px; width:0; background:var(--gold); transition:width .3s; }
        .ac-links li:hover::after { width:100%; }
        .ac-icons { display:flex; align-items:center; gap:20px; color:var(--ink); }
        .ac-icons button { background:none; border:none; cursor:pointer; color:inherit; position:relative; padding:4px; }
        .ac-icons button:hover { color:var(--wine); }
        .ac-badge { position:absolute; top:-4px; right:-6px; background:var(--wine); color:var(--ivory); font-size:9px; width:15px; height:15px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
        .ac-mega { position:absolute; top:100%; left:0; width:100%; background:var(--ivory); border-top:1px solid var(--beige); box-shadow:0 18px 30px rgba(0,0,0,0.08); padding:36px 8vw; display:flex; gap:60px; animation:fadeDown .25s ease; }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:translateY(0);} }
        .ac-mega-col h5 { font-family:'Cinzel',serif; font-size:11px; letter-spacing:0.18em; color:var(--gold-dark); margin-bottom:14px; }
        .ac-mega-col div { font-size:13.5px; padding:6px 0; cursor:pointer; color:var(--ink); }
        .ac-mega-col div:hover { color:var(--wine); }

        /* Hero */
        .ac-hero { position:relative; height:94vh; min-height:600px; display:flex; align-items:flex-end; overflow:hidden; }
        .ac-hero img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; filter:saturate(1.08) brightness(0.7) contrast(1.06); transform:scale(1.06); animation:heroZoom 18s ease-in-out infinite alternate; }
        @keyframes heroZoom { from{transform:scale(1.06);}to{transform:scale(1.15);} }
        .ac-hero::after { content:""; position:absolute; inset:0; background:linear-gradient(0deg,rgba(22,14,10,0.88) 4%,rgba(22,14,10,0.04) 56%,rgba(22,14,10,0.42) 100%),linear-gradient(100deg,rgba(76,14,27,0.28) 0%,rgba(20,75,60,0.08) 60%,transparent 100%); }
        .ac-hero-frame { position:absolute; inset:22px; border:1px solid rgba(200,161,88,0.55); z-index:2; pointer-events:none; }
        .ac-hero-frame::before,.ac-hero-frame::after { content:""; position:absolute; width:26px; height:26px; border:1.5px solid var(--gold); }
        .ac-hero-frame::before { top:-1px; left:-1px; border-right:none; border-bottom:none; }
        .ac-hero-frame::after { bottom:-1px; right:-1px; border-left:none; border-top:none; }
        .ac-hero-est { position:absolute; right:40px; top:50%; transform:translateY(-50%) rotate(90deg); transform-origin:center; z-index:2; font-family:'Cinzel',serif; font-size:11px; letter-spacing:0.4em; color:rgba(251,246,236,0.55); white-space:nowrap; }
        @media(max-width:768px){.ac-hero-est{display:none;}}
        .ac-hero-content { position:relative; z-index:2; padding:0 6vw 70px; color:var(--ivory); max-width:760px; animation:fadeUp 1.1s ease both; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(26px);}to{opacity:1;transform:translateY(0);} }
        .ac-hero h1 { font-size:clamp(34px,5.4vw,70px); line-height:1.08; font-style:italic; font-weight:500; text-shadow:0 4px 30px rgba(0,0,0,0.3); }
        .ac-hero p.sub { font-weight:300; font-size:15.5px; line-height:1.7; margin:22px 0 32px; max-width:520px; color:rgba(251,246,236,0.88); }
        .ac-hero-ctas { display:flex; gap:14px; flex-wrap:wrap; }
        .ac-hero-creds { display:flex; gap:30px; margin-top:46px; flex-wrap:wrap; }
        .ac-hero-creds div { display:flex; align-items:center; gap:9px; font-family:'Cinzel',serif; font-size:10px; letter-spacing:0.1em; color:rgba(251,246,236,0.75); text-transform:uppercase; }
        .ac-hero-creds div::before { content:"◆"; color:var(--gold); font-size:7px; }

        /* 3D Box in Hero */
        .ac-hero-3d { position:absolute; right:6vw; top:50%; transform:translateY(-50%); z-index:3; }
        @media(max-width:900px){.ac-hero-3d{display:none;}}

        /* Gold Particles Canvas */
        .gold-particles { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:1; }

        /* 3D Box */
        .box3d-scene { width:200px; height:200px; perspective:600px; cursor:grab; user-select:none; }
        .box3d-scene:active { cursor:grabbing; }
        .box3d-cube { width:120px; height:120px; position:relative; transform-style:preserve-3d; margin:40px auto; }
        .box3d-face { position:absolute; width:120px; height:120px; border:1px solid rgba(200,161,88,0.55); display:flex; align-items:center; justify-content:center; font-family:'Cormorant Garamond',serif; font-style:italic; }
        .box3d-face.front { transform:translateZ(60px); background:rgba(76,14,27,0.75); }
        .box3d-face.back { transform:rotateY(180deg) translateZ(60px); background:rgba(20,75,60,0.75); }
        .box3d-face.left { transform:rotateY(-90deg) translateZ(60px); background:rgba(22,14,10,0.8); }
        .box3d-face.right { transform:rotateY(90deg) translateZ(60px); background:rgba(22,14,10,0.8); }
        .box3d-face.top { transform:rotateX(90deg) translateZ(60px); background:linear-gradient(135deg,rgba(200,161,88,0.4),rgba(156,122,51,0.3)); }
        .box3d-face.bottom { transform:rotateX(-90deg) translateZ(60px); background:rgba(22,14,10,0.6); }
        .box3d-face-inner { color:rgba(200,161,88,0.9); text-align:center; }
        .box3d-logo { font-size:32px; line-height:1; }
        .box3d-tag { font-family:'Cinzel',serif; font-size:8px; letter-spacing:0.2em; text-transform:uppercase; color:rgba(200,161,88,0.6); margin-top:6px; }
        .box3d-ribbon-h { position:absolute; width:100%; height:2px; background:rgba(200,161,88,0.6); top:50%; left:0; transform:translateY(-50%); }
        .box3d-ribbon-v { position:absolute; width:2px; height:100%; background:rgba(200,161,88,0.6); left:50%; top:0; transform:translateX(-50%); }
        .box3d-bow { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:24px; color:rgba(200,161,88,0.9); z-index:2; }

        /* 3D Card tilt */
        .card3d { transition:transform 0.12s ease, box-shadow 0.12s ease; transform-style:preserve-3d; }

        /* Mandala */
        .mandala3d { display:block; }

        /* Buttons */
        .btn-gold { position:relative; overflow:hidden; background:linear-gradient(135deg,var(--gold),var(--gold-dark)); color:var(--onyx); border:none; padding:14px 30px; font-family:'Cinzel',serif; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; cursor:pointer; transition:transform .25s, box-shadow .25s; }
        .btn-gold::before { content:""; position:absolute; top:0; left:-120%; width:60%; height:100%; background:linear-gradient(115deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-20deg); transition:left .7s; }
        .btn-gold:hover::before { left:130%; }
        .btn-gold:hover { transform:translateY(-2px); box-shadow:0 12px 26px rgba(200,161,88,0.4); }
        .btn-outline { background:transparent; color:var(--ivory); border:1px solid rgba(251,246,236,0.6); padding:14px 30px; font-family:'Cinzel',serif; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; cursor:pointer; transition:all .25s; }
        .btn-outline:hover { background:rgba(251,246,236,0.12); border-color:var(--ivory); }
        .btn-wine { position:relative; overflow:hidden; background:var(--wine); color:var(--ivory); border:1px solid var(--wine); padding:14px 32px; font-family:'Cinzel',serif; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; cursor:pointer; transition:all .25s; }
        .btn-wine:hover { background:transparent; color:var(--wine); transform:translateY(-2px); }

        /* Marquee */
        .ac-marquee-wrap { background:var(--onyx); padding:16px 0; overflow:hidden; border-top:1px solid rgba(200,161,88,0.25); border-bottom:1px solid rgba(200,161,88,0.25); }
        .ac-marquee { display:flex; gap:50px; white-space:nowrap; animation:marquee 32s linear infinite; }
        @keyframes marquee { from{transform:translateX(0);}to{transform:translateX(-50%);} }
        .ac-marquee span { font-family:'Cinzel',serif; font-size:12px; letter-spacing:0.26em; color:var(--gold); text-transform:uppercase; }
        .ac-marquee span i { color:var(--gold); opacity:0.55; margin-right:50px; font-style:normal; font-size:9px; }

        /* Press */
        .ac-press { background:var(--cream); padding:22px 6vw; display:flex; align-items:center; justify-content:center; gap:28px; flex-wrap:wrap; border-bottom:1px solid rgba(200,161,88,0.25); }
        .ac-press > span:first-child { font-family:'Cinzel',serif; font-size:10px; letter-spacing:0.18em; color:var(--gold-dark); text-transform:uppercase; }
        .ac-press-row { display:flex; gap:26px; flex-wrap:wrap; }
        .ac-press-row span { font-family:'Cormorant Garamond',serif; font-style:italic; font-size:16px; color:#6b5d4f; }

        /* Section header */
        .ac-head { text-align:center; max-width:640px; margin:0 auto 54px; }
        .ac-head h2 { font-size:clamp(28px,3.6vw,44px); font-style:italic; color:var(--wine); }
        .ac-head p { font-size:14.5px; color:#6b5d4f; margin-top:14px; line-height:1.7; font-weight:300; }

        /* 3D Collection grid */
        .ac-coll-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:26px; }
        @media(max-width:1024px){.ac-coll-grid{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:560px){.ac-coll-grid{grid-template-columns:1fr;}}
        .ac-coll-card { position:relative; border-radius:2px; overflow:hidden; aspect-ratio:3/4; cursor:pointer; border:1px solid rgba(200,161,88,0.3); transition:box-shadow .4s, transform .4s; }
        .ac-coll-card:hover { box-shadow:0 24px 48px rgba(76,14,27,0.22); transform:translateY(-5px) scale(1.01); }
        .ac-coll-card img { width:100%; height:100%; object-fit:cover; transition:transform .7s cubic-bezier(.2,.7,.2,1); filter:brightness(0.88) saturate(1.05); }
        .ac-coll-card:hover img { transform:scale(1.1); }
        .ac-coll-corner { position:absolute; width:22px; height:22px; border:1.5px solid var(--gold); z-index:3; opacity:0; transition:opacity .35s, transform .35s; }
        .ac-coll-card:hover .ac-coll-corner { opacity:1; }
        .ac-coll-corner.tl { top:12px; left:12px; border-right:none; border-bottom:none; transform:translate(6px,6px); }
        .ac-coll-card:hover .ac-coll-corner.tl { transform:translate(0,0); }
        .ac-coll-corner.br { bottom:12px; right:12px; border-left:none; border-top:none; transform:translate(-6px,-6px); }
        .ac-coll-card:hover .ac-coll-corner.br { transform:translate(0,0); }
        .ac-coll-overlay { position:absolute; inset:0; background:linear-gradient(0deg,rgba(22,14,10,0.84) 0%,rgba(22,14,10,0.04) 50%); display:flex; flex-direction:column; justify-content:flex-end; padding:24px; color:var(--ivory); }
        .ac-coll-overlay h3 { font-size:22px; font-style:italic; }
        .ac-coll-overlay p { font-size:12px; font-weight:300; opacity:0.85; margin:6px 0 14px; }
        .ac-explore { font-family:'Cinzel',serif; font-size:10px; letter-spacing:0.16em; text-transform:uppercase; color:var(--gold); display:inline-flex; align-items:center; gap:6px; border-bottom:1px solid var(--gold); padding-bottom:3px; width:fit-content; transition:gap .25s; }
        .ac-coll-card:hover .ac-explore { gap:11px; }

        /* Product cards */
        .ac-prod-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:28px; }
        @media(max-width:1024px){.ac-prod-grid{grid-template-columns:repeat(2,1fr);}}
        .ac-prod-card { background:var(--ivory); position:relative; }
        .ac-prod-imgwrap { position:relative; aspect-ratio:3/4; overflow:hidden; border-radius:2px; background:var(--beige); box-shadow:0 2px 10px rgba(76,14,27,0.06); transition:box-shadow .4s; }
        .ac-prod-card:hover .ac-prod-imgwrap { box-shadow:0 28px 44px rgba(76,14,27,0.2); }
        .ac-prod-imgwrap img { width:100%; height:100%; object-fit:cover; position:absolute; inset:0; transition:opacity .5s, transform .7s ease; }
        .ac-prod-imgwrap img.second { opacity:0; }
        .ac-prod-card:hover .ac-prod-imgwrap img.second { opacity:1; }
        .ac-prod-card:hover .ac-prod-imgwrap img.first { opacity:0; }
        .ac-prod-card:hover .ac-prod-imgwrap img { transform:scale(1.06); }
        .ac-wish-btn { position:absolute; top:12px; right:12px; background:rgba(251,246,236,0.92); border:none; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:3; transition:transform .2s; }
        .ac-wish-btn:hover { transform:scale(1.12); }
        .ac-discount { position:absolute; top:12px; left:12px; background:var(--wine); color:var(--ivory); font-size:10px; letter-spacing:0.08em; padding:5px 9px; z-index:3; font-family:'Cinzel',serif; }
        .ac-quickadd { position:absolute; left:10px; right:10px; bottom:10px; background:rgba(22,14,10,0.93); color:var(--ivory); text-align:center; padding:11px; font-family:'Cinzel',serif; font-size:10px; letter-spacing:0.14em; text-transform:uppercase; opacity:0; transform:translateY(8px); transition:all .3s; cursor:pointer; z-index:3; }
        .ac-prod-card:hover .ac-quickadd { opacity:1; transform:translateY(0); }
        .ac-prod-info { padding:16px 2px 0; }
        .ac-prod-info h4 { font-size:17px; font-style:italic; font-weight:500; }
        .ac-prod-info .fabric { font-size:11.5px; color:#8a7a68; margin:4px 0 8px; font-weight:300; }
        .ac-price-row { display:flex; align-items:baseline; gap:9px; margin-top:6px; }
        .ac-price { font-family:'Cinzel',serif; font-size:14px; color:var(--wine); }
        .ac-mrp { font-size:12px; color:#a89a89; text-decoration:line-through; }

        /* Bridal split */
        .ac-split { display:grid; grid-template-columns:1fr 1fr; min-height:560px; }
        @media(max-width:860px){.ac-split{grid-template-columns:1fr;min-height:auto;}}
        .ac-split-img { position:relative; overflow:hidden; min-height:360px; }
        .ac-split-img img { width:100%; height:100%; object-fit:cover; position:absolute; inset:0; transition:transform .8s ease; }
        .ac-split:hover .ac-split-img img { transform:scale(1.04); }
        .ac-split-text { background:var(--wine); color:var(--ivory); display:flex; flex-direction:column; justify-content:center; padding:70px 6vw; }
        .ac-split-text h2 { font-size:clamp(30px,4vw,46px); font-style:italic; color:var(--ivory); }
        .ac-split-text .accent { color:var(--gold); display:block; font-family:'Cinzel',serif; font-size:12px; letter-spacing:0.3em; margin-bottom:16px; font-style:normal; }
        .ac-split-text p { font-weight:300; line-height:1.85; font-size:14.5px; color:rgba(251,246,236,0.82); margin:22px 0 32px; max-width:440px; }

        /* Occasions */
        .ac-occ-row { display:flex; gap:30px; overflow-x:auto; padding-bottom:10px; scrollbar-width:none; }
        .ac-occ-row::-webkit-scrollbar { display:none; }
        .ac-occ { flex:0 0 auto; text-align:center; cursor:pointer; width:132px; }
        .ac-occ-circle { width:132px; height:132px; border-radius:50%; overflow:hidden; border:1px solid var(--gold); padding:4px; transition:transform .35s; }
        .ac-occ:hover .ac-occ-circle { transform:scale(1.06); }
        .ac-occ-circle img { width:100%; height:100%; object-fit:cover; border-radius:50%; transition:transform .5s; }
        .ac-occ:hover .ac-occ-circle img { transform:scale(1.14); }
        .ac-occ p { margin-top:14px; font-family:'Cinzel',serif; font-size:11px; letter-spacing:0.08em; color:var(--ink); }

        /* Fabric */
        .ac-fab-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:22px; }
        @media(max-width:860px){.ac-fab-grid{grid-template-columns:repeat(2,1fr);}}
        .ac-fab-card { position:relative; aspect-ratio:1/1.05; overflow:hidden; border-radius:4px; cursor:pointer; }
        .ac-fab-card img { width:100%; height:100%; object-fit:cover; transition:transform .6s; filter:brightness(0.8) saturate(1.1); }
        .ac-fab-card:hover img { transform:scale(1.09); }
        .ac-fab-label { position:absolute; bottom:16px; left:16px; color:var(--ivory); font-family:'Cormorant Garamond',serif; font-style:italic; font-size:20px; }

        /* Bestsellers */
        .ac-bs-scroller { display:flex; gap:24px; overflow-x:auto; scroll-snap-type:x mandatory; padding:6px 2px 16px; scrollbar-width:none; }
        .ac-bs-scroller::-webkit-scrollbar { display:none; }
        .ac-bs-card { flex:0 0 280px; scroll-snap-align:start; }
        .ac-bs-imgwrap { position:relative; aspect-ratio:3/4; overflow:hidden; border-radius:3px; }
        .ac-bs-imgwrap img { width:100%; height:100%; object-fit:cover; transition:transform .6s; }
        .ac-bs-card:hover img { transform:scale(1.07); }
        .ac-bs-badge { position:absolute; top:12px; left:12px; background:var(--gold); color:var(--onyx); font-size:9.5px; letter-spacing:0.1em; padding:5px 9px; font-family:'Cinzel',serif; }
        .ac-scroll-btn { width:42px; height:42px; border-radius:50%; border:1px solid var(--gold); background:transparent; color:var(--wine); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .25s; }
        .ac-scroll-btn:hover { background:var(--gold); color:var(--onyx); }

        /* 3D Heritage showcase */
        .ac-3d-showcase { display:flex; align-items:center; justify-content:center; padding:20px 0; }

        /* Stats */
        .ac-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; margin-top:38px; }
        @media(max-width:700px){.ac-stats{grid-template-columns:repeat(2,1fr);}}
        .ac-stat h3 { font-size:34px; color:var(--gold-dark); font-style:italic; }
        .ac-stat p { font-size:10px; letter-spacing:0.04em; color:#6b5d4f; margin-top:6px; font-family:'Cinzel',serif; text-transform:uppercase; }

        /* Why us */
        .ac-why-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:rgba(200,161,88,0.25); border:1px solid rgba(200,161,88,0.25); }
        @media(max-width:860px){.ac-why-grid{grid-template-columns:repeat(2,1fr);}}
        .ac-why-item { background:var(--ivory); padding:38px 26px; text-align:center; transition:background .3s, transform .3s; cursor:pointer; }
        .ac-why-item:hover { background:var(--cream); transform:translateY(-3px); }
        .ac-why-item h4 { font-size:15px; font-style:italic; margin:16px 0 8px; }
        .ac-why-item p { font-size:12px; color:#8a7a68; font-weight:300; line-height:1.6; }

        /* Testimonials */
        .ac-testi-wrap { background:var(--cream); padding:90px 6vw; text-align:center; }
        .ac-testi-card { max-width:700px; margin:0 auto; }
        .ac-testi-card p.quote { font-family:'Cormorant Garamond',serif; font-style:italic; font-size:clamp(20px,2.6vw,28px); line-height:1.6; color:var(--ink); min-height:130px; }
        .ac-testi-name { font-family:'Cinzel',serif; font-size:12px; letter-spacing:0.1em; color:var(--wine); margin-top:22px; }
        .ac-testi-city { font-size:11.5px; color:#8a7a68; margin-top:2px; }
        .ac-dots { display:flex; gap:8px; justify-content:center; margin-top:26px; }
        .ac-dot { width:7px; height:7px; border-radius:50%; background:rgba(76,14,27,0.25); cursor:pointer; transition:all .25s; }
        .ac-dot.active { background:var(--wine); width:22px; border-radius:4px; }

        /* Gallery */
        .ac-gal-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:4px; }
        @media(max-width:860px){.ac-gal-grid{grid-template-columns:repeat(3,1fr);}}
        .ac-gal-item { position:relative; aspect-ratio:1/1; overflow:hidden; cursor:pointer; }
        .ac-gal-item img { width:100%; height:100%; object-fit:cover; transition:transform .5s, filter .4s; filter:grayscale(0.12); }
        .ac-gal-item:hover img { transform:scale(1.1); filter:grayscale(0); }
        .ac-gal-item::after { content:"@aaradhyascreation"; position:absolute; inset:0; background:rgba(22,14,10,0.52); color:var(--ivory); font-family:'Cinzel',serif; font-size:10px; letter-spacing:0.1em; display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity .3s; text-align:center; padding:10px; }
        .ac-gal-item:hover::after { opacity:1; }

        /* Newsletter */
        .ac-news { background:var(--onyx); color:var(--ivory); text-align:center; padding:100px 6vw; position:relative; overflow:hidden; }
        .ac-news h2 { font-size:clamp(28px,3.6vw,42px); font-style:italic; color:var(--ivory); }
        .ac-news .accent { color:var(--gold); font-family:'Cinzel',serif; font-size:11px; letter-spacing:0.3em; display:block; margin-bottom:16px; }
        .ac-news p.desc { font-weight:300; color:rgba(251,246,236,0.7); margin:18px auto 36px; max-width:480px; font-size:14px; line-height:1.7; }
        .ac-news-form { display:flex; justify-content:center; gap:0; max-width:440px; margin:0 auto; border:1px solid rgba(200,161,88,0.5); }
        .ac-news-form input { flex:1; background:transparent; border:none; padding:16px 18px; color:var(--ivory); font-size:13px; outline:none; }
        .ac-news-form input::placeholder { color:rgba(251,246,236,0.45); }
        .ac-news-form button { background:var(--gold); border:none; padding:0 26px; font-family:'Cinzel',serif; font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:var(--onyx); cursor:pointer; }
        .ac-news-mandala { position:absolute; right:-80px; top:50%; transform:translateY(-50%); opacity:0.12; pointer-events:none; }

        /* Footer */
        .ac-footer { background:var(--wine-deep); color:rgba(251,246,236,0.78); padding:70px 6vw 26px; position:relative; overflow:hidden; }
        .ac-foot-watermark { position:absolute; right:-40px; bottom:-60px; font-family:'Cormorant Garamond',serif; font-style:italic; font-size:320px; line-height:1; color:rgba(251,246,236,0.03); pointer-events:none; user-select:none; }
        .ac-foot-grid { display:grid; grid-template-columns:1.4fr 1fr 1fr 1fr; gap:50px; max-width:1440px; margin:0 auto; position:relative; z-index:1; }
        @media(max-width:860px){.ac-foot-grid{grid-template-columns:1fr 1fr;}}
        .ac-foot-logo { font-family:'Cormorant Garamond',serif; font-style:italic; font-size:26px; color:var(--ivory); }
        .ac-foot-grid p.about { font-size:13px; font-weight:300; line-height:1.8; margin:16px 0 20px; max-width:280px; }
        .ac-foot-col h5 { font-family:'Cinzel',serif; font-size:11px; letter-spacing:0.18em; color:var(--gold); margin-bottom:18px; text-transform:uppercase; }
        .ac-foot-col div { display:block; font-size:13px; padding:6px 0; color:rgba(251,246,236,0.78); cursor:pointer; }
        .ac-foot-col div:hover { color:var(--gold); }
        .ac-foot-bottom { max-width:1440px; margin:50px auto 0; padding-top:22px; border-top:1px solid rgba(251,246,236,0.12); display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px; font-size:11.5px; color:rgba(251,246,236,0.5); }
        .ac-social { display:flex; gap:14px; }
        .ac-social div { width:32px; height:32px; border-radius:50%; border:1px solid rgba(200,161,88,0.4); display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:11px; transition:all .25s; }
        .ac-social div:hover { background:var(--gold); color:var(--onyx); border-color:var(--gold); }

        /* Mobile menu */
        .ac-mobile-menu { position:fixed; inset:0; background:var(--ivory); z-index:100; padding:26px 6vw; animation:fadeUp .3s ease both; overflow-y:auto; }
        .ac-mobile-menu li { list-style:none; font-family:'Cormorant Garamond',serif; font-size:26px; font-style:italic; padding:16px 0; border-bottom:1px solid var(--beige); cursor:pointer; }
        @media(prefers-reduced-motion:reduce){ .ac-hero img,.ac-marquee{animation:none!important;} }
      `}</style>

      {/* Admin FAB */}
      <button className="admin-fab" onClick={() => setAdminMode(true)} title="Admin Panel">
        <Settings size={20}/>
      </button>

      {/* Topbar */}
      <div className="ac-topbar">Complimentary worldwide shipping on orders above ₹25,000 &nbsp;·&nbsp; Private bridal styling, by appointment</div>

      {/* Navbar */}
      <nav className={`ac-nav ${scrolled ? "scrolled" : ""}`} onMouseLeave={() => setMegaOpen(false)}>
        <div className="ac-nav-inner">
          <button onClick={() => setMenuOpen(true)} style={{ background:"none",border:"none",cursor:"pointer",display:"none" }} className="ac-burger-mobile">
            <Menu size={22} color="#4C0E1B"/>
          </button>
          <div className="ac-logo"><Monogram size={38}/>Aaradhya's Creation<span>FINE HANDWOVEN SAREES</span></div>
          <ul className="ac-links" style={{ position:"relative" }}>
            <li>Home</li><li>New Arrivals</li><li>Bridal Sarees</li><li>Silk Sarees</li>
            <li onMouseEnter={() => setMegaOpen(true)}>Collections</li>
            <li>Occasion</li><li>About</li><li>Contact</li>
          </ul>
          <div className="ac-icons">
            <button aria-label="Search"><Search size={18}/></button>
            <button aria-label="Wishlist"><Heart size={18}/>{wishlist.size > 0 && <span className="ac-badge">{wishlist.size}</span>}</button>
            <button aria-label="Account"><User size={18}/></button>
            <button aria-label="Cart"><ShoppingBag size={18}/>{cartCount > 0 && <span className="ac-badge">{cartCount}</span>}</button>
          </div>
        </div>
        {megaOpen && (
          <div className="ac-mega">
            <div className="ac-mega-col"><h5>By Weave</h5>{["Banarasi","Kanjivaram","Organza","Tissue Silk","Handloom"].map(c=><div key={c}>{c}</div>)}</div>
            <div className="ac-mega-col"><h5>By Occasion</h5>{["Bridal","Festive","Reception","Sangeet","Office Elegance"].map(c=><div key={c}>{c}</div>)}</div>
            <div className="ac-mega-col"><h5>By Fabric</h5>{["Pure Silk","Georgette","Chiffon","Linen","Cotton"].map(c=><div key={c}>{c}</div>)}</div>
            <div className="ac-mega-col"><h5>Featured</h5>{["New Arrivals","Best Sellers","The Bridal Edit","Gifting"].map(c=><div key={c}>{c}</div>)}</div>
          </div>
        )}
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="ac-mobile-menu">
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:30 }}>
            <div className="ac-logo">Aaradhya's Creation</div>
            <button onClick={() => setMenuOpen(false)} style={{ background:"none",border:"none" }}><X size={26}/></button>
          </div>
          <ul>{["Home","New Arrivals","Bridal Sarees","Silk Sarees","Banarasi","Kanjivaram","Collections","Occasion","About","Contact"].map(l=><li key={l} onClick={()=>setMenuOpen(false)}>{l}</li>)}</ul>
        </div>
      )}

      {/* HERO */}
      <header className="ac-hero">
        <GoldParticles/>
        <img src={img("aaradhya-hero",1800,1400)} alt="Model draped in a luxury Aaradhya's Creation bridal saree" style={{ transform:`scale(1.06) translateY(${heroOffset}px)` }}/>
        <div className="ac-hero-frame"/>
        <div className="ac-hero-est">EST. 2009 — SURAT, INDIA</div>
        <div className="ac-hero-3d"><SareeBox3D/></div>
        <div className="ac-hero-content">
          <Eyebrow className="light">The 2026 Bridal & Festive Edit</Eyebrow>
          <h1>Timeless Sarees,<br/>Crafted for Royal Elegance</h1>
          <p className="sub">Each Aaradhya's Creation saree begins as raw silk thread and ends in an heirloom — woven by master artisans across Varanasi, Kanchipuram and Bengal, finished by hand, and made to be passed down.</p>
          <div className="ac-hero-ctas">
            <button className="btn-gold">Shop Collection</button>
            <button className="btn-outline">Bridal Edit</button>
            <button className="btn-outline">Festive Sarees</button>
          </div>
          <div className="ac-hero-creds">
            <div>Pure Silk, Verified</div><div>Hand-Finished Zari</div><div>30+ Countries Shipped</div>
          </div>
        </div>
      </header>

      {/* MARQUEE */}
      <div className="ac-marquee-wrap">
        <div className="ac-marquee">
          {[1,2].map(r=><React.Fragment key={r}>
            <span><i>◆</i>Banarasi</span><span><i>◆</i>Kanjivaram</span><span><i>◆</i>Pure Silk</span>
            <span><i>◆</i>Bridal Edit</span><span><i>◆</i>Handloom</span><span><i>◆</i>Organza</span><span><i>◆</i>Festive 2026</span>
          </React.Fragment>)}
        </div>
      </div>

      {/* PRESS */}
      <div className="ac-press">
        <span>As Cherished By Brides In</span>
        <div className="ac-press-row"><span>Mumbai</span><span>Delhi</span><span>Surat</span><span>Hyderabad</span><span>Dubai</span><span>London</span></div>
      </div>

      {/* COLLECTIONS */}
      <section className="ac-section">
        <Reveal className="ac-head">
          <Eyebrow>Curated By Craft</Eyebrow>
          <h2>Featured Luxury Collections</h2>
          <p>Sixteen weaves, one philosophy — uncompromising craftsmanship. Begin your search with the collections our patrons return to most.</p>
        </Reveal>
        <div className="ac-coll-grid">
          {activeCollections.map((c,i) => (
            <Reveal delay={(i%4)*90} key={c.id}>
              <Card3D>
                <div className="ac-coll-card">
                  <span className="ac-coll-corner tl"/><span className="ac-coll-corner br"/>
                  <img src={img(c.seed,700,950)} alt={c.title}/>
                  <div className="ac-coll-overlay">
                    <h3>{c.title}</h3><p>{c.sub}</p>
                    <span className="ac-explore">Explore Collection <ChevronRight size={12}/></span>
                  </div>
                </div>
              </Card3D>
            </Reveal>
          ))}
        </div>
        <div style={{ textAlign:"center",marginTop:44 }}>
          <button className="btn-wine">View All {collections.length} Collections</button>
        </div>
      </section>

      <ZariDivider/>

      {/* NEW ARRIVALS */}
      <section className="ac-section">
        <Reveal className="ac-head">
          <Eyebrow>Just Woven</Eyebrow>
          <h2>New Arrivals</h2>
          <p>Fresh off the loom — the latest additions to our atelier, in limited counts.</p>
        </Reveal>
        <div className="ac-prod-grid">
          {newArrivals.map((p,i) => {
            const off = p.mrp ? Math.round(100-(p.price/p.mrp)*100) : 0;
            return (
              <Reveal delay={i*90} key={p.id}>
                <Card3D>
                  <div className="ac-prod-card">
                    <div className="ac-prod-imgwrap">
                      {off>0&&<span className="ac-discount">{off}% OFF</span>}
                      <button className="ac-wish-btn" onClick={()=>toggleWishlist(p.id)}><Heart size={15} fill={wishlist.has(p.id)?"#4C0E1B":"none"} color="#4C0E1B"/></button>
                      <img className="first" src={img(p.seed,600,800)} alt={p.name}/>
                      <img className="second" src={img(p.seed+"b",600,800)} alt={p.name}/>
                      <div className="ac-quickadd" onClick={()=>setCartCount(c=>c+1)}>+ Quick Add to Bag</div>
                    </div>
                    <div className="ac-prod-info">
                      <h4>{p.name}</h4>
                      <p className="fabric">{p.fabric}</p>
                      <StarRow rating={p.rating}/>
                      <div className="ac-price-row">
                        <span className="ac-price">{rupee(p.price)}</span>
                        {p.mrp&&<span className="ac-mrp">{rupee(p.mrp)}</span>}
                      </div>
                    </div>
                  </div>
                </Card3D>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* BRIDAL EDIT */}
      <Reveal as="section" className="ac-split">
        <div className="ac-split-img"><img src={img("aaradhya-bridal-edit",1000,1200)} alt="Bridal saree"/></div>
        <div className="ac-split-text">
          <span className="accent">SIGNATURE COLLECTION</span>
          <h2>The Bridal Edit</h2>
          <p>Sarees for grand celebrations — hand-stitched zari borders, pure mulberry silk, and embroidery that can take an artisan up to ninety days to complete. This is a collection built for the one day you'll remember for a lifetime.</p>
          <button className="btn-gold">Shop Bridal Collection</button>
        </div>
      </Reveal>

      <ZariDivider/>

      {/* OCCASION */}
      <section className="ac-section">
        <Reveal className="ac-head">
          <Eyebrow>Dressed For The Moment</Eyebrow>
          <h2>Shop by Occasion</h2>
        </Reveal>
        <div className="ac-occ-row">
          {OCCASIONS.map((o,i)=>(
            <Reveal delay={i*60} key={o} className="ac-occ">
              <div className="ac-occ-circle"><img src={img(`occ-${i}-${o}`,300,300)} alt={o}/></div>
              <p>{o}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FABRIC */}
      <section className="ac-section" style={{ background:"var(--cream)",maxWidth:"100%" }}>
        <div style={{ maxWidth:1440,margin:"0 auto" }}>
          <Reveal className="ac-head">
            <Eyebrow>Touch & Texture</Eyebrow>
            <h2>Shop by Fabric</h2>
            <p>From featherlight Georgette to the unmistakable sheen of pure Kanjivaram silk — find your fabric.</p>
          </Reveal>
          <div className="ac-fab-grid">
            {FABRICS.map((f,i)=>(
              <Reveal delay={(i%4)*80} key={f.name}>
                <Card3D>
                  <div className="ac-fab-card">
                    <img src={img(f.seed,600,650)} alt={f.name}/>
                    <span className="ac-fab-label">{f.name}</span>
                  </div>
                </Card3D>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BESTSELLERS */}
      <section className="ac-section">
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:36,flexWrap:"wrap",gap:20 }}>
          <div>
            <Eyebrow>Loved By Our Patrons</Eyebrow>
            <h2 style={{ fontSize:"clamp(26px,3.2vw,38px)",fontStyle:"italic",color:"var(--wine)" }}>Best Sellers</h2>
          </div>
          <div style={{ display:"flex",gap:10 }}>
            <button className="ac-scroll-btn" onClick={()=>scrollBest(-1)}><ChevronLeft size={17}/></button>
            <button className="ac-scroll-btn" onClick={()=>scrollBest(1)}><ChevronRight size={17}/></button>
          </div>
        </div>
        <div className="ac-bs-scroller" ref={bsRef}>
          {bestsellers.map(p=>(
            <div className="ac-bs-card" key={p.id}>
              <div className="ac-bs-imgwrap">
                <span className="ac-bs-badge">BESTSELLER</span>
                <button className="ac-wish-btn" onClick={()=>toggleWishlist(p.id)}><Heart size={15} fill={wishlist.has(p.id)?"#4C0E1B":"none"} color="#4C0E1B"/></button>
                <img src={img(p.seed,600,800)} alt={p.name}/>
              </div>
              <div className="ac-prod-info">
                <h4>{p.name}</h4>
                <div className="ac-price-row"><span className="ac-price">{rupee(p.price)}</span></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ZariDivider/>

      {/* HERITAGE */}
      <Reveal as="section" className="ac-split" style={{ minHeight:520 }}>
        <div className="ac-split-text" style={{ background:"var(--emerald)",order:2 }}>
          <span className="accent">SINCE THE LOOM, SINCE 2009</span>
          <h2>Woven Into Heritage</h2>
          <p>Aaradhya's Creation began with a single handloom in Surat and a promise: never to compromise the craft. Today we work directly with weaver families across Varanasi, Kanchipuram and Bengal, preserving techniques passed down for generations.</p>
          <div className="ac-3d-showcase"><Mandala3D/></div>
          <div className="ac-stats">
            <div className="ac-stat"><h3>10,000+</h3><p>Happy Customers</p></div>
            <div className="ac-stat"><h3>500+</h3><p>Exclusive Designs</p></div>
            <div className="ac-stat"><h3>100%</h3><p>Handmade Luxury</p></div>
            <div className="ac-stat"><h3>30+</h3><p>Countries Shipped</p></div>
          </div>
        </div>
        <div className="ac-split-img" style={{ order:1 }}>
          <img src={img("aaradhya-heritage-weaver",1000,1200)} alt="Artisan weaving"/>
        </div>
      </Reveal>

      {/* WHY US */}
      <section className="ac-section">
        <Reveal className="ac-head">
          <Eyebrow>The Aaradhya Promise</Eyebrow>
          <h2>Why Choose Us</h2>
        </Reveal>
        <div className="ac-why-grid">
          {WHY_US.map(({icon:Icon,title,text})=>(
            <div className="ac-why-item" key={title}>
              <Icon size={26} color="#C8A158" strokeWidth={1.3}/><h4>{title}</h4><p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <div className="ac-testi-wrap">
        <Eyebrow>In Their Words</Eyebrow>
        <div className="ac-testi-card">
          <StarRow rating={TESTIMONIALS[testimonialIdx].rating}/>
          <p className="quote" style={{ marginTop:18 }}>"{TESTIMONIALS[testimonialIdx].text}"</p>
          <p className="ac-testi-name">{TESTIMONIALS[testimonialIdx].name}</p>
          <p className="ac-testi-city">{TESTIMONIALS[testimonialIdx].city}</p>
        </div>
        <div className="ac-dots">
          {TESTIMONIALS.map((_,i)=><div key={i} className={`ac-dot ${i===testimonialIdx?"active":""}`} onClick={()=>setTestimonialIdx(i)}/>)}
        </div>
      </div>

      {/* GALLERY */}
      <section style={{ padding:"90px 0 0" }}>
        <div className="ac-head"><Eyebrow>@aaradhyascreation</Eyebrow><h2>The Editorial Gallery</h2></div>
        <div className="ac-gal-grid">
          {GALLERY.map((g,i)=>(
            <Reveal delay={(i%6)*70} key={g}>
              <div className="ac-gal-item"><img src={img(g,500,500)} alt="Editorial styling"/></div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <div className="ac-news">
        <div className="ac-news-mandala"><Mandala3D/></div>
        <span className="accent">VIP ACCESS</span>
        <h2>Join Our Private Saree Circle</h2>
        <p className="desc">Unlock early access to bridal and festive collections, private trunk shows, and styling notes — before anyone else.</p>
        {subscribed ? (
          <p style={{ color:"#C8A158",fontFamily:"'Cinzel',serif",fontSize:13,letterSpacing:"0.08em" }}>Welcome to the Circle. Watch your inbox.</p>
        ) : (
          <form className="ac-news-form" onSubmit={e=>{e.preventDefault();if(email)setSubscribed(true);}}>
            <input type="email" required placeholder="Your email address" value={email} onChange={e=>setEmail(e.target.value)}/>
            <button type="submit">Subscribe</button>
          </form>
        )}
      </div>

      {/* FOOTER */}
      <footer className="ac-footer">
        <div className="ac-foot-watermark">A</div>
        <div className="ac-foot-grid">
          <div>
            <div className="ac-foot-logo" style={{ display:"flex",alignItems:"center",gap:12 }}><Monogram size={34}/>Aaradhya's Creation</div>
            <p className="about">A heritage atelier of handwoven sarees — bridal, festive and everyday luxury, crafted with India's finest weavers since 2009.</p>
            <div className="ac-social"><div>IG</div><div>FB</div><div>PIN</div><div><Phone size={13}/></div></div>
          </div>
          <div className="ac-foot-col">
            <h5>Shop</h5>
            <div>New Arrivals</div><div>Bridal Sarees</div><div>Best Sellers</div><div>Designer Sarees</div><div>Gifting</div>
          </div>
          <div className="ac-foot-col">
            <h5>Bridal Collection</h5>
            <div>The Bridal Edit</div><div>Book a Styling Session</div><div>Custom Blouse Stitching</div><div>Trousseau Sets</div>
          </div>
          <div className="ac-foot-col">
            <h5>Support</h5>
            <div>Contact Us</div><div>Shipping Info</div><div>Returns & Exchanges</div><div>Privacy Policy</div><div>FAQs</div>
          </div>
        </div>
        <div className="ac-foot-bottom">
          <span>© 2026 Aaradhya's Creation. All rights reserved.</span>
          <span>Handcrafted in Surat, India · Shipped worldwide</span>
        </div>
      </footer>
    </div>
  );
}
