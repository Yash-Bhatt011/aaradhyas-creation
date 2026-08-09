import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Heart, ShoppingBag, ShoppingCart, Zap,
  Star, Shield, Truck, RotateCcw, Share2, Check, Upload, X as XIcon,
  ChevronDown, ChevronUp, Award, Package
} from "lucide-react";
import { Logo, StarRow, ZariDivider, Card3D } from "../components/shared.jsx";
import CartDrawer from "../components/CartDrawer.jsx";
import LazyImage from "../components/LazyImage.jsx";
import { useCart } from "../context/CartContext.jsx";
import { api } from "../api/client.js";
import { img, rupee } from "../data/content.js";
import "../styles/storefront.css";
import "../styles/product.css";

const BACKEND = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace("/api", "")
  : "http://localhost:5000";

function resolveImg(src, w = 700, h = 900) {
  if (!src) return img("placeholder", w, h);
  if (src.startsWith("/uploads/")) return `${BACKEND}${src}`;
  return img(src, w, h);
}

function buildGallery(product) {
  if (!product) return [];
  // Only use real uploaded images — never generate fake random placeholders
  const imgs = (product.images || []).filter(Boolean).map(s => resolveImg(s, 700, 900));
  // If the admin uploaded nothing yet, return empty so we show the "no photo" UI
  return imgs;
}

/* ─── Star breakdown bar ─── */
function RatingBar({ label, pct }) {
  return (
    <div className="pd-rbar">
      <span className="pd-rbar-lbl">{label} <Star size={10} fill="#C8A158" color="#C8A158"/></span>
      <div className="pd-rbar-track"><div className="pd-rbar-fill" style={{ width: `${pct}%` }}/></div>
      <span className="pd-rbar-pct">{Math.round(pct)}%</span>
    </div>
  );
}

/* ─── Single review card ─── */
function ReviewCard({ r }) {
  return (
    <div className="pd-review-card">
      <div className="pd-review-head">
        <div className="pd-review-avatar">{r.name?.[0]?.toUpperCase() || "?"}</div>
        <div>
          <p className="pd-review-name">{r.name} {r.verified && <span className="pd-verified">✓ Verified Purchase</span>}</p>
          <p className="pd-review-city">{r.city && `📍 ${r.city}`} · {new Date(r.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}</p>
        </div>
        <div className="pd-review-stars">
          {[1,2,3,4,5].map(i => <Star key={i} size={12} fill={i<=r.rating?"#C8A158":"none"} color="#C8A158" strokeWidth={1.5}/>)}
        </div>
      </div>
      {r.title && <p className="pd-review-title">"{r.title}"</p>}
      <p className="pd-review-text">{r.text}</p>
      {r.images?.length > 0 && (
        <div className="pd-review-imgs">
          {r.images.map((src, i) => (
            <LazyImage key={i} src={resolveImg(src, 200, 200)} alt="Customer photo" className="pd-review-img"/>
          ))}
        </div>
      )}
    </div>
  );
}


/* ── FABRIC SENSORY CARD ── */
const FABRIC_PROFILES = {
  "Pure Katan Silk":     { weight:88, sheen:92, drape:75, texture:80, weightLbl:"Substantial", sheenLbl:"Luminous", drapeLbl:"Fluid", texLbl:"Sumptuous" },
  "Temple Border Silk":  { weight:90, sheen:88, drape:70, texture:85, weightLbl:"Rich", sheenLbl:"Radiant", drapeLbl:"Structured", texLbl:"Intricate" },
  "Hand-painted Organza":{ weight:18, sheen:65, drape:95, texture:35, weightLbl:"Gossamer", sheenLbl:"Luminous", drapeLbl:"Ethereal", texLbl:"Sheer" },
  "Tissue Silk, Pure Zari":{ weight:55,sheen:98,drape:72, texture:88, weightLbl:"Moderate", sheenLbl:"Dazzling", drapeLbl:"Fluid", texLbl:"Lustrous" },
  "Pure Silk Zari":      { weight:85, sheen:90, drape:74, texture:82, weightLbl:"Substantial", sheenLbl:"Brilliant", drapeLbl:"Flowing", texLbl:"Silken" },
  "Pure Mulberry Silk":  { weight:70, sheen:86, drape:88, texture:72, weightLbl:"Medium", sheenLbl:"Luminous", drapeLbl:"Very Fluid", texLbl:"Smooth" },
  "French Georgette":    { weight:22, sheen:40, drape:96, texture:30, weightLbl:"Featherlight", sheenLbl:"Soft Sheen", drapeLbl:"Extremely Fluid", texLbl:"Crinkled" },
  "Ivory Katan Silk":    { weight:82, sheen:88, drape:76, texture:78, weightLbl:"Full", sheenLbl:"Radiant", drapeLbl:"Graceful", texLbl:"Smooth" },
  default:               { weight:75, sheen:80, drape:78, texture:75, weightLbl:"Medium", sheenLbl:"Luminous", drapeLbl:"Fluid", texLbl:"Rich" }
};

function FabricSensory({ fabric }) {
  const profile = FABRIC_PROFILES[fabric] || FABRIC_PROFILES.default;
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);
  useEffect(()=>{
    const obs = new IntersectionObserver(([e])=>{ if(e.isIntersecting){ setAnimated(true); obs.disconnect(); } },{threshold:0.3});
    if(ref.current) obs.observe(ref.current);
    return ()=>obs.disconnect();
  },[]);
  const meters = [
    { label:"Weight",  val:profile.weight,  endLbl:profile.weightLbl, poles:["Gossamer","Substantial"] },
    { label:"Sheen",   val:profile.sheen,   endLbl:profile.sheenLbl,  poles:["Matte","Luminous"] },
    { label:"Drape",   val:profile.drape,   endLbl:profile.drapeLbl,  poles:["Structured","Fluid"] },
    { label:"Texture", val:profile.texture, endLbl:profile.texLbl,    poles:["Sheer","Sumptuous"] },
  ];
  return (
    <div className="pd-sensory" ref={ref}>
      <p className="pd-sensory-title">Fabric Character</p>
      <div className="pd-sensory-meters">
        {meters.map(m=>(
          <div className="pd-meter" key={m.label}>
            <div className="pd-meter-head">
              <span className="pd-meter-label">{m.label}</span>
              <span className="pd-meter-val">{m.endLbl}</span>
            </div>
            <div className="pd-meter-track">
              <div className={`pd-meter-fill ${animated?"animate":""}`}
                style={{ width:`${m.val}%`, transform: animated ? `scaleX(1)` : `scaleX(0)`, transitionDelay:`${meters.indexOf(m)*0.12}s` }}/>
            </div>
            <div className="pd-meter-poles"><span>{m.poles[0]}</span><span>{m.poles[1]}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── ARTISAN JOURNEY ── */
const JOURNEY_STEPS = [
  { emoji:"🪴", num:"01", name:"Raw Silk", desc:"Mulberry silk reeled from cocoons by hand in Karnataka and West Bengal.", time:"2–3 weeks" },
  { emoji:"🎨", num:"02", name:"Natural Dyeing", desc:"Threads soaked in plant and mineral dyes — saffron, indigo, pomegranate rind.", time:"3–7 days" },
  { emoji:"🪡", num:"03", name:"Loom Setting", desc:"The master weaver sets up 2,000–5,000 threads on the handloom for each saree.", time:"2–5 days" },
  { emoji:"🪢", num:"04", name:"Hand Weaving", desc:"Woven thread-by-thread at 18–30 cm per day. Each saree takes 15 to 90 days.", time:"15–90 days" },
  { emoji:"✨", num:"05", name:"Zari & Motifs", desc:"Pure gold or silver zari thread woven in by a second artisan for borders and pallu.", time:"3–20 days" },
  { emoji:"🔍", num:"06", name:"Quality Check", desc:"12-point inspection by our heritage artisans. Only 1 in 3 sarees pass our standard.", time:"1–2 days" },
  { emoji:"📦", num:"07", name:"Yours Forever", desc:"Hand-folded, wrapped in archival tissue, sealed in a signature gold silk box.", time:"Ships in 2–3 days" },
  { emoji:"🏡", num:"08", name:"Heirloom", desc:"A saree that outlives fashion — made to be worn, treasured, and passed down.", time:"Generations" },
];

function ArtisanJourney() {
  return (
    <div className="pd-artisan">
      <h3 className="pd-artisan-title">From the Loom to Your Hands</h3>
      <p className="pd-artisan-sub">Every Aaradhya's Creation saree passes through eight stages of artisan care before it reaches you.</p>
      <div className="pd-timeline">
        {JOURNEY_STEPS.map((step,i)=>(
          <div className="pd-step" key={step.num}>
            <div className="pd-step-icon">{step.emoji}</div>
            {i < JOURNEY_STEPS.length-1 && <div className="pd-step-connector"/>}
            <p className="pd-step-num">STEP {step.num}</p>
            <p className="pd-step-name">{step.name}</p>
            <p className="pd-step-desc">{step.desc}</p>
            <p className="pd-step-time">⏱ {step.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── OCCASION MATCHER ── */
const OCC_MAP = {
  bridal:    ["Wedding","Reception","Engagement","Sangeet"],
  kanjivaram:["Wedding","Temple Visit","Reception","Anniversary"],
  banarasi:  ["Wedding","Festive Wear","Reception","Puja"],
  silk:      ["Wedding","Reception","Office Elegance","Party Wear"],
  organza:   ["Reception","Party Wear","Festive Wear","Casual Grace"],
  designer:  ["Party Wear","Office Elegance","Reception","Sangeet"],
  festive:   ["Festive Wear","Mehendi","Sangeet","Puja"],
  handloom:  ["Casual Grace","Office Elegance","Festive Wear","Puja"],
};
const ALL_OCC = ["Wedding","Reception","Festive Wear","Mehendi","Sangeet","Party Wear","Office Elegance","Casual Grace","Temple Visit","Engagement","Anniversary","Puja"];
function OccasionMatcher({ collection }) {
  const match = OCC_MAP[collection] || OCC_MAP.silk;
  return (
    <div>
      <h3 style={{fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:".1em",color:"var(--wine)",marginBottom:12}}>PERFECT FOR</h3>
      <div className="pd-occasions">
        {ALL_OCC.map(o=>(
          <span key={o} className={`pd-occ-tag ${match.includes(o)?"match":""}`}>{o}</span>
        ))}
      </div>
    </div>
  );
}


export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cart = useCart();

  const [product, setProduct]       = useState(null);
  const [collection, setCollection] = useState(null);
  const [related, setRelated]       = useState([]);
  const [reviews, setReviews]       = useState([]);
  const [gallery, setGallery]       = useState([]);
  const [activeIdx, setActiveIdx]   = useState(0);
  const [zoomed, setZoomed]         = useState(false);
  const [zoomPos, setZoomPos]       = useState({ x: 50, y: 50 });
  const [qty, setQty]               = useState(1);
  const [inWishlist, setInWishlist] = useState(false);
  const [tab, setTab]               = useState("description");
  const [loading, setLoading]       = useState(true);
  const [scrolled, setScrolled]     = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const imgRef = useRef(null);

  /* ── Review form state ── */
  const [rv, setRv] = useState({ name:"", city:"", rating:5, title:"", text:"" });
  const [rvFiles, setRvFiles] = useState([]);
  const [rvPreviews, setRvPreviews] = useState([]);
  const [rvSubmitting, setRvSubmitting] = useState(false);
  const [rvDone, setRvDone] = useState(false);
  const [rvError, setRvError] = useState(null);
  const rvFileRef = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    setLoading(true);
    setActiveIdx(0);
    Promise.all([
      api.getProduct(id),
      api.getCollections(),
      api.getProducts(),
      api.getReviews(id)
    ]).then(([p, cols, allProds, revs]) => {
      setProduct(p);
      setGallery(buildGallery(p));
      setCollection(cols.find(c => c.id === p.collection) || null);
      setRelated(allProds.filter(x => x.id !== p.id && x.collection === p.collection).slice(0, 4));
      setReviews(revs);
    }).catch(() => navigate("/", { replace: true }))
      .finally(() => setLoading(false));
  }, [id]);

  /* ── Zoom handler ── */
  const handleMouseMove = e => {
    if (!imgRef.current) return;
    const r = imgRef.current.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  };

  /* ── Add to cart ── */
  const handleAddToCart = () => {
    cart.addItem(product, qty);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  /* ── Buy now ── */
  const handleBuyNow = () => {
    cart.addItem(product, qty);
    navigate("/checkout");
  };

  /* ── Review submit ── */
  const handleRvFileChange = e => {
    const files = Array.from(e.target.files).slice(0, 4);
    setRvFiles(files);
    setRvPreviews(files.map(f => URL.createObjectURL(f)));
  };
  const handleRvSubmit = async e => {
    e.preventDefault();
    if (!rv.text.trim()) { setRvError("Please write your review."); return; }
    setRvSubmitting(true); setRvError(null);
    try {
      const saved = await api.submitReview(id, rv, rvFiles);
      setReviews(prev => [saved, ...prev]);
      setRvDone(true);
      setRv({ name:"", city:"", rating:5, title:"", text:"" });
      setRvFiles([]); setRvPreviews([]);
      setTab("reviews");
    } catch(e) { setRvError(e.message); }
    finally { setRvSubmitting(false); }
  };

  /* ── Rating breakdown ── */
  const ratingBreakdown = [5,4,3,2,1].map(star => {
    const count = reviews.filter(r => r.rating === star).length;
    return { star, pct: reviews.length ? (count / reviews.length) * 100 : 0 };
  });
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : (product?.rating || 0).toFixed(1);

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--ivory)" }}>
      <div style={{ color:"#8a7a68", fontStyle:"italic", fontFamily:"'Cormorant Garamond',serif", fontSize:18 }}>Loading…</div>
    </div>
  );

  if (!product) return null;

  const off = product.mrp ? Math.round(100 - (product.price / product.mrp) * 100) : 0;

  return (
    <div className="ac-root" style={{ background:"var(--ivory)", minHeight:"100vh" }}>
      {/* Nav */}
      <nav className={`ac-nav ${scrolled?"scrolled":""}`}>
        <div className="ac-nav-inner">
          <Link to="/" className="ac-logo"><Logo size={34}/>Aaradhya's Creation<span>FINE HANDWOVEN SAREES</span></Link>
          <div className="ac-icons">
            <button onClick={() => cart.setIsOpen(true)} aria-label="Cart">
              <ShoppingBag size={18}/>{cart.count>0&&<span className="ac-badge">{cart.count}</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="pd-breadcrumb">
        <Link to="/">Home</Link>
        <span>›</span>
        {collection && <><Link to={`/collection/${collection.id}`}>{collection.title}</Link><span>›</span></>}
        <span className="pd-bc-current">{product.name}</span>
      </div>

      {/* ─── Main product section ─── */}
      <div className="pd-wrap">

        {/* LEFT — image gallery */}
        <div className="pd-gallery">
          {/* Thumbnails — only shown when there are real uploaded images */}
          {gallery.length > 1 && (
            <div className="pd-thumbs">
              {gallery.map((src, i) => (
                <div key={i} className={`pd-thumb ${i===activeIdx?"active":""}`}
                  onClick={() => setActiveIdx(i)}>
                  <LazyImage src={src} alt={`${product.name} view ${i+1}`}/>
                </div>
              ))}
            </div>
          )}

          {/* Main image with zoom */}
          <div className={`pd-main-img-wrap ${gallery.length===0?"pd-no-photo":""}`}
            ref={imgRef}
            onMouseEnter={() => gallery.length>0 && setZoomed(true)}
            onMouseLeave={() => setZoomed(false)}
            onMouseMove={handleMouseMove}>

            {gallery.length > 0 ? (
              <>
                <img
                  src={gallery[activeIdx]}
                  alt={product.name}
                  className="pd-main-img"
                  loading="eager"
                  decoding="async"
                  style={{ transform: zoomed ? "scale(2.2)" : "scale(1)",
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transition: zoomed ? "none" : "transform .25s ease" }}
                />
                {off > 0 && <div className="pd-img-badge">{off}% OFF</div>}
                {gallery.length > 1 && (
                  <div className="pd-zoom-hint">{zoomed ? "Move cursor to zoom" : "Hover to zoom"}</div>
                )}
                {gallery.length > 1 && (
                  <>
                    <button className="pd-arrow pd-arrow-l" onClick={() => setActiveIdx(i => (i-1+gallery.length)%gallery.length)}><ChevronLeft size={18}/></button>
                    <button className="pd-arrow pd-arrow-r" onClick={() => setActiveIdx(i => (i+1)%gallery.length)}><ChevronRight size={18}/></button>
                  </>
                )}
              </>
            ) : (
              <div className="pd-no-photo-inner">
                <div className="pd-no-photo-icon">🪡</div>
                <p className="pd-no-photo-title">{product.name}</p>
                <p className="pd-no-photo-sub">Photos coming soon</p>
                <p className="pd-no-photo-hint">
                  Add product photos from<br/>
                  <strong>Admin → Products → Edit → Upload Images</strong>
                </p>
              </div>
            )}
          </div>


        </div>

        {/* RIGHT — product info */}
        <div className="pd-info">
          {collection && (
            <Link to={`/collection/${collection.id}`} className="pd-collection-tag">{collection.title}</Link>
          )}
          <h1 className="pd-title">{product.name}</h1>
          <p className="pd-fabric">{product.fabric}</p>

          {/* Rating summary */}
          <div className="pd-rating-row">
            <div className="pd-stars-inline">
              {[1,2,3,4,5].map(i=>(
                <Star key={i} size={14} fill={i<=Math.round(Number(avgRating))?"#C8A158":"none"} color="#C8A158" strokeWidth={1.5}/>
              ))}
            </div>
            <span className="pd-rating-val">{avgRating}</span>
            <span className="pd-review-count">({reviews.length} review{reviews.length!==1?"s":""})</span>
            {product.featured && <span className="pd-badge-pill">⭐ Best Seller</span>}
          </div>

          {/* Compact wishlist + share — small, inline */}
          <div className="pd-action-icons">
            <button className={`pd-action-icon ${inWishlist?"active":""}`} onClick={() => setInWishlist(v=>!v)}>
              <Heart size={13} fill={inWishlist?"#4C0E1B":"none"} color={inWishlist?"#4C0E1B":"#8a7a68"}/>
              {inWishlist ? "Wishlisted" : "Wishlist"}
            </button>
            <button className="pd-action-icon" onClick={() => navigator.share?.({ title: product.name, url: window.location.href })}>
              <Share2 size={13} color="#8a7a68"/>Share
            </button>
          </div>

          <div className="pd-divider"/>

          {/* Price */}
          <div className="pd-price-block">
            <span className="pd-price">{rupee(product.price)}</span>
            {product.mrp > product.price && (
              <>
                <span className="pd-mrp">{rupee(product.mrp)}</span>
                <span className="pd-off">{off}% off</span>
              </>
            )}
          </div>
          {product.price >= 25000 && (
            <p className="pd-free-shipping">🚚 Free delivery on this order</p>
          )}

          <div className="pd-divider"/>

          {/* Highlights */}
          <div className="pd-highlights">
            <h3>Highlights</h3>
            <ul>
              <li>Fabric: <strong>{product.fabric || "Pure Silk"}</strong></li>
              <li>Collection: <strong>{collection?.title || product.collection}</strong></li>
              <li>Finish: <strong>Hand-finished zari border</strong></li>
              <li>Blouse piece: <strong>Included (0.8m)</strong></li>
              <li>Length: <strong>6.3 metres</strong></li>
              <li>Wash care: <strong>Dry clean only</strong></li>
            </ul>
          </div>

          <div className="pd-divider"/>

          {/* Stock */}
          <div className="pd-stock">
            {product.stock === 0
              ? <span className="pd-out-of-stock">✗ Out of Stock</span>
              : product.stock <= 3
                ? <span className="pd-low-stock">⚡ Only {product.stock} left — order soon!</span>
                : <span className="pd-in-stock">✓ In Stock ({product.stock} available)</span>
            }
          </div>

          {/* Quantity */}
          <div className="pd-qty-row">
            <span className="pd-qty-label">Quantity</span>
            <div className="pd-qty-ctrl">
              <button onClick={() => setQty(q=>Math.max(1,q-1))} disabled={qty<=1}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(q=>Math.min(product.stock||99,q+1))} disabled={qty>=(product.stock||99)}>+</button>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="pd-ctas">
            <button className="pd-btn-cart" onClick={handleAddToCart} disabled={product.stock===0}>
              {addedToCart
                ? <><Check size={16}/>Added to Bag</>
                : <><ShoppingCart size={16}/>Add to Bag</>}
            </button>
            <button className="pd-btn-buy" onClick={handleBuyNow} disabled={product.stock===0}>
              <Zap size={16}/>Buy Now
            </button>
          </div>

          {/* Trust badges */}
          <div className="pd-trust">
            <div className="pd-trust-item"><Truck size={16} color="#C8A158"/><div><strong>Free Delivery</strong><p>On orders above ₹25,000</p></div></div>
            <div className="pd-trust-item"><RotateCcw size={16} color="#C8A158"/><div><strong>7-Day Returns</strong><p>Easy hassle-free returns</p></div></div>
            <div className="pd-trust-item"><Shield size={16} color="#C8A158"/><div><strong>100% Authentic</strong><p>Verified handwoven sarees</p></div></div>
            <div className="pd-trust-item"><Award size={16} color="#C8A158"/><div><strong>Artisan Made</strong><p>Directly from the loom</p></div></div>
          </div>
        </div>
      </div>

      {/* ─── Tabs — Description / Reviews / Shipping ─── */}
      <div className="pd-tabs-section">
        <div className="pd-tabs-bar">
          {[["description","Description"],["reviews",`Reviews (${reviews.length})`],["write","Write a Review"],["shipping","Shipping & Returns"]].map(([key,label])=>(
            <button key={key} className={`pd-tab ${tab===key?"active":""}`} onClick={()=>setTab(key)}>{label}</button>
          ))}
        </div>

        <div className="pd-tab-content">
          {/* ── Description ── */}
          {tab==="description" && (
            <div className="pd-desc">
              <p>{product.name} is a masterpiece of Indian textile artistry. Woven on traditional handlooms by skilled artisans in {product.collection === "kanjivaram" ? "Kanchipuram" : product.collection === "banarasi" ? "Varanasi" : "India"}, this saree is a celebration of heritage craftsmanship passed down through generations.</p>
              {showFullDesc && <>
                <p>The fabric is {product.fabric}, known for its luxurious texture, natural sheen, and durability. The intricate motifs — inspired by temple architecture, nature, and royal courts — are woven directly into the fabric using pure zari thread, ensuring they last the life of the saree.</p>
                <p>Each piece takes between 15 and 90 days to complete, depending on the complexity of the design. The border is hand-finished for precision, and the pallu features the signature Aaradhya's Creation motif that has become synonymous with bridal luxury.</p>
                <h4>Care Instructions</h4>
                <ul>
                  <li>Dry clean recommended for the first 2–3 washes</li>
                  <li>Store in a muslin cloth, away from direct sunlight</li>
                  <li>Do not wring or machine wash</li>
                  <li>Iron on reverse at medium heat</li>
                </ul>
              </>}
              <button className="pd-desc-toggle" onClick={()=>setShowFullDesc(v=>!v)}>
                {showFullDesc ? <><ChevronUp size={14}/>Show less</> : <><ChevronDown size={14}/>Read full description</>}
              </button>
              <FabricSensory fabric={product.fabric}/>
              <OccasionMatcher collection={product.collection}/>
            </div>
          )}

          {/* ── Reviews ── */}
          {tab==="reviews" && (
            <div className="pd-reviews">
              {reviews.length === 0 ? (
                <div className="pd-no-reviews">
                  <p>No reviews yet. Be the first to share your experience!</p>
                  <button className="pd-btn-cart" style={{ marginTop:16,maxWidth:220 }} onClick={()=>setTab("write")}>Write a Review</button>
                </div>
              ) : (
                <>
                  {/* Rating overview */}
                  <div className="pd-rating-overview">
                    <div className="pd-avg-rating">
                      <span className="pd-avg-num">{avgRating}</span>
                      <div className="pd-avg-stars">
                        {[1,2,3,4,5].map(i=><Star key={i} size={18} fill={i<=Math.round(Number(avgRating))?"#C8A158":"none"} color="#C8A158" strokeWidth={1.5}/>)}
                      </div>
                      <span className="pd-avg-sub">{reviews.length} verified review{reviews.length!==1?"s":""}</span>
                    </div>
                    <div className="pd-breakdown">
                      {ratingBreakdown.map(({star,pct})=><RatingBar key={star} label={star} pct={pct}/>)}
                    </div>
                  </div>
                  {/* Review cards */}
                  <div className="pd-reviews-list">
                    {reviews.map(r=><ReviewCard key={r.id} r={r}/>)}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Write a Review ── */}
          {tab==="write" && (
            <div className="pd-write-review">
              {rvDone ? (
                <div className="pd-rv-success">
                  <Check size={32} color="#2f9e5b"/>
                  <h3>Thank you for your review!</h3>
                  <p>Your review has been published. We appreciate you sharing your experience.</p>
                  <button className="pd-btn-cart" style={{ marginTop:16,maxWidth:200 }} onClick={()=>setTab("reviews")}>See All Reviews</button>
                </div>
              ) : (
                <form onSubmit={handleRvSubmit}>
                  <h3>Share Your Experience</h3>
                  {rvError && <div className="pd-rv-error">{rvError}</div>}

                  {/* Star picker */}
                  <div className="pd-rv-field">
                    <label>Your Rating *</label>
                    <div className="pd-star-picker">
                      {[1,2,3,4,5].map(s=>(
                        <Star key={s} size={28} onClick={()=>setRv(r=>({...r,rating:s}))}
                          fill={s<=rv.rating?"#C8A158":"none"} color="#C8A158"
                          strokeWidth={1.5} style={{ cursor:"pointer" }}/>
                      ))}
                      <span style={{ fontSize:13,color:"#8a7a68",marginLeft:8 }}>
                        {["","Poor","Fair","Good","Very Good","Excellent"][rv.rating]}
                      </span>
                    </div>
                  </div>

                  <div className="pd-rv-grid">
                    <div className="pd-rv-field"><label>Your Name *</label><input required placeholder="Priya Mehta" value={rv.name} onChange={e=>setRv(r=>({...r,name:e.target.value}))}/></div>
                    <div className="pd-rv-field"><label>City</label><input placeholder="Mumbai" value={rv.city} onChange={e=>setRv(r=>({...r,city:e.target.value}))}/></div>
                    <div className="pd-rv-field full"><label>Review Title</label><input placeholder="Absolutely beautiful craftsmanship!" value={rv.title} onChange={e=>setRv(r=>({...r,title:e.target.value}))}/></div>
                    <div className="pd-rv-field full">
                      <label>Your Review *</label>
                      <textarea required rows={4} placeholder="Tell us what you loved about this saree — the fabric, the drape, the occasion you wore it to…" value={rv.text} onChange={e=>setRv(r=>({...r,text:e.target.value}))}/>
                    </div>
                  </div>

                  {/* Photo upload */}
                  <div className="pd-rv-field">
                    <label>Add Photos (optional, max 4)</label>
                    <div className="pd-rv-upload" onClick={()=>rvFileRef.current?.click()}>
                      <Upload size={18} color="#C8A158"/>
                      <span>Click to upload your photos</span>
                    </div>
                    <input ref={rvFileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={handleRvFileChange}/>
                    {rvPreviews.length > 0 && (
                      <div className="pd-rv-previews">
                        {rvPreviews.map((src,i)=>(
                          <div key={i} className="pd-rv-prev-wrap">
                            <img src={src} alt="preview"/>
                            <button type="button" className="pd-rv-prev-del"
                              onClick={()=>{ setRvFiles(f=>f.filter((_,j)=>j!==i)); setRvPreviews(p=>p.filter((_,j)=>j!==i)); }}>
                              <XIcon size={10}/>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button type="submit" className="pd-btn-buy" style={{ maxWidth:220 }} disabled={rvSubmitting}>
                    {rvSubmitting ? "Submitting…" : "Submit Review"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ── Shipping & Returns ── */}
          {tab==="shipping" && (
            <div className="pd-shipping">
              <div className="pd-ship-grid">
                <div className="pd-ship-card"><Truck size={22} color="#C8A158"/>
                  <h4>Standard Delivery</h4><p>5–7 business days across India</p><p style={{fontWeight:600,color:"var(--wine)"}}>Free on orders ₹25,000+, else ₹199</p>
                </div>
                <div className="pd-ship-card"><Package size={22} color="#C8A158"/>
                  <h4>Express Delivery</h4><p>2–3 business days</p><p style={{fontWeight:600,color:"var(--wine)"}}>₹499 anywhere in India</p>
                </div>
                <div className="pd-ship-card"><RotateCcw size={22} color="#C8A158"/>
                  <h4>Returns</h4><p>7-day return window</p><p>Item must be unworn, tags intact, in original packaging</p>
                </div>
                <div className="pd-ship-card"><Shield size={22} color="#C8A158"/>
                  <h4>Exchanges</h4><p>14-day exchange window</p><p>Exchange for a different design or receive store credit</p>
                </div>
              </div>
              <div className="pd-ship-note">
                <strong>International Shipping:</strong> Available to 30+ countries. Delivery in 10–14 business days. Customs and duties are the responsibility of the recipient. Contact us on WhatsApp for international orders.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Artisan Journey ─── */}
      <div className="pd-tabs-section" style={{paddingTop:0}}><ArtisanJourney/></div>

      {/* ─── Related Products ─── */}
      {related.length > 0 && (
        <div className="pd-related">
          <ZariDivider/>
          <div className="ac-section">
            <div className="ac-head">
              <p className="ac-eyebrow">You May Also Love</p>
              <h2>More from {collection?.title || "This Collection"}</h2>
            </div>
            <div className="pd-related-grid">
              {related.map(p => {
                const rImg = p.images?.length ? resolveImg(p.images[0],600,800) : img(p.seed,600,800);
                return (
                  <Card3D key={p.id}>
                    <div className="ac-prod-card" onClick={() => navigate(`/product/${p.id}`)} style={{cursor:"pointer"}}>
                      <div className="ac-prod-imgwrap">
                        <LazyImage src={rImg} alt={p.name}/>
                        <div className="ac-quickadd" onClick={e=>{e.stopPropagation();cart.addItem(p);}}>+ Quick Add</div>
                      </div>
                      <div className="ac-prod-info">
                        <h4>{p.name}</h4>
                        <p className="fabric">{p.fabric}</p>
                        <StarRow rating={p.rating}/>
                        <div className="ac-price-row">
                          <span className="ac-price">{rupee(p.price)}</span>
                          {p.mrp?<span className="ac-mrp">{rupee(p.mrp)}</span>:null}
                        </div>
                      </div>
                    </div>
                  </Card3D>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <CartDrawer/>
    </div>
  );
}
