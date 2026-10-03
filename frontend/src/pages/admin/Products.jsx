import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Upload, X as XIcon,
  ImageOff, GripVertical, ChevronLeft, ExternalLink,
  CheckSquare, Square, AlertCircle
} from "lucide-react";
import { api } from "../../api/client.js";
import { rupee } from "../../data/content.js";

const BACKEND = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace("/api","")
  : "http://localhost:5000";

function imgUrl(src) {
  if (!src) return null;
  if (src.startsWith("/uploads/")) return `${BACKEND}${src}`;
  return src;
}

const BLANK = {
  name:"", fabric:"", category:"saree", collection:"", price:"", mrp:"", cost:"",
  stock:"", rating:5, sku:"", weight:"", tags:"",
  description:"", seoTitle:"", seoDesc:"",
  active:true, featured:false, images:[],
  // Profit calculator inputs (all optional, % or ₹)
  packagingCost:"", shippingCost:"",
  paymentGatewayPct:"2.36", platformFeePct:"0",
  gstPct:"5", gstInclusive:true, hsnCode:"", returnRatePct:"3", marketingPct:"0"
};

/** Computes a full profit breakdown from a product form's pricing fields. */
function computeProfit(f) {
  const price   = Number(f.price)   || 0;
  const cost    = Number(f.cost)    || 0;
  const pack    = Number(f.packagingCost) || 0;
  const ship    = Number(f.shippingCost)  || 0;
  const pgPct   = Number(f.paymentGatewayPct) || 0;
  const platPct = Number(f.platformFeePct)    || 0;
  const gstPct  = Number(f.gstPct)            || 0;
  const retPct  = Number(f.returnRatePct)     || 0;
  const mktPct  = Number(f.marketingPct)      || 0;

  const paymentGatewayFee = price * (pgPct  / 100);
  const platformFee       = price * (platPct/ 100);
  // FIXED: correctly back-calculate GST when the price is GST-inclusive.
  // The old flat-percentage formula overstated GST by taxing the tax-inclusive
  // price instead of the taxable base. This now matches the backend's real
  // order-based calculation (services/profitCalculator.js) and the invoice.
  const gstInclusive = f.gstInclusive !== false;
  const gst = gstInclusive ? price - (price / (1 + gstPct / 100)) : price * (gstPct / 100);
  const marketingCost     = price * (mktPct / 100);
  const returnLossReserve = price * (retPct / 100);

  const totalDeductions = cost + pack + ship + paymentGatewayFee + platformFee + gst + marketingCost + returnLossReserve;
  const netProfit = price - totalDeductions;
  const netMarginPct = price > 0 ? (netProfit / price) * 100 : 0;

  return {
    price, cost, pack, ship, paymentGatewayFee, platformFee, gst,
    marketingCost, returnLossReserve, totalDeductions, netProfit, netMarginPct
  };
}

const STATUS_OPTIONS = ["All","Active","Draft","Featured","Low Stock","Out of Stock"];

/* ── Drag-drop image strip ── */
function ImageStrip({ images, onReorder, onRemove, uploading, onUpload }) {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const fileRef = useRef(null);

  const handleDrop = (e, i) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return; }
    const arr = [...images];
    const [moved] = arr.splice(dragIdx, 1);
    arr.splice(i, 0, moved);
    onReorder(arr);
    setDragIdx(null); setOverIdx(null);
  };

  return (
    <div className="sfy-img-strip">
      {images.map((src, i) => (
        <div key={src+i}
          className={`sfy-img-thumb ${i===0?"main":""} ${overIdx===i?"drag-over":""}`}
          draggable
          onDragStart={() => setDragIdx(i)}
          onDragOver={e => { e.preventDefault(); setOverIdx(i); }}
          onDrop={e => handleDrop(e, i)}
          onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}>
          <img src={imgUrl(src)} alt={`view ${i+1}`}/>
          {i===0 && <span className="sfy-main-badge">Main</span>}
          <div className="sfy-img-actions">
            <GripVertical size={12} color="#fff"/>
            <button className="sfy-img-del" onClick={() => onRemove(i)}><XIcon size={11}/></button>
          </div>
        </div>
      ))}
      <div className={`sfy-img-upload-tile ${uploading?"loading":""}`}
        onClick={() => !uploading && fileRef.current?.click()}>
        {uploading ? <div className="sfy-spinner"/> : <><Upload size={20} color="#8a7a68"/><span>Add photos</span></>}
        <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}}
          onChange={e => onUpload(e.target.files)}/>
      </div>
    </div>
  );
}

/* ── SEO preview ── */
function SeoPreview({ title, desc, name }) {
  const t = title || name || "Product Name";
  const d = desc || "Discover this exquisite handwoven saree at Aaradhya's Creation.";
  return (
    <div className="sfy-seo-preview">
      <p className="sfy-seo-label">Google search preview</p>
      <div className="sfy-seo-box">
        <p className="sfy-seo-url">aaradhyascreation.com › products</p>
        <p className="sfy-seo-title">{t.slice(0,60)}{t.length>60?"…":""}</p>
        <p className="sfy-seo-desc">{d.slice(0,160)}{d.length>160?"…":""}</p>
      </div>
    </div>
  );
}

export default function Products() {
  const [products,     setProducts]     = useState([]);
  const [collections,  setCollections]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [view,         setView]         = useState("list");
  const [editing,      setEditing]      = useState(null);
  const [form,         setForm]         = useState(BLANK);
  const [saving,       setSaving]       = useState(false);
  const [saveMsg,      setSaveMsg]      = useState(null);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [collFilter,   setCollFilter]   = useState("all");
  const [selected,     setSelected]     = useState(new Set());
  const [uploading,    setUploading]    = useState(false);
  const [deleteId,     setDeleteId]     = useState(null);
  const [bulkAction,   setBulkAction]   = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.getProducts(true), api.getCollections(true)])
      .then(([p,c]) => { setProducts(p); setCollections(c); })
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const up = k => e => setForm(f => ({
    ...f, [k]: e.target.type==="checkbox" ? e.target.checked : e.target.value
  }));

  const openNew = () => {
    setEditing(null); setForm(BLANK); setError(null); setSaveMsg(null); setView("editor");
  };
  const openEdit = p => {
    setEditing(p);
    setForm({
      ...BLANK, ...p,
      price: p.price||"", mrp: p.mrp||"", cost: p.cost||"",
      stock: p.stock||"", sku: p.sku||"", weight: p.weight||"",
      tags: Array.isArray(p.tags) ? p.tags.join(", ") : (p.tags||""),
      description: p.description||"", seoTitle: p.seoTitle||"", seoDesc: p.seoDesc||"",
      images: p.images||[]
    });
    setError(null); setSaveMsg(null); setView("editor");
  };

  const handleImageUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const { urls } = await api.uploadProductImages(files);
      setForm(f => ({ ...f, images: [...f.images, ...urls] }));
    } catch(e) { setError("Upload failed: " + e.message); }
    finally { setUploading(false); }
  };

  const handleSave = async (andBack=false) => {
    if (!form.name.trim()) { setError("Product name is required."); return; }
    if (!form.price || Number(form.price) <= 0) { setError("A valid selling price is required."); return; }
    setSaving(true); setError(null);
    try {
      const payload = {
        ...form,
        price:  Number(form.price),
        mrp:    Number(form.mrp)||0,
        cost:   Number(form.cost)||0,
        stock:  Number(form.stock)||0,
        rating: Number(form.rating)||5,
        weight: Number(form.weight)||0,
        tags:   form.tags.split(",").map(t=>t.trim()).filter(Boolean),
      };
      const saved = editing
        ? await api.updateProduct(editing.id, payload)
        : await api.createProduct(payload);
      setSaveMsg("Saved!"); setTimeout(()=>setSaveMsg(null),2000);
      if (!editing) { setEditing(saved); setForm(f=>({...f,...saved})); }
      load();
      if (andBack) setView("list");
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleReorder = async (newImages) => {
    setForm(f => ({ ...f, images: newImages }));
    if (editing?.id) {
      await api.reorderProductImages(editing.id, newImages).catch(()=>{});
      load();
    }
  };

  const toggleActive = async p => { await api.updateProduct(p.id,{active:!p.active}); load(); };
  const handleDelete = async id => {
    await api.deleteProduct(id);
    setDeleteId(null);
    if (view==="editor") setView("list");
    load();
  };

  const handleBulk = async () => {
    if (!bulkAction || selected.size===0) return;
    await api.bulkProducts([...selected].map(String), bulkAction);
    setSelected(new Set()); setBulkAction(""); load();
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) ||
      (p.sku||"").toLowerCase().includes(q) ||
      (Array.isArray(p.tags)?p.tags:[]).some(t=>t.toLowerCase().includes(q));
    const matchC = collFilter==="all" || p.collection===collFilter;
    let matchS = true;
    if (statusFilter==="Active")       matchS = p.active && p.stock>0;
    if (statusFilter==="Draft")        matchS = !p.active;
    if (statusFilter==="Featured")     matchS = p.featured;
    if (statusFilter==="Low Stock")    matchS = p.stock>0 && p.stock<=5;
    if (statusFilter==="Out of Stock") matchS = p.stock===0;
    return matchQ && matchC && matchS;
  });

  const allSelected = filtered.length>0 && filtered.every(p=>selected.has(String(p.id)));
  const toggleAll = () => allSelected
    ? setSelected(new Set())
    : setSelected(new Set(filtered.map(p=>String(p.id))));
  const toggleOne = id => {
    const s = new Set(selected);
    s.has(String(id)) ? s.delete(String(id)) : s.add(String(id));
    setSelected(s);
  };

  /* ══ EDITOR VIEW ══════════════════════════════════ */
  if (view==="editor") return (
    <div className="sfy-editor">
      <div className="sfy-editor-header">
        <div className="sfy-editor-header-left">
          <button className="sfy-back-btn" onClick={()=>setView("list")}>
            <ChevronLeft size={16}/>Products
          </button>
          <h1>{editing ? editing.name : "Add product"}</h1>
          {editing && (
            <a href={`/product/${editing.id}`} target="_blank" rel="noopener noreferrer" className="sfy-view-link">
              View on store <ExternalLink size={12}/>
            </a>
          )}
        </div>
        <div className="sfy-editor-header-right">
          {editing && (
            <button className="adm-btn adm-btn-ghost" onClick={()=>setDeleteId(editing.id)}>
              <Trash2 size={14}/>Delete
            </button>
          )}
          <button className="adm-btn adm-btn-ghost" onClick={()=>handleSave(false)} disabled={saving||uploading}>
            {saving ? "Saving…" : saveMsg || "Save"}
          </button>
          <button className="adm-btn adm-btn-gold" onClick={()=>handleSave(true)} disabled={saving||uploading}>
            Save &amp; go back
          </button>
        </div>
      </div>

      {error && <div className="sfy-error-bar"><AlertCircle size={15}/>{error}</div>}

      <div className="sfy-editor-body">
        {/* ── LEFT COLUMN ── */}
        <div className="sfy-editor-left">

          {/* Title + description */}
          <div className="sfy-card">
            <div className="sfy-card-body">
              <div className="sfy-field">
                <label>Product Name *</label>
                <input value={form.name} onChange={up("name")} placeholder="e.g. Meherunisa Banarasi"/>
              </div>
              <div className="sfy-field" style={{marginTop:14}}>
                <label>Description</label>
                <textarea rows={5} value={form.description} onChange={up("description")}
                  placeholder="Tell the story of this saree — the weave, the tradition, the occasion it was made for…"/>
              </div>
            </div>
          </div>

          {/* Photos with drag-drop */}
          <div className="sfy-card">
            <div className="sfy-card-head">
              <h3>Photos</h3>
              <span className="sfy-card-hint">Drag to reorder · first photo is the main image</span>
            </div>
            <div className="sfy-card-body">
              <ImageStrip
                images={form.images}
                onReorder={handleReorder}
                onRemove={i=>setForm(f=>({...f,images:f.images.filter((_,j)=>j!==i)}))}
                uploading={uploading}
                onUpload={handleImageUpload}
              />
              {form.images.length===0 && (
                <p className="sfy-hint-text" style={{marginTop:10}}>
                  Upload real saree photos. JPG/PNG/WebP, up to 10 MB each, up to 5 at a time.
                </p>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="sfy-card">
            <div className="sfy-card-head"><h3>Pricing</h3></div>
            <div className="sfy-card-body">
              <div className="sfy-field-row">
                <div className="sfy-field">
                  <label>Selling Price (₹) *</label>
                  <input type="number" value={form.price} onChange={up("price")} placeholder="42500"/>
                </div>
                <div className="sfy-field">
                  <label>MRP / Compare-at (₹)</label>
                  <input type="number" value={form.mrp} onChange={up("mrp")} placeholder="52000"/>
                  <span className="sfy-hint">Shows as crossed-out price</span>
                </div>
                <div className="sfy-field">
                  <label>Product Cost (₹)</label>
                  <input type="number" value={form.cost} onChange={up("cost")} placeholder="28000"/>
                  <span className="sfy-hint">Fabric, weaving, artisan cost</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profit & Deductions Calculator */}
          <div className="sfy-card">
            <div className="sfy-card-head">
              <h3>Profit Calculator</h3>
              <span className="sfy-card-hint">Every deduction, then your real take-home</span>
            </div>
            <div className="sfy-card-body">
              <div className="sfy-field-row">
                <div className="sfy-field">
                  <label>Packaging (₹)</label>
                  <input type="number" value={form.packagingCost} onChange={up("packagingCost")} placeholder="150"/>
                </div>
                <div className="sfy-field">
                  <label>Shipping cost (₹)</label>
                  <input type="number" value={form.shippingCost} onChange={up("shippingCost")} placeholder="199"/>
                </div>
                <div className="sfy-field">
                  <label>Payment gateway (%)</label>
                  <input type="number" step="0.01" value={form.paymentGatewayPct} onChange={up("paymentGatewayPct")} placeholder="2.36"/>
                  <span className="sfy-hint">Razorpay ≈ 2%–2.36%</span>
                </div>
              </div>
              <div className="sfy-field-row" style={{marginTop:14}}>
                <div className="sfy-field">
                  <label>Marketplace / platform fee (%)</label>
                  <input type="number" step="0.1" value={form.platformFeePct} onChange={up("platformFeePct")} placeholder="0"/>
                  <span className="sfy-hint">0 for your own site</span>
                </div>
                <div className="sfy-field">
                  <label>GST (%)</label>
                  <input type="number" step="0.1" value={form.gstPct} onChange={up("gstPct")} placeholder="5"/>
                  <span className="sfy-hint">5% on textiles in India</span>
                </div>
                <div className="sfy-field">
                  <label>GST Pricing</label>
                  <select value={form.gstInclusive !== false ? "inclusive" : "exclusive"} onChange={e=>setForm(f=>({...f,gstInclusive:e.target.value==="inclusive"}))}>
                    <option value="inclusive">Inclusive (price includes GST)</option>
                    <option value="exclusive">Exclusive (GST added on top)</option>
                  </select>
                  <span className="sfy-hint">Match your Settings → GST setting</span>
                </div>
                <div className="sfy-field">
                  <label>HSN/SAC Code</label>
                  <input value={form.hsnCode || ""} onChange={up("hsnCode")} placeholder="5407 (blank = store default)"/>
                </div>
                <div className="sfy-field">
                  <label>Returns / RTO reserve (%)</label>
                  <input type="number" step="0.1" value={form.returnRatePct} onChange={up("returnRatePct")} placeholder="3"/>
                  <span className="sfy-hint">Amortised return risk</span>
                </div>
              </div>
              <div className="sfy-field" style={{marginTop:14, maxWidth:260}}>
                <label>Marketing / ad spend allocation (%)</label>
                <input type="number" step="0.1" value={form.marketingPct} onChange={up("marketingPct")} placeholder="0"/>
                <span className="sfy-hint">Share of ad spend per sale</span>
              </div>

              {form.price && Number(form.price) > 0 && (() => {
                const p = computeProfit(form);
                const rows = [
                  ["Selling price",            p.price,              false],
                  ["– Product cost",           -p.cost,               true],
                  ["– Packaging",              -p.pack,               true],
                  ["– Shipping",               -p.ship,               true],
                  ["– Payment gateway fee",    -p.paymentGatewayFee,  true],
                  ["– Platform fee",           -p.platformFee,        true],
                  ["– GST",                    -p.gst,                true],
                  ["– Marketing allocation",   -p.marketingCost,      true],
                  ["– Returns/RTO reserve",    -p.returnLossReserve,  true],
                ];
                return (
                  <div className="sfy-profit-box">
                    <table className="sfy-profit-table">
                      <tbody>
                        {rows.map(([label, val, isDeduction]) => (
                          <tr key={label}>
                            <td>{label}</td>
                            <td style={{color: isDeduction ? "var(--adm-danger)" : "var(--adm-text)"}}>
                              {isDeduction ? "−" : ""}₹{Math.abs(val).toLocaleString("en-IN",{maximumFractionDigits:0})}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className={`sfy-net-profit ${p.netProfit>=0?"positive":"negative"}`}>
                      <span>Net Profit per Sale</span>
                      <strong>₹{p.netProfit.toLocaleString("en-IN",{maximumFractionDigits:0})}</strong>
                      <span className="sfy-net-margin">{p.netMarginPct.toFixed(1)}% margin</span>
                    </div>
                    {form.stock && Number(form.stock)>0 && (
                      <p className="sfy-hint" style={{marginTop:8}}>
                        If all {form.stock} units sell: <strong style={{color:"var(--adm-text)"}}>₹{(p.netProfit*Number(form.stock)).toLocaleString("en-IN",{maximumFractionDigits:0})}</strong> total profit
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Inventory */}
          <div className="sfy-card">
            <div className="sfy-card-head"><h3>Inventory</h3></div>
            <div className="sfy-card-body">
              <div className="sfy-field-row">
                <div className="sfy-field">
                  <label>SKU (Stock Keeping Unit)</label>
                  <input value={form.sku} onChange={up("sku")} placeholder="AC-BAN-001"/>
                </div>
                <div className="sfy-field">
                  <label>Available Stock</label>
                  <input type="number" value={form.stock} onChange={up("stock")} placeholder="8"/>
                </div>
                <div className="sfy-field">
                  <label>Weight (kg) for shipping</label>
                  <input type="number" step="0.1" value={form.weight} onChange={up("weight")} placeholder="0.5"/>
                </div>
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="sfy-card">
            <div className="sfy-card-head"><h3>Search Engine Optimisation</h3></div>
            <div className="sfy-card-body">
              <div className="sfy-field" style={{marginBottom:12}}>
                <label>Page Title <span className="sfy-hint" style={{marginLeft:4}}>{(form.seoTitle||form.name||"").length}/60</span></label>
                <input value={form.seoTitle} onChange={up("seoTitle")} maxLength={60}
                  placeholder={form.name || "Product name — Aaradhya's Creation"}/>
              </div>
              <div className="sfy-field" style={{marginBottom:14}}>
                <label>Meta Description <span className="sfy-hint" style={{marginLeft:4}}>{(form.seoDesc||"").length}/160</span></label>
                <textarea rows={3} value={form.seoDesc} onChange={up("seoDesc")} maxLength={160}
                  placeholder="A brief description for Google search results…"/>
              </div>
              <SeoPreview title={form.seoTitle} desc={form.seoDesc} name={form.name}/>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="sfy-editor-right">

          {/* Status */}
          <div className="sfy-card">
            <div className="sfy-card-head"><h3>Status</h3></div>
            <div className="sfy-card-body">
              <div className="sfy-field" style={{marginBottom:12}}>
                <select value={form.active?"active":"draft"}
                  onChange={e=>setForm(f=>({...f,active:e.target.value==="active"}))}>
                  <option value="active">🟢 Active — visible on store</option>
                  <option value="draft">⚪ Draft — hidden from customers</option>
                </select>
              </div>
              <label className="sfy-check-label">
                <input type="checkbox" checked={!!form.featured} onChange={up("featured")}/>
                ⭐ Featured (shown in New Arrivals &amp; hero section)
              </label>
            </div>
          </div>

          {/* Organisation */}
          <div className="sfy-card">
            <div className="sfy-card-head"><h3>Organisation</h3></div>
            <div className="sfy-card-body">
              <div className="sfy-field" style={{marginBottom:12}}>
                <label>Product Category *</label>
                <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value,collection:""}))}>
                  <option value="saree">Saree</option>
                  <option value="kurti">Kurti</option>
                </select>
              </div>
              <div className="sfy-field" style={{marginBottom:12}}>
                <label>Collection</label>
                <select value={form.collection} onChange={up("collection")}>
                  <option value="">— No collection —</option>
                  {collections.filter(c=>!c.category||c.category===form.category).map(c=><option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="sfy-field" style={{marginBottom:12}}>
                <label>Fabric / Material</label>
                <input value={form.fabric} onChange={up("fabric")} placeholder="Pure Katan Silk"/>
              </div>
              <div className="sfy-field">
                <label>Tags</label>
                <input value={form.tags} onChange={up("tags")} placeholder="bridal, red, zari, wedding"/>
                <span className="sfy-hint">Comma-separated. Used in search &amp; filtering.</span>
              </div>
            </div>
          </div>

          {/* Display rating */}
          <div className="sfy-card">
            <div className="sfy-card-head"><h3>Display Rating</h3></div>
            <div className="sfy-card-body">
              <div className="sfy-field">
                <label>Rating (1.0 – 5.0)</label>
                <input type="number" step="0.1" min="1" max="5" value={form.rating} onChange={up("rating")}/>
                <span className="sfy-hint">Auto-updated when real reviews are submitted</span>
              </div>
            </div>
          </div>

          {/* Live photo preview */}
          {form.images.length>0 && (
            <div className="sfy-card" style={{overflow:"hidden"}}>
              <div className="sfy-card-head"><h3>Main Photo</h3></div>
              <img src={imgUrl(form.images[0])} alt="main"
                style={{width:"100%",aspectRatio:"3/4",objectFit:"cover",display:"block"}}/>
            </div>
          )}
        </div>
      </div>

      {deleteId && (
        <div className="adm-modal-overlay" onClick={()=>setDeleteId(null)}>
          <div className="adm-modal adm-modal-sm" onClick={e=>e.stopPropagation()}>
            <h3>Delete this product?</h3>
            <p>This cannot be undone. All data will be permanently removed.</p>
            <div className="adm-modal-foot" style={{marginTop:20}}>
              <button className="adm-btn adm-btn-ghost" onClick={()=>setDeleteId(null)}>Cancel</button>
              <button className="adm-btn adm-btn-danger" onClick={()=>handleDelete(deleteId)}>Delete product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /* ══ LIST VIEW ══════════════════════════════════ */
  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1>Products</h1>
          <p>{products.length} total · {products.filter(p=>p.active).length} active · {products.filter(p=>!p.active).length} draft</p>
        </div>
        <button className="adm-btn adm-btn-gold" onClick={openNew}><Plus size={14}/>Add product</button>
      </div>

      {/* Status tabs */}
      <div className="sfy-filter-bar">
        <div className="sfy-status-tabs">
          {STATUS_OPTIONS.map(s=>(
            <button key={s} className={`sfy-status-tab ${statusFilter===s?"active":""}`}
              onClick={()=>setStatusFilter(s)}>{s}</button>
          ))}
        </div>
        <div className="adm-filters" style={{marginBottom:0}}>
          <input className="adm-search" placeholder="Search products, SKU, tags…"
            value={search} onChange={e=>setSearch(e.target.value)}/>
          <select className="adm-select" value={collFilter} onChange={e=>setCollFilter(e.target.value)}>
            <option value="all">All collections</option>
            {collections.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size>0 && (
        <div className="sfy-bulk-bar">
          <span>{selected.size} product{selected.size!==1?"s":""} selected</span>
          <select className="adm-select" value={bulkAction} onChange={e=>setBulkAction(e.target.value)}>
            <option value="">Bulk actions…</option>
            <option value="activate">Set active</option>
            <option value="deactivate">Set draft</option>
            <option value="feature">Mark featured</option>
            <option value="unfeature">Remove featured</option>
            <option value="delete">Delete selected</option>
          </select>
          <button className="adm-btn adm-btn-ghost" onClick={handleBulk} disabled={!bulkAction}>Apply</button>
          <button className="adm-btn adm-btn-ghost" onClick={()=>setSelected(new Set())}>Deselect all</button>
        </div>
      )}

      {loading ? <div className="adm-loading">Loading products…</div> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th style={{width:40}}>
                  <div onClick={toggleAll} style={{cursor:"pointer",display:"flex",alignItems:"center"}}>
                    {allSelected
                      ? <CheckSquare size={15} color="var(--adm-gold)"/>
                      : <Square size={15} color="#c4c9cd"/>}
                  </div>
                </th>
                <th>Product</th><th>Status</th><th>Collection</th>
                <th>Price</th><th>Stock</th><th>Rating</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 && (
                <tr><td colSpan={8} style={{textAlign:"center",padding:40,color:"var(--adm-muted)"}}>
                  No products match your filters.
                </td></tr>
              )}
              {filtered.map(p => {
                const mainImg = p.images?.[0] ? imgUrl(p.images[0]) : null;
                const isChecked = selected.has(String(p.id));
                return (
                  <tr key={p.id} onClick={()=>openEdit(p)} style={{cursor:"pointer"}}>
                    <td onClick={e=>{e.stopPropagation();toggleOne(p.id)}} style={{cursor:"default"}}>
                      {isChecked
                        ? <CheckSquare size={15} color="var(--adm-gold)"/>
                        : <Square size={15} color="#c4c9cd"/>}
                    </td>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        <div style={{width:44,height:58,borderRadius:5,overflow:"hidden",background:"#f1f2f4",flexShrink:0,border:"1px solid var(--adm-border)"}}>
                          {mainImg
                            ? <img src={mainImg} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                            : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><ImageOff size={16} color="#c4c9cd"/></div>}
                        </div>
                        <div>
                          <p style={{fontWeight:600,margin:"0 0 2px",fontSize:13.5}}>{p.name}</p>
                          <p style={{margin:0,fontSize:11.5,color:"var(--adm-muted)"}}>{p.fabric}{p.sku?` · SKU: ${p.sku}`:""}</p>
                          {Array.isArray(p.tags) && p.tags.length>0 && (
                            <div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap"}}>
                              {p.tags.slice(0,3).map(t=>(
                                <span key={t} style={{fontSize:10,background:"#f1f2f4",padding:"1px 7px",borderRadius:100,color:"#6d7175"}}>{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`adm-badge ${p.active?"active-badge":"inactive-badge"}`}>
                        {p.active?"Active":"Draft"}
                      </span>
                      {p.featured && <span className="adm-badge" style={{background:"#fff5e3",color:"#b98900",marginLeft:4}}>⭐ Featured</span>}
                    </td>
                    <td style={{fontSize:12.5,color:"var(--adm-muted)"}}>{collections.find(c=>c.id===p.collection)?.title||"—"}</td>
                    <td>
                      <p style={{fontWeight:700,margin:0,fontSize:14}}>{rupee(p.price)}</p>
                      {p.mrp>p.price && <p style={{margin:0,fontSize:11,color:"var(--adm-muted)",textDecoration:"line-through"}}>{rupee(p.mrp)}</p>}
                    </td>
                    <td>
                      <span style={{fontWeight:600,color:p.stock===0?"var(--adm-danger)":p.stock<=5?"var(--adm-warn)":"var(--adm-success)"}}>
                        {p.stock===0 ? "Out of stock" : `${p.stock} in stock`}
                      </span>
                    </td>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:3}}>
                        <span style={{color:"#b98900",fontSize:13}}>★</span>
                        <span style={{fontSize:13,fontWeight:600}}>{p.rating||5}</span>
                      </div>
                    </td>
                    <td onClick={e=>e.stopPropagation()}>
                      <div style={{display:"flex",gap:6}}>
                        <button className="adm-icon-btn" title="Edit" onClick={()=>openEdit(p)}><Edit2 size={13}/></button>
                        <button className="adm-icon-btn" title={p.active?"Set draft":"Activate"} onClick={()=>toggleActive(p)}>
                          {p.active?<EyeOff size={13}/>:<Eye size={13}/>}
                        </button>
                        <button className="adm-icon-btn danger" title="Delete" onClick={()=>setDeleteId(p.id)}><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {deleteId && (
        <div className="adm-modal-overlay" onClick={()=>setDeleteId(null)}>
          <div className="adm-modal adm-modal-sm" onClick={e=>e.stopPropagation()}>
            <h3>Delete product?</h3>
            <p>This cannot be undone.</p>
            <div className="adm-modal-foot" style={{marginTop:20}}>
              <button className="adm-btn adm-btn-ghost" onClick={()=>setDeleteId(null)}>Cancel</button>
              <button className="adm-btn adm-btn-danger" onClick={()=>handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
