import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import * as THREE from 'three';
import { productAPI } from '../api';
import { STORAGE_URL } from '../config';
import { useCart } from '../context/CartContext';

/* ─── helpers ──────────────────────────────────────────────────────────── */
function getImg(p) {
  const url = p?.primary_image?.image_url || p?.thumbnail || p?.image_url;
  if (!url) return null;
  return url.startsWith('http') ? url : `${STORAGE_URL}/${url}`;
}
function fmt(price) {
  return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(price);
}

/* card sizes: cycle through for visual variety */
const SIZE_CYCLE = ['normal','tall','wide','normal','normal','wide','normal','tall','normal','normal','wide','normal'];

/* hues matching brand palette, cycled per card */
const HUES = ['#C7694F','#9CAF88','#C9A94E','#8a6e52','#7a6888','#C7694F'];

/* ─── Three.js ink particles ──────────────────────────────────────────── */
function InkCanvas() {
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
    const camera = new THREE.PerspectiveCamera(60, W/H, 0.1, 100);
    camera.position.z = 5;

    const count = 1800;
    const geo   = new THREE.BufferGeometry();
    const pos   = new Float32Array(count*3);
    const cols  = new Float32Array(count*3);
    const sizes = new Float32Array(count);

    const palette = [
      new THREE.Color('#C7694F'), new THREE.Color('#9CAF88'),
      new THREE.Color('#F7F2EA'), new THREE.Color('#C9A94E'),
      new THREE.Color('#6B7F6E'),
    ];

    for (let i=0; i<count; i++) {
      const r     = Math.pow(Math.random(), 0.4) * 7;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2*Math.random()-1);
      pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
      pos[i*3+2] = r * Math.cos(phi) * 0.3;
      const c = palette[Math.floor(Math.random()*palette.length)];
      cols[i*3]=c.r; cols[i*3+1]=c.g; cols[i*3+2]=c.b;
      sizes[i] = Math.random()*12+2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',    new THREE.BufferAttribute(cols,3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes,1));

    const mat = new THREE.ShaderMaterial({
      vertexColors:true, transparent:true, depthWrite:false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime:{ value:0 }, uPR:{ value:renderer.getPixelRatio() } },
      vertexShader:`
        attribute float size; varying vec3 vColor; varying float vAlpha;
        uniform float uTime; uniform float uPR;
        void main(){
          vColor = color;
          vec3 p = position;
          float idx = float(gl_VertexID);
          p.x += sin(uTime*0.18+idx*0.031)*0.12;
          p.y += cos(uTime*0.14+idx*0.027)*0.10;
          p.z += sin(uTime*0.11+idx*0.019)*0.06;
          float d = length(p.xy);
          vAlpha = clamp(1.0-d*0.14,0.0,1.0)*0.75;
          vec4 mv = modelViewMatrix*vec4(p,1.0);
          gl_PointSize = size*uPR*(3.0/-mv.z);
          gl_Position = projectionMatrix*mv;
        }`,
      fragmentShader:`
        varying vec3 vColor; varying float vAlpha;
        void main(){
          vec2 uv=gl_PointCoord-vec2(0.5);
          float a=smoothstep(0.5,0.15,length(uv))*vAlpha;
          if(a<0.01) discard;
          gl_FragColor=vec4(vColor,a);
        }`,
    });

    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    let animId, mx=0, my=0;
    const onResize = () => {
      const w=el.clientWidth, h=el.clientHeight;
      renderer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix();
    };
    const onMouse = e => { mx=(e.clientX/window.innerWidth-0.5)*0.6; my=-(e.clientY/window.innerHeight-0.5)*0.4; };
    window.addEventListener('resize',onResize);
    window.addEventListener('mousemove',onMouse);

    const clock = new THREE.Clock();
    const tick = () => {
      animId = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      mat.uniforms.uTime.value = t;
      pts.rotation.y += (mx*0.5 - pts.rotation.y)*0.03;
      pts.rotation.x += (my*0.3 - pts.rotation.x)*0.03;
      pts.rotation.z  = Math.sin(t*0.07)*0.04;
      renderer.render(scene,camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize',onResize);
      window.removeEventListener('mousemove',onMouse);
      renderer.dispose(); geo.dispose(); mat.dispose();
      if(el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ position:'absolute', inset:0, pointerEvents:'none' }}/>;
}

/* ─── Magnetic Product Card ───────────────────────────────────────────── */
function ProductCard({ product, index, hue, size }) {
  const cardRef  = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x:0, y:0 });
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const springX = useSpring(0, { stiffness:200, damping:22 });
  const springY = useSpring(0, { stiffness:200, damping:22 });

  const onMouseMove = useCallback(e => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    springX.set((e.clientX - rect.left - rect.width/2)  * 0.07);
    springY.set((e.clientY - rect.top  - rect.height/2) * 0.07);
    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [springX, springY]);

  const onMouseLeave = () => { springX.set(0); springY.set(0); setHovered(false); };

  const handleAdd = async e => {
    e.preventDefault(); e.stopPropagation();
    if (!product.is_in_stock) return;
    try {
      await addToCart(product.id, 1, null);
      setAdded(true);
      setTimeout(() => setAdded(false), 2200);
    } catch {}
  };

  const img = getImg(product);

  /* grid span */
  const gridStyle = {
    gridRow:    size === 'tall' ? 'span 2' : 'span 1',
    gridColumn: size === 'wide' ? 'span 2' : 'span 1',
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity:0, y:60 }}
      whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true, margin:'-60px' }}
      transition={{ duration:0.7, delay: index*0.07, ease:[0.22,1,0.36,1] }}
      style={{ x:springX, y:springY, ...gridStyle }}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onMouseLeave}
      className="relative flex flex-col overflow-hidden cursor-pointer group"
      style={{
        background:'#141414',
        border:'1px solid rgba(247,242,234,0.07)',
        borderRadius:4,
        gridRow:    size === 'tall' ? 'span 2' : 'span 1',
        gridColumn: size === 'wide' ? 'span 2' : 'span 1',
        x: springX,
        y: springY,
      }}
    >
      {/* Cursor glow orb */}
      <div
        className="absolute pointer-events-none z-0 rounded-full"
        style={{
          width:400, height:400,
          left: cursorPos.x, top: cursorPos.y,
          transform:'translate(-50%,-50%)',
          background:`radial-gradient(300px circle at center, ${hue}2a, transparent 70%)`,
          opacity: hovered ? 1 : 0,
          transition:'opacity 0.3s',
        }}
      />

      {/* Art area */}
      <Link to={`/shop/${product.slug}`} className="flex-1 relative overflow-hidden min-h-[180px]"
        style={{ background:`linear-gradient(135deg,#141414 0%,#1e1c1a 100%)` }}>

        {img ? (
          <img src={img} alt={product.name} draggable={false}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            style={{ opacity:0.85 }}
          />
        ) : (
          /* Abstract ink-stroke SVG fallback — unique per product */
          <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full" style={{ opacity:0.9 }}>
            <defs>
              <filter id={`blur-${product.id}`}><feGaussianBlur stdDeviation="3"/></filter>
            </defs>
            <path
              d={`M${20+product.id*3},${80+product.id*5} Q${80+product.id*4},${20+product.id*2} ${160-product.id*3},${100+product.id*3}`}
              fill="none" stroke={hue} strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
            <path
              d={`M${30+product.id*2},${120+product.id*3} Q100,${60+product.id*5} ${170-product.id*2},${80+product.id*4}`}
              fill="none" stroke={hue} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
            <circle cx={100+product.id*3} cy={100-product.id*2} r="40" fill={hue} opacity="0.04" filter={`url(#blur-${product.id})`}/>
            {[...Array(7)].map((_,i)=>(
              <circle key={i} cx={50+i*18+(product.id%3)*8} cy={140-i*6+(product.id%5)*4}
                r={1.5-i*0.15} fill={hue} opacity={0.6-i*0.07}/>
            ))}
          </svg>
        )}

        {/* Hover dark overlay */}
        <div className="absolute inset-0 transition-opacity duration-400 pointer-events-none"
          style={{ background:'linear-gradient(to top, rgba(13,13,13,0.6) 0%, transparent 50%)', opacity: hovered?1:0.4 }}/>

        {/* Category tag */}
        <span className="absolute top-3 left-3 text-[10px] font-medium uppercase tracking-[0.18em]"
          style={{ color:'rgba(247,242,234,0.7)', background:'rgba(13,13,13,0.7)',
            padding:'4px 10px', borderRadius:999, backdropFilter:'blur(6px)' }}>
          {product.product_type?.replace(/_/g,' ') || 'Original'}
        </span>

        {/* Stock badge */}
        {!product.is_in_stock && (
          <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ background:'rgba(196,90,90,0.9)', color:'white', padding:'4px 10px', borderRadius:2 }}>
            Sold
          </span>
        )}
      </Link>

      {/* Card body */}
      <div className="relative z-10 flex flex-col gap-2 p-5"
        style={{ background:'#141414' }}>
        <Link to={`/shop/${product.slug}`}>
          <h3 className="font-display leading-snug"
            style={{ fontSize:'clamp(1rem,2.5vw,1.15rem)', fontWeight:600, color:'#F7F2EA', letterSpacing:'-0.01em' }}>
            {product.name}
          </h3>
        </Link>
        {product.short_description && (
          <p className="text-[13px] leading-relaxed line-clamp-2"
            style={{ color:'rgba(247,242,234,0.45)', fontWeight:300 }}>
            {product.short_description}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="font-display text-xl" style={{ color: hue, fontWeight:600 }}>
            {fmt(product.price)}
          </span>
          <motion.button
            whileHover={{ scale:1.05 }}
            whileTap={{ scale:0.96 }}
            onClick={handleAdd}
            disabled={!product.is_in_stock || added}
            className="text-[11px] font-semibold uppercase tracking-[0.08em] disabled:opacity-40"
            style={{
              background: added ? '#9CAF88' : `${hue}20`,
              color: added ? '#fff' : hue,
              border: `1px solid ${added ? '#9CAF88' : hue}4d`,
              padding:'8px 18px', borderRadius:2,
              transition:'background 0.2s, color 0.2s',
            }}
          >
            {added ? '✓ Added' : product.is_in_stock ? 'Add to Cart' : 'Sold Out'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Filter Pill ─────────────────────────────────────────────────────── */
function FilterPill({ label, active, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
      transition={{ duration:0.18 }}
      className="relative overflow-hidden"
      style={{
        background: '#1C1B19',
        border: `1px solid ${active ? 'rgba(199,105,79,0.6)' : 'rgba(247,242,234,0.08)'}`,
        color: active ? '#0D0D0D' : 'rgba(247,242,234,0.45)',
        padding:'9px 20px', borderRadius:999,
        fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:500,
        letterSpacing:'0.04em', cursor:'pointer',
        transition:'border-color 0.25s, color 0.25s',
      }}
    >
      {active && (
        <motion.span
          layoutId="pill-bg"
          transition={{ type:'spring', stiffness:380, damping:30 }}
          className="absolute inset-0"
          style={{ background:'#C7694F', borderRadius:999, zIndex:0 }}
        />
      )}
      <span style={{ position:'relative', zIndex:1 }}>{label}</span>
    </motion.button>
  );
}

/* ─── Main Shop Page ──────────────────────────────────────────────────── */
export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '');
  const [search,     setSearch]     = useState('');
  const [sort,       setSort]       = useState('newest');
  const [type,       setType]       = useState(searchParams.get('type') || '');
  const [meta,       setMeta]       = useState({ total:0, last_page:1, current_page:1 });

  /* Parallax hero */
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 420], [1, 0]);
  const heroY       = useTransform(scrollY, [0, 420], [0, -80]);

  /* Load products whenever filters change */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = { sort, per_page:18 };
    if (activeCategory) params.category = activeCategory;
    if (type)           params.type     = type;
    if (search.trim())  params.search   = search.trim();

    productAPI.all(params)
      .then(({ data }) => {
        if (cancelled) return;
        setProducts(data.data || []);
        setMeta(data.meta || { total: data.data?.length || 0, last_page:1, current_page:1 });
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [activeCategory, type, sort, search]);

  /* Load categories once */
  useEffect(() => {
    productAPI.categories()
      .then(({ data }) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  /* Category pills: "All" + API categories */
  const categoryPills = [{ slug:'', name:'All' }, ...categories];

  const productTypes = [
    { value:'', label:'All Types' },
    { value:'original',       label:'Original Art'     },
    { value:'print',          label:'Prints'           },
    { value:'limited_edition',label:'Limited Editions' },
  ];

  return (
    <div style={{ background:'#0D0D0D', color:'#F7F2EA', minHeight:'100vh', overflowX:'hidden' }}>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section style={{ position:'relative', height:'100vh', minHeight:640,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        textAlign:'center', overflow:'hidden' }}>

        {/* Radial bg */}
        <div style={{ position:'absolute', inset:0,
          background:'radial-gradient(ellipse 80% 60% at 50% 50%, #1a1510 0%, #0D0D0D 70%)' }}/>

        {/* Three.js ink canvas */}
        <InkCanvas />

        {/* Hero content */}
        <motion.div style={{ position:'relative', zIndex:2, opacity:heroOpacity, y:heroY,
          display:'flex', flexDirection:'column', alignItems:'center', gap:24, padding:'0 24px' }}>

          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.8, delay:0.2 }}
            style={{ fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:500,
              letterSpacing:'0.35em', textTransform:'uppercase', color:'#C7694F',
              display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ display:'block', width:40, height:1, background:'#C7694F', opacity:0.5 }}/>
            Handcrafted Art Boutique
            <span style={{ display:'block', width:40, height:1, background:'#C7694F', opacity:0.5 }}/>
          </motion.div>

          <motion.h1 initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:1, delay:0.4, ease:[0.22,1,0.36,1] }}
            className="font-display"
            style={{ fontSize:'clamp(3rem,8vw,7rem)', fontWeight:600, lineHeight:1.02,
              letterSpacing:'-0.02em', color:'#F7F2EA' }}>
            The<br/>
            <em style={{ fontStyle:'italic', color:'#C7694F' }}>Collection</em>
          </motion.h1>

          <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.8, delay:0.65 }}
            style={{ fontSize:16, fontWeight:300, color:'rgba(247,242,234,0.5)',
              maxWidth:440, lineHeight:1.7, letterSpacing:'0.01em' }}>
            Original paintings and handcrafted artworks — each one a one-of-a-kind piece made with intention.
          </motion.p>

          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.8, delay:0.85 }}
            style={{ display:'flex', gap:14, alignItems:'center', flexWrap:'wrap', justifyContent:'center' }}>
            <motion.button whileHover={{ scale:1.04, opacity:0.9 }} whileTap={{ scale:0.97 }}
              onClick={() => document.getElementById('shop-body')?.scrollIntoView({ behavior:'smooth' })}
              style={{ background:'#C7694F', color:'#0D0D0D', border:'none',
                padding:'14px 36px', fontFamily:"'Inter',sans-serif", fontSize:13,
                fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', borderRadius:2 }}>
              Shop the Collection
            </motion.button>
            <motion.a href="/commission" whileHover={{ scale:1.04, borderColor:'rgba(199,105,79,0.5)' }} whileTap={{ scale:0.97 }}
              style={{ background:'transparent', color:'#F7F2EA',
                border:'1px solid rgba(247,242,234,0.2)', padding:'13px 36px',
                fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:400,
                letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer',
                borderRadius:2, textDecoration:'none', display:'inline-block' }}>
              Commission a Piece
            </motion.a>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          transition={{ delay:1.4, duration:1 }}
          style={{ position:'absolute', bottom:40, left:'50%', transform:'translateX(-50%)',
            display:'flex', flexDirection:'column', alignItems:'center', gap:10, zIndex:2 }}>
          <motion.div animate={{ scaleY:[1,0.4,1], opacity:[1,0.4,1] }}
            transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}
            style={{ width:1, height:50,
              background:'linear-gradient(to bottom, #C7694F, transparent)' }}/>
          <span style={{ fontSize:10, letterSpacing:'0.25em', textTransform:'uppercase',
            color:'rgba(247,242,234,0.35)' }}>Scroll</span>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════
          SHOP BODY
      ══════════════════════════════════════ */}
      <section id="shop-body" style={{ padding:'80px clamp(20px,4vw,60px)', maxWidth:1400, margin:'0 auto' }}>

        {/* Header row */}
        <div style={{ marginBottom:52 }}>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between',
            gap:24, flexWrap:'wrap', marginBottom:32 }}>
            <motion.div initial={{ opacity:0, x:-30 }} whileInView={{ opacity:1, x:0 }}
              viewport={{ once:true }} transition={{ duration:0.7 }}>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:500,
                letterSpacing:'0.3em', textTransform:'uppercase',
                color:'rgba(247,242,234,0.35)', marginBottom:8 }}>The Collection</p>
              <h2 className="font-display"
                style={{ fontSize:'clamp(1.8rem,4vw,3rem)', fontWeight:600,
                  color:'#F7F2EA', lineHeight:1.1, letterSpacing:'-0.01em' }}>
                Browse &amp;{' '}
                <em style={{ fontStyle:'italic', color:'#C7694F' }}>Discover</em>
              </h2>
            </motion.div>

            {/* Search + Sort */}
            <motion.div initial={{ opacity:0, x:30 }} whileInView={{ opacity:1, x:0 }}
              viewport={{ once:true }} transition={{ duration:0.7 }}
              style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
              <div style={{ position:'relative', flex:1, minWidth:200, maxWidth:320 }}>
                <svg style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
                  color:'rgba(247,242,234,0.3)', pointerEvents:'none' }}
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search artworks…"
                  style={{ width:'100%', background:'#1C1B19', border:'1px solid rgba(247,242,234,0.08)',
                    color:'#F7F2EA', padding:'11px 14px 11px 42px', fontFamily:"'Inter',sans-serif",
                    fontSize:13, outline:'none', borderRadius:2 }}
                  onFocus={e => e.target.style.borderColor='#C7694F'}
                  onBlur={e  => e.target.style.borderColor='rgba(247,242,234,0.08)'}
                />
              </div>
              <select value={sort} onChange={e => setSort(e.target.value)}
                style={{ background:'#1C1B19', border:'1px solid rgba(247,242,234,0.08)',
                  color:'#F7F2EA', padding:'11px 14px', fontFamily:"'Inter',sans-serif",
                  fontSize:13, outline:'none', cursor:'pointer', borderRadius:2 }}>
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="name">Name: A–Z</option>
              </select>
            </motion.div>
          </div>

          {/* Divider */}
          <div style={{ height:1, background:'rgba(247,242,234,0.07)', margin:'0 0 24px' }}/>

          {/* Filter pills row */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
            flexWrap:'wrap', gap:16 }}>
            <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }} transition={{ duration:0.6 }}
              style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
              {/* Category pills */}
              {categoryPills.map(cat => (
                <FilterPill key={cat.slug} label={cat.name}
                  active={activeCategory === cat.slug}
                  onClick={() => setActiveCategory(cat.slug === activeCategory ? '' : cat.slug)} />
              ))}
              {/* Divider pill */}
              {categoryPills.length > 1 && (
                <span style={{ width:1, height:20, background:'rgba(247,242,234,0.1)', display:'block' }}/>
              )}
              {/* Type pills */}
              {productTypes.slice(1).map(t => (
                <FilterPill key={t.value} label={t.label}
                  active={type === t.value}
                  onClick={() => setType(type === t.value ? '' : t.value)} />
              ))}
            </motion.div>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12,
              color:'rgba(247,242,234,0.3)', letterSpacing:'0.06em', flexShrink:0 }}>
              {meta.total || products.length} {(meta.total || products.length) === 1 ? 'piece' : 'pieces'}
            </span>
          </div>
        </div>

        {/* ── Bento Grid ── */}
        <AnimatePresence mode="wait">
          <motion.div key={activeCategory+type+sort+search}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.3 }}
            style={{
              display:'grid',
              gridTemplateColumns:'repeat(3, 1fr)',
              gridAutoRows:380,
              gap:18,
            }}
            className="shop-grid"
          >
            {loading ? (
              [...Array(6)].map((_,i) => (
                <motion.div key={i}
                  initial={{ opacity:0 }} animate={{ opacity:1 }}
                  transition={{ delay:i*0.06 }}
                  style={{ background:'#1C1B19', borderRadius:4,
                    animation:'pulse 1.5s ease-in-out infinite',
                    gridRow: i===0?'span 2': i===2?'span 2':'span 1',
                    gridColumn: i===1?'span 2':'span 1' }}
                />
              ))
            ) : products.length === 0 ? (
              <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column',
                alignItems:'center', gap:16, padding:'80px 20px',
                color:'rgba(247,242,234,0.35)' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.5" style={{ opacity:0.3 }}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="font-display" style={{ fontSize:22, fontStyle:'italic',
                  color:'rgba(247,242,234,0.35)' }}>No pieces found</p>
                <p style={{ fontSize:13 }}>Try a different filter or search term</p>
              </div>
            ) : (
              products.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={i}
                  hue={HUES[i % HUES.length]}
                  size={SIZE_CYCLE[i % SIZE_CYCLE.length]}
                />
              ))
            )}
          </motion.div>
        </AnimatePresence>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            style={{ marginTop:48, display:'flex', justifyContent:'center', gap:8 }}>
            {[...Array(meta.last_page)].map((_,i) => (
              <button key={i}
                onClick={() => {/* page navigation could be added here */}}
                style={{
                  width:40, height:40, borderRadius:2,
                  background: meta.current_page===i+1 ? '#C7694F' : '#1C1B19',
                  color: meta.current_page===i+1 ? '#0D0D0D' : 'rgba(247,242,234,0.45)',
                  border:'1px solid rgba(247,242,234,0.08)',
                  fontFamily:"'Inter',sans-serif", fontSize:13, cursor:'pointer',
                  transition:'background 0.2s',
                }}>
                {i+1}
              </button>
            ))}
          </motion.div>
        )}
      </section>

      {/* ══════════════════════════════════════
          BOTTOM STRIP
      ══════════════════════════════════════ */}
      <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
        viewport={{ once:true }} transition={{ duration:0.7 }}
        style={{ borderTop:'1px solid rgba(247,242,234,0.07)',
          padding:'40px clamp(20px,4vw,60px)', maxWidth:1400, margin:'0 auto',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          gap:24, flexWrap:'wrap' }}>
        <p className="font-display"
          style={{ fontSize:20, fontStyle:'italic', color:'rgba(247,242,234,0.35)' }}>
          Every piece is made{' '}
          <strong style={{ color:'#C7694F', fontStyle:'normal', fontWeight:600 }}>by hand</strong>
          , with intention — no two are ever identical.
        </p>
        <a href="/commission"
          style={{ fontSize:12, letterSpacing:'0.15em', textTransform:'uppercase',
            color:'#C7694F', textDecoration:'none', display:'flex', alignItems:'center', gap:8 }}
          onMouseEnter={e => e.currentTarget.style.opacity='0.75'}
          onMouseLeave={e => e.currentTarget.style.opacity='1'}>
          Get a custom commission →
        </a>
      </motion.div>

      {/* Responsive grid override */}
      <style>{`
        @media (max-width:1024px) {
          .shop-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width:640px) {
          .shop-grid { grid-template-columns: 1fr !important; grid-auto-rows: 340px !important; }
          .shop-grid > * { grid-column: span 1 !important; grid-row: span 1 !important; }
        }
        @keyframes pulse {
          0%,100% { opacity:0.4; }
          50% { opacity:0.7; }
        }
        input::placeholder { color: rgba(247,242,234,0.28); }
        select option { background:#1C1B19; color:#F7F2EA; }
      `}</style>
    </div>
  );
}
