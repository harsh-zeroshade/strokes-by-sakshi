import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';

/* ══════════════════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════════════════ */
const CARD_W    = 300;
const CARD_H    = 420;
const CARD_GAP  = 20;
const INTERVAL  = 3500; // ms auto-advance

function formatPrice(p) {
  return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(p);
}

/* ══════════════════════════════════════════════════════════════════════════
   LOW-POLY ART OBJECT MAKERS — adapted from Delassus fruit makers
   but art-themed: canvas frames, brushes, ink drops, palettes, pencils
══════════════════════════════════════════════════════════════════════════ */
function jc(r,g,b,a=0.06){ const j=()=>(Math.random()-.5)*a; return [r+j(),g+j(),b+j()]; }
function flatMat(col){ return new THREE.MeshLambertMaterial({color:col,flatShading:true}); }

function makeCanvas3D(){
  const g=new THREE.Group();
  // Frame
  const fGeo=new THREE.BoxGeometry(1.1,1.4,0.08);
  const fc=[]; const fp=fGeo.attributes.position;
  for(let i=0;i<fp.count/3;i++) for(let j=0;j<3;j++) fc.push(...jc(0.36,0.22,0.14,0.04));
  fGeo.setAttribute('color',new THREE.Float32BufferAttribute(fc,3));
  g.add(new THREE.Mesh(fGeo,new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true})));
  // Surface strokes
  const palette=[[0.97,0.93,0.88],[0.78,0.38,0.22],[0.79,0.67,0.30],[0.61,0.69,0.53],[0.85,0.80,0.75]];
  const sGeo=new THREE.PlaneGeometry(0.88,1.18,3,4);
  const sc=[]; const sp=sGeo.attributes.position;
  for(let i=0;i<sp.count/3;i++) for(let j=0;j<3;j++) sc.push(...jc(...palette[i%palette.length],0.08));
  sGeo.setAttribute('color',new THREE.Float32BufferAttribute(sc,3));
  const surf=new THREE.Mesh(sGeo,new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true}));
  surf.position.z=0.06; g.add(surf);
  return g;
}

function makeBrush3D(){
  const g=new THREE.Group();
  // Handle
  const hGeo=new THREE.CylinderGeometry(0.048,0.058,1.9,7);
  const hc=[]; const hp=hGeo.attributes.position;
  for(let i=0;i<hp.count/3;i++) for(let j=0;j<3;j++) hc.push(...jc(0.58,0.34,0.14,0.05));
  hGeo.setAttribute('color',new THREE.Float32BufferAttribute(hc,3));
  g.add(new THREE.Mesh(hGeo,new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true})));
  // Ferrule
  const fer=new THREE.Mesh(new THREE.CylinderGeometry(0.062,0.062,0.2,7),flatMat(0xb0b0b0));
  fer.position.y=-1.02; g.add(fer);
  // Bristle
  const brGeo=new THREE.ConeGeometry(0.058,0.5,7);
  const brc=[]; const brp=brGeo.attributes.position;
  for(let i=0;i<brp.count/3;i++) for(let j=0;j<3;j++) brc.push(...jc(0.78,0.38,0.22,0.07));
  brGeo.setAttribute('color',new THREE.Float32BufferAttribute(brc,3));
  const br=new THREE.Mesh(brGeo,new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true}));
  br.position.y=-1.38; br.rotation.x=Math.PI; g.add(br);
  g.rotation.z=0.3;
  return g;
}

function makeInkDrop3D(){
  const g=new THREE.Group();
  const dGeo=new THREE.IcosahedronGeometry(0.54,1);
  const pos=dGeo.attributes.position;
  for(let i=0;i<pos.count;i++) pos.setY(i, pos.getY(i)*(pos.getY(i)>0?1.28:0.72));
  dGeo.computeVertexNormals();
  const dc=[]; const inkP=[[0.15,0.09,0.06],[0.12,0.07,0.04],[0.18,0.11,0.07]];
  for(let i=0;i<pos.count/3;i++) for(let j=0;j<3;j++) dc.push(...jc(...inkP[i%inkP.length],0.03));
  dGeo.setAttribute('color',new THREE.Float32BufferAttribute(dc,3));
  g.add(new THREE.Mesh(dGeo,new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true})));
  for(let i=0;i<6;i++){
    const a=(i/6)*Math.PI*2;
    const sm=new THREE.Mesh(new THREE.SphereGeometry(0.05+Math.random()*0.04,4,4),flatMat(0x1e120a));
    const r=0.65+Math.random()*0.1;
    sm.position.set(Math.cos(a)*r,-0.3+Math.random()*0.1,Math.sin(a)*r);
    g.add(sm);
  }
  return g;
}

function makePalette3D(){
  const g=new THREE.Group();
  const geo=new THREE.CylinderGeometry(0.54,0.54,0.07,8);
  const pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){ const x=pos.getX(i); if(x<-0.25){pos.setX(i,x*0.5);pos.setZ(i,pos.getZ(i)*0.78);} }
  geo.computeVertexNormals();
  const bc=[]; for(let i=0;i<pos.count/3;i++) for(let j=0;j<3;j++) bc.push(...jc(0.95,0.92,0.86,0.04));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(bc,3));
  g.add(new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true})));
  [[0.22,0.05,0.12,0.78,0.38,0.22],[-0.10,0.05,0.30,0.79,0.67,0.30],[0.10,0.05,-0.26,0.61,0.69,0.53],[0.30,0.05,-0.10,0.79,0.52,0.28],[-0.26,0.05,0.05,0.38,0.30,0.62]]
    .forEach(([dx,dy,dz,r,gr,b])=>{
      const dg=new THREE.SphereGeometry(0.10,4,4);
      const dc2=[]; const dp=dg.attributes.position;
      for(let i=0;i<dp.count/3;i++) for(let j=0;j<3;j++) dc2.push(...jc(r,gr,b,0.05));
      dg.setAttribute('color',new THREE.Float32BufferAttribute(dc2,3));
      const dm=new THREE.Mesh(dg,new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true}));
      dm.position.set(dx,dy,dz); dm.scale.y=0.38; g.add(dm);
    });
  g.rotation.x=-0.28;
  return g;
}

function makePencil3D(){
  const g=new THREE.Group();
  const bGeo=new THREE.CylinderGeometry(0.055,0.055,1.85,6);
  const bc=[]; const bp=bGeo.attributes.position;
  for(let i=0;i<bp.count/3;i++) for(let j=0;j<3;j++) bc.push(...jc(0.90,0.72,0.22,0.05));
  bGeo.setAttribute('color',new THREE.Float32BufferAttribute(bc,3));
  g.add(new THREE.Mesh(bGeo,new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true})));
  const tip=new THREE.Mesh(new THREE.ConeGeometry(0.055,0.25,6),flatMat(0x8a6832));
  tip.position.y=-1.05; tip.rotation.x=Math.PI; g.add(tip);
  const metal=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.12,6),flatMat(0xb0b0b0));
  metal.position.y=0.98; g.add(metal);
  const eraser=new THREE.Mesh(new THREE.CylinderGeometry(0.056,0.056,0.14,6),flatMat(0xe08888));
  eraser.position.y=1.12; g.add(eraser);
  g.rotation.z=-0.28;
  return g;
}

const MAKERS = { makeCanvas3D, makeBrush3D, makeInkDrop3D, makePalette3D, makePencil3D };

/* ══════════════════════════════════════════════════════════════════════════
   CARD GRADIENTS — one per cycling index, using brand palette
══════════════════════════════════════════════════════════════════════════ */
const CARD_THEMES = [
  { bg: ['#C7694F','#8a3d2a'], maker:'makeCanvas3D',  tag:'Original'   },
  { bg: ['#9CAF88','#5c7a4a'], maker:'makeBrush3D',   tag:'Landscape'  },
  { bg: ['#4A3728','#2a1e14'], maker:'makeInkDrop3D', tag:'Abstract'   },
  { bg: ['#C9A94E','#8a6e2a'], maker:'makePalette3D', tag:'Collection' },
  { bg: ['#2C2C2C','#141414'], maker:'makePencil3D',  tag:'Sketch'     },
];

/* ══════════════════════════════════════════════════════════════════════════
   THREE.JS CARD SCENE — one per card, renders a low-poly object
══════════════════════════════════════════════════════════════════════════ */
function initCardScene(canvas, makerKey) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setClearColor(0x000000,0);
  renderer.setSize(CARD_W, CARD_H, false);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, CARD_W/CARD_H, 0.1, 100);
  camera.position.set(0,0,3.2);

  scene.add(new THREE.AmbientLight(0xffffff,0.6));
  const d1=new THREE.DirectionalLight(0xffffff,0.9); d1.position.set(3,5,4); scene.add(d1);
  const d2=new THREE.DirectionalLight(0xffffff,0.3); d2.position.set(-3,-2,2); scene.add(d2);

  const maker = MAKERS[makerKey];
  const obj   = maker ? maker() : null;
  if(obj){ obj.scale.setScalar(1.05); obj.position.set(0,0.1,0); scene.add(obj); }

  return { renderer, scene, camera, obj };
}

/* ══════════════════════════════════════════════════════════════════════════
   FEATURED SLIDER
══════════════════════════════════════════════════════════════════════════ */
export default function FeaturedSlider({ products }) {
  const trackRef      = useRef(null);
  const wrapRef       = useRef(null);
  const threeRef      = useRef([]);   // [{renderer,scene,camera,obj}, ...]
  const canvasRefs    = useRef([]);
  const progressRefs  = useRef([]);
  const progressRaf   = useRef(null);
  const progressStart = useRef(null);
  const autoTimer     = useRef(null);
  const dragStart     = useRef(null);
  const dragDelta     = useRef(0);

  const [current, setCurrent] = useState(0);
  const total = products.length;

  /* ── build card data: merge product with a theme ── */
  const cards = products.map((p, i) => ({
    product: p,
    theme: CARD_THEMES[i % CARD_THEMES.length],
    num: String(i + 1).padStart(2, '0'),
  }));

  /* ── goTo — infinite loop ── */
  const goTo = useCallback((idx, userAction = false) => {
    const next = ((idx % total) + total) % total;
    setCurrent(next);
    if (trackRef.current) {
      trackRef.current.style.transition = 'transform 0.55s cubic-bezier(0.22,1,0.36,1)';
      trackRef.current.style.transform  = `translateX(-${next * (CARD_W + CARD_GAP)}px)`;
    }
    // sync active card styling via DOM (avoids re-render)
    document.querySelectorAll('.ps-card-item').forEach((c,i) => {
      c.classList.toggle('ps-card-active', i === next);
    });
    document.querySelectorAll('.ps-dot-item').forEach((d,i) => {
      d.classList.toggle('ps-dot-on', i === next);
    });
    startProgress(next);
    if (userAction) resetAuto(next);
  }, [total]); // eslint-disable-line

  /* ── progress bar ── */
  const startProgress = useCallback((idx) => {
    cancelAnimationFrame(progressRaf.current);
    progressRefs.current.forEach(b => { if(b){ b.style.transition='none'; b.style.width='0%'; } });
    progressStart.current = performance.now();
    const bar = progressRefs.current[idx];
    const tick = () => {
      const pct = Math.min(100, ((performance.now()-progressStart.current)/INTERVAL)*100);
      if(bar){ bar.style.transition='none'; bar.style.width=pct+'%'; }
      if(pct<100) progressRaf.current = requestAnimationFrame(tick);
    };
    progressRaf.current = requestAnimationFrame(tick);
  }, []);

  /* ── auto-advance ── */
  const resetAuto = useCallback((idx) => {
    clearTimeout(autoTimer.current);
    const loop = (i) => {
      autoTimer.current = setTimeout(() => {
        const next = (i+1)%total;
        goTo(next);
        loop(next);
      }, INTERVAL);
    };
    loop(idx ?? current);
  }, [goTo, total, current]); // eslint-disable-line

  /* ── init Three.js for all cards ── */
  useEffect(() => {
    if (!total) return;
    threeRef.current = [];
    canvasRefs.current.forEach((cnv, i) => {
      if (!cnv) return;
      const inst = initCardScene(cnv, cards[i].theme.maker);
      threeRef.current[i] = inst;
    });

    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = performance.now() * 0.001;
      threeRef.current.forEach((inst, i) => {
        if (!inst?.obj) return;
        inst.obj.rotation.y = t * 0.28 + i * 0.9;
        inst.obj.position.y = 0.1 + Math.sin(t * 0.55 + i) * 0.09;
        inst.renderer.render(inst.scene, inst.camera);
      });
    };
    animate();

    goTo(0);
    resetAuto(0);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(autoTimer.current);
      cancelAnimationFrame(progressRaf.current);
      threeRef.current.forEach(inst => inst?.renderer?.dispose());
    };
  }, [total]); // eslint-disable-line

  /* ── keyboard ── */
  useEffect(() => {
    const onKey = e => {
      if(e.key==='ArrowRight') goTo(current+1,true);
      if(e.key==='ArrowLeft')  goTo(current-1,true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, goTo]);

  /* ── drag/swipe ── */
  const onDragStart = (x) => {
    dragStart.current = x; dragDelta.current = 0;
    wrapRef.current?.classList.add('cursor-grabbing');
    clearTimeout(autoTimer.current);
    cancelAnimationFrame(progressRaf.current);
  };
  const onDragMove = (x) => { if(dragStart.current!==null) dragDelta.current = x-dragStart.current; };
  const onDragEnd  = () => {
    if(dragStart.current!==null){
      if(dragDelta.current<-60)      goTo(current+1,true);
      else if(dragDelta.current>60)  goTo(current-1,true);
      else                           resetAuto(current);
      dragStart.current=null;
      wrapRef.current?.classList.remove('cursor-grabbing');
    }
  };

  /* ── skeleton ── */
  if (!total) {
    return (
      <div className="py-16 px-4 sm:px-10">
        <div className="flex gap-5 overflow-hidden">
          {[0,1,2].map(i=>(
            <div key={i} className="flex-shrink-0 w-[300px] h-[420px] rounded-2xl bg-[#1a1a1a] animate-pulse"/>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden bg-[#0d0b08]">
      {/* Top rule */}
      <div className="w-full h-px" style={{background:'rgba(255,255,255,0.06)'}}/>

      <div className="max-w-[1400px] mx-auto">
        {/* Section header */}
        <div className="flex items-end justify-between px-6 sm:px-10 lg:px-16 pt-16 sm:pt-20 pb-6 sm:pb-8">
          <div>
            <span className="text-[10px] uppercase tracking-[0.35em] font-medium" style={{color:'rgba(255,255,255,0.3)'}}>
              {String(products.indexOf(products[0])+1).padStart(2,'0') === '01' ? '02' : '02'} · Original Artworks
            </span>
            <h2 className="mt-3 font-display text-white" style={{fontSize:'clamp(1.8rem,4.5vw,3.5rem)',fontWeight:300,letterSpacing:'-1px'}}>
              Featured <em style={{fontStyle:'normal',color:'#C7694F'}}>Works</em>
            </h2>
          </div>
          <Link to="/shop"
            className="hidden sm:inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] transition-colors duration-300"
            style={{color:'rgba(255,255,255,0.35)'}}
            onMouseEnter={e=>e.currentTarget.style.color='white'}
            onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.35)'}
          >
            View All
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </Link>
        </div>

        {/* Track */}
        <div
          ref={wrapRef}
          className="relative overflow-hidden cursor-grab select-none"
          onMouseDown={e=>onDragStart(e.clientX)}
          onMouseMove={e=>onDragMove(e.clientX)}
          onMouseUp={onDragEnd}
          onMouseLeave={()=>{ if(dragStart.current!==null) onDragEnd(); else { clearTimeout(autoTimer.current); cancelAnimationFrame(progressRaf.current); } }}
          onMouseEnter={()=>{ if(dragStart.current===null){ clearTimeout(autoTimer.current); cancelAnimationFrame(progressRaf.current); } }}
          onTouchStart={e=>onDragStart(e.touches[0].clientX)}
          onTouchMove={e=>onDragMove(e.touches[0].clientX)}
          onTouchEnd={onDragEnd}
        >
          <div
            ref={trackRef}
            className="flex"
            style={{ gap:CARD_GAP, padding:`0 clamp(24px,4vw,64px) 0`, willChange:'transform' }}
          >
            {cards.map(({ product, theme, num }, i) => {
              const imgUrl = product.primary_image?.image_url || product.thumbnail || product.image_url || null;
              return (
                <div
                  key={product.id}
                  className="ps-card-item flex-shrink-0 relative overflow-hidden rounded-2xl transition-all duration-400"
                  style={{
                    width:CARD_W, height:CARD_H,
                    boxShadow: i===current ? '0 24px 56px -8px rgba(0,0,0,0.6)' : '0 8px 24px rgba(0,0,0,0.3)',
                    transform: i===current ? 'translateY(-6px)' : 'translateY(0)',
                    transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease',
                    cursor:'pointer',
                  }}
                  onClick={() => goTo(i, true)}
                >
                  {/* Gradient background */}
                  <div className="absolute inset-0 transition-all duration-400"
                    style={{ background:`linear-gradient(155deg,${theme.bg[0]} 0%,${theme.bg[1]} 100%)`, filter: i===current?'brightness(1)':'brightness(0.82)' }}/>

                  {/* Product image if available — overlaid on gradient */}
                  {imgUrl && (
                    <div className="absolute inset-0 transition-opacity duration-400"
                      style={{ opacity: i===current ? 0.42 : 0.28 }}>
                      <img src={imgUrl} alt={product.name} className="w-full h-full object-cover"/>
                    </div>
                  )}

                  {/* Three.js canvas */}
                  <canvas
                    ref={el => canvasRefs.current[i] = el}
                    width={CARD_W} height={CARD_H}
                    className="absolute inset-0"
                    style={{ width:'100%', height:'100%', pointerEvents:'none' }}
                  />

                  {/* Content overlay */}
                  <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
                    {/* Top — frosted tag */}
                    <div className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.18em]"
                      style={{ background:'rgba(255,255,255,0.18)', backdropFilter:'blur(8px)', border:'0.5px solid rgba(255,255,255,0.3)', color:'rgba(255,255,255,0.92)' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/80"/>
                      {product.product_type?.replace(/_/g,' ') || theme.tag}
                    </div>

                    {/* Bottom — name + description */}
                    <div>
                      <p className="text-[10px] tracking-[0.18em] mb-1.5" style={{color:'rgba(255,255,255,0.5)',fontFamily:"'Inter',sans-serif"}}>
                        {num}.
                      </p>
                      <h3 className="font-display text-white leading-none" style={{fontSize:'clamp(2rem,6vw,2.5rem)',fontWeight:300,letterSpacing:'-1px'}}>
                        {product.name}
                      </h3>
                      {product.medium && (
                        <p className="mt-2 text-[11px] leading-relaxed" style={{color:'rgba(255,255,255,0.55)',letterSpacing:'0.3px'}}>
                          {product.medium}
                        </p>
                      )}
                      {product.price && (
                        <p className="mt-2 text-sm font-medium" style={{color:'rgba(255,255,255,0.8)'}}>
                          {formatPrice(product.price)}
                        </p>
                      )}
                      {/* View link — only active card */}
                      {i===current && (
                        <Link
                          to={`/shop/${product.slug}`}
                          className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] pointer-events-auto"
                          style={{color:'white',borderBottom:'1px solid rgba(255,255,255,0.4)',paddingBottom:1}}
                          onClick={e=>e.stopPropagation()}
                        >
                          View Artwork
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div
                    ref={el => progressRefs.current[i] = el}
                    className="absolute bottom-0 left-0 h-[2.5px] w-0"
                    style={{background:'rgba(255,255,255,0.75)'}}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Dots + nav */}
        <div className="flex items-center justify-between px-6 sm:px-10 lg:px-16 py-6 sm:py-8">
          {/* Dots */}
          <div className="flex items-center gap-2">
            {cards.map((_,i)=>(
              <button
                key={i}
                className="ps-dot-item h-[5px] rounded-full transition-all duration-350 cursor-pointer"
                style={{
                  width: i===current ? 20 : 5,
                  background: i===current ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)',
                  border:'none',
                }}
                onClick={()=>goTo(i,true)}
                aria-label={`Go to slide ${i+1}`}
              />
            ))}
          </div>

          {/* Nav arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={()=>goTo(current-1,true)}
              aria-label="Previous"
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 text-base"
              style={{border:'0.5px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.75)'}}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.15)';e.currentTarget.style.borderColor='rgba(255,255,255,0.4)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.07)';e.currentTarget.style.borderColor='rgba(255,255,255,0.2)';}}
            >←</button>
            <button
              onClick={()=>goTo(current+1,true)}
              aria-label="Next"
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 text-base"
              style={{border:'0.5px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.75)'}}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.15)';e.currentTarget.style.borderColor='rgba(255,255,255,0.4)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.07)';e.currentTarget.style.borderColor='rgba(255,255,255,0.2)';}}
            >→</button>
          </div>
        </div>

        {/* Mobile view-all */}
        <div className="sm:hidden text-center pb-10">
          <Link to="/shop" className="text-[11px] uppercase tracking-[0.22em]" style={{color:'rgba(255,255,255,0.4)'}}>
            View All Artworks →
          </Link>
        </div>
      </div>

      {/* Bottom rule */}
      <div className="w-full h-px" style={{background:'rgba(255,255,255,0.06)'}}/>
    </section>
  );
}
