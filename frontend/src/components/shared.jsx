import React, { useState, useEffect, useRef } from "react";
import { Star } from "lucide-react";

/* ─────────────────────────────────────
   LOGO — only used in nav, footer, admin
   (never as a small decoration)
───────────────────────────────────── */
export function Logo({ size = 38 }) {
  return (
    <img src="/logo.svg" alt="Aaradhya's Creation"
      style={{ height: size, width: "auto", objectFit: "contain", display: "block" }} />
  );
}

/* ─────────────────────────────────────
   HERO ORNAMENT  (replaces SareeBox3D)
   — concentric gold rings with rotating
     inner star, no logo shrinkage
───────────────────────────────────── */
export function HeroOrnament() {
  return (
    <div className="hero-ornament" aria-hidden="true">
      <svg viewBox="0 0 260 260" className="hero-orn-svg">
        <defs>
          <radialGradient id="hog" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#e5c97a" stopOpacity="0.9"/>
            <stop offset="60%"  stopColor="#C8A158" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#C8A158" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="holine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#C8A158" stopOpacity="0"/>
            <stop offset="50%"  stopColor="#C8A158" stopOpacity="1"/>
            <stop offset="100%" stopColor="#C8A158" stopOpacity="0"/>
          </linearGradient>
        </defs>

        {/* Outer dashed ring */}
        <circle cx="130" cy="130" r="122" stroke="#C8A158" strokeWidth="0.6"
          fill="none" opacity="0.3" strokeDasharray="3 6"
          style={{ animation: "rnRotCW 40s linear infinite", transformOrigin: "130px 130px" }}/>

        {/* Mid solid ring */}
        <circle cx="130" cy="130" r="102" stroke="#C8A158" strokeWidth="0.8"
          fill="none" opacity="0.45"
          style={{ animation: "rnRotCCW 28s linear infinite", transformOrigin: "130px 130px" }}/>

        {/* 16-point diamond ring */}
        <g style={{ animation: "rnRotCW 22s linear infinite", transformOrigin: "130px 130px" }}>
          {Array.from({length:16},(_,i)=>{
            const a = (i/16)*Math.PI*2, r=102;
            const x = 130+r*Math.cos(a), y = 130+r*Math.sin(a);
            return i%2===0
              ? <polygon key={i} points={`${x},${y-4} ${x+2.5},${y} ${x},${y+4} ${x-2.5},${y}`} fill="#C8A158" opacity="0.7"/>
              : <circle key={i} cx={x} cy={y} r="1.2" fill="#C8A158" opacity="0.4"/>;
          })}
        </g>

        {/* Inner ring */}
        <circle cx="130" cy="130" r="78" stroke="#C8A158" strokeWidth="0.6"
          fill="none" opacity="0.3"/>

        {/* 8-petal lotus */}
        <g style={{ animation: "rnRotCCW 18s linear infinite", transformOrigin: "130px 130px" }}>
          {Array.from({length:8},(_,i)=>{
            const a0=(i/8)*Math.PI*2, a1=a0+Math.PI/8;
            const r1=58, r2=74;
            const x1=130+r1*Math.cos(a0-0.25), y1=130+r1*Math.sin(a0-0.25);
            const x2=130+r2*Math.cos(a1),      y2=130+r2*Math.sin(a1);
            const x3=130+r1*Math.cos(a0+0.25), y3=130+r1*Math.sin(a0+0.25);
            return <path key={i} d={`M130,130 Q${x1},${y1} ${x2},${y2} Q${x3},${y3} 130,130`}
              stroke="#C8A158" strokeWidth="0.7" fill="rgba(200,161,88,0.07)"/>;
          })}
        </g>

        {/* Inner glow */}
        <circle cx="130" cy="130" r="55" fill="url(#hog)"/>

        {/* 8-spoke star */}
        <g style={{ animation: "rnRotCW 14s linear infinite", transformOrigin: "130px 130px" }}>
          {Array.from({length:8},(_,i)=>{
            const a=(i/8)*Math.PI*2;
            return <line key={i} x1="130" y1="130"
              x2={130+46*Math.cos(a)} y2={130+46*Math.sin(a)}
              stroke="#C8A158" strokeWidth="0.6" opacity="0.55"/>;
          })}
        </g>

        {/* Inner diamond */}
        <polygon points="130,108 148,130 130,152 112,130"
          stroke="#C8A158" strokeWidth="1" fill="rgba(200,161,88,0.12)"/>
        <polygon points="130,118 140,130 130,142 120,130"
          stroke="#C8A158" strokeWidth="0.6" fill="rgba(200,161,88,0.18)"/>

        {/* Centre dot */}
        <circle cx="130" cy="130" r="5" fill="#C8A158"/>
        <circle cx="130" cy="130" r="2.5" fill="#e5c97a"/>

        {/* Horizontal + vertical cross lines */}
        <line x1="30"  y1="130" x2="100" y2="130" stroke="url(#holine)" strokeWidth="0.6"/>
        <line x1="160" y1="130" x2="230" y2="130" stroke="url(#holine)" strokeWidth="0.6"/>
        <line x1="130" y1="30"  x2="130" y2="100" stroke="url(#holine)" strokeWidth="0.6"/>
        <line x1="130" y1="160" x2="130" y2="230" stroke="url(#holine)" strokeWidth="0.6"/>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────
   NEWSLETTER ORNAMENT
   — horizontal zari / meenakari divider
───────────────────────────────────── */
export function NewsletterOrnament() {
  return (
    <svg viewBox="0 0 520 56" className="nl-ornament" aria-hidden="true">
      <defs>
        <linearGradient id="nlg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="rgba(200,161,88,0)"/>
          <stop offset="22%"  stopColor="#C8A158"/>
          <stop offset="50%"  stopColor="#e5c97a"/>
          <stop offset="78%"  stopColor="#C8A158"/>
          <stop offset="100%" stopColor="rgba(200,161,88,0)"/>
        </linearGradient>
      </defs>

      {/* Main line */}
      <line x1="0" y1="28" x2="520" y2="28" stroke="url(#nlg)" strokeWidth="0.7"/>

      {/* Central large diamond */}
      <polygon points="260,12 276,28 260,44 244,28" stroke="#C8A158" strokeWidth="1" fill="rgba(200,161,88,0.13)"/>
      <polygon points="260,18 270,28 260,38 250,28" stroke="#C8A158" strokeWidth="0.7" fill="rgba(200,161,88,0.2)"/>
      <circle cx="260" cy="28" r="3" fill="#C8A158"/>

      {/* Inner dots on line */}
      {[-88,-66,-44,44,66,88].map(o=>(
        <circle key={o} cx={260+o} cy="28" r="2" fill="#C8A158" opacity="0.55"/>
      ))}
      {[-140,-120,-100,100,120,140].map(o=>(
        <circle key={o} cx={260+o} cy="28" r="1.2" fill="#C8A158" opacity="0.3"/>
      ))}

      {/* Small side diamonds */}
      {[-115,115].map(o=>(
        <polygon key={o} points={`${260+o},22 ${260+o+6},28 ${260+o},34 ${260+o-6},28`}
          stroke="#C8A158" strokeWidth="0.8" fill="rgba(200,161,88,0.15)"/>
      ))}

      {/* Curved flourishes either side of centre diamond */}
      <path d="M 234 28 Q 220 19 205 28" stroke="#C8A158" fill="none" strokeWidth="0.7" opacity="0.65"/>
      <path d="M 234 28 Q 220 37 205 28" stroke="#C8A158" fill="none" strokeWidth="0.7" opacity="0.4"/>
      <path d="M 286 28 Q 300 19 315 28" stroke="#C8A158" fill="none" strokeWidth="0.7" opacity="0.65"/>
      <path d="M 286 28 Q 300 37 315 28" stroke="#C8A158" fill="none" strokeWidth="0.7" opacity="0.4"/>

      {/* Corner accent lines */}
      <line x1="30"  y1="22" x2="30"  y2="34" stroke="#C8A158" strokeWidth="0.7" opacity="0.4"/>
      <line x1="490" y1="22" x2="490" y2="34" stroke="#C8A158" strokeWidth="0.7" opacity="0.4"/>
    </svg>
  );
}

/* ─────────────────────────────────────
   HERITAGE MANDALA
   — decorative SVG mandala for the
     about/heritage dark green section
───────────────────────────────────── */
export function HeritageMandala() {
  return (
    <div className="heritage-mandala" aria-hidden="true">
      <svg viewBox="0 0 200 200">
        {/* Outer dashed halo */}
        <circle cx="100" cy="100" r="95" stroke="#C8A158" strokeWidth="0.5"
          fill="none" opacity="0.18" strokeDasharray="2 5"
          style={{ animation:"rnRotCW 50s linear infinite", transformOrigin:"100px 100px" }}/>

        {/* 12 outer spokes */}
        <g opacity="0.2"
          style={{ animation:"rnRotCCW 30s linear infinite", transformOrigin:"100px 100px" }}>
          {Array.from({length:12},(_,i)=>{
            const a=(i/12)*Math.PI*2;
            return <line key={i} x1={100+62*Math.cos(a)} y1={100+62*Math.sin(a)}
              x2={100+88*Math.cos(a)} y2={100+88*Math.sin(a)}
              stroke="#C8A158" strokeWidth="0.8"/>;
          })}
        </g>

        {/* Mid ring */}
        <circle cx="100" cy="100" r="62" stroke="#C8A158" strokeWidth="0.5"
          fill="none" opacity="0.25"/>

        {/* 8-petal lotus */}
        <g opacity="0.35"
          style={{ animation:"rnRotCW 20s linear infinite", transformOrigin:"100px 100px" }}>
          {Array.from({length:8},(_,i)=>{
            const a0=(i/8)*Math.PI*2, half=Math.PI/8;
            const tip = { x:100+55*Math.cos(a0), y:100+55*Math.sin(a0) };
            const lc  = { x:100+38*Math.cos(a0-half), y:100+38*Math.sin(a0-half) };
            const rc  = { x:100+38*Math.cos(a0+half), y:100+38*Math.sin(a0+half) };
            return <path key={i}
              d={`M100,100 Q${lc.x},${lc.y} ${tip.x},${tip.y} Q${rc.x},${rc.y} 100,100`}
              stroke="#C8A158" strokeWidth="0.7" fill="rgba(200,161,88,0.12)"/>;
          })}
        </g>

        {/* Inner ring */}
        <circle cx="100" cy="100" r="36" stroke="#C8A158" strokeWidth="0.5"
          fill="none" opacity="0.3"/>

        {/* 8 diamond markers on inner ring */}
        <g style={{ animation:"rnRotCCW 12s linear infinite", transformOrigin:"100px 100px" }}>
          {Array.from({length:8},(_,i)=>{
            const a=(i/8)*Math.PI*2, r=36;
            const x=100+r*Math.cos(a), y=100+r*Math.sin(a);
            return <polygon key={i}
              points={`${x},${y-3.5} ${x+2.5},${y} ${x},${y+3.5} ${x-2.5},${y}`}
              fill="#C8A158" opacity="0.5"/>;
          })}
        </g>

        {/* Centre */}
        <circle cx="100" cy="100" r="12" stroke="#C8A158" strokeWidth="0.7"
          fill="rgba(200,161,88,0.1)"/>
        <circle cx="100" cy="100" r="5"  fill="#C8A158" opacity="0.5"/>
        <circle cx="100" cy="100" r="2"  fill="#e5c97a"/>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────
   PRELOADER ORNAMENT (replaces logo in preloader)
───────────────────────────────────── */
export function PreloaderMark() {
  return (
    <div className="preloader-mark" aria-hidden="true">
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" stroke="#C8A158" strokeWidth="0.6"
          fill="none" strokeDasharray="4 8"
          style={{ animation:"rnRotCW 6s linear infinite", transformOrigin:"60px 60px" }}/>
        <circle cx="60" cy="60" r="42" stroke="#C8A158" strokeWidth="0.4" fill="none" opacity="0.4"/>
        {Array.from({length:8},(_,i)=>{
          const a=(i/8)*Math.PI*2;
          return <line key={i} x1="60" y1="60"
            x2={60+34*Math.cos(a)} y2={60+34*Math.sin(a)}
            stroke="#C8A158" strokeWidth="0.5" opacity="0.5"/>;
        })}
        <polygon points="60,44 72,60 60,76 48,60" stroke="#C8A158" strokeWidth="0.8"
          fill="rgba(200,161,88,0.15)"/>
        <circle cx="60" cy="60" r="4" fill="#C8A158"/>
        <circle cx="60" cy="60" r="2" fill="#e5c97a"/>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────
   RE-USED PRIMITIVES
───────────────────────────────────── */
export function ZariDivider({ flip }) {
  return (
    <div className="zari-divider" aria-hidden="true">
      <svg viewBox="0 0 1200 40" preserveAspectRatio="none"
        style={{ transform: flip ? "scaleY(-1)" : "none" }}>
        <path d="M0 20 Q 50 2,100 20 T 200 20 T 300 20 T 400 20 T 500 20 T 600 20 T 700 20 T 800 20 T 900 20 T 1000 20 T 1100 20 T 1200 20"
          fill="none" stroke="url(#zg)" strokeWidth="1.5"/>
        <defs>
          <linearGradient id="zg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="transparent"/>
            <stop offset="20%"  stopColor="#C8A158"/>
            <stop offset="50%"  stopColor="#e5c97a"/>
            <stop offset="80%"  stopColor="#C8A158"/>
            <stop offset="100%" stopColor="transparent"/>
          </linearGradient>
        </defs>
      </svg>
      <div className="zari-center-ornament">◆</div>
    </div>
  );
}

export function Eyebrow({ children, className = "" }) {
  return <p className={`ac-eyebrow ${className}`}>{children}</p>;
}

export function StarRow({ rating = 5 }) {
  return (
    <div style={{ display:"flex", gap:2, margin:"5px 0" }}>
      {[1,2,3,4,5].map(i=>(
        <Star key={i} size={11}
          fill={i<=Math.round(rating)?"#C8A158":"none"}
          color="#C8A158" strokeWidth={1.5}/>
      ))}
    </div>
  );
}

export function Reveal({ children, delay=0, className="", as:Tag="div", style={} }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(()=>{
    const obs = new IntersectionObserver(([e])=>{ if(e.isIntersecting){setVis(true);obs.disconnect();} },{threshold:0.12});
    if(ref.current) obs.observe(ref.current);
    return ()=>obs.disconnect();
  },[]);
  return (
    <Tag ref={ref} className={className}
      style={{ opacity:vis?1:0, transform:vis?"translateY(0)":"translateY(28px)",
        transition:`opacity .7s ease ${delay}ms, transform .7s ease ${delay}ms`, ...style }}>
      {children}
    </Tag>
  );
}

export function Card3D({ children, className="" }) {
  const ref = useRef(null);
  const move = e=>{
    const r = ref.current?.getBoundingClientRect(); if(!r) return;
    const x=((e.clientX-r.left)/r.width-0.5)*14, y=((e.clientY-r.top)/r.height-0.5)*-14;
    ref.current.style.transform=`perspective(700px) rotateY(${x}deg) rotateX(${y}deg) scale(1.015)`;
  };
  const reset=()=>{ if(ref.current) ref.current.style.transform=""; };
  return (
    <div ref={ref} className={className} onMouseMove={move} onMouseLeave={reset}
      style={{ transition:"transform .18s ease", willChange:"transform" }}>
      {children}
    </div>
  );
}

export function GoldParticles() {
  const pts = Array.from({length:20},(_,i)=>({
    x:Math.random()*100, delay:Math.random()*8, dur:6+Math.random()*10, big:Math.random()>.7
  }));
  return (
    <svg className="gold-particles" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {pts.map((p,i)=>(
        <circle key={i} cx={p.x} cy={100} r={p.big?1.2:0.6} fill="#C8A158" opacity="0.55">
          <animate attributeName="cy" values="100;-5" dur={`${p.dur}s`} begin={`${p.delay}s`} repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0;0.7;0" dur={`${p.dur}s`} begin={`${p.delay}s`} repeatCount="indefinite"/>
        </circle>
      ))}
    </svg>
  );
}
