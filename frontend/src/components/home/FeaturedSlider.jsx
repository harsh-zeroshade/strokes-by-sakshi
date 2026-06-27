import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════════════════
   TRUE INFINITE SLIDER
   Strategy: render [clone_tail | original | clone_head] triple track.
   Start at the "original" offset. When we scroll into a clone,
   silently snap back to the matching original card — the user never
   sees a gap or a jump.
═══════════════════════════════════════════════════════════════════ */

const CARD_W   = 300;
const CARD_H   = 420;
const CARD_GAP = 20;
const STRIDE   = CARD_W + CARD_GAP;
const INTERVAL = 3500;          // ms auto-advance
const ANIM     = '0.55s cubic-bezier(0.22,1,0.36,1)';

function formatPrice(p) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(p);
}

const FALLBACK_GRADIENTS = [
  'linear-gradient(155deg,#e8c4b8 0%,#c7694f 100%)',
  'linear-gradient(155deg,#c8d8be 0%,#9caf88 100%)',
  'linear-gradient(155deg,#e8dfc8 0%,#c9a94e 100%)',
  'linear-gradient(155deg,#d4c8b8 0%,#8a6e52 100%)',
  'linear-gradient(155deg,#c8ccd8 0%,#6878a8 100%)',
];

function getImg(p) {
  return p?.primary_image?.image_url || p?.thumbnail || p?.image_url || null;
}

/* padding left of the track so active card appears centred-ish */
const PAD_LEFT = 'clamp(24px, 4vw, 64px)';

export default function FeaturedSlider({ products }) {
  const total = products.length;

  /* ── refs that survive re-renders without causing them ── */
  const trackRef    = useRef(null);
  const currentRef  = useRef(0);          // actual index in original set
  const timerRef    = useRef(null);
  const rafRef      = useRef(null);
  const tsRef       = useRef(null);       // progress start timestamp
  const pausedRef   = useRef(false);
  const dragStartX  = useRef(null);
  const dragDeltaX  = useRef(0);
  const progressRefs = useRef([]);        // length = total

  /* React state — only for re-rendering dots/active styling */
  const [active, setActive] = useState(0);

  /* ── compute translateX for a real index (in original set) ── */
  /* We always keep the track in the MIDDLE copy → offset = total * STRIDE */
  const offsetFor = (idx) => (total + idx) * STRIDE;

  /* ── instant snap (no animation) ── */
  const snapTo = (idx) => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = 'none';
    el.style.transform = `translateX(-${offsetFor(idx)}px)`;
  };

  /* ── animated slide ── */
  const slideTo = (idx, animated = true) => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = animated ? `transform ${ANIM}` : 'none';
    el.style.transform = `translateX(-${offsetFor(idx)}px)`;
  };

  /* ── progress bar ── */
  const startProgress = (idx) => {
    cancelAnimationFrame(rafRef.current);
    progressRefs.current.forEach(b => {
      if (b) { b.style.transition = 'none'; b.style.width = '0%'; }
    });
    tsRef.current = performance.now();
    const bar = progressRefs.current[idx];
    const tick = () => {
      const pct = Math.min(100, ((performance.now() - tsRef.current) / INTERVAL) * 100);
      if (bar) { bar.style.transition = 'none'; bar.style.width = pct + '%'; }
      if (pct < 100) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  /* ── advance to next/prev, wrapping correctly ── */
  const goTo = (rawIdx, animated = true) => {
    const next = ((rawIdx % total) + total) % total;
    currentRef.current = next;
    slideTo(next, animated);
    setActive(next);
    startProgress(next);
  };

  /* ── auto-cycle using a stable setInterval ── */
  const startAuto = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (pausedRef.current) return;
      goTo(currentRef.current + 1);
    }, INTERVAL);
  };

  const stopAuto  = () => clearInterval(timerRef.current);
  const resetAuto = () => { stopAuto(); startAuto(); };

  /* ── init ── */
  useEffect(() => {
    if (!total) return;
    snapTo(0);
    startProgress(0);
    startAuto();
    return () => {
      stopAuto();
      cancelAnimationFrame(rafRef.current);
    };
  }, [total]); // eslint-disable-line

  /* ── after a slide animation ends: silently jump if in clone zone ── */
  const onTransitionEnd = () => {
    /* currentRef already holds the canonical index; just re-snap silently */
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = 'none';
    el.style.transform = `translateX(-${offsetFor(currentRef.current)}px)`;
  };

  /* ── keyboard ── */
  useEffect(() => {
    const fn = (e) => {
      if (e.key === 'ArrowRight') { goTo(currentRef.current + 1); resetAuto(); }
      if (e.key === 'ArrowLeft')  { goTo(currentRef.current - 1); resetAuto(); }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [total]); // eslint-disable-line

  /* ── drag / swipe ── */
  const onDragStart = (x) => { dragStartX.current = x; dragDeltaX.current = 0; };
  const onDragMove  = (x) => { if (dragStartX.current !== null) dragDeltaX.current = x - dragStartX.current; };
  const onDragEnd   = () => {
    if (dragStartX.current === null) return;
    if (dragDeltaX.current < -55)      { goTo(currentRef.current + 1); resetAuto(); }
    else if (dragDeltaX.current > 55)  { goTo(currentRef.current - 1); resetAuto(); }
    dragStartX.current = null;
  };

  /* ── skeleton ── */
  if (!total) {
    return (
      <section className="bg-ivory dark:bg-[#1A1814]">
        <div className="w-full h-px bg-charcoal/8 dark:bg-white/8" />
        <div className="flex gap-5 overflow-hidden px-6 py-16">
          {[0,1,2,3].map(i => (
            <div key={i} className="flex-shrink-0 rounded-2xl animate-pulse bg-cream dark:bg-[#252219]"
              style={{ width:CARD_W, height:CARD_H }} />
          ))}
        </div>
      </section>
    );
  }

  /* ── build triple-clone array ── */
  /* [tail_clone(N cards), originals(N cards), head_clone(N cards)] */
  const tripled = [...products, ...products, ...products];

  return (
    <section className="bg-ivory dark:bg-[#1A1814]">
      <div className="w-full h-px bg-charcoal/8 dark:bg-white/8" />

      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between px-6 sm:px-10 lg:px-16 pt-16 sm:pt-20 pb-6 sm:pb-8">
          <div>
            <span className="text-[10px] uppercase tracking-[0.35em] text-charcoal-muted dark:text-[#9A9590] font-medium">
              02 · Featured Works
            </span>
            <h2 className="mt-3 font-display text-charcoal dark:text-[#F0EDE8] leading-tight"
              style={{ fontSize:'clamp(1.8rem,4.5vw,3.5rem)', fontWeight:400, letterSpacing:'-1px' }}>
              Original <em className="not-italic text-terracotta">Artworks</em>
            </h2>
          </div>
          <Link to="/shop"
            className="hidden sm:inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-charcoal-muted hover:text-charcoal dark:text-[#9A9590] dark:hover:text-[#F0EDE8] transition-colors">
            View All
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </Link>
        </div>

        {/* Track wrapper */}
        <div
          className="overflow-hidden cursor-grab active:cursor-grabbing select-none"
          style={{ perspective:'1400px' }}
          onMouseDown={e  => onDragStart(e.clientX)}
          onMouseMove={e  => onDragMove(e.clientX)}
          onMouseUp={onDragEnd}
          onMouseLeave={() => { onDragEnd(); pausedRef.current = false; }}
          onMouseEnter={() => { pausedRef.current = true; cancelAnimationFrame(rafRef.current); }}
          onTouchStart={e => onDragStart(e.touches[0].clientX)}
          onTouchMove={e  => onDragMove(e.touches[0].clientX)}
          onTouchEnd={onDragEnd}
        >
          <div
            ref={trackRef}
            className="flex"
            onTransitionEnd={onTransitionEnd}
            style={{ gap:CARD_GAP, paddingLeft:PAD_LEFT, paddingBottom:24, willChange:'transform' }}
          >
            {tripled.map((product, triIdx) => {
              /* real index within original set */
              const realIdx  = triIdx % total;
              const isActive = realIdx === active;

              let offset = realIdx - active;
              if (offset >  total / 2) offset -= total;
              if (offset < -total / 2) offset += total;
              const absOff = Math.abs(offset);

              const scale   = isActive ? 1 : Math.max(0.88, 1 - absOff * 0.06);
              const rotateY = offset * -6;
              const tz      = isActive ? 0 : -absOff * 30;
              const opacity = isActive ? 1 : Math.max(0.50, 1 - absOff * 0.18);
              const img     = getImg(product);

              return (
                <div
                  key={triIdx}
                  onClick={() => { goTo(realIdx); resetAuto(); }}
                  className="flex-shrink-0 relative overflow-hidden rounded-2xl"
                  style={{
                    width: CARD_W, height: CARD_H, cursor:'pointer',
                    transformStyle: 'preserve-3d',
                    transform: `scale(${scale}) rotateY(${rotateY}deg) translateZ(${tz}px)`,
                    opacity,
                    transition: `transform ${ANIM}, opacity 0.45s ease, box-shadow 0.4s ease`,
                    boxShadow: isActive
                      ? '0 28px 72px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.10)'
                      : '0 8px 28px rgba(0,0,0,0.10)',
                  }}
                >
                  {/* BG */}
                  {img ? (
                    <img src={img} alt={product.name} draggable={false}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ transform: isActive ? 'scale(1.04)' : 'scale(1)', transition:'transform 0.7s ease' }}
                    />
                  ) : (
                    <div className="absolute inset-0"
                      style={{ background: FALLBACK_GRADIENTS[realIdx % FALLBACK_GRADIENTS.length] }} />
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background:'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.22) 48%, rgba(0,0,0,0.04) 100%)' }} />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-between p-5 pointer-events-none">
                    {/* Top — frosted tag */}
                    <div className="self-start">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.16em]"
                        style={{ background:'rgba(255,255,255,0.18)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)', border:'0.5px solid rgba(255,255,255,0.3)', color:'rgba(255,255,255,0.95)' }}>
                        <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background:'rgba(255,255,255,0.85)' }} />
                        {product.product_type?.replace(/_/g,' ') || 'Original'}
                      </span>
                    </div>

                    {/* Bottom — number, name, price, link */}
                    <div>
                      {/* Large decorative number — Delassus style */}
                      <div className="font-display leading-none select-none mb-1"
                        style={{ fontSize:'clamp(3rem,8vw,4.5rem)', fontWeight:300, color:'rgba(255,255,255,0.12)', letterSpacing:'-2px', lineHeight:1 }}>
                        {String(realIdx + 1).padStart(2, '0')}
                      </div>
                      <h3 className="font-display text-white leading-none"
                        style={{ fontSize:'clamp(1.5rem,4.5vw,2rem)', fontWeight:300, letterSpacing:'-0.5px' }}>
                        {product.name}
                      </h3>
                      {product.medium && (
                        <p className="mt-1 text-[11px] leading-relaxed" style={{ color:'rgba(255,255,255,0.55)', letterSpacing:'0.3px' }}>
                          {product.medium}
                        </p>
                      )}
                      <p className="mt-1.5 text-sm font-medium" style={{ color:'rgba(255,255,255,0.88)' }}>
                        {formatPrice(product.price)}
                      </p>
                      {/* View link — active card only */}
                      {isActive && (
                        <Link to={`/shop/${product.slug}`}
                          className="mt-3 pointer-events-auto inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] transition-opacity duration-300"
                          style={{ color:'white', borderBottom:'1px solid rgba(255,255,255,0.4)', paddingBottom:1 }}
                          onClick={e => e.stopPropagation()}
                        >
                          View Artwork
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Progress bar — only on original cards (triIdx in middle set) */}
                  {triIdx >= total && triIdx < total * 2 && (
                    <div ref={el => progressRefs.current[realIdx] = el}
                      className="absolute bottom-0 left-0 h-[2.5px]"
                      style={{ width:'0%', background:'rgba(255,255,255,0.80)' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dots + nav */}
        <div className="flex items-center justify-between px-6 sm:px-10 lg:px-16 py-5 sm:py-7">
          <div className="flex items-center gap-2">
            {products.map((_, i) => (
              <button key={i} onClick={() => { goTo(i); resetAuto(); }}
                aria-label={`Go to slide ${i+1}`}
                className="rounded-full transition-all duration-300 border-none p-0"
                style={{
                  height:5, width: i === active ? 22 : 5, cursor:'pointer',
                  background: i === active ? '#c7694f' : 'rgba(44,44,44,0.22)',
                }} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { goTo(currentRef.current - 1); resetAuto(); }}
              aria-label="Previous"
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all duration-200 text-charcoal-muted hover:text-charcoal dark:text-[#9A9590] dark:hover:text-[#F0EDE8]"
              style={{ border:'1px solid rgba(44,44,44,0.18)', background:'transparent' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='rgba(44,44,44,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='rgba(44,44,44,0.18)'}
            >←</button>
            <button onClick={() => { goTo(currentRef.current + 1); resetAuto(); }}
              aria-label="Next"
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all duration-200 text-charcoal-muted hover:text-charcoal dark:text-[#9A9590] dark:hover:text-[#F0EDE8]"
              style={{ border:'1px solid rgba(44,44,44,0.18)', background:'transparent' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='rgba(44,44,44,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='rgba(44,44,44,0.18)'}
            >→</button>
          </div>
        </div>

        <div className="sm:hidden text-center pb-10">
          <Link to="/shop" className="text-[11px] uppercase tracking-[0.22em] text-charcoal-muted hover:text-charcoal transition-colors">
            View All Artworks →
          </Link>
        </div>
      </div>

      <div className="w-full h-px bg-charcoal/8 dark:bg-white/8" />
    </section>
  );
}
