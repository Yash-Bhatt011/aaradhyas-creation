import React, { useEffect, useRef, useState } from "react";
import { Plus, Edit2, Trash2, ChevronLeft, Upload, X as XIcon } from "lucide-react";
import { api } from "../../api/client.js";

const BACKEND = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace("/api","")
  : "http://localhost:5000";

const BLANK = { id:"", title:"", sub:"", description:"", seed:"", category:"saree", active:true, count:0, sortOrder:"Featured", seoTitle:"", seoDesc:"" };
const SORT_OPTIONS = ["Featured","Best selling","Alphabetically A–Z","Alphabetically Z–A","Price: low to high","Price: high to low","Newest first"];

export default function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [view,      setView]      = useState("list");
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(BLANK);
  const [saving,    setSaving]    = useState(false);
  const [saveMsg,   setSaveMsg]   = useState(null);
  const [error,     setError]     = useState(null);
  const [deleteId,  setDeleteId]  = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = () => { setLoading(true); api.getCollections(true).then(setCollections).finally(()=>setLoading(false)); };
  useEffect(load,[]);

  const up = k => e => setForm(f=>({...f,[k]:e.target.type==="checkbox"?e.target.checked:e.target.value}));
  const openNew  = () => { setEditing(null); setForm(BLANK); setError(null); setSaveMsg(null); setView("editor"); };
  const openEdit = c  => { setEditing(c); setForm({...BLANK,...c,description:c.description||"",seoTitle:c.seoTitle||"",seoDesc:c.seoDesc||""}); setError(null); setSaveMsg(null); setView("editor"); };

  const uploadImage = async (file) => {
    setUploading(true);
    try {
      const {urls} = await api.uploadProductImages([file]);
      setForm(f=>({...f, seed:urls[0]}));
    } catch(e) { setError("Upload failed: "+e.message); }
    finally { setUploading(false); }
  };

  const handleSave = async (andBack=false) => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSaving(true); setError(null);
    try {
      if (editing) await api.updateCollection(editing.id, form);
      else         await api.createCollection(form);
      setSaveMsg("Saved!"); setTimeout(()=>setSaveMsg(null),2000);
      load();
      if (andBack) setView("list");
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    await api.deleteCollection(id);
    setDeleteId(null); if (view==="editor") setView("list"); load();
  };

  const collImg = c => {
    if (!c?.seed) return null;
    if (c.seed.startsWith("/uploads/")) return `${BACKEND}${c.seed}`;
    return c.seed;
  };

  /* ── EDITOR ── */
  if (view==="editor") return (
    <div className="sfy-editor">
      <div className="sfy-editor-header">
        <div className="sfy-editor-header-left">
          <button className="sfy-back-btn" onClick={()=>setView("list")}><ChevronLeft size={16}/>Collections</button>
          <h1>{editing ? editing.title : "Create collection"}</h1>
        </div>
        <div className="sfy-editor-header-right">
          {editing && <button className="adm-btn adm-btn-ghost" onClick={()=>setDeleteId(editing.id)}><Trash2 size={14}/>Delete</button>}
          <button className="adm-btn adm-btn-ghost" onClick={()=>handleSave(false)} disabled={saving}>{saving?"Saving…":saveMsg||"Save"}</button>
          <button className="adm-btn adm-btn-gold" onClick={()=>handleSave(true)} disabled={saving}>Save &amp; go back</button>
        </div>
      </div>

      {error && <div className="sfy-error-bar">{error}</div>}

      <div className="sfy-editor-body">
        <div className="sfy-editor-left">
          <div className="sfy-card">
            <div className="sfy-card-body">
              <div className="sfy-field">
                <label>Collection Title *</label>
                <input value={form.title} onChange={up("title")} placeholder="Banarasi Sarees"/>
              </div>
              <div className="sfy-field" style={{marginTop:12}}>
                <label>Subtitle</label>
                <input value={form.sub} onChange={up("sub")} placeholder="Woven on ancient looms"/>
              </div>
              <div className="sfy-field" style={{marginTop:12}}>
                <label>Description</label>
                <textarea rows={4} value={form.description} onChange={up("description")}
                  placeholder="Tell the story of this collection — the weaving tradition, the artisans, the heritage…"/>
              </div>
            </div>
          </div>

          <div className="sfy-card">
            <div className="sfy-card-head"><h3>Collection Image</h3></div>
            <div className="sfy-card-body">
              {form.seed && (
                <div style={{position:"relative",marginBottom:14}}>
                  <img src={collImg({seed:form.seed})||form.seed} alt="preview"
                    style={{width:"100%",aspectRatio:"16/9",objectFit:"cover",borderRadius:6,border:"1px solid var(--adm-border)"}}/>
                  <button style={{position:"absolute",top:8,right:8,width:28,height:28,borderRadius:"50%",background:"rgba(215,44,13,0.85)",color:"#fff",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
                    onClick={()=>setForm(f=>({...f,seed:""}))}><XIcon size={13}/></button>
                </div>
              )}
              <div className="adm-upload-zone" onClick={()=>fileRef.current?.click()}>
                <Upload size={20} color="#8a7a68"/>
                <p>{uploading?"Uploading…":"Click to upload a collection banner image"}</p>
                <span>JPG, PNG, WebP · Max 10 MB · Recommended 1200×900px</span>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}}
                onChange={e=>e.target.files[0]&&uploadImage(e.target.files[0])}/>
              <div className="sfy-field" style={{marginTop:12}}>
                <label>Or paste an image URL</label>
                <input value={form.seed} onChange={up("seed")} placeholder="https://… or /uploads/products/…"/>
              </div>
            </div>
          </div>

          <div className="sfy-card">
            <div className="sfy-card-head"><h3>SEO</h3></div>
            <div className="sfy-card-body">
              <div className="sfy-field" style={{marginBottom:12}}>
                <label>Page Title <span className="sfy-hint" style={{marginLeft:4}}>{(form.seoTitle||"").length}/60</span></label>
                <input value={form.seoTitle} onChange={up("seoTitle")} placeholder={form.title} maxLength={60}/>
              </div>
              <div className="sfy-field">
                <label>Meta Description <span className="sfy-hint" style={{marginLeft:4}}>{(form.seoDesc||"").length}/160</span></label>
                <textarea rows={3} value={form.seoDesc} onChange={up("seoDesc")} placeholder="Short description for Google…" maxLength={160}/>
              </div>
            </div>
          </div>
        </div>

        <div className="sfy-editor-right">
          <div className="sfy-card">
            <div className="sfy-card-head"><h3>Category</h3></div>
            <div className="sfy-card-body">
              <select value={form.category||"saree"} onChange={up("category")}>
                <option value="saree">Saree</option>
                <option value="kurti">Kurti</option>
              </select>
            </div>
          </div>

          <div className="sfy-card">
            <div className="sfy-card-head"><h3>Visibility</h3></div>
            <div className="sfy-card-body">
              <select value={form.active?"active":"draft"} onChange={e=>setForm(f=>({...f,active:e.target.value==="active"}))}>
                <option value="active">🟢 Active — visible on store</option>
                <option value="draft">⚪ Draft — hidden from customers</option>
              </select>
            </div>
          </div>

          <div className="sfy-card">
            <div className="sfy-card-head"><h3>URL Handle</h3></div>
            <div className="sfy-card-body">
              <div className="sfy-field">
                <label>Slug / ID</label>
                <input value={form.id} onChange={up("id")} placeholder="banarasi-sarees" disabled={!!editing}/>
                <span className="sfy-hint">{editing?"Cannot change after creation":"Auto-generated from title if blank"}</span>
              </div>
            </div>
          </div>

          <div className="sfy-card">
            <div className="sfy-card-head"><h3>Default Sort Order</h3></div>
            <div className="sfy-card-body">
              <div className="sfy-field">
                <select value={form.sortOrder||"Featured"} onChange={up("sortOrder")}>
                  {SORT_OPTIONS.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {deleteId && (
        <div className="adm-modal-overlay" onClick={()=>setDeleteId(null)}>
          <div className="adm-modal adm-modal-sm" onClick={e=>e.stopPropagation()}>
            <h3>Delete collection?</h3>
            <p>Products in this collection won't be deleted but will lose their collection tag.</p>
            <div className="adm-modal-foot" style={{marginTop:20}}>
              <button className="adm-btn adm-btn-ghost" onClick={()=>setDeleteId(null)}>Cancel</button>
              <button className="adm-btn adm-btn-danger" onClick={()=>handleDelete(deleteId)}>Delete collection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /* ── LIST ── */
  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div><h1>Collections</h1><p>{collections.length} total · {collections.filter(c=>c.active).length} active</p></div>
        <button className="adm-btn adm-btn-gold" onClick={openNew}><Plus size={14}/>Add collection</button>
      </div>
      {loading ? <div className="adm-loading">Loading…</div> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Collection</th><th>Visibility</th><th>Products</th><th>Handle</th><th>Actions</th></tr></thead>
            <tbody>
              {collections.length===0 && <tr><td colSpan={5} style={{textAlign:"center",padding:40,color:"var(--adm-muted)"}}>No collections yet. Create your first one.</td></tr>}
              {collections.map(c=>(
                <tr key={c.id} onClick={()=>openEdit(c)} style={{cursor:"pointer"}}>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:60,height:44,borderRadius:5,overflow:"hidden",background:"#f1f2f4",flexShrink:0,border:"1px solid var(--adm-border)"}}>
                        {collImg(c)
                          ? <img src={collImg(c)} alt={c.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                          : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🪡</div>}
                      </div>
                      <div>
                        <p style={{fontWeight:600,margin:"0 0 2px",fontSize:13.5}}>{c.title}</p>
                        <p style={{margin:0,fontSize:11.5,color:"var(--adm-muted)"}}>{c.sub}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className={`adm-badge ${c.active?"active-badge":"inactive-badge"}`}>{c.active?"Active":"Draft"}</span></td>
                  <td style={{color:"var(--adm-muted)",fontSize:13}}>{c.count||0}</td>
                  <td><code style={{fontSize:11,background:"#f1f2f4",padding:"2px 7px",borderRadius:4}}>{c.id}</code></td>
                  <td onClick={e=>e.stopPropagation()}>
                    <div style={{display:"flex",gap:6}}>
                      <button className="adm-icon-btn" onClick={()=>openEdit(c)}><Edit2 size={13}/></button>
                      <button className="adm-icon-btn danger" onClick={()=>setDeleteId(c.id)}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {deleteId && (
        <div className="adm-modal-overlay" onClick={()=>setDeleteId(null)}>
          <div className="adm-modal adm-modal-sm" onClick={e=>e.stopPropagation()}>
            <h3>Delete collection?</h3>
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
