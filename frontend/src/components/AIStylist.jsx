/**
 * Smart Saree Advisor — 100% local, no API key needed.
 * Reads your live product catalogue and matches customer queries
 * using keyword extraction, budget parsing and collection scoring.
 */
import React, { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, ChevronDown } from "lucide-react";
import { api } from "../api/client.js";
import { rupee } from "../data/content.js";
import "../styles/aistylist.css";

/* ── Greeting shown on open ── */
const GREETING = `Namaste! I'm **Aaradhya**, your personal saree styling advisor. ✨

Tell me about your occasion, budget, or fabric preference and I'll recommend the perfect saree from our collection.

Try: *"Bridal saree under ₹65,000"* or *"Light silk for a reception"* or *"Best Banarasi we have"*`;

/* ── Quick suggestion chips ── */
const QUICK = [
  "Best bridal sarees",
  "Under ₹30,000",
  "Banarasi silk",
  "Festive saree",
  "Most popular",
  "Surprise me!",
];

/* ── Keyword maps ── */
const OCCASION_MAP = {
  bridal: ["bridal","bride","wedding","shaadi","shadi","nikah","engagement","vivah"],
  festive: ["festive","diwali","navratri","durga","puja","pooja","festival","eid","onam","ugadi"],
  reception: ["reception","party","cocktail","function","ceremony"],
  sangeet: ["sangeet","mehendi","mehndi","haldi"],
  casual: ["casual","everyday","daily","office","work","college"],
};
const FABRIC_MAP = {
  banarasi: ["banarasi","banaras","katan","varanasi","zari silk"],
  kanjivaram: ["kanjivaram","kanchi","kanchipuram","temple silk","south silk"],
  organza: ["organza","light","featherlight","transparent","sheer","gossamer"],
  silk: ["silk","pure silk","mulberry","tissue"],
  georgette: ["georgette","chiffon","drape","flowing","fluid"],
  handloom: ["handloom","weave","artisan","cotton silk","linen"],
};

/* ── Parse budget from natural text ── */
function parseBudget(text) {
  const t = text.toLowerCase().replace(/,/g,"");
  const m = t.match(/(?:under|below|less than|within|upto|up to|budget[:\s]+)?[₹rs]?\s*(\d+(?:\.\d+)?)\s*(k|lakh|l|thousand)?/);
  if (!m) return null;
  let n = parseFloat(m[1]);
  const unit = m[2] || "";
  if (unit === "k" || unit === "thousand") n *= 1000;
  if (unit === "lakh" || unit === "l") n *= 100000;
  return n >= 1000 ? n : null;
}

/* ── Score a product against parsed intent ── */
function score(product, intent) {
  let s = 0;
  const name = (product.name + " " + product.fabric + " " + product.collection).toLowerCase();

  if (intent.budget && product.price <= intent.budget) s += 30;
  else if (intent.budget && product.price > intent.budget) s -= 20;

  intent.occasions.forEach(occ => {
    if (OCCASION_MAP[occ]?.some(kw => name.includes(kw) || product.collection?.includes(kw))) s += 25;
    if (product.collection === occ) s += 20;
  });

  intent.fabrics.forEach(fab => {
    if (FABRIC_MAP[fab]?.some(kw => name.includes(kw))) s += 20;
    if (product.collection === fab) s += 15;
  });

  // Boost highly rated and featured products
  s += (product.rating || 0) * 3;
  if (product.featured) s += 10;
  if (product.stock > 0) s += 5;

  return s;
}

/* ── Build a response from matched products ── */
function buildReply(input, products) {
  const t = input.toLowerCase();

  // Greetings
  if (/^(hi|hello|hey|namaste|hii|helo)\W*$/.test(t.trim())) {
    return `Namaste! 🙏 I'm here to help you find your perfect saree.\n\nTell me about your **occasion**, your **budget**, or a **fabric** you love and I'll suggest the best matches from our collection.`;
  }

  // Surprise / random
  if (t.includes("surprise") || t.includes("random") || t.includes("anything")) {
    const picks = [...products].sort(() => Math.random() - 0.5).slice(0, 2);
    return `Here are two beautiful picks just for you 🌸\n\n${formatProducts(picks)}\n\nWould you like to narrow it down by occasion or budget?`;
  }

  // Most popular / best sellers
  if (/popular|best seller|top|highly rated|most loved/.test(t)) {
    const top = [...products].sort((a,b) => (b.rating||0)-(a.rating||0)).slice(0,3);
    return `Our most loved sarees right now ⭐\n\n${formatProducts(top)}`;
  }

  // Parse intent
  const budget = parseBudget(t);
  const occasions = Object.keys(OCCASION_MAP).filter(occ =>
    OCCASION_MAP[occ].some(kw => t.includes(kw))
  );
  const fabrics = Object.keys(FABRIC_MAP).filter(fab =>
    FABRIC_MAP[fab].some(kw => t.includes(kw))
  );

  const intent = { budget, occasions, fabrics };
  const hasIntent = budget || occasions.length || fabrics.length;

  if (!hasIntent) {
    return `I'd love to help you find the right saree! Could you share a little more? For example:\n\n• **"Bridal saree under ₹70,000"**\n• **"Something light for a reception"**\n• **"Banarasi silk"**\n• **"Best-rated sarees"**`;
  }

  // Score and rank
  const ranked = products
    .map(p => ({ p, s: score(p, intent) }))
    .filter(x => x.s > 0)
    .sort((a,b) => b.s - a.s)
    .slice(0, 3)
    .map(x => x.p);

  if (ranked.length === 0) {
    let msg = `I couldn't find an exact match`;
    if (budget) msg += ` within ₹${budget.toLocaleString("en-IN")}`;
    msg += `. Here are our nearest picks:\n\n`;
    const fallback = [...products].sort((a,b)=>(b.rating||0)-(a.rating||0)).slice(0,2);
    return msg + formatProducts(fallback) + `\n\nWould you like to adjust your budget or try a different occasion?`;
  }

  let intro = "Here's what I'd recommend 🌸\n\n";
  if (occasions.length) intro = `For **${occasions.join(" & ")}**, here are my top picks 💫\n\n`;
  if (budget) intro += `*(within your budget of ${rupee(budget)})*\n\n`;

  return intro + formatProducts(ranked) + `\n\nWould you like to know more about any of these? I can also suggest by occasion, fabric, or budget.`;
}

function formatProducts(products) {
  return products.map(p => {
    const off = p.mrp ? Math.round(100-(p.price/p.mrp)*100) : 0;
    return `**${p.name}** — ${rupee(p.price)}${off > 0 ? ` *(${off}% off ${rupee(p.mrp)})*` : ""}\n_${p.fabric}_ · ${["⭐","⭐⭐","⭐⭐⭐","⭐⭐⭐⭐","⭐⭐⭐⭐⭐"][Math.round(p.rating||4)-1]} ${p.rating||4}/5${p.stock<=3&&p.stock>0?" · ⚡ Only "+p.stock+" left":""}`;
  }).join("\n\n");
}

function renderMd(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")
    .replace(/\*(.*?)\*/g,"<em>$1</em>")
    .replace(/_(.*?)_/g,"<em>$1</em>")
    .replace(/\n/g,"<br/>");
}

/* ══ Component ══ */
export default function AIStylist() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([{ role:"assistant", content: GREETING }]);
  const [input, setInput]       = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [pulse, setPulse]       = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Load products once
  useEffect(() => { api.getProducts().then(setProducts).catch(()=>{}); }, []);

  // Pulse after 10s if not opened
  useEffect(() => {
    const t = setTimeout(()=>{ if(!hasOpened) setPulse(true); }, 10000);
    return ()=>clearTimeout(t);
  }, [hasOpened]);

  useEffect(() => {
    if (open) {
      setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}), 80);
      inputRef.current?.focus();
    }
  }, [messages, open]);

  const openChat = () => { setOpen(true); setHasOpened(true); setPulse(false); };

  const send = async (text) => {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role:"user", content: msg }]);
    setLoading(true);
    // Small delay to feel natural
    await new Promise(r => setTimeout(r, 420));
    const reply = buildReply(msg, products);
    setMessages(prev => [...prev, { role:"assistant", content: reply }]);
    setLoading(false);
  };

  const handleKey = e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  return (
    <>
      {!open && (
        <button className={`ai-fab ${pulse?"pulse":""}`} onClick={openChat} aria-label="Saree Style Advisor">
          <Sparkles size={20}/>
          <span className="ai-fab-label">Style Advisor</span>
          {pulse && <span className="ai-fab-ping"/>}
        </button>
      )}

      {open && (
        <div className="ai-panel">
          <div className="ai-header">
            <div className="ai-header-avatar"><Sparkles size={16}/></div>
            <div className="ai-header-info">
              <h4>Aaradhya <span className="ai-live-dot"/></h4>
              <p>Personal Saree Styling Advisor · {products.length} sarees in store</p>
            </div>
            <button className="ai-close" onClick={()=>setOpen(false)}><X size={18}/></button>
          </div>

          <div className="ai-messages">
            {messages.map((m,i)=>(
              <div key={i} className={`ai-msg ${m.role}`}>
                {m.role==="assistant" && <div className="ai-msg-avatar"><Sparkles size={11}/></div>}
                <div className="ai-msg-bubble" dangerouslySetInnerHTML={{__html:renderMd(m.content)}}/>
              </div>
            ))}
            {loading && (
              <div className="ai-msg assistant">
                <div className="ai-msg-avatar"><Sparkles size={11}/></div>
                <div className="ai-msg-bubble ai-typing"><span/><span/><span/></div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Quick chips — visible until 2nd message sent */}
          {messages.length <= 2 && (
            <div className="ai-quick-prompts">
              {QUICK.map(p=>(
                <button key={p} className="ai-quick-chip" onClick={()=>send(p)}>{p}</button>
              ))}
            </div>
          )}

          <div className="ai-input-row">
            <textarea
              ref={inputRef}
              className="ai-input"
              placeholder="Ask me about sarees…"
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
            />
            <button className="ai-send" onClick={()=>send(input)} disabled={!input.trim()||loading}>
              <Send size={16}/>
            </button>
          </div>
          <p className="ai-footer-note">Reads your live product catalogue · No external API needed</p>
        </div>
      )}
    </>
  );
}
