import React, { useEffect, useState } from "react";
import {
  Plus, Edit2, Trash2, TrendingUp, MousePointer, Eye,
  ShoppingBag, X as XIcon, ExternalLink, Link2, Copy, Check
} from "lucide-react";
import { api } from "../../api/client.js";
import { rupee } from "../../data/content.js";

const PLATFORMS = ["Meta (Facebook/Instagram)", "Google Ads", "WhatsApp", "YouTube", "Pinterest", "Email", "Other"];
const PLATFORM_ICONS = { "Meta (Facebook/Instagram)":"📘", "Google Ads":"🔍", "WhatsApp":"💬", "YouTube":"▶️", "Pinterest":"📌", "Email":"📧", "Other":"📣" };
const STATUS_COLORS = { active:"var(--adm-success)", paused:"var(--adm-warn)", completed:"var(--adm-muted)", draft:"#c4c9cd" };

const BLANK = {
  name:"", platform:"Meta (Facebook/Instagram)", status:"active",
  budget:"", spend:"", clicks:"", impressions:"", conversions:"", revenue:"",
  startDate: new Date().toISOString().slice(0,10), endDate:"",
  utmSource:"", utmMedium:"", utmCampaign:"", targetUrl:"", notes:""
};

function MetricCard({ icon: Icon, label, value, sub, color="#C8A158" }) {
  return (
    <div style={{ background:"#fff", border:"1px solid var(--adm-border)", borderRadius:8, padding:"18px 20px", boxShadow:"var(--adm-shadow)", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:color }}/>
      <div style={{ position:"absolute", top:16, right:16, opacity:0.1 }}><Icon size={34}/></div>
      <p style={{ fontSize:11.5, fontWeight:600, color:"var(--adm-muted)", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 8px" }}>{label}</p>
      <p style={{ fontSize:24, fontWeight:700, color:"var(--adm-text)", margin:"0 0 4px" }}>{value}</p>
      {sub && <p style={{ fontSize:12, color:"var(--adm-muted)", margin:0 }}>{sub}</p>}
    </div>
  );
}

function UTMBuilder() {
  const [form, setForm] = useState({ url:"https://aaradhyascreation.com", source:"meta", medium:"cpc", campaign:"", content:"", term:"" });
  const [copied, setCopied] = useState(false);

  const built = (() => {
    const params = new URLSearchParams();
    if (form.source)   params.set("utm_source",   form.source);
    if (form.medium)   params.set("utm_medium",   form.medium);
    if (form.campaign) params.set("utm_campaign", form.campaign);
    if (form.content)  params.set("utm_content",  form.content);
    if (form.term)     params.set("utm_term",     form.term);
    const qs = params.toString();
    return form.url + (qs ? (form.url.includes("?")?"&":"?") + qs : "");
  })();

  const copy = () => { navigator.clipboard?.writeText(built); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const up = k => e => setForm(f=>({...f,[k]:e.target.value}));

  return (
    <div style={{ background:"#fff", border:"1px solid var(--adm-border)", borderRadius:8, boxShadow:"var(--adm-shadow)", overflow:"hidden" }}>
      <div style={{ padding:"14px 18px 12px", borderBottom:"1px solid var(--adm-border)", display:"flex", alignItems:"center", gap:8 }}>
        <Link2 size={16} color="var(--adm-gold)"/>
        <h3 style={{ fontSize:14, fontWeight:600, margin:0 }}>UTM Link Builder</h3>
        <span style={{ fontSize:12, color:"var(--adm-muted)" }}>Build trackable URLs for your ads</span>
      </div>
      <div style={{ padding:18 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:12 }}>
          {[
            { k:"url",      label:"Page URL *",       placeholder:"https://aaradhyascreation.com/collection/bridal" },
            { k:"source",   label:"UTM Source *",     placeholder:"meta, google, email" },
            { k:"medium",   label:"UTM Medium *",     placeholder:"cpc, social, email" },
            { k:"campaign", label:"UTM Campaign",     placeholder:"diwali-2026, bridal-sale" },
            { k:"content",  label:"UTM Content",      placeholder:"red-saree-banner" },
            { k:"term",     label:"UTM Term",         placeholder:"bridal saree, silk saree" },
          ].map(({k,label,placeholder})=>(
            <div key={k} style={{ display:"flex", flexDirection:"column", gap:4 }}>
              <label style={{ fontSize:12, fontWeight:600, color:"var(--adm-text)" }}>{label}</label>
              <input value={form[k]} onChange={up(k)} placeholder={placeholder}
                style={{ padding:"7px 10px", border:"1px solid var(--adm-border)", borderRadius:6, fontSize:12.5, fontFamily:"'Inter',sans-serif", outline:"none" }}/>
            </div>
          ))}
        </div>
        <div style={{ background:"#f8f9fa", border:"1px solid var(--adm-border)", borderRadius:6, padding:"10px 14px", marginBottom:10, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
          <span style={{ fontSize:12, color:"var(--adm-text)", wordBreak:"break-all", flex:1 }}>{built}</span>
          <button className="adm-btn adm-btn-ghost" style={{ fontSize:12, padding:"5px 12px", flexShrink:0 }} onClick={copy}>
            {copied ? <><Check size={13}/>Copied!</> : <><Copy size={13}/>Copy URL</>}
          </button>
        </div>
        <p style={{ fontSize:11, color:"var(--adm-muted)" }}>Paste this URL into your Meta/Google ad as the landing page destination.</p>
      </div>
    </div>
  );
}

export default function AdManager() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(BLANK);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState(null);
  const [deleteId, setDeleteId]   = useState(null);
  const [activeTab, setActiveTab] = useState("campaigns");

  const load = () => { setLoading(true); api.getAdCampaigns().then(setCampaigns).finally(()=>setLoading(false)); };
  useEffect(load,[]);

  const up = k => e => setForm(f=>({...f,[k]:e.target.type==="checkbox"?e.target.checked:e.target.value}));
  const openNew  = () => { setEditing(null); setForm(BLANK); setError(null); setShowModal(true); };
  const openEdit = c  => { setEditing(c); setForm({...BLANK,...c,budget:c.budget||"",spend:c.spend||"",clicks:c.clicks||"",impressions:c.impressions||"",conversions:c.conversions||"",revenue:c.revenue||""}); setError(null); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Campaign name is required."); return; }
    setSaving(true); setError(null);
    try {
      const payload = { ...form, budget:Number(form.budget)||0, spend:Number(form.spend)||0, clicks:Number(form.clicks)||0, impressions:Number(form.impressions)||0, conversions:Number(form.conversions)||0, revenue:Number(form.revenue)||0 };
      if (editing) await api.updateAdCampaign(editing.id, payload);
      else         await api.createAdCampaign(payload);
      setShowModal(false); load();
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => { await api.deleteAdCampaign(id); setDeleteId(null); load(); };

  // Totals
  const totals = campaigns.reduce((acc,c)=>({
    budget: acc.budget+c.budget, spend: acc.spend+c.spend,
    clicks: acc.clicks+c.clicks, impressions: acc.impressions+c.impressions,
    conversions: acc.conversions+c.conversions, revenue: acc.revenue+c.revenue
  }),{ budget:0, spend:0, clicks:0, impressions:0, conversions:0, revenue:0 });
  const totalROI = totals.spend > 0 ? ((totals.revenue - totals.spend)/totals.spend*100).toFixed(1) : 0;
  const avgCPC   = totals.clicks > 0 ? (totals.spend/totals.clicks).toFixed(2) : 0;

  const PLATFORM_LINKS = [
    { name:"Meta Ads Manager",       url:"https://adsmanager.facebook.com", icon:"📘", desc:"Manage Facebook & Instagram campaigns" },
    { name:"Google Ads",             url:"https://ads.google.com",           icon:"🔍", desc:"Search, Display & Shopping campaigns" },
    { name:"Google Analytics",       url:"https://analytics.google.com",     icon:"📊", desc:"Track website visitors & conversions" },
    { name:"Google Search Console",  url:"https://search.google.com/search-console", icon:"🌐", desc:"Monitor SEO performance" },
    { name:"WhatsApp Business",      url:"https://business.whatsapp.com",    icon:"💬", desc:"Message & broadcast campaigns" },
    { name:"Pinterest Business",     url:"https://business.pinterest.com",   icon:"📌", desc:"Visual discovery ads" },
  ];

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1>Ad Manager</h1>
          <p>Track campaigns, measure ROI, build UTM links</p>
        </div>
        <button className="adm-btn adm-btn-gold" onClick={openNew}><Plus size={14}/>New Campaign</button>
      </div>

      {/* Metric cards */}
      {campaigns.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:14, marginBottom:24 }}>
          <MetricCard icon={TrendingUp}  label="Total Spend"       value={rupee(totals.spend)}       sub={`Budget: ${rupee(totals.budget)}`} color="var(--adm-gold)"/>
          <MetricCard icon={Eye}         label="Impressions"        value={totals.impressions.toLocaleString("en-IN")} color="var(--adm-info)"/>
          <MetricCard icon={MousePointer}label="Clicks"             value={totals.clicks.toLocaleString("en-IN")}      sub={`Avg CPC: ₹${avgCPC}`} color="#7c5cbf"/>
          <MetricCard icon={ShoppingBag} label="Conversions"        value={totals.conversions}         color="var(--adm-success)"/>
          <MetricCard icon={TrendingUp}  label="Ad Revenue"         value={rupee(totals.revenue)}      sub={`ROI: ${totalROI}%`} color={Number(totalROI)>=0?"var(--adm-success)":"var(--adm-danger)"}/>
        </div>
      )}

      {/* Tabs */}
      <div className="adm-tab-bar">
        <button className={`adm-tab ${activeTab==="campaigns"?"active":""}`} onClick={()=>setActiveTab("campaigns")}>📊 Campaigns ({campaigns.length})</button>
        <button className={`adm-tab ${activeTab==="utm"?"active":""}`} onClick={()=>setActiveTab("utm")}>🔗 UTM Builder</button>
        <button className={`adm-tab ${activeTab==="links"?"active":""}`} onClick={()=>setActiveTab("links")}>⚡ Ad Platforms</button>
      </div>

      {/* Campaigns tab */}
      {activeTab==="campaigns" && (
        loading ? <div className="adm-loading">Loading campaigns…</div> : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Campaign</th><th>Platform</th><th>Status</th><th>Budget</th>
                  <th>Spend</th><th>Clicks</th><th>Conversions</th><th>Revenue</th><th>ROI</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length===0 && (
                  <tr><td colSpan={10} style={{textAlign:"center",padding:48,color:"var(--adm-muted)"}}>
                    <div style={{fontSize:32,marginBottom:10}}>📣</div>
                    No campaigns yet. Click "New Campaign" to start tracking your ad spend.
                  </td></tr>
                )}
                {campaigns.map(c => {
                  const roi = c.spend>0 ? ((c.revenue-c.spend)/c.spend*100).toFixed(1) : null;
                  const remaining = c.budget - c.spend;
                  const pct = c.budget>0 ? Math.min(100,Math.round(c.spend/c.budget*100)) : 0;
                  return (
                    <tr key={c.id} onClick={()=>openEdit(c)} style={{cursor:"pointer"}}>
                      <td>
                        <p style={{fontWeight:600,margin:"0 0 2px",fontSize:13.5}}>{c.name}</p>
                        {c.startDate && <p style={{margin:0,fontSize:11,color:"var(--adm-muted)"}}>{c.startDate}{c.endDate?` → ${c.endDate}`:""}</p>}
                        {c.utmCampaign && <code style={{fontSize:10,background:"#f1f2f4",padding:"1px 6px",borderRadius:3}}>{c.utmCampaign}</code>}
                      </td>
                      <td>{PLATFORM_ICONS[c.platform]||"📣"} <span style={{fontSize:12.5}}>{c.platform.split("(")[0].trim()}</span></td>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:7,height:7,borderRadius:"50%",background:STATUS_COLORS[c.status]||"#ccc",flexShrink:0}}/>
                          <span style={{fontSize:12.5,textTransform:"capitalize"}}>{c.status}</span>
                        </div>
                      </td>
                      <td>
                        <p style={{margin:0,fontWeight:600}}>{rupee(c.budget)}</p>
                        {c.budget>0 && (
                          <div style={{marginTop:4}}>
                            <div style={{height:4,background:"#f1f2f4",borderRadius:2,overflow:"hidden",width:70}}>
                              <div style={{height:"100%",width:`${pct}%`,background:pct>90?"var(--adm-danger)":"var(--adm-gold)",borderRadius:2}}/>
                            </div>
                            <span style={{fontSize:10,color:"var(--adm-muted)"}}>{pct}% used</span>
                          </div>
                        )}
                      </td>
                      <td style={{fontWeight:600}}>{rupee(c.spend)}</td>
                      <td>{c.clicks?.toLocaleString("en-IN")||0}</td>
                      <td>
                        <p style={{margin:0,fontWeight:600}}>{c.conversions||0}</p>
                        {c.clicks>0 && <p style={{margin:0,fontSize:11,color:"var(--adm-muted)"}}>{((c.conversions/c.clicks)*100).toFixed(1)}% CVR</p>}
                      </td>
                      <td style={{fontWeight:600,color:"var(--adm-success)"}}>{rupee(c.revenue)}</td>
                      <td>
                        {roi!==null ? (
                          <span style={{fontWeight:700,color:Number(roi)>=0?"var(--adm-success)":"var(--adm-danger)"}}>
                            {Number(roi)>=0?"+":""}{roi}%
                          </span>
                        ) : "—"}
                      </td>
                      <td onClick={e=>e.stopPropagation()}>
                        <div style={{display:"flex",gap:6}}>
                          <button className="adm-icon-btn" onClick={()=>openEdit(c)}><Edit2 size={13}/></button>
                          <button className="adm-icon-btn danger" onClick={()=>setDeleteId(c.id)}><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* UTM tab */}
      {activeTab==="utm" && <UTMBuilder/>}

      {/* Platform links tab */}
      {activeTab==="links" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
          {PLATFORM_LINKS.map(p=>(
            <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
              style={{ background:"#fff", border:"1px solid var(--adm-border)", borderRadius:8, padding:"18px 20px", textDecoration:"none", display:"flex", gap:14, alignItems:"flex-start", boxShadow:"var(--adm-shadow)", transition:"box-shadow .2s, border-color .2s" }}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow="var(--adm-shadow-md)";e.currentTarget.style.borderColor="#c4c9cd";}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow="var(--adm-shadow)";e.currentTarget.style.borderColor="var(--adm-border)";}}>
              <span style={{fontSize:28,flexShrink:0}}>{p.icon}</span>
              <div style={{flex:1}}>
                <p style={{fontWeight:600,fontSize:14,margin:"0 0 4px",color:"var(--adm-text)"}}>{p.name}</p>
                <p style={{fontSize:12.5,color:"var(--adm-muted)",margin:0,lineHeight:1.5}}>{p.desc}</p>
              </div>
              <ExternalLink size={14} color="var(--adm-muted)" style={{flexShrink:0,marginTop:3}}/>
            </a>
          ))}
        </div>
      )}

      {/* Campaign modal */}
      {showModal && (
        <div className="adm-modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="adm-modal adm-modal-wide" onClick={e=>e.stopPropagation()}>
            <div className="adm-modal-head">
              <h3>{editing?"Edit Campaign":"New Campaign"}</h3>
              <button className="adm-close-btn" onClick={()=>setShowModal(false)}>✕</button>
            </div>
            {error && <div className="adm-form-error">{error}</div>}
            <div style={{padding:"18px 20px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,maxHeight:"65vh",overflowY:"auto"}}>
              <div className="adm-field" style={{gridColumn:"1/-1"}}>
                <label>Campaign Name *</label>
                <input value={form.name} onChange={up("name")} placeholder="Diwali 2026 Bridal Collection"/>
              </div>
              <div className="adm-field">
                <label>Platform</label>
                <select value={form.platform} onChange={up("platform")}>
                  {PLATFORMS.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="adm-field">
                <label>Status</label>
                <select value={form.status} onChange={up("status")}>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div className="adm-field"><label>Start Date</label><input type="date" value={form.startDate} onChange={up("startDate")}/></div>
              <div className="adm-field"><label>End Date</label><input type="date" value={form.endDate} onChange={up("endDate")}/></div>

              <div style={{gridColumn:"1/-1",paddingTop:8,borderTop:"1px solid var(--adm-border)",fontSize:11.5,fontWeight:700,color:"var(--adm-muted)",letterSpacing:"0.06em"}}>BUDGET & PERFORMANCE</div>
              <div className="adm-field"><label>Total Budget (₹)</label><input type="number" value={form.budget} onChange={up("budget")} placeholder="10000"/></div>
              <div className="adm-field"><label>Amount Spent (₹)</label><input type="number" value={form.spend} onChange={up("spend")} placeholder="6500"/></div>
              <div className="adm-field"><label>Impressions</label><input type="number" value={form.impressions} onChange={up("impressions")} placeholder="45000"/></div>
              <div className="adm-field"><label>Clicks</label><input type="number" value={form.clicks} onChange={up("clicks")} placeholder="1200"/></div>
              <div className="adm-field"><label>Conversions (orders)</label><input type="number" value={form.conversions} onChange={up("conversions")} placeholder="18"/></div>
              <div className="adm-field"><label>Revenue from this ad (₹)</label><input type="number" value={form.revenue} onChange={up("revenue")} placeholder="85000"/></div>

              <div style={{gridColumn:"1/-1",paddingTop:8,borderTop:"1px solid var(--adm-border)",fontSize:11.5,fontWeight:700,color:"var(--adm-muted)",letterSpacing:"0.06em"}}>UTM TRACKING</div>
              <div className="adm-field" style={{gridColumn:"1/-1"}}><label>Target URL</label><input value={form.targetUrl} onChange={up("targetUrl")} placeholder="https://aaradhyascreation.com/collection/bridal"/></div>
              <div className="adm-field"><label>UTM Source</label><input value={form.utmSource} onChange={up("utmSource")} placeholder="meta"/></div>
              <div className="adm-field"><label>UTM Medium</label><input value={form.utmMedium} onChange={up("utmMedium")} placeholder="cpc"/></div>
              <div className="adm-field"><label>UTM Campaign</label><input value={form.utmCampaign} onChange={up("utmCampaign")} placeholder="diwali-bridal-2026"/></div>
              <div className="adm-field"><label>UTM Content</label><input value={form.utmContent} onChange={up("utmContent")} placeholder="red-saree-carousel"/></div>

              <div className="adm-field" style={{gridColumn:"1/-1"}}><label>Notes</label><textarea rows={3} value={form.notes} onChange={up("notes")} placeholder="Campaign notes, audience targeting, creative details…"/></div>
            </div>
            <div className="adm-modal-foot">
              <button className="adm-btn adm-btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="adm-btn adm-btn-gold" onClick={handleSave} disabled={saving}>{saving?"Saving…":"Save campaign"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="adm-modal-overlay" onClick={()=>setDeleteId(null)}>
          <div className="adm-modal adm-modal-sm" onClick={e=>e.stopPropagation()}>
            <h3>Delete campaign?</h3>
            <p>All data for this campaign will be removed.</p>
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
