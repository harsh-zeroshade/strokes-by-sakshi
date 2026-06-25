import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';

function formatPrice(p) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(p);
}

/* ─── Three.js ambient particle layer ──────────────────────────────────────── */
function AmbientCanvas({ mountRef }) {
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 5;

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();

    const sc = document.createElement('canvas');
    sc.width = sc.height = 64;
    const sctx = sc.getContext('2d');
    const g = sctx.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0,   'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.4)');
    g.addColorStop(1,   'rgba(255,255,255,0)');
    sctx.fillStyle = g;
    sctx.fillRect(0,0,64,64);
    const sprite = new THREE.CanvasTexture(sc);

    const N = 140;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const drifts = new Float32Array(N);
    const PALETTE = [
      new THREE.Color('#c7694f'),
      new THREE.Color('#c9a94e'),
      new THREE.Color('#9caf88'),
      new THREE.Color('#2c2c2c'),
    ];
    for (let i = 0; i < N; i++) {
      pos[i*3]   = (Math.random()-0.5)*18;
      pos[i*3+1] = (Math.random()-0.5)*12;
      pos[i*3+2] = (Math.random()-0.5)*7;
      const c = PALETTE[Math.floor(Math.random()*PALETTE.length)];
      col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b;
      drifts[i] = (Math.random()-0.5)*0.005;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.3, map: sprite, vertexColors: true,
      transparent: true, opacity: 0.6,
      blending: THREE.NormalBlending, depthWrite: false, sizeAttenuation: true,
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    let raf, mx=0, my=0;
    const onMouse = e => {
      mx = (e.clientX/window.innerWidth  - 0.5)*0.6;
      my = (e.clientY/window.innerHeight - 0.5)*0.4;
    };
    window.addEventListener('mousemove', onMouse);

    const clock = new THREE.Clock();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      pts.rotation.y = t*0.018;
      for (let i=0;i<N;i++) {
        pos[i*3+1] += drifts[i];
        if (pos[i*3+1]>6)  pos[i*3+1]=-6;
        if (pos[i*3+1]<-6) pos[i*3+1]= 6;
      }
      geo.attributes.position.needsUpdate = true;
      camera.position.x += (mx - camera.position.x)*0.03;
      camera.position.y += (-my - camera.position.y)*0.03;
      camera.lookAt(0,0,0);
      renderer.render(scene, camera);
    };
    tick();

    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouse);
      ro.disconnect();
      geo.dispose(); mat.dispose(); sprite.dispose(); renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []); // eslint-disable-line

  return null;
}

/* ─── responsive card size helper ──────────────────────────────────────────── */
function useContainerWidth(ref) {
  const [width, setWidth] = useState(800);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(ref.current);
    setWidth(ref.current.clientWidth);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

/* ─── FeaturedSlider ────────────────────────────────────────────────────────── */
export default function FeaturedSlider({ products }) {
  const wrapRef    = useRef(null);
  const ambientRef = useRef(null);
  const [active, setActive]        = useState(0);
  const [prev,   setPrev]          = useState(null);
  const [dir,    setDir]           = useState(1);
  const [transitioning, setTrans]  = useState(false);
  const total = products.length;

  /* live container width → responsive card sizing */
  const containerW = useContainerWidth(wrapRef);
  const isMobile   = containerW < 580;

  /*
   * Active card: takes up ~46% of container width on desktop, ~78% on mobile
   * Neighbour cards: each ~24% on desktop, ~32% on mobile
   * translateX spacing: enough to show partial neighbours on each side
   */
  const activeW   = isMobile ? containerW * 0.76 : containerW * 0.44;
  const neighW    = isMobile ? containerW * 0.30 : containerW * 0.23;
  const spacing   = isMobile ? 58 : 50;  // % translateX per step

  const getCardW  = (offset) => offset === 0 ? activeW : neighW;
  const getScale  = (offset) => {
    if (offset === 0) return 1;
    return Math.max(0.70, 1 - Math.abs(offset) * 0.15);
  };
  const getOpacity = (offset) => {
    if (offset === 0) return 1;
    return Math.max(0.22, 1 - Math.abs(offset) * 0.38);
  };

  /* slide */
  const goTo = useCallback((nextI, direction) => {
    if (transitioning || !total) return;
    const idx = ((nextI % total) + total) % total;
    if (idx === active) return;
    setPrev(active);
    setDir(direction);
    setActive(idx);
    setTrans(true);
  }, [transitioning, total, active]);

  const onTransitionEnd = useCallback(() => {
    setTrans(false);
    setPrev(null);
  }, []);

  /* auto-advance */
  useEffect(() => {
    if (!total) return;
    const id = setInterval(() => { if (!transitioning) goTo(active+1, 1); }, 5000);
    return () => clearInterval(id);
  }, [active, transitioning, goTo, total]);

  const getImg = p => p?.primary_image?.image_url || p?.thumbnail || p?.image_url || null;

  /* skeleton */
  if (!total) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1,2,3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[3/4] rounded-2xl bg-ivory-dark"/>
            <div className="mt-4 h-4 bg-ivory-dark rounded w-3/4"/>
          </div>
        ))}
      </div>
    );
  }

  const current = products[active];

  return (
    <div
      ref={wrapRef}
      className="relative select-none overflow-hidden rounded-2xl"
      style={{ height: isMobile ? 'clamp(480px,90vw,620px)' : 'clamp(520px,62vw,680px)' }}
    >
      {/* ── Three.js ambient particles ── */}
      <div ref={ambientRef} className="absolute inset-0 z-0 pointer-events-none">
        <AmbientCanvas mountRef={ambientRef} />
      </div>

      {/* ── Card strip ── */}
      <div className="absolute inset-0 z-10 flex items-center justify-center"
           style={{ perspective: '1200px' }}>
        {products.map((product, i) => {
          /* circular offset */
          let offset = i - active;
          if (offset >  total / 2) offset -= total;
          if (offset < -total / 2) offset += total;

          const isPrev = i === prev;
          const isCurr = i === active;

          if (Math.abs(offset) > 2 && !isPrev) return null;

          const cardW   = getCardW(offset);
          const scale   = getScale(offset);
          const opacity = getOpacity(offset);
          const rotateY = offset * -9;
          const txPct   = offset * spacing;

          let exitX = 0;
          if (isPrev && transitioning) exitX = dir * -65;

          return (
            <div
              key={product.id}
              onTransitionEnd={isCurr ? onTransitionEnd : undefined}
              style={{
                position:       'absolute',
                width:          `${cardW}px`,
                aspectRatio:    '3/4',
                zIndex:         isCurr ? 30 : isPrev ? 25 : 20 - Math.abs(offset),
                transform:      isPrev && transitioning
                  ? `translateX(${exitX}%) scale(${scale*0.82}) rotateY(0deg)`
                  : `translateX(${txPct}%) scale(${scale}) rotateY(${rotateY}deg)`,
                opacity:        isPrev && transitioning ? 0 : opacity,
                transition:     'transform 0.68s cubic-bezier(0.16,1,0.3,1), opacity 0.62s ease, width 0.3s ease',
                transformStyle: 'preserve-3d',
                willChange:     'transform, opacity',
              }}
            >
              <div
                className="w-full h-full rounded-2xl overflow-hidden relative"
                style={{
                  boxShadow: isCurr
                    ? '0 28px 70px rgba(0,0,0,0.22)'
                    : '0 8px 28px rgba(0,0,0,0.14)',
                }}
              >
                {getImg(product) ? (
                  <img
                    src={getImg(product)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-4xl font-display"
                    style={{ background: `hsl(${i*55},45%,70%)`, color: 'rgba(0,0,0,0.25)' }}
                  >
                    {product.name?.charAt(0)}
                  </div>
                )}

                {/* gradient overlay active card */}
                {isCurr && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none"/>
                )}

                {/* type badge */}
                <div className="absolute top-3 left-3">
                  <span
                    className="text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full font-medium"
                    style={{ background:'rgba(250,247,242,0.92)', color:'#6b6b6b' }}
                  >
                    {product.product_type?.replace(/_/g,' ')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Prev ── */}
      <button
        onClick={() => goTo(active-1, -1)}
        disabled={transitioning}
        aria-label="Previous"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-40
                   w-11 h-11 rounded-full
                   bg-ivory/92 backdrop-blur-sm border border-border shadow-lg
                   flex items-center justify-center
                   text-charcoal hover:text-terracotta hover:bg-ivory
                   transition-all disabled:opacity-30"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      {/* ── Next ── */}
      <button
        onClick={() => goTo(active+1, 1)}
        disabled={transitioning}
        aria-label="Next"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-40
                   w-11 h-11 rounded-full
                   bg-ivory/92 backdrop-blur-sm border border-border shadow-lg
                   flex items-center justify-center
                   text-charcoal hover:text-terracotta hover:bg-ivory
                   transition-all disabled:opacity-30"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
      </button>

      {/* ── Dots ── */}
      <div className="absolute bottom-[96px] left-1/2 -translate-x-1/2 z-40 flex gap-2.5">
        {products.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > active ? 1 : -1)}
            aria-label={`Slide ${i+1}`}
            style={{
              height:     8,
              width:      i === active ? 26 : 8,
              background: i === active ? '#c7694f' : 'rgba(44,44,44,0.22)',
              borderRadius: 999,
              transition: 'all 0.35s ease',
              border:     'none',
              cursor:     'pointer',
            }}
          />
        ))}
      </div>

      {/* ── Product info card ── */}
      {current && (
        <div
          key={active}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40
                     bg-ivory/95 backdrop-blur-md rounded-2xl
                     border border-border shadow-xl px-5 py-4
                     animate-infoUp"
          style={{ width: isMobile ? 'calc(100% - 48px)' : 'clamp(260px,44%,400px)' }}
        >
          <div className="flex items-start gap-3 justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.22em] text-charcoal-muted font-medium">
                {current.product_type?.replace(/_/g,' ')}
              </p>
              <h3 className="text-base font-display text-charcoal mt-0.5 truncate">
                {current.name}
              </h3>
              {current.medium && (
                <p className="text-xs text-charcoal-muted mt-0.5">{current.medium}</p>
              )}
            </div>
            <p className="text-base font-semibold text-terracotta flex-shrink-0 mt-0.5">
              {formatPrice(current.price)}
            </p>
          </div>
          <Link
            to={`/shop/${current.slug}`}
            className="mt-3 w-full flex items-center justify-center gap-1.5
                       py-2.5 rounded-xl text-xs uppercase tracking-wider font-medium
                       bg-charcoal text-ivory hover:bg-terracotta transition-colors duration-300"
          >
            View Artwork
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </Link>
        </div>
      )}

      <style>{`
        @keyframes infoUp {
          from { opacity:0; transform:translate(-50%,12px); }
          to   { opacity:1; transform:translate(-50%,0);    }
        }
        .animate-infoUp { animation: infoUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>
    </div>
  );
}
