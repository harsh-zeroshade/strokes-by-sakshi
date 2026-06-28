import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  motion, AnimatePresence,
  useScroll, useTransform,
  useSpring, useMotionValue, useInView,
} from 'motion/react';
import * as THREE from 'three';
import { productAPI } from '../api';
import { STORAGE_URL } from '../config';

/* ─── helpers ──────────────────────────────────────────── */
function getImg(p) {
  const url = p?.primary_image?.image_url || p?.thumbnail || p?.image_url;
  if (!url) return null;
  return url.startsWith('http') ? url : `${STORAGE_URL}/${url}`;
}
function fmt(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(price);
}

const HUES  = ['#C7694F', '#9CAF88', '#C9A94E', '#8a6e52', '#7a6888', '#C7694F'];
const SPANS = ['normal','tall','wide','normal','normal','wide','normal','tall','normal'];

/* ─── Three.js brush ribbon ────────────────────────────── */
function BrushRibbonCanvas() {
  const mountRef = useRef(null);
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W/H, 0.1, 100);
    camera.position.set(0, 0, 8);

    const ribbons = [];
    const defs = [
      { color:'#C7694F', width:0.045, speed:0.28, amplitude:2.2, offset:0,             opacity:0.7  },
      { color:'#9CAF88', width:0.025, speed:0.18, amplitude:1.6, offset:Math.PI*0.7,   opacity:0.5  },
      { color:'#F7F2EA', width:0.012, speed:0.38, amplitude:2.8, offset:Math.PI*1.4,   opacity:0.25 },
      { color:'#C7694F', width:0.008, speed:0.48, amplitude:1.2, offset:Math.PI*0.3,   opacity:0.18 },
      { color:'#C9A94E', width:0.018, speed:0.22, amplitude:2.0, offset:Math.PI*1.1,   opacity:0.35 },
    ];
    const SEG = 180;
    defs.forEach(def => {
      const pts = [];
      for (let i=0; i<=SEG; i++) {
        const t = (i/SEG)*Math.PI*4-Math.PI*2;
        pts.push(new THREE.Vector3(
          t*0.85,
          Math.sin(t+def.offset)*def.amplitude,
          Math.cos(t*0.5+def.offset)*1.2
        ));
      }
      const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), SEG*2, def.width, 8, false);
      const mat = new THREE.MeshBasicMaterial({ color:def.color, transparent:true, opacity:def.opacity, depthWrite:false });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      ribbons.push({ mesh, def });
    });

    /* Dot cloud */
    const N=600, dPos=new Float32Array(N*3), dCol=new Float32Array(N*3);
    const pal=[new THREE.Color('#C7694F'),new THREE.Color('#9CAF88'),new THREE.Color('#F7F2EA')];
    for(let i=0;i<N;i++){
      dPos[i*3]=(Math.random()-0.5)*18; dPos[i*3+1]=(Math.random()-0.5)*8; dPos[i*3+2]=(Math.random()-0.5)*4;
      const c=pal[i%pal.length]; dCol[i*3]=c.r; dCol[i*3+1]=c.g; dCol[i*3+2]=c.b;
    }
    const dotGeo=new THREE.BufferGeometry();
    dotGeo.setAttribute('position',new THREE.BufferAttribute(dPos,3));
    dotGeo.setAttribute('color',new THREE.BufferAttribute(dCol,3));
    const dotMat=new THREE.PointsMaterial({size:0.035,vertexColors:true,transparent:true,opacity:0.35,depthWrite:false});
    const dots=new THREE.Points(dotGeo,dotMat);
    scene.add(dots);

    let mx=0, my=0, animId;
    const onMouse=e=>{ mx=(e.clientX/window.innerWidth-0.5)*1.2; my=-(e.clientY/window.innerHeight-0.5)*0.7; };
    const onResize=()=>{ const w=el.clientWidth,h=el.clientHeight; renderer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix(); };
    window.addEventListener('mousemove',onMouse);
    window.addEventListener('resize',onResize);

    const clock=new THREE.Clock();
    const tick=()=>{
      animId=requestAnimationFrame(tick);
      const t=clock.getElapsedTime();
      ribbons.forEach(({mesh,def})=>{
        mesh.rotation.x+=(my*0.15-mesh.rotation.x)*0.04;
        mesh.rotation.y+=(mx*0.10-mesh.rotation.y)*0.04;
        mesh.position.y=Math.sin(t*def.speed*0.5)*0.15;
      });
      dots.rotation.y=t*0.015;
      dots.rotation.z=Math.sin(t*0.08)*0.05;
      renderer.render(scene,camera);
    };
    tick();

    return ()=>{
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove',onMouse);
      window.removeEventListener('resize',onResize);
      ribbons.forEach(({mesh})=>{ mesh.geometry.dispose(); mesh.material.dispose(); });
      dotGeo.dispose(); dotMat.dispose(); renderer.dispose();
      if(el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);
  return <div ref={mountRef} style={{ position:'absolute', inset:0, pointerEvents:'none' }}/>;
}

/* ─── Scroll-traced SVG ink path ───────────────────────── */
function InkTracePath() {
  const pathRef = useRef(null);
  const wrapRef = useRef(null);
  const { scrollYProgress } = useScroll({ target:wrapRef, offset:['start end','end start'] });
  const draw = useTransform(scrollYProgress, [0,1], [0,1]);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray  = len;
    path.style.strokeDashoffset = len;
    return draw.on('change', v => { path.style.strokeDashoffset = len*(1-v); });
  }, [draw]);

  return (
    <div ref={wrapRef} style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0 }}>
      <svg viewBox="0 0 1400 2000" preserveAspectRatio="none"
        style={{ width:'100%', height:'100%', position:'absolute', inset:0 }}>
        <path ref={pathRef}
          d="M-50,100C300,80 1100,200 1450,140C1600,110 1500,350 1200,380C900,410 400,300 100,420C-100,490 50,650 400,680C750,710 1300,600 1450,700C1560,770 1400,920 1100,940C800,960 300,850 100,980C-50,1060 100,1220 450,1240C800,1260 1300,1160 1450,1280C1570,1360 1350,1520 1050,1540C750,1560 250,1450 100,1600C-30,1700 200,1900 600,1920"
          fill="none" stroke="rgba(199,105,79,0.16)" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

/* ─── Gallery Card ─────────────────────────────────────── */
function GalleryCard({ product, index, hue, span, onOpen }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once:true, margin:'-80px' });
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-1,1], [4,-4]), { stiffness:160, damping:18 });
  const ry = useSpring(useTransform(mx, [-1,1], [-4,4]), { stiffness:160, damping:18 });

  const onMouseMove = e => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set(((e.clientX-rect.left)/rect.width -0.5)*2);
    my.set(((e.clientY-rect.top) /rect.height-0.5)*2);
  };
  const onMouseLeave = () => { mx.set(0); my.set(0); setHovered(false); };

  const img = getImg(product);

  return (
    <motion.article
      ref={ref}
      onClick={() => onOpen(product)}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onMouseLeave}
      initial={{ opacity:0, y:50, scale:0.97 }}
      animate={inView ? { opacity:1, y:0, scale:1 } : {}}
      transition={{ duration:0.75, delay:index*0.07, ease:[0.22,1,0.36,1] }}
      style={{ rotateX:rx, rotateY:ry, transformStyle:'preserve-3d', perspective:800 }}
      className="relative rounded-sm overflow-hidden flex flex-col cursor-pointer bg-ivory dark:bg-[#1e1c18] border border-charcoal/10 dark:border-white/8 hover:border-terracotta/35 dark:hover:border-terracotta/35 transition-colors duration-300"
    >
      {/* Art area */}
      <div className="relative overflow-hidden bg-cream dark:bg-[#252219]" style={{ aspectRatio:'3/4' }}>
        {img && !imgError ? (
          <img src={img} alt={product.name} draggable={false}
            onError={() => setImgError(true)}
            style={{
              position:'absolute', inset:0, width:'100%', height:'100%',
              objectFit:'cover', opacity:0.88,
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
              transition:'transform 0.7s cubic-bezier(0.22,1,0.36,1)',
            }}/>
        ) : (
          /* SVG art fallback */
          <svg viewBox="0 0 200 200" style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.9 }}>
            <defs>
              <radialGradient id={`glow-${product.id}`} cx="50%" cy="50%" r="60%">
                <stop offset="0%"   stopColor={hue} stopOpacity="0.12"/>
                <stop offset="100%" stopColor={hue} stopOpacity="0"/>
              </radialGradient>
              <filter id={`soft-${product.id}`}><feGaussianBlur stdDeviation="4"/></filter>
            </defs>
            <ellipse cx="100" cy="105" rx="80" ry="70"
              fill={`url(#glow-${product.id})`} filter={`url(#soft-${product.id})`}/>
            <path d={`M${20+product.id*3},${80+product.id*5} Q${80+product.id*4},${20+product.id*2} ${160-product.id*3},${100+product.id*3}`}
              fill="none" stroke={hue} strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
            <path d={`M${30+product.id*2},${120+product.id*3} Q100,${60+product.id*5} ${170-product.id*2},${80+product.id*4}`}
              fill="none" stroke={hue} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
            {[...Array(7)].map((_,i)=>(
              <circle key={i}
                cx={50+i*18+(product.id%3)*8} cy={140-i*6+(product.id%5)*4}
                r={1.5-i*0.15} fill={hue} opacity={0.6-i*0.07}/>
            ))}
          </svg>
        )}

        {/* Hover slide-up overlay */}
        <motion.div
          initial={false}
          animate={{ y: hovered ? 0 : '100%' }}
          transition={{ duration:0.38, ease:[0.22,1,0.36,1] }}
          style={{
            position:'absolute', bottom:0, left:0, right:0,
            padding:'20px 18px 18px',
            background:'linear-gradient(to top, rgba(13,13,13,0.9) 0%, transparent 100%)',
            display:'flex', flexDirection:'column', gap:4,
          }}>
          <span style={{ fontSize:11, color:'rgba(247,242,234,0.8)', letterSpacing:'0.04em' }}>
            {product.medium || product.product_type?.replace(/_/g,' ')}
          </span>
          <span style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:'#C7694F' }}>
            Click to expand
          </span>
        </motion.div>

        {/* Category badge */}
        <span style={{
          position:'absolute', top:14, left:14,
          fontSize:9, fontWeight:600, letterSpacing:'0.22em', textTransform:'uppercase',
          color:'rgba(247,242,234,0.7)', background:'rgba(13,13,13,0.75)',
          padding:'4px 10px', borderRadius:999, backdropFilter:'blur(8px)',
        }}>{product.product_type?.replace(/_/g,' ') || 'Original'}</span>

        {/* Price badge */}
        <span style={{
          position:'absolute', top:14, right:14,
          fontSize:10, color:'rgba(247,242,234,0.5)',
          fontFamily:"'Playfair Display',serif", fontStyle:'italic',
        }}>{fmt(product.price)}</span>
      </div>

      {/* Caption */}
      <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-t border-charcoal/8 dark:border-white/8 bg-ivory dark:bg-[#1e1c18]">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold text-charcoal dark:text-[#F0EDE8] leading-snug truncate">{product.name}</h3>
          {product.short_description && (
            <p className="text-[11px] text-charcoal-muted dark:text-[#9A9590] mt-0.5 truncate">{product.short_description}</p>
          )}
        </div>
        <motion.div animate={{ x:hovered?4:0, opacity:hovered?1:0.4 }} transition={{ duration:0.25 }}
          style={{ color:hue, fontSize:20, flexShrink:0, lineHeight:1 }}>↗</motion.div>
      </div>
    </motion.article>
  );
}

/* ─── Lightbox ─────────────────────────────────────────── */
function Lightbox({ product, all, onClose }) {
  const [current, setCurrent] = useState(all.findIndex(p => p.id === product.id));
  const shown = all[current] || product;
  const hue   = HUES[current % HUES.length];
  const img   = getImg(shown);
  const [imgError, setImgError] = useState(false);

  useEffect(() => { setImgError(false); }, [current]);

  useEffect(() => {
    const onKey = e => {
      if (e.key==='Escape') onClose();
      if (e.key==='ArrowRight') setCurrent(i => Math.min(i+1, all.length-1));
      if (e.key==='ArrowLeft')  setCurrent(i => Math.max(i-1, 0));
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow=''; };
  }, [all, onClose]);

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      transition={{ duration:0.3 }}
      style={{
        position:'fixed', inset:0, background:'rgba(9,8,7,0.92)',
        backdropFilter:'blur(12px)', zIndex:1000,
        display:'flex', alignItems:'center', justifyContent:'center', padding:24,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity:0, scale:0.94, y:30 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.96, y:20 }}
        transition={{ duration:0.45, ease:[0.22,1,0.36,1] }}
        onClick={e => e.stopPropagation()}
        style={{
          position:'relative', display:'grid',
          gridTemplateColumns:'1fr 380px',
          width:'100%', maxWidth:1040, maxHeight:'90vh',
          background:'#141414',
          border:'1px solid rgba(247,242,234,0.07)',
          borderRadius:4, overflow:'hidden',
        }}
        className="lb-panel"
      >
        {/* Close */}
        <button onClick={onClose}
          style={{
            position:'absolute', top:16, right:16, zIndex:10,
            background:'rgba(13,13,13,0.7)', border:'1px solid rgba(247,242,234,0.1)',
            color:'#F7F2EA', width:40, height:40, borderRadius:'50%',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', backdropFilter:'blur(8px)',
          }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        {/* Art panel */}
        <AnimatePresence mode="wait">
          <motion.div key={shown.id}
            initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}
            transition={{ duration:0.32 }}
            style={{
              position:'relative', minHeight:420,
              background:`linear-gradient(145deg, #111110 0%, #1c1b18 100%)`,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
            {img && !imgError ? (
              <img src={img} alt={shown.name} onError={() => setImgError(true)}
                style={{ maxWidth:'90%', maxHeight:'75vh', objectFit:'contain', borderRadius:2 }}/>
            ) : (
              <svg viewBox="0 0 400 400" style={{ width:'80%', height:'80%', padding:40 }}>
                <defs>
                  <radialGradient id="lb-glow" cx="50%" cy="50%" r="55%">
                    <stop offset="0%"   stopColor={hue} stopOpacity="0.15"/>
                    <stop offset="100%" stopColor={hue} stopOpacity="0"/>
                  </radialGradient>
                  <filter id="lb-blur"><feGaussianBlur stdDeviation="12"/></filter>
                </defs>
                <ellipse cx="200" cy="200" rx="160" ry="140"
                  fill="url(#lb-glow)" filter="url(#lb-blur)"/>
                {[{d:`M40,160 C120,60 280,320 360,160`,w:5,op:0.8},
                  {d:`M40,200 C120,100 280,300 360,200`,w:2,op:0.4},
                  {d:`M40,240 C120,150 280,260 360,240`,w:1,op:0.2}]
                  .map((s,i) => (
                    <motion.path key={i} d={s.d} fill="none" stroke={hue}
                      strokeWidth={s.w} strokeLinecap="round" opacity={s.op}
                      initial={{ pathLength:0 }} animate={{ pathLength:1 }}
                      transition={{ duration:1.2+i*0.3, delay:i*0.2 }}/>
                  ))}
              </svg>
            )}

            {/* Nav */}
            <button onClick={()=>setCurrent(i=>Math.max(i-1,0))} disabled={current===0}
              style={{
                position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
                background:'rgba(13,13,13,0.6)', border:'1px solid rgba(247,242,234,0.1)',
                color:'#F7F2EA', width:44, height:44, borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', fontSize:20, opacity: current===0?0.2:1,
              }}>←</button>
            <button onClick={()=>setCurrent(i=>Math.min(i+1,all.length-1))} disabled={current===all.length-1}
              style={{
                position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
                background:'rgba(13,13,13,0.6)', border:'1px solid rgba(247,242,234,0.1)',
                color:'#F7F2EA', width:44, height:44, borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', fontSize:20, opacity: current===all.length-1?0.2:1,
              }}>→</button>

            {/* Dot progress */}
            <div style={{ position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)',
              display:'flex', gap:8 }}>
              {all.slice(0, Math.min(all.length, 12)).map((_,i) => (
                <button key={i} onClick={()=>setCurrent(i)}
                  style={{
                    width: i===current?18:6, height:6, borderRadius:999, border:'none',
                    background: i===current ? hue : 'rgba(247,242,234,0.2)',
                    cursor:'pointer', padding:0,
                    transition:'width 0.3s ease, background 0.3s ease',
                  }}/>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Meta panel */}
        <AnimatePresence mode="wait">
          <motion.div key={shown.id+'-meta'}
            initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
            transition={{ duration:0.32, delay:0.08 }}
            style={{
              padding:'44px 32px 32px', display:'flex', flexDirection:'column', gap:20,
              borderLeft:'1px solid rgba(247,242,234,0.07)', overflowY:'auto',
            }}>
            <div>
              <span style={{ fontSize:10, fontWeight:600, letterSpacing:'0.25em',
                textTransform:'uppercase', color:hue, display:'block', marginBottom:8 }}>
                {shown.product_type?.replace(/_/g,' ') || 'Original'}
              </span>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.9rem',
                fontWeight:600, lineHeight:1.15, color:'#F7F2EA' }}>{shown.name}</h2>
              {shown.medium && (
                <p style={{ fontSize:13, color:'rgba(247,242,234,0.45)', marginTop:6,
                  letterSpacing:'0.02em' }}>{shown.medium}</p>
              )}
            </div>

            <div style={{ height:1, background:'rgba(247,242,234,0.07)' }}/>

            {shown.short_description && (
              <p style={{ fontSize:14, lineHeight:1.75, color:'rgba(247,242,234,0.65)',
                fontWeight:300 }}>{shown.short_description}</p>
            )}

            {/* Spec grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 16px' }}>
              {[
                { label:'Price',       val: fmt(shown.price)                         },
                { label:'Medium',      val: shown.medium                             },
                { label:'Dimensions',  val: shown.width_cm ? `${shown.width_cm}×${shown.height_cm}cm` : null },
                { label:'Orientation', val: shown.orientation                        },
              ].filter(s=>s.val).map(s=>(
                <div key={s.label}>
                  <p style={{ fontSize:9, letterSpacing:'0.22em', textTransform:'uppercase',
                    color:'rgba(247,242,234,0.3)', marginBottom:3 }}>{s.label}</p>
                  <p style={{ fontSize:13, color:'#F7F2EA',
                    fontFamily:"'Playfair Display',serif", fontStyle:'italic' }}>{s.val}</p>
                </div>
              ))}
            </div>

            <div style={{ height:1, background:'rgba(247,242,234,0.07)' }}/>

            {/* Actions */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <Link to={`/shop/${shown.slug}`}
                style={{
                  flex:1, minWidth:140, padding:'13px 20px', border:'none',
                  background:hue, color:'#0D0D0D',
                  fontFamily:"'Inter',sans-serif", fontSize:12,
                  fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase',
                  cursor:'pointer', borderRadius:2, textDecoration:'none',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                }}>
                View Artwork →
              </Link>
              <Link to="/commission"
                style={{
                  padding:'12px 18px', background:'transparent',
                  border:'1px solid rgba(247,242,234,0.12)', color:'rgba(247,242,234,0.5)',
                  fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:500,
                  letterSpacing:'0.08em', textTransform:'uppercase',
                  cursor:'pointer', borderRadius:2, textDecoration:'none',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                Commission Similar
              </Link>
            </div>

            <p style={{ fontSize:11, color:'rgba(247,242,234,0.25)', marginTop:'auto',
              letterSpacing:'0.08em' }}>{current+1} / {all.length}</p>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <style>{`
        @media (max-width:780px) {
          .lb-panel { grid-template-columns:1fr !important; grid-template-rows:1fr auto !important; }
        }
      `}</style>
    </motion.div>
  );
}

/* ─── Main Gallery Page ────────────────────────────────── */
export default function GalleryPage() {
  const [products,       setProducts]       = useState([]);
  const [categories,     setCategories]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [lightboxPiece,  setLightboxPiece]  = useState(null);

  const { scrollY }   = useScroll();
  const heroOpacity   = useTransform(scrollY, [0,380], [1,0]);
  const heroY         = useTransform(scrollY, [0,380], [0,-60]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = { per_page:24 };
    if (activeCategory) params.category = activeCategory;
    productAPI.all(params)
      .then(({ data }) => { if (!cancelled) setProducts(data.data || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeCategory]);

  useEffect(() => {
    productAPI.categories()
      .then(({ data }) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const openLightbox  = useCallback(p => setLightboxPiece(p), []);
  const closeLightbox = useCallback(()  => setLightboxPiece(null), []);

  const categoryPills = [{ slug:'', name:'All' }, ...categories];

  return (
    <div className="min-h-screen bg-ivory dark:bg-[#1A1814]">

      {/* ══ HERO — always dark ════════════════════════════ */}
      <section style={{ position:'relative', height:'100vh', minHeight:640,
        display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', textAlign:'center', overflow:'hidden', background:'#0D0D0D' }}>
        <div style={{ position:'absolute', inset:0,
          background:'radial-gradient(ellipse 90% 65% at 50% 55%, #17140e 0%, #0D0D0D 72%)' }}/>
        <BrushRibbonCanvas />

        <motion.div style={{ position:'relative', zIndex:2, opacity:heroOpacity, y:heroY,
          display:'flex', flexDirection:'column', alignItems:'center', gap:22, padding:'0 24px', maxWidth:720 }}>

          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.8, delay:0.2 }}
            style={{ fontSize:10, fontWeight:500, letterSpacing:'0.38em', textTransform:'uppercase',
              color:'#C7694F', display:'flex', alignItems:'center', gap:14 }}>
            <span style={{ width:50, height:1, background:'#C7694F', opacity:0.45 }}/>
            The Archive
            <span style={{ width:50, height:1, background:'#C7694F', opacity:0.45 }}/>
          </motion.div>

          <motion.h1 initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:1, delay:0.4, ease:[0.22,1,0.36,1] }}
            className="font-display"
            style={{ fontSize:'clamp(3.4rem,9vw,7.5rem)', fontWeight:600, lineHeight:0.95,
              letterSpacing:'-0.025em', color:'#F7F2EA' }}>
            Gallery<br/>
            <em style={{ fontStyle:'italic', color:'#C7694F', fontSize:'0.55em',
              letterSpacing:'0.04em', fontWeight:400, display:'block', marginTop:10 }}>
              Every stroke, preserved
            </em>
          </motion.h1>

          <motion.p initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.8, delay:0.65 }}
            style={{ fontSize:15, fontWeight:300, color:'rgba(247,242,234,0.5)',
              lineHeight:1.75, maxWidth:440 }}>
            A curated archive of original paintings and commissioned artworks.
            Each piece is unique — none will be made twice.
          </motion.p>

          <motion.div initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.8, delay:0.85 }}
            style={{ display:'flex', gap:36, paddingTop:24,
              borderTop:'1px solid rgba(247,242,234,0.07)', width:'100%', justifyContent:'center' }}>
            {[
              { num:`${products.length || '200'}+`, label:'Pieces' },
              { num:'Original',  label:'Handcrafted' },
              { num:'2019',      label:'Est.' },
            ].map(({ num, label }) => (
              <div key={label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <span className="font-display"
                  style={{ fontSize:26, fontWeight:600, color:'#C7694F', lineHeight:1 }}>{num}</span>
                <span style={{ fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase',
                  color:'rgba(247,242,234,0.35)' }}>{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          transition={{ delay:1.4, duration:1 }}
          style={{ position:'absolute', bottom:36, left:'50%', transform:'translateX(-50%)',
            display:'flex', flexDirection:'column', alignItems:'center', gap:10, zIndex:2 }}>
          <motion.div animate={{ scaleY:[1,0.35,1], opacity:[1,0.3,1] }}
            transition={{ duration:2.2, repeat:Infinity, ease:'easeInOut' }}
            style={{ width:1, height:52, background:'linear-gradient(to bottom,#C7694F,transparent)' }}/>
          <span style={{ fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase',
            color:'rgba(247,242,234,0.35)' }}>Explore</span>
        </motion.div>
      </section>

      {/* ══ GALLERY BODY — light/dark ════════════════════ */}
      <section className="bg-ivory dark:bg-[#1A1814] relative">
        <InkTracePath />
        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-14 sm:pt-20 pb-10">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-5 mb-8">
            <motion.div initial={{ opacity:0, x:-24 }} whileInView={{ opacity:1, x:0 }}
              viewport={{ once:true }} transition={{ duration:0.7 }}>
              <p className="text-[10px] uppercase tracking-[0.28em] text-charcoal-muted dark:text-[#9A9590] font-medium mb-2">Selected Works</p>
              <h2 className="font-display text-charcoal dark:text-[#F0EDE8]"
                style={{ fontSize:'clamp(1.8rem,3.5vw,2.8rem)', fontWeight:400, letterSpacing:'-0.01em' }}>
                The <em className="not-italic text-terracotta">Collection</em>
              </h2>
            </motion.div>
            {/* Category filter */}
            <motion.div initial={{ opacity:0, x:24 }} whileInView={{ opacity:1, x:0 }}
              viewport={{ once:true }} transition={{ duration:0.7 }}
              className="flex gap-0 overflow-hidden rounded-sm border border-charcoal/10 dark:border-white/8">
              {categoryPills.map(cat => (
                <button key={cat.slug}
                  onClick={() => setActiveCategory(cat.slug===activeCategory?'':cat.slug)}
                  className={`relative px-4 py-2.5 text-[11px] font-medium tracking-[0.06em] transition-colors duration-200 border-r border-charcoal/10 dark:border-white/8 last:border-r-0 ${
                    activeCategory===cat.slug
                      ? 'text-ivory dark:text-[#1A1814] bg-terracotta'
                      : 'text-charcoal-muted dark:text-[#9A9590] bg-cream dark:bg-[#252219] hover:text-charcoal dark:hover:text-[#F0EDE8]'
                  }`}>
                  {activeCategory===cat.slug && (
                    <motion.span layoutId="gallery-tab" transition={{ type:'spring', stiffness:400, damping:32 }}
                      className="absolute inset-0 bg-terracotta" style={{ zIndex:0 }}/>
                  )}
                  <span className="relative z-10">{cat.name}</span>
                </button>
              ))}
            </motion.div>
          </div>
          <div className="h-px bg-charcoal/8 dark:bg-white/8 mb-8"/>

          {/* Grid */}
          <AnimatePresence mode="wait">
            <motion.div key={activeCategory} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              transition={{ duration:0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {loading ? (
                [...Array(6)].map((_,i) => (
                  <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
                    <div className="bg-cream dark:bg-[#252219]" style={{ aspectRatio:'3/4' }}/>
                    <div className="p-4 bg-ivory dark:bg-[#1e1c18] space-y-2">
                      <div className="h-4 rounded bg-cream dark:bg-[#252219] w-3/4"/>
                      <div className="h-3 rounded bg-cream dark:bg-[#252219] w-1/2"/>
                    </div>
                  </div>
                ))
              ) : products.length === 0 ? (
                <div className="col-span-full flex flex-col items-center gap-4 py-20 text-charcoal-muted dark:text-[#9A9590]">
                  <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <p className="font-display text-xl italic opacity-40">No artworks found</p>
                </div>
              ) : (
                products.map((p, i) => (
                  <GalleryCard key={p.id} product={p} index={i}
                    hue={HUES[i % HUES.length]} span="normal"
                    onOpen={openLightbox}/>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom CTA */}
        <motion.section initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }} transition={{ duration:0.8 }}
          className="border-t border-charcoal/8 dark:border-white/6 px-4 sm:px-6 lg:px-10 py-14 max-w-[1440px] mx-auto grid sm:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="font-display text-charcoal dark:text-[#F0EDE8] leading-tight"
              style={{ fontSize:'clamp(1.6rem,3vw,2.4rem)', fontWeight:400 }}>
              Want something made<br/>
              <em className="not-italic text-terracotta">just for you?</em>
            </h2>
            <p className="text-sm text-charcoal-muted dark:text-[#9A9590] leading-relaxed mt-4 max-w-sm">
              Every commission begins with a conversation. Share what matters and I'll find the right medium to carry it.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <motion.a href="/commission" whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
              className="inline-flex items-center gap-2 self-start px-8 py-4 bg-terracotta text-ivory text-[11px] uppercase tracking-[0.1em] font-semibold rounded-sm hover:opacity-90 transition-opacity"
              style={{ textDecoration:'none' }}>
              Start a Commission
            </motion.a>
            <p className="text-xs text-charcoal-muted dark:text-[#9A9590] flex items-start gap-2">
              <span className="text-terracotta flex-shrink-0">—</span>
              Commissions are accepted in small batches. Response within 48 hours.
            </p>
          </div>
        </motion.section>
      </section>

      {/* ══ LIGHTBOX ═════════════════════════════════════════ */}
      <AnimatePresence>
        {lightboxPiece && (
          <Lightbox product={lightboxPiece} all={products.length>0?products:[lightboxPiece]} onClose={closeLightbox}/>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width:1100px) {
          .gallery-grid { grid-template-columns:repeat(2,1fr) !important; grid-auto-rows:320px !important; }
        }
        @media (max-width:640px) {
          .gallery-grid { grid-template-columns:1fr !important; grid-auto-rows:300px !important; }
          .gallery-grid > * { grid-column:span 1 !important; grid-row:span 1 !important; }
          .gh-bottom-grid { grid-template-columns:1fr !important; gap:32px !important; }
        }
        @keyframes gal-pulse { 0%,100%{opacity:0.4} 50%{opacity:0.7} }
        select option { background:#1C1B19; color:#F7F2EA; }
      `}</style>
    </div>
  );
}
