import React, { useEffect, useRef, useState } from "react";
import { api } from "../../api/client.js";
import { rupee, OCCASIONS, FABRICS } from "../../data/content.js";
import { Upload, X as XIcon, Plus, Trash2, Edit2, ExternalLink, TrendingUp, Eye, MousePointer, ShoppingCart } from "lucide-react";

const BACKEND = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace("/api","")
  : "http://localhost:5000";

function resolveUrl(src) {
  if (!src) return null;
  if (src.startsWith("http")) return src;
  if (src.startsWith("/uploads/")) return `${BACKEND}${src}`;
  return src;
}

// ── Customers ────────────────────────────────────────────────
export function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  useEffect(()=>{ api.getCustomers().then(setCustomers).finally(()=>setLoading(false)); },[]);
  const visible = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.city||"").toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="adm-page">
      <div className="adm-page-head"><div><h1>Customers</h1><p>{customers.length} total</p></div></div>
      <div className="adm-filters">
        <input className="adm-search" placeholder="Search by name, email or city…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>
      {loading ? <div className="adm-loading">Loading…</div> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Name</th><th>Email</th><th>City</th><th>Orders</th><th>Total Spent</th><th>Last Order</th></tr></thead>
            <tbody>
              {visible.length===0&&<tr><td colSpan={6} style={{textAlign:"center",padding:28,color:"var(--adm-muted)"}}>No customers yet.</td></tr>}
              {visible.map(c=>(
                <tr key={c.id}>
                  <td style={{fontWeight:500}}>{c.name}</td>
                  <td style={{fontSize:12}}>{c.email}</td>
                  <td>{c.city||"—"}</td>
                  <td>{c.orders}</td>
                  <td style={{fontWeight:700}}>{rupee(c.spent)}</td>
                  <td style={{fontSize:11,color:"var(--adm-muted)"}}>{c.lastOrder?new Date(c.lastOrder).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Discounts ─────────────────────────────────────────────────
const BLANK_D = { code:"",type:"percentage",value:"",maxUses:"",expires:"",active:true };
export function Discounts() {
  const [discounts,setDiscounts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showModal,setShowModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState(BLANK_D);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState(null);
  const [deleteId,setDeleteId]=useState(null);
  const load=()=>{setLoading(true);api.getDiscounts().then(setDiscounts).finally(()=>setLoading(false));};
  useEffect(load,[]);
  const openNew=()=>{setEditing(null);setForm(BLANK_D);setError(null);setShowModal(true);};
  const openEdit=d=>{setEditing(d);setForm({...d,maxUses:d.maxUses??""});setError(null);setShowModal(true);};
  const up=k=>e=>setForm(f=>({...f,[k]:e.target.type==="checkbox"?e.target.checked:e.target.value}));
  const handleSave=async()=>{
    if(!form.code||!form.value){setError("Code and value required.");return;}
    setSaving(true);setError(null);
    try{
      const p={...form,value:Number(form.value),maxUses:form.maxUses===""?null:Number(form.maxUses),expires:form.expires||null};
      if(editing)await api.updateDiscount(editing.id,p);else await api.createDiscount(p);
      setShowModal(false);load();
    }catch(e){setError(e.message);}finally{setSaving(false);}
  };
  const toggleActive=async d=>{await api.updateDiscount(d.id,{active:!d.active});load();};
  const handleDelete=async id=>{await api.deleteDiscount(id);setDeleteId(null);load();};
  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div><h1>Discounts &amp; Coupons</h1><p>{discounts.length} total</p></div>
        <button className="adm-btn adm-btn-gold" onClick={openNew}><Plus size={14}/>New coupon</button>
      </div>
      {loading?<div className="adm-loading">Loading…</div>:(
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Uses</th><th>Expires</th><th>Active</th><th>Actions</th></tr></thead>
            <tbody>
              {discounts.map(d=>(
                <tr key={d.id}>
                  <td><code className="adm-code">{d.code}</code></td>
                  <td>{d.type}</td>
                  <td>{d.type==="percentage"?`${d.value}%`:rupee(d.value)}</td>
                  <td>{d.uses}{d.maxUses?` / ${d.maxUses}`:""}</td>
                  <td style={{fontSize:12}}>{d.expires?new Date(d.expires).toLocaleDateString("en-IN"):"No expiry"}</td>
                  <td><div className={`adm-toggle ${d.active?"on":""}`} onClick={()=>toggleActive(d)}><div className="adm-toggle-knob"/></div></td>
                  <td><div style={{display:"flex",gap:8}}><button className="adm-icon-btn" onClick={()=>openEdit(d)}><Edit2 size={13}/></button><button className="adm-icon-btn danger" onClick={()=>setDeleteId(d.id)}><Trash2 size={13}/></button></div></td>
                </tr>
              ))}
              {discounts.length===0&&<tr><td colSpan={7} style={{textAlign:"center",padding:28,color:"var(--adm-muted)"}}>No coupons yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {showModal&&(
        <div className="adm-modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="adm-modal" onClick={e=>e.stopPropagation()}>
            <div className="adm-modal-head"><h3>{editing?"Edit Coupon":"New Coupon"}</h3><button className="adm-close-btn" onClick={()=>setShowModal(false)}>✕</button></div>
            {error&&<div className="adm-form-error">{error}</div>}
            <div className="adm-form-grid">
              <div className="adm-field"><label>Code *</label><input value={form.code} onChange={up("code")} placeholder="BRIDAL25" style={{textTransform:"uppercase"}}/></div>
              <div className="adm-field"><label>Type</label><select value={form.type} onChange={up("type")}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed (₹)</option></select></div>
              <div className="adm-field"><label>Value *</label><input type="number" value={form.value} onChange={up("value")} placeholder={form.type==="percentage"?"15":"500"}/></div>
              <div className="adm-field"><label>Max Uses (blank=unlimited)</label><input type="number" value={form.maxUses} onChange={up("maxUses")} placeholder="100"/></div>
              <div className="adm-field"><label>Expiry Date</label><input type="date" value={form.expires||""} onChange={up("expires")}/></div>
              <div className="adm-field adm-checkbox-field"><label><input type="checkbox" checked={!!form.active} onChange={up("active")}/> Active</label></div>
            </div>
            <div className="adm-modal-foot">
              <button className="adm-btn adm-btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="adm-btn adm-btn-gold" onClick={handleSave} disabled={saving}>{saving?"Saving…":"Save"}</button>
            </div>
          </div>
        </div>
      )}
      {deleteId&&(
        <div className="adm-modal-overlay" onClick={()=>setDeleteId(null)}>
          <div className="adm-modal adm-modal-sm" onClick={e=>e.stopPropagation()}>
            <h3>Delete coupon?</h3>
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

// ── Banners ───────────────────────────────────────────────────
export function Banners() {
  const [banners,setBanners]=useState([]);
  const [loading,setLoading]=useState(true);
  const [uploading,setUploading]=useState(false);
  const [label,setLabel]=useState("");
  const [file,setFile]=useState(null);
  const [error,setError]=useState(null);
  const load=()=>{setLoading(true);api.getBanners().then(setBanners).finally(()=>setLoading(false));};
  useEffect(load,[]);
  const handleUpload=async()=>{
    if(!file){setError("Select an image file.");return;}
    setUploading(true);setError(null);
    try{await api.uploadBanner(label||"Banner",file);setLabel("");setFile(null);load();}
    catch(e){setError(e.message);}finally{setUploading(false);}
  };
  return (
    <div className="adm-page">
      <div className="adm-page-head"><div><h1>Banners &amp; Media</h1><p>Upload hero images and promotional banners.</p></div></div>
      <div className="adm-upload-box">
        <h3>Upload New Banner</h3>
        {error&&<div className="adm-form-error">{error}</div>}
        <div className="adm-form-grid">
          <div className="adm-field"><label>Label</label><input value={label} onChange={e=>setLabel(e.target.value)} placeholder="Summer Edit Hero"/></div>
          <div className="adm-field"><label>Image File (max 8 MB)</label><input type="file" accept="image/*" onChange={e=>setFile(e.target.files[0])}/></div>
        </div>
        <button className="adm-btn adm-btn-gold" style={{marginTop:12}} onClick={handleUpload} disabled={uploading}>{uploading?"Uploading…":"Upload Banner"}</button>
      </div>
      {loading?<div className="adm-loading">Loading…</div>:(
        <div className="adm-banner-grid">
          {banners.length===0&&<p className="adm-empty">No banners uploaded yet.</p>}
          {banners.map(b=>(
            <div className="adm-banner-card" key={b.id}>
              <img src={`${BACKEND}${b.url}`} alt={b.label}/>
              <div className="adm-banner-foot"><span>{b.label}</span><button className="adm-icon-btn danger" onClick={async()=>{await api.deleteBanner(b.id);load();}}><Trash2 size={13}/></button></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Reviews ───────────────────────────────────────────────────
export function Reviews() {
  const [reviews,setReviews]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const load=()=>{setLoading(true);api.getAllReviews().then(setReviews).finally(()=>setLoading(false));};
  useEffect(load,[]);
  const handleDelete=async id=>{if(!confirm("Delete this review?"))return;await api.deleteReview(id);load();};
  const handleVerify=async id=>{await api.verifyReview(id);load();};
  const avg=reviews.length?(reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1):"—";
  const visible=reviews.filter(r=>r.name.toLowerCase().includes(search.toLowerCase())||(r.text||"").toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="adm-page">
      <div className="adm-page-head"><div><h1>Customer Reviews</h1><p>{reviews.length} total · avg {avg}★ · {reviews.filter(r=>r.verified).length} verified</p></div></div>
      <div className="adm-filters"><input className="adm-search" placeholder="Search by name or text…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
      {loading?<div className="adm-loading">Loading…</div>:(
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Product</th><th>Customer</th><th>Rating</th><th>Review</th><th>Verified</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {visible.length===0&&<tr><td colSpan={7} style={{textAlign:"center",padding:28,color:"var(--adm-muted)"}}>No reviews found.</td></tr>}
              {visible.map(r=>(
                <tr key={r.id}>
                  <td><span style={{fontFamily:"monospace",fontSize:11,color:"var(--adm-info)"}}>#{r.productId}</span></td>
                  <td><strong>{r.name}</strong>{r.city&&<><br/><span style={{fontSize:11,color:"var(--adm-muted)"}}>📍 {r.city}</span></>}</td>
                  <td><div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(i=><span key={i} style={{color:i<=r.rating?"#b98900":"#e3e5e8",fontSize:13}}>★</span>)}</div></td>
                  <td style={{maxWidth:280}}>
                    {r.title&&<p style={{fontSize:12,fontStyle:"italic",color:"var(--adm-wine)",margin:"0 0 3px"}}>"{r.title}"</p>}
                    <p style={{fontSize:12,color:"var(--adm-muted)",margin:0,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{r.text}</p>
                  </td>
                  <td><div className={`adm-toggle ${r.verified?"on":""}`} onClick={()=>handleVerify(r.id)}><div className="adm-toggle-knob"/></div></td>
                  <td style={{fontSize:11,color:"var(--adm-muted)",whiteSpace:"nowrap"}}>{new Date(r.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</td>
                  <td><button className="adm-icon-btn danger" onClick={()=>handleDelete(r.id)}><Trash2 size={13}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Ad Manager ────────────────────────────────────────────────
const PLATFORMS = ["Google Ads","Meta Ads","Instagram","WhatsApp","YouTube","Influencer"];
const AD_STATUS  = ["Active","Paused","Completed","Draft"];
const BLANK_AD = { name:"", platform:"Google Ads", status:"Active", budget:"", spend:"", clicks:"", impressions:"", conversions:"", startDate:"", endDate:"", utmLink:"", notes:"" };

export function AdManager() {
  const [ads,setAds]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showModal,setShowModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState(BLANK_AD);
  const [saving,setSaving]=useState(false);
  const [deleteId,setDeleteId]=useState(null);
  const load=()=>{setLoading(true);api.getAds().then(setAds).finally(()=>setLoading(false));};
  useEffect(load,[]);
  const up=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const openNew=()=>{setEditing(null);setForm(BLANK_AD);setShowModal(true);};
  const openEdit=a=>{setEditing(a);setForm({...BLANK_AD,...a});setShowModal(true);};
  const handleSave=async()=>{
    setSaving(true);
    try{
      const p={...form,budget:Number(form.budget)||0,spend:Number(form.spend)||0,clicks:Number(form.clicks)||0,impressions:Number(form.impressions)||0,conversions:Number(form.conversions)||0};
      if(editing)await api.updateAd(editing.id,p);else await api.createAd(p);
      setShowModal(false);load();
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const handleDelete=async id=>{await api.deleteAd(id);setDeleteId(null);load();};

  const totalSpend=ads.reduce((s,a)=>s+Number(a.spend||0),0);
  const totalConversions=ads.reduce((s,a)=>s+Number(a.conversions||0),0);
  const totalClicks=ads.reduce((s,a)=>s+Number(a.clicks||0),0);
  const avgCPA=totalConversions>0?totalSpend/totalConversions:0;

  const statusColor={"Active":"var(--adm-success)","Paused":"var(--adm-warn)","Completed":"var(--adm-muted)","Draft":"#c4c9cd"};

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div><h1>Ad Manager</h1><p>Track and monitor all your advertising campaigns.</p></div>
        <button className="adm-btn adm-btn-gold" onClick={openNew}><Plus size={14}/>New Campaign</button>
      </div>

      {/* Summary cards */}
      <div className="adm-stats-grid" style={{marginBottom:24}}>
        <div className="adm-stat-card gold">
          <div className="adm-stat-icon"><TrendingUp size={36}/></div>
          <p className="adm-stat-label">Total Ad Spend</p>
          <h3 className="adm-stat-value">{rupee(totalSpend)}</h3>
          <p className="adm-stat-sub">{ads.filter(a=>a.status==="Active").length} active campaigns</p>
        </div>
        <div className="adm-stat-card blue">
          <div className="adm-stat-icon"><MousePointer size={36}/></div>
          <p className="adm-stat-label">Total Clicks</p>
          <h3 className="adm-stat-value">{totalClicks.toLocaleString("en-IN")}</h3>
          <p className="adm-stat-sub">Across all campaigns</p>
        </div>
        <div className="adm-stat-card green">
          <div className="adm-stat-icon"><ShoppingCart size={36}/></div>
          <p className="adm-stat-label">Conversions</p>
          <h3 className="adm-stat-value">{totalConversions}</h3>
          <p className="adm-stat-sub">Orders from ads</p>
        </div>
        <div className="adm-stat-card wine">
          <div className="adm-stat-icon"><Eye size={36}/></div>
          <p className="adm-stat-label">Cost per Order</p>
          <h3 className="adm-stat-value">{avgCPA>0?rupee(Math.round(avgCPA)):"—"}</h3>
          <p className="adm-stat-sub">Average CPA</p>
        </div>
      </div>

      {loading?<div className="adm-loading">Loading campaigns…</div>:(
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Campaign</th><th>Platform</th><th>Status</th><th>Budget</th><th>Spend</th><th>Clicks</th><th>Conv.</th><th>CPA</th><th>Actions</th></tr></thead>
            <tbody>
              {ads.length===0&&<tr><td colSpan={9} style={{textAlign:"center",padding:40,color:"var(--adm-muted)"}}>No campaigns yet. Add your first campaign to start tracking.</td></tr>}
              {ads.map(a=>{
                const cpa=Number(a.conversions)>0?Number(a.spend)/Number(a.conversions):0;
                return (
                  <tr key={a.id} onClick={()=>openEdit(a)} style={{cursor:"pointer"}}>
                    <td>
                      <p style={{fontWeight:600,margin:"0 0 2px"}}>{a.name}</p>
                      {a.utmLink&&<a href={a.utmLink} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{fontSize:11,color:"var(--adm-info)",display:"flex",alignItems:"center",gap:3}}><ExternalLink size={10}/>UTM Link</a>}
                    </td>
                    <td><span style={{fontSize:12,background:"#f1f2f4",padding:"2px 10px",borderRadius:100,fontWeight:500}}>{a.platform}</span></td>
                    <td><span style={{fontSize:12,fontWeight:600,color:statusColor[a.status]||"#6d7175"}}>● {a.status}</span></td>
                    <td>{rupee(Number(a.budget)||0)}</td>
                    <td style={{fontWeight:600}}>{rupee(Number(a.spend)||0)}</td>
                    <td>{Number(a.clicks||0).toLocaleString("en-IN")}</td>
                    <td style={{fontWeight:600,color:"var(--adm-success)"}}>{a.conversions||0}</td>
                    <td>{cpa>0?rupee(Math.round(cpa)):"—"}</td>
                    <td onClick={e=>e.stopPropagation()}>
                      <div style={{display:"flex",gap:6}}>
                        <button className="adm-icon-btn" onClick={()=>openEdit(a)}><Edit2 size={13}/></button>
                        <button className="adm-icon-btn danger" onClick={()=>setDeleteId(a.id)}><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Campaign modal */}
      {showModal&&(
        <div className="adm-modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="adm-modal adm-modal-wide" onClick={e=>e.stopPropagation()}>
            <div className="adm-modal-head"><h3>{editing?"Edit Campaign":"New Campaign"}</h3><button className="adm-close-btn" onClick={()=>setShowModal(false)}>✕</button></div>
            <div className="adm-form-grid">
              <div className="adm-field full"><label>Campaign Name *</label><input value={form.name} onChange={up("name")} placeholder="Summer Bridal Campaign"/></div>
              <div className="adm-field"><label>Platform</label><select value={form.platform} onChange={up("platform")}>{PLATFORMS.map(p=><option key={p}>{p}</option>)}</select></div>
              <div className="adm-field"><label>Status</label><select value={form.status} onChange={up("status")}>{AD_STATUS.map(s=><option key={s}>{s}</option>)}</select></div>
              <div className="adm-field"><label>Total Budget (₹)</label><input type="number" value={form.budget} onChange={up("budget")} placeholder="50000"/></div>
              <div className="adm-field"><label>Amount Spent (₹)</label><input type="number" value={form.spend} onChange={up("spend")} placeholder="32000"/></div>
              <div className="adm-field"><label>Clicks</label><input type="number" value={form.clicks} onChange={up("clicks")} placeholder="1240"/></div>
              <div className="adm-field"><label>Impressions</label><input type="number" value={form.impressions} onChange={up("impressions")} placeholder="45000"/></div>
              <div className="adm-field"><label>Conversions (Orders)</label><input type="number" value={form.conversions} onChange={up("conversions")} placeholder="18"/></div>
              <div className="adm-field"><label>Start Date</label><input type="date" value={form.startDate||""} onChange={up("startDate")}/></div>
              <div className="adm-field"><label>End Date</label><input type="date" value={form.endDate||""} onChange={up("endDate")}/></div>
              <div className="adm-field full"><label>UTM / Landing Page URL</label><input value={form.utmLink||""} onChange={up("utmLink")} placeholder="https://aaradhyascreation.com?utm_source=google&utm_campaign=bridal"/></div>
              <div className="adm-field full"><label>Notes</label><textarea rows={2} value={form.notes||""} onChange={up("notes")} placeholder="Target audience, creative notes, performance observations…"/></div>
            </div>
            <div className="adm-modal-foot">
              <button className="adm-btn adm-btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="adm-btn adm-btn-gold" onClick={handleSave} disabled={saving}>{saving?"Saving…":"Save Campaign"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId&&(
        <div className="adm-modal-overlay" onClick={()=>setDeleteId(null)}>
          <div className="adm-modal adm-modal-sm" onClick={e=>e.stopPropagation()}>
            <h3>Delete campaign?</h3>
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

// ── Settings ──────────────────────────────────────────────────
const STORE_FIELDS = [
  {k:"storeName",label:"Store Name"},{k:"tagline",label:"Tagline"},
  {k:"contactEmail",label:"Contact Email"},{k:"whatsapp",label:"WhatsApp Number"},
  {k:"address",label:"Store Address"},{k:"standardDelivery",label:"Standard Delivery Time"},
  {k:"expressDelivery",label:"Express Delivery Label"},
  {k:"returnWindowDays",label:"Return Window (days)",type:"number"},
  {k:"exchangeWindowDays",label:"Exchange Window (days)",type:"number"},
  {k:"freeShippingAbove",label:"Free Shipping Above (₹)",type:"number"},
  {k:"refundMode",label:"Refund Mode"},
];

const GST_FIELDS = [
  {k:"legalBusinessName",label:"Legal Business Name (for invoices)"},
  {k:"gstin",label:"GSTIN"},
  {k:"placeOfSupplyState",label:"Place of Supply (Your State)", hint:"e.g. Gujarat — decides CGST+SGST vs IGST"},
  {k:"defaultHsnCode",label:"Default HSN/SAC Code", hint:"e.g. 5407 for woven fabrics"},
  {k:"defaultGstPct",label:"Default GST Rate (%)",type:"number"},
  {k:"gstInclusive",label:"Prices are GST-Inclusive",type:"checkbox", hint:"ON: listed prices already include GST (typical retail). OFF: GST added on top."},
  {k:"paymentGatewayPct",label:"Payment Gateway Fee (%)",type:"number", hint:"Razorpay is typically ~2-2.36% — used in profit reports"},
  {k:"actualShippingCostPerOrder",label:"Avg. Courier Cost per Order (Rs)",type:"number", hint:"Optional — what you actually pay the courier"},
  {k:"invoiceTerms",label:"Invoice Terms & Conditions",type:"textarea"},
];

// All the image slots for the storefront
const HERO_ROWS = [
  {key:"hero_main",    label:"🖼 Hero Background",          hint:"Main large banner (left side of homepage hero)"},
  {key:"hero_saree_promo", label:"🥻 Saree Promo Banner",    hint:"Top-right promo tile linking to Sarees"},
  {key:"hero_kurti_promo", label:"👗 Kurti Promo Banner",    hint:"Bottom-right promo tile linking to Kurtis"},
  {key:"bridal_split", label:"💍 Bridal Split Section",      hint:"Left image in the bridal section"},
  {key:"heritage",     label:"🪡 Heritage / Weaver Section", hint:"Right image in the about section"},
];
const GAL_ROWS  = [0,1,2,3,4,5].map(i=>({key:`gal_${i}`,label:`📸 Gallery Photo ${i+1}`,hint:"Shown in Instagram-style gallery grid"}));
const OCC_ROWS  = OCCASIONS.map(name=>({key:`occ_${name}`,label:`🔵 Occasion: ${name}`,hint:"Round circle photo for this occasion"}));
const FAB_ROWS  = FABRICS.map(f=>({key:`fab_${f.name}`,label:`🧵 Fabric: ${f.name}`,hint:"Card image for this fabric type"}));

function SiteImageRow({row, value, onUpload, onUrlChange, uploading, saved}) {
  const fileRef = useRef(null);
  const imgSrc = resolveUrl(value);
  return (
    <div className="sfy-site-img-row">
      <div className="sfy-site-img-preview">
        {imgSrc
          ? <img src={imgSrc} alt={row.label} onError={e=>{e.target.style.display="none";}} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:6,display:"block"}}/>
          : <div className="sfy-site-img-empty">No image</div>}
      </div>
      <div className="sfy-site-img-body">
        <p className="sfy-site-img-label">{row.label}</p>
        <p className="sfy-site-img-hint">{row.hint}</p>
        <div style={{display:"flex",gap:8,marginTop:8,alignItems:"center",flexWrap:"wrap"}}>
          <button className="adm-btn adm-btn-ghost" style={{fontSize:11,padding:"5px 12px"}}
            onClick={()=>fileRef.current?.click()} disabled={uploading}>
            <Upload size={12}/>{uploading?"Uploading…":"Upload Photo"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}}
            onChange={e=>e.target.files[0]&&onUpload(row.key,e.target.files[0])}/>
          <span style={{fontSize:11,color:"var(--adm-muted)"}}>or</span>
          <input
            className="adm-input"
            style={{flex:1,minWidth:200,fontSize:12,padding:"5px 10px"}}
            placeholder="Paste image URL (Cloudinary, S3…)"
            value={value||""}
            onChange={e=>onUrlChange(row.key,e.target.value)}
          />
          {value&&<button className="adm-icon-btn danger" style={{width:28,height:28,flexShrink:0}} onClick={()=>onUrlChange(row.key,"")}><XIcon size={12}/></button>}
          {saved&&<span style={{fontSize:11,color:"var(--adm-success)",fontWeight:600,whiteSpace:"nowrap"}}>✓ Saved</span>}
        </div>
      </div>
    </div>
  );
}

export function Settings() {
  const [settings,   setSettings]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [tab,        setTab]        = useState("store");
  const [uploading,  setUploading]  = useState({});
  const [rowSaved,   setRowSaved]   = useState({});

  useEffect(()=>{api.getSettings().then(setSettings).finally(()=>setLoading(false));}, []);

  const up=k=>e=>setSettings(s=>({...s,[k]:e.target.type==="checkbox"?e.target.checked:e.target.value}));

  const handleSave=async()=>{
    setSaving(true);setSaved(false);
    await api.updateSettings(settings);
    setSaving(false);setSaved(true);
    setTimeout(()=>setSaved(false),2500);
  };

  // Upload a site image — uses dedicated endpoint that auto-saves to DB
  const handleImageUpload=async(key,file)=>{
    setUploading(u=>({...u,[key]:true}));
    try{
      const {url}=await api.uploadSiteImage(key,file);
      setSettings(s=>({...s,siteImages:{...(s.siteImages||{}),[key]:url}}));
      setRowSaved(r=>({...r,[key]:true}));
      setTimeout(()=>setRowSaved(r=>({...r,[key]:false})),2500);
    }catch(e){alert("Upload failed: "+e.message);}
    finally{setUploading(u=>({...u,[key]:false}));}
  };

  // URL paste — save immediately to backend
  const handleUrlChange=async(key,url)=>{
    setSettings(s=>({...s,siteImages:{...(s.siteImages||{}),[key]:url}}));
    try{
      const current=await api.getSettings();
      await api.updateSettings({...current,siteImages:{...(current.siteImages||{}),[key]:url}});
      setRowSaved(r=>({...r,[key]:true}));
      setTimeout(()=>setRowSaved(r=>({...r,[key]:false})),2000);
    }catch(e){console.error("Save failed:",e);}
  };

  if(loading) return <div className="adm-page"><div className="adm-loading">Loading settings…</div></div>;

  const si=settings?.siteImages||{};
  const allImageRows=[...HERO_ROWS,...OCC_ROWS,...FAB_ROWS,...GAL_ROWS];

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div><h1>Settings</h1><p>Store configuration and storefront images.</p></div>
        <button className="adm-btn adm-btn-gold" onClick={handleSave} disabled={saving}>
          {saved?"✓ Saved!":saving?"Saving…":"Save Settings"}
        </button>
      </div>

      <div className="adm-tab-bar">
        <button className={`adm-tab ${tab==="store"?"active":""}`} onClick={()=>setTab("store")}>🏪 Store Info</button>
        <button className={`adm-tab ${tab==="gst"?"active":""}`} onClick={()=>setTab("gst")}>🧾 GST &amp; Invoice</button>
        <button className={`adm-tab ${tab==="hero"?"active":""}`} onClick={()=>setTab("hero")}>🖼 Hero &amp; Banners</button>
        <button className={`adm-tab ${tab==="occasions"?"active":""}`} onClick={()=>setTab("occasions")}>⭕ Occasion Photos</button>
        <button className={`adm-tab ${tab==="fabrics"?"active":""}`} onClick={()=>setTab("fabrics")}>🧵 Fabric Photos</button>
        <button className={`adm-tab ${tab==="gallery"?"active":""}`} onClick={()=>setTab("gallery")}>📸 Gallery</button>
      </div>

      {tab==="store"&&(
        <div className="adm-settings-card">
          <div className="adm-form-grid">
            {STORE_FIELDS.map(({k,label,type="text"})=>(
              <div className="adm-field" key={k}>
                <label>{label}</label>
                <input type={type} value={settings?.[k]??""} onChange={up(k)}/>
              </div>
            ))}
            <div className="adm-field adm-checkbox-field">
              <label><input type="checkbox" checked={!!settings?.internationalShipping} onChange={up("internationalShipping")}/> International Shipping Enabled</label>
            </div>
          </div>
          <div style={{margin:"0 20px 20px",padding:"16px 18px",background:"#fffbf4",border:"1px solid rgba(200,161,88,0.25)",borderRadius:6}}>
            <h4 style={{fontSize:12,fontWeight:700,letterSpacing:"0.06em",color:"var(--adm-wine)",marginBottom:10}}>INTEGRATIONS</h4>
            <p style={{fontSize:13,color:"var(--adm-muted)",lineHeight:1.8,margin:0}}>
              <strong style={{color:"var(--adm-text)"}}>Razorpay:</strong> Add <code>RAZORPAY_KEY_ID</code> &amp; <code>RAZORPAY_KEY_SECRET</code> to <code>backend/.env</code><br/>
              <strong style={{color:"var(--adm-text)"}}>Shiprocket:</strong> Add <code>SHIPROCKET_EMAIL</code> &amp; <code>SHIPROCKET_PASSWORD</code> to <code>backend/.env</code>
            </p>
          </div>
        </div>
      )}

      {tab==="gst"&&(
        <div className="adm-settings-card">
          <div style={{padding:"14px 20px",borderBottom:"1px solid var(--adm-border)",background:"#fffbf4"}}>
            <p style={{margin:0,fontSize:13,color:"var(--adm-muted)"}}>
              These details appear on every customer invoice and drive GST calculations. Nothing here is hard-coded — it all comes from what you enter below.
            </p>
          </div>
          <div className="adm-form-grid">
            {GST_FIELDS.map(({k,label,type="text",hint})=>(
              <div className={`adm-field ${type==="checkbox"?"adm-checkbox-field":""} ${type==="textarea"?"full":""}`} key={k}>
                {type==="checkbox" ? (
                  <label><input type="checkbox" checked={!!settings?.[k]} onChange={up(k)}/> {label}</label>
                ) : type==="textarea" ? (
                  <><label>{label}</label><textarea rows={3} value={settings?.[k]??""} onChange={up(k)}/></>
                ) : (
                  <><label>{label}</label><input type={type} value={settings?.[k]??""} onChange={up(k)}/></>
                )}
                {hint && <span className="sfy-hint">{hint}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {["hero","occasions","fabrics","gallery"].includes(tab)&&(
        <div className="adm-settings-card">
          <div style={{padding:"14px 20px",borderBottom:"1px solid var(--adm-border)",background:"#fffbf4"}}>
            <p style={{margin:0,fontSize:13,color:"var(--adm-muted)"}}>
              Upload a file or paste a URL for each image slot. Changes are saved to the storefront immediately after uploading. Refresh your store page to see the update.
            </p>
          </div>
          <div className="sfy-site-img-list">
            {(tab==="hero"?HERO_ROWS:tab==="occasions"?OCC_ROWS:tab==="fabrics"?FAB_ROWS:GAL_ROWS).map(row=>(
              <SiteImageRow
                key={row.key}
                row={row}
                value={si[row.key]||""}
                onUpload={handleImageUpload}
                onUrlChange={handleUrlChange}
                uploading={!!uploading[row.key]}
                saved={!!rowSaved[row.key]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
