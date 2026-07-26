import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, Heart, User, ShoppingBag, Menu, X, ChevronLeft, ChevronRight,
  ChevronDown, Phone, ImageOff, Truck, RotateCcw, ShieldCheck, Wallet,
  Headphones, Package as Package2
} from "lucide-react";
import {
  Logo, ZariDivider, Eyebrow, StarRow, Reveal,
  Card3D, HeritageMandala, NewsletterOrnament, PreloaderMark
} from "../components/shared.jsx";
import CartDrawer from "../components/CartDrawer.jsx";
import { useCart } from "../context/CartContext.jsx";
import { api } from "../api/client.js";
import { img, rupee, OCCASIONS, FABRICS, TESTIMONIALS, GALLERY, WHY_US } from "../data/content.js";
import "../styles/storefront.css";

const BACKEND = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace("/api", "")
  : "http://localhost:5000";

/* Resolve any image src — uploaded path, external URL, or legacy picsum seed */
function resolveImg(src, w = 600, h = 800) {
  if (!src) return img("placeholder", w, h);
  if (src.startsWith("http")) return src;
  if (src.startsWith("/uploads/")) return `${BACKEND}${src}`;
  return img(src, w, h);
}

/* Pick the best available image for a product */
function productImg(p, w = 600, h = 800, idx = 0) {
  if (p?.images?.length > idx) return resolveImg(p.images[idx], w, h);
  if (p?.seed) return img(p.seed, w, h);
  return img(`prod-${p?.id || "x"}`, w, h);
}

export default function Storefront() {
  const navigate  = useNavigate();
  const bsRef     = useRef(null);
  const cart      = useCart();

  const [products,      setProducts]      = useState([]);
  const [collections,   setCollections]   = useState([]);
  const [siteImages,    setSiteImages]    = useState({});   // occasion / fabric / gallery overrides
  const [settings,      setSettings]      = useState({});   // store info (whatsapp, storeName, etc.)
  const [apiOk,         setApiOk]         = useState(true);
  const [wishlist,      setWishlist]      = useState(new Set());
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [megaOpen,      setMegaOpen]      = useState(null);  // null | "saree" | "kurti" | "all"
  const [collectionTab, setCollectionTab] = useState("saree"); // "saree" | "kurti" | "all"
  const [searchQuery,   setSearchQuery]   = useState("");
  const [testimonialIdx,setTestimonialIdx]= useState(0);
  const [email,         setEmail]         = useState("");
  const [subscribed,    setSubscribed]    = useState(false);
  const [scrolled,      setScrolled]      = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [heroOffset,    setHeroOffset]    = useState(0);

  /* ── Fetch data ── */
  useEffect(() => {
    Promise.all([api.getProducts(), api.getCollections(), api.getSettings()])
      .then(([p, c, s]) => {
        setProducts(p);
        setCollections(c);
        setSiteImages(s?.siteImages || {});
        setSettings(s || {});
        setApiOk(true);
      })
      .catch(() => {
        setApiOk(false);
        // Keep empty arrays so UI still renders gracefully
      })
      .finally(() => setLoading(false));
  }, []);

  /* ── Scroll & parallax ── */
  useEffect(() => {
    const fn = () => { setScrolled(window.scrollY > 24); setHeroOffset(window.scrollY * 0.28); };
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* ── Testimonial auto-rotate ── */
  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 6000);
    return () => clearInterval(t);
  }, []);

  /* ── Preloader ── */
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1100);
    return () => clearTimeout(t);
  }, []);

  const toggleWishlist  = (id) => setWishlist(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const scrollBest      = (dir) => bsRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  const goCollection    = (id) => navigate(`/collection/${id}`);

  /* Derived lists */
  const newArrivals = products.slice(0, 4);
  const bestsellers = [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6);
  const sareeCollections = collections.filter(c => (c.category || "saree") === "saree");
  const kurtiCollections = collections.filter(c => c.category === "kurti");
  const visibleCollections = collectionTab === "all" ? collections : collections.filter(c => (c.category || "saree") === collectionTab);
  const searchResults = searchQuery.trim()
    ? products.filter(p => {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) ||
          (p.fabric || "").toLowerCase().includes(q) ||
          (p.tags || []).some(t => t.toLowerCase().includes(q));
      })
    : null;

  /* Occasion image: admin-set URL > picsum seed */
  const occImg  = (name, i) => siteImages[`occ_${name}`] || img(`occ-${i}`, 300, 300);
  /* Fabric image: admin-set URL > picsum seed */
  const fabImg  = (name)    => siteImages[`fab_${name}`] || img(`fab-${name.toLowerCase().replace(/ /g, "-")}`, 600, 650);
  /* Gallery image */
  const galImg  = (i)       => siteImages[`gal_${i}`]   || img(`ig${i + 1}`, 500, 500);

  return (
    <div className="ac-root">
      {/* ── Preloader ── */}
      <div className={`ac-preloader ${!loading ? "hide" : ""}`}>
        <PreloaderMark />
        <span>Aaradhya's Creation</span>
      </div>

      <div className="ac-grain" />

      {/* ── API warning ── */}
      {!apiOk && !loading && (
        <div className="ac-api-warn">
          ⚠ Backend not reachable — start the API server with <code>npm run dev</code> to load products and enable checkout.
        </div>
      )}

      {/* ── Topbar ── */}
      <div className="sf2-topbar">
        <span className="sf2-topbar-left">★ Free shipping on orders above ₹999</span>
        <div className="sf2-topbar-right">
          <Link to="/"><Package2 size={13}/>Track Order</Link>
          <span><Heart size={13}/>Wishlist</span>
          <Link to="/login"><Headphones size={13}/>Customer Support</Link>
          <a href={`tel:${settings.whatsapp || "+919876543210"}`}><Phone size={13}/>{settings.whatsapp || "+91 98765 43210"}</a>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="sf2-header">
        <Link to="/" className="sf2-brand">
          <Logo size={44}/>
          <div className="sf2-brand-text">
            <h1>Aaradhya <em>Creation</em></h1>
            <p>Grace. Tradition. You.</p>
          </div>
        </Link>

        <form className="sf2-search" onSubmit={e => { e.preventDefault(); document.getElementById("new-arrivals")?.scrollIntoView({ behavior: "smooth" }); }}>
          <input placeholder="Search for Sarees, Kurtis…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
          <button type="submit" aria-label="Search"><Search size={17}/></button>
        </form>

        <div className="sf2-header-icons">
          <Link to="/login" className="sf2-icon-link"><User size={19}/><span>Account</span></Link>
          <div className="sf2-icon-link"><Heart size={19}/>{wishlist.size > 0 && <span className="ac-badge">{wishlist.size}</span>}<span>Wishlist</span></div>
          <div className="sf2-icon-link" onClick={() => cart.setIsOpen(true)} style={{ cursor: "pointer" }}>
            <ShoppingBag size={19}/>{cart.count > 0 && <span className="ac-badge">{cart.count}</span>}<span>Cart</span>
          </div>
        </div>

        <button onClick={() => setMenuOpen(true)} className="ac-burger-mobile" style={{ background: "none", border: "none", cursor: "pointer" }}>
          <Menu size={22} color="#4C0E1B"/>
        </button>
      </div>

      {/* ── Navbar ── */}
      <nav className={`sf2-nav ${scrolled ? "scrolled" : ""}`} onMouseLeave={() => setMegaOpen(null)}>
        <ul className="sf2-nav-links">
          <li className="active" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Home</li>
          <li onMouseEnter={() => setMegaOpen("saree")}>Saree <ChevronDown size={13}/></li>
          <li onMouseEnter={() => setMegaOpen("kurti")}>Kurti <ChevronDown size={13}/></li>
          <li onClick={() => document.getElementById("new-arrivals")?.scrollIntoView({ behavior: "smooth" })}>New Arrivals</li>
          <li onClick={() => document.getElementById("bestsellers")?.scrollIntoView({ behavior: "smooth" })}>Best Sellers</li>
          <li onMouseEnter={() => setMegaOpen("all")}>Collections <ChevronDown size={13}/></li>
          <li onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}>About Us</li>
          <li onClick={() => document.querySelector(".ac-footer")?.scrollIntoView({ behavior: "smooth" })}>Contact Us</li>
        </ul>

        {megaOpen && (
          <div className="ac-mega" onMouseLeave={() => setMegaOpen(null)}>
            {megaOpen === "saree" && (
              <div className="ac-mega-col"><h5>Saree Collections</h5>
                {sareeCollections.length === 0 && <div style={{ color: "#8a7a68" }}>No saree collections yet</div>}
                {sareeCollections.map(c => (
                  <div key={c.id} onClick={() => { goCollection(c.id); setMegaOpen(null); }}>{c.title}</div>
                ))}
              </div>
            )}
            {megaOpen === "kurti" && (
              <div className="ac-mega-col"><h5>Kurti Collections</h5>
                {kurtiCollections.length === 0 && <div style={{ color: "#8a7a68" }}>No kurti collections yet</div>}
                {kurtiCollections.map(c => (
                  <div key={c.id} onClick={() => { goCollection(c.id); setMegaOpen(null); }}>{c.title}</div>
                ))}
              </div>
            )}
            {megaOpen === "all" && (
              <div className="ac-mega-col"><h5>All Collections</h5>
                {collections.map(c => (
                  <div key={c.id} onClick={() => { goCollection(c.id); setMegaOpen(null); }}>{c.title}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className="ac-mobile-menu">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <Logo size={30} />
            <button onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none" }}><X size={26} /></button>
          </div>
          <ul>
            {["Home","New Arrivals","Best Sellers","About Us"].map(l => (
              <li key={l} onClick={() => setMenuOpen(false)}>{l}</li>
            ))}
            <li style={{ color: "#8a7a68", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 14 }}>Sarees</li>
            {sareeCollections.map(c => (
              <li key={c.id} onClick={() => { setMenuOpen(false); goCollection(c.id); }}>{c.title}</li>
            ))}
            <li style={{ color: "#8a7a68", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 14 }}>Kurtis</li>
            {kurtiCollections.map(c => (
              <li key={c.id} onClick={() => { setMenuOpen(false); goCollection(c.id); }}>{c.title}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── HERO (split: big banner + 2 stacked promos) ── */}
      <div className="sf2-hero">
        <div className="sf2-hero-main">
          <img src={siteImages.hero_main ? resolveImg(siteImages.hero_main,1400,1000) : img("aaradhya-hero-main",1400,1000)} alt="Timeless Elegance"/>
          <div className="sf2-hero-main-content">
            <span className="sf2-hero-tag">New Collection</span>
            <h1>Timeless Elegance<br/><em>in Every Drape</em></h1>
            <p>Premium Ethnic Wear for Every Occasion</p>
            <button className="sf2-hero-cta" onClick={() => document.getElementById("collections")?.scrollIntoView({ behavior: "smooth" })}>
              Shop Now <ChevronRight size={15}/>
            </button>
          </div>
        </div>

        <div className="sf2-hero-side">
          <div className="sf2-promo sf2-promo-wine" onClick={() => { setCollectionTab("saree"); document.getElementById("collections")?.scrollIntoView({ behavior: "smooth" }); }}>
            <img src={siteImages.hero_saree_promo ? resolveImg(siteImages.hero_saree_promo,700,500) : img("aaradhya-saree-promo",700,500)} alt="Sarees"/>
            <div className="sf2-promo-content">
              <h3>Saree</h3>
              <p>Explore Our Exquisite Collection</p>
              <button>Explore Sarees <ChevronRight size={13}/></button>
            </div>
          </div>
          <div className="sf2-promo sf2-promo-green" onClick={() => { setCollectionTab("kurti"); document.getElementById("collections")?.scrollIntoView({ behavior: "smooth" }); }}>
            <img src={siteImages.hero_kurti_promo ? resolveImg(siteImages.hero_kurti_promo,700,500) : img("aaradhya-kurti-promo",700,500)} alt="Kurtis"/>
            <div className="sf2-promo-content">
              <h3>Kurti</h3>
              <p>Stylish. Comfortable. Always You.</p>
              <button>Explore Kurtis <ChevronRight size={13}/></button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Feature bar ── */}
      <div className="sf2-features">
        <div className="sf2-feature"><Truck size={22}/><div><strong>Free Shipping</strong><p>On orders above ₹999</p></div></div>
        <div className="sf2-feature"><RotateCcw size={22}/><div><strong>7 Days Return</strong><p>Easy Return Policy</p></div></div>
        <div className="sf2-feature"><ShieldCheck size={22}/><div><strong>Secure Payment</strong><p>100% Secure Checkout</p></div></div>
        <div className="sf2-feature"><Wallet size={22}/><div><strong>COD Available</strong><p>Cash on Delivery</p></div></div>
        <div className="sf2-feature"><Headphones size={22}/><div><strong>Customer Support</strong><p>{settings.whatsapp || "+91 98765 43210"}</p></div></div>
      </div>

      {/* ── Marquee ── */}
      <div className="ac-marquee-wrap">
        <div className="ac-marquee">
          {[1,2].map(r => <React.Fragment key={r}>
            <span><i>◆</i>Banarasi</span><span><i>◆</i>Kanjivaram</span>
            <span><i>◆</i>Pure Silk</span><span><i>◆</i>Bridal Edit</span>
            <span><i>◆</i>Handloom</span><span><i>◆</i>Organza</span>
            <span><i>◆</i>Festive 2026</span>
          </React.Fragment>)}
        </div>
      </div>

      {/* ── Press ── */}
      <div className="ac-press">
        <span>As Cherished By Brides In</span>
        <div className="ac-press-row">
          {["Mumbai","Delhi","Surat","Hyderabad","Dubai","London"].map(c => <span key={c}>{c}</span>)}
        </div>
      </div>

      {/* ── COLLECTIONS ── */}
      <section className="ac-section" id="collections">
        <Reveal className="ac-head">
          <Eyebrow>Curated By Craft</Eyebrow>
          <h2>Featured Collections</h2>
          <p>Sarees and kurtis, one philosophy — uncompromising craftsmanship.</p>
        </Reveal>

        <div className="sf2-cat-tabs">
          <button className={collectionTab==="saree" ? "active" : ""} onClick={() => setCollectionTab("saree")}>Saree</button>
          <button className={collectionTab==="kurti" ? "active" : ""} onClick={() => setCollectionTab("kurti")}>Kurti</button>
          <button className={collectionTab==="all" ? "active" : ""} onClick={() => setCollectionTab("all")}>All</button>
        </div>

        <div className="ac-coll-grid">
          {visibleCollections.map((c, i) => (
            <Reveal delay={(i % 4) * 90} key={c.id}>
              <Card3D>
                <div className="ac-coll-card" onClick={() => goCollection(c.id)}>
                  <span className="ac-coll-corner tl" /><span className="ac-coll-corner br" />
                  <img src={resolveImg(c.seed, 700, 950)} alt={c.title} />
                  <div className="ac-coll-overlay">
                    <h3>{c.title}</h3>
                    <p>{c.sub}</p>
                    <span className="ac-explore">Explore Collection <ChevronRight size={12} /></span>
                  </div>
                </div>
              </Card3D>
            </Reveal>
          ))}
          {!loading && visibleCollections.length === 0 && (
            <p style={{ gridColumn: "1/-1", textAlign: "center", color: "#8a7a68", padding: "40px 0" }}>
              No collections in this category yet — add one in the admin panel.
            </p>
          )}
        </div>
        {collections.length > 0 && (
          <div style={{ textAlign: "center", marginTop: 44 }}>
            <button className="btn-wine" onClick={() => setCollectionTab("all")}>
              View All {collections.length} Collections
            </button>
          </div>
        )}
      </section>

      <ZariDivider />

      {/* ── NEW ARRIVALS ── */}
      <section className="ac-section" id="new-arrivals">
        <Reveal className="ac-head">
          <Eyebrow>Just Woven</Eyebrow>
          <h2>New Arrivals</h2>
          <p>Fresh off the loom — the latest additions to our atelier, in limited counts.</p>
        </Reveal>
        {!loading && products.length === 0 && (
          <p style={{ textAlign: "center", color: "#8a7a68", padding: "20px 0 40px" }}>
            {apiOk ? "No products yet — add them from the admin panel." : "Start the backend server to load products."}
          </p>
        )}
        <div className="ac-prod-grid">
          {newArrivals.map((p, i) => {
            const off = p.mrp ? Math.round(100 - (p.price / p.mrp) * 100) : 0;
            return (
              <Reveal delay={i * 90} key={p.id}>
                <Card3D>
                  <div className="ac-prod-card" onClick={(e)=>{if(!e.defaultPrevented)navigate(`/product/${p.id}`)}} style={{cursor:"pointer"}}>
                    <div className="ac-prod-imgwrap">
                      {off > 0 && <span className="ac-discount">{off}% OFF</span>}
                      <button className="ac-wish-btn" onClick={(e)=>{e.stopPropagation();e.preventDefault();toggleWishlist(p.id);}}>
                        <Heart size={15} fill={wishlist.has(p.id) ? "#4C0E1B" : "none"} color="#4C0E1B" />
                      </button>
                      <img className="first"  src={productImg(p, 600, 800, 0)} alt={p.name} />
                      <img className="second" src={productImg(p, 600, 800, 1)} alt={p.name} />
                      <div className="ac-quickadd" onClick={(e)=>{e.stopPropagation();e.preventDefault();cart.addItem(p);}}>+ Quick Add to Bag</div>
                    </div>
                    <div className="ac-prod-info">
                      <h4>{p.name}</h4>
                      <p className="fabric">{p.fabric}</p>
                      <StarRow rating={p.rating} />
                      <div className="ac-price-row">
                        <span className="ac-price">{rupee(p.price)}</span>
                        {p.mrp ? <span className="ac-mrp">{rupee(p.mrp)}</span> : null}
                      </div>
                    </div>
                  </div>
                </Card3D>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── BRIDAL SPLIT ── */}
      <Reveal as="section" className="ac-split">
        <div className="ac-split-img">
          <img src={siteImages.bridal_split ? resolveImg(siteImages.bridal_split,1000,1200) : img("aaradhya-bridal-edit-2026",1000,1200)} alt="Bridal saree" />
        </div>
        <div className="ac-split-text">
          <span className="accent">SIGNATURE COLLECTION</span>
          <h2>The Bridal Edit</h2>
          <p>Sarees for grand celebrations — hand-stitched zari borders, pure mulberry silk, and embroidery that can take an artisan up to ninety days to complete.</p>
          <button className="btn-gold" onClick={() => goCollection("bridal")}>Shop Bridal Collection</button>
        </div>
      </Reveal>

      <ZariDivider />

      {/* ── OCCASION ── */}
      <section className="ac-section" id="occasion">
        <Reveal className="ac-head">
          <Eyebrow>Dressed For The Moment</Eyebrow>
          <h2>Shop by Occasion</h2>
        </Reveal>
        <div className="ac-occ-row">
          {OCCASIONS.map((o, i) => (
            <Reveal delay={i * 60} key={o} className="ac-occ">
              <div className="ac-occ-circle">
                <img src={occImg(o, i)} alt={o} />
              </div>
              <p>{o}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FABRIC ── */}
      <section className="ac-section" style={{ background: "var(--cream)", maxWidth: "100%" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto" }}>
          <Reveal className="ac-head">
            <Eyebrow>Touch &amp; Texture</Eyebrow>
            <h2>Shop by Fabric</h2>
            <p>From featherlight Georgette to the unmistakable sheen of pure Kanjivaram silk — find your fabric.</p>
          </Reveal>
          <div className="ac-fab-grid">
            {FABRICS.map((f, i) => (
              <Reveal delay={(i % 4) * 80} key={f.name}>
                <Card3D>
                  <div className="ac-fab-card">
                    <img src={fabImg(f.name)} alt={f.name} />
                    <span className="ac-fab-label">{f.name}</span>
                  </div>
                </Card3D>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── BESTSELLERS ── */}
      <section className="ac-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36, flexWrap: "wrap", gap: 20 }}>
          <div>
            <Eyebrow>Loved By Our Patrons</Eyebrow>
            <h2 style={{ fontSize: "clamp(26px,3.2vw,38px)", fontStyle: "italic", color: "var(--wine)" }}>Best Sellers</h2>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="ac-scroll-btn" onClick={() => scrollBest(-1)}><ChevronLeft size={17} /></button>
            <button className="ac-scroll-btn" onClick={() => scrollBest(1)}><ChevronRight size={17} /></button>
          </div>
        </div>
        <div className="ac-bs-scroller" ref={bsRef}>
          {bestsellers.map(p => (
            <div className="ac-bs-card" key={p.id} onClick={()=>navigate(`/product/${p.id}`)} style={{cursor:"pointer"}}>
              <div className="ac-bs-imgwrap">
                <span className="ac-bs-badge">BESTSELLER</span>
                <button className="ac-wish-btn" onClick={(e)=>{e.stopPropagation();e.preventDefault();toggleWishlist(p.id);}}>
                  <Heart size={15} fill={wishlist.has(p.id) ? "#4C0E1B" : "none"} color="#4C0E1B" />
                </button>
                <img src={productImg(p, 600, 800, 0)} alt={p.name} />
              </div>
              <div className="ac-prod-info">
                <h4>{p.name}</h4>
                <div className="ac-price-row"><span className="ac-price">{rupee(p.price)}</span></div>
                <div className="ac-quickadd" style={{ position: "static", opacity: 1, transform: "none", marginTop: 10 }}
                  onClick={(e)=>{e.stopPropagation();e.preventDefault();cart.addItem(p);}}>
                  + Quick Add to Bag
                </div>
              </div>
            </div>
          ))}
          {bestsellers.length === 0 && !loading && (
            <p style={{ color: "#8a7a68", padding: "40px 0" }}>Products will appear here once added.</p>
          )}
        </div>
      </section>

      <ZariDivider />

      {/* ── HERITAGE / ABOUT ── */}
      <Reveal as="section" className="ac-split" id="about" style={{ minHeight: 520 }}>
        <div className="ac-split-text" style={{ background: "var(--emerald)", order: 2 }}>
          <span className="accent">SINCE THE LOOM, SINCE 2009</span>
          <h2>Woven Into Heritage</h2>
          <p>Aaradhya's Creation began with a single handloom in Surat and a promise: never to compromise the craft. Today we work directly with weaver families across Varanasi, Kanchipuram and Bengal, preserving techniques passed down for generations.</p>
          <div className="ac-3d-showcase">
            <HeritageMandala />
          </div>
          <div className="ac-stats">
            <div className="ac-stat"><h3>10,000+</h3><p>Happy Customers</p></div>
            <div className="ac-stat"><h3>500+</h3><p>Exclusive Designs</p></div>
            <div className="ac-stat"><h3>100%</h3><p>Handmade Luxury</p></div>
            <div className="ac-stat"><h3>30+</h3><p>Countries Shipped</p></div>
          </div>
        </div>
        <div className="ac-split-img" style={{ order: 1 }}>
          <img src={siteImages.heritage ? resolveImg(siteImages.heritage,1000,1200) : img("aaradhya-heritage-weaver",1000,1200)} alt="Artisan weaving" />
        </div>
      </Reveal>

      {/* ── WHY US ── */}
      <section className="ac-section">
        <Reveal className="ac-head">
          <Eyebrow>The Aaradhya Promise</Eyebrow>
          <h2>Why Choose Us</h2>
        </Reveal>
        <div className="ac-why-grid">
          {WHY_US.map(({ icon: Icon, title, text }) => (
            <div className="ac-why-item" key={title}>
              <Icon size={26} color="#C8A158" strokeWidth={1.3} /><h4>{title}</h4><p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <div className="ac-testi-wrap">
        <Eyebrow>In Their Words</Eyebrow>
        <div className="ac-testi-card">
          <StarRow rating={TESTIMONIALS[testimonialIdx].rating} />
          <p className="quote" style={{ marginTop: 18 }}>"{TESTIMONIALS[testimonialIdx].text}"</p>
          <p className="ac-testi-name">{TESTIMONIALS[testimonialIdx].name}</p>
          <p className="ac-testi-city">{TESTIMONIALS[testimonialIdx].city}</p>
        </div>
        <div className="ac-dots">
          {TESTIMONIALS.map((_, i) => (
            <div key={i} className={`ac-dot ${i === testimonialIdx ? "active" : ""}`}
              onClick={() => setTestimonialIdx(i)} />
          ))}
        </div>
      </div>

      {/* ── GALLERY ── */}
      <section style={{ padding: "90px 0 0" }}>
        <div className="ac-head">
          <Eyebrow>@aaradhyascreation</Eyebrow>
          <h2>The Editorial Gallery</h2>
        </div>
        <div className="ac-gal-grid">
          {GALLERY.map((_, i) => (
            <Reveal delay={(i % 6) * 70} key={i}>
              <div className="ac-gal-item">
                <img src={galImg(i)} alt="Editorial styling" />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <div className="ac-news">
        <NewsletterOrnament />
        <span className="accent">VIP ACCESS</span>
        <h2>Join Our Private Saree Circle</h2>
        <p className="desc">Unlock early access to bridal and festive collections, private trunk shows, and styling notes — before anyone else.</p>
        {subscribed ? (
          <p style={{ color: "#C8A158", fontFamily: "'Cinzel',serif", fontSize: 13, letterSpacing: "0.08em" }}>
            Welcome to the Circle. Watch your inbox.
          </p>
        ) : (
          <form className="ac-news-form" onSubmit={e => { e.preventDefault(); if (email) setSubscribed(true); }}>
            <input type="email" required placeholder="Your email address"
              value={email} onChange={e => setEmail(e.target.value)} />
            <button type="submit">Subscribe</button>
          </form>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer className="ac-footer">
        <div className="ac-foot-watermark">A</div>
        <div className="ac-foot-grid">
          <div>
            <div className="ac-foot-logo">
              <Logo size={34} />&nbsp;Aaradhya's Creation
            </div>
            <p className="about">A heritage atelier of handwoven sarees — bridal, festive and everyday luxury, crafted with India's finest weavers since 2009.</p>
            <div className="ac-social"><div>IG</div><div>FB</div><div>PIN</div><div><Phone size={13} /></div></div>
          </div>
          <div className="ac-foot-col">
            <h5>Shop</h5>
            {["New Arrivals","Bridal Sarees","Best Sellers","Designer Sarees","Gifting"].map(l => <div key={l}>{l}</div>)}
          </div>
          <div className="ac-foot-col">
            <h5>Collections</h5>
            {collections.slice(0, 5).map(c => (
              <div key={c.id} onClick={() => goCollection(c.id)} style={{ cursor: "pointer" }}>{c.title}</div>
            ))}
          </div>
          <div className="ac-foot-col">
            <h5>Support</h5>
            {["Contact Us","Shipping Info","Returns & Exchanges","FAQs"].map(l => <div key={l}>{l}</div>)}
            <Link to="/login" style={{ display: "block", padding: "6px 0", color: "rgba(251,246,236,0.55)", fontSize: 12 }}>
              Sign In / My Account
            </Link>
          </div>
        </div>
        <div className="ac-foot-bottom">
          <span>© 2026 Aaradhya's Creation. All rights reserved.</span>
          <span>Handcrafted in Surat, India · Shipped worldwide</span>
        </div>
      </footer>
      <CartDrawer />
    </div>
  );
}
