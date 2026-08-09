import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Heart, ShoppingBag } from "lucide-react";
import { Logo, StarRow, Card3D, ZariDivider } from "../components/shared.jsx";
import CartDrawer from "../components/CartDrawer.jsx";
import LazyImage from "../components/LazyImage.jsx";
import { useCart } from "../context/CartContext.jsx";
import { api } from "../api/client.js";
import { img, rupee } from "../data/content.js";
import "../styles/storefront.css";

const BACKEND = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace("/api", "")
  : "http://localhost:5000";
function resolveImg(src, w, h) {
  if (!src) return img("placeholder", w, h);
  if (src.startsWith("/uploads/")) return `${BACKEND}${src}`;
  return img(src, w, h);
}

export default function CollectionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState(new Set());
  const [sort, setSort] = useState("featured");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getCollections(), api.getProducts()])
      .then(([cols, prods]) => {
        const col = cols.find(c => c.id === id);
        if (!col) { navigate("/", { replace: true }); return; }
        setCollection(col);
        const filtered = prods.filter(p => p.collection === id);
        setProducts(filtered);
      })
      .catch(() => navigate("/", { replace: true }))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleWishlist = (pid) => setWishlist(prev => {
    const n = new Set(prev); n.has(pid) ? n.delete(pid) : n.add(pid); return n;
  });

  const sorted = [...products].sort((a, b) => {
    if (sort === "price-asc")  return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "rating")     return (b.rating || 0) - (a.rating || 0);
    // featured: featured first, then by id
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

  return (
    <div className="ac-root" style={{ background: "var(--ivory)", minHeight: "100vh" }}>
      {/* Nav */}
      <nav className={`ac-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="ac-nav-inner">
          <Link to="/" className="ac-logo"><Logo size={34} />Aaradhya's Creation<span>FINE HANDWOVEN SAREES</span></Link>
          <div className="ac-icons">
            <button aria-label="Cart" onClick={() => cart.setIsOpen(true)}>
              <ShoppingBag size={18} />{cart.count > 0 && <span className="ac-badge">{cart.count}</span>}
            </button>
          </div>
        </div>
      </nav>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <div style={{ color: "#8a7a68", fontStyle: "italic" }}>Loading collection…</div>
        </div>
      ) : (
        <>
          {/* Collection Hero Banner */}
          <div className="ac-coll-hero">
            <LazyImage eager src={resolveImg(collection?.seed, 1800, 600)} alt={collection?.title} />
            <div className="ac-coll-hero-overlay">
              <Link to="/" className="ac-coll-back"><ChevronLeft size={16} /> Back to Store</Link>
              <h1>{collection?.title}</h1>
              <p>{collection?.sub}</p>
              <span className="ac-coll-count">{products.length} sarees in this collection</span>
            </div>
          </div>

          <ZariDivider />

          {/* Toolbar */}
          <div className="ac-coll-toolbar">
            <p>{sorted.length} saree{sorted.length !== 1 ? "s" : ""}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label style={{ fontSize: 12, color: "#8a7a68", fontFamily: "'Cinzel',serif", letterSpacing: "0.08em" }}>Sort by</label>
              <select className="ac-sort-select" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          <div className="ac-coll-products">
            {sorted.length === 0 ? (
              <div className="ac-coll-empty">
                <p>No products in this collection yet.</p>
                <Link to="/" className="btn-gold" style={{ display: "inline-block", marginTop: 20 }}>Back to Store</Link>
              </div>
            ) : sorted.map(p => {
              const off = p.mrp ? Math.round(100 - (p.price / p.mrp) * 100) : 0;
              const mainImg = p.images?.length ? resolveImg(p.images[0], 600, 800) : resolveImg(p.seed, 600, 800);
              const hoverImg = p.images?.length > 1 ? resolveImg(p.images[1], 600, 800) : resolveImg((p.seed || "") + "b", 600, 800);
              return (
                <Card3D key={p.id}>
                  <div className="ac-prod-card" onClick={()=>navigate(`/product/${p.id}`)} style={{cursor:"pointer"}}>
                    <div className="ac-prod-imgwrap">
                      {off > 0 && <span className="ac-discount">{off}% OFF</span>}
                      {p.featured && <span className="ac-discount" style={{ left: "auto", right: 10, background: "rgba(76,14,27,0.85)" }}>FEATURED</span>}
                      <button className="ac-wish-btn" onClick={(e)=>{e.stopPropagation();e.preventDefault();toggleWishlist(p.id);}}>
                        <Heart size={15} fill={wishlist.has(p.id) ? "#4C0E1B" : "none"} color="#4C0E1B" />
                      </button>
                      <img className="first"  src={mainImg}  alt={p.name} loading="lazy" decoding="async"/>
                      <img className="second" src={hoverImg} alt={p.name} loading="lazy" decoding="async"/>
                      <div className="ac-quickadd" onClick={(e)=>{e.stopPropagation();e.preventDefault();cart.addItem(p);}}>+ Add to Bag</div>
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
              );
            })}
          </div>
        </>
      )}

      <CartDrawer />
    </div>
  );
}
