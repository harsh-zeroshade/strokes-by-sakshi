import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

const CARD_W   = 300;
const CARD_H   = 420;
const CARD_GAP = 20;
const INTERVAL = 3800;

function formatPrice(p) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(p);
}

/* card bg fallback gradients matching brand palette */
const FALLBACK_GRADIENTS = [
  'linear-gradient(155deg,#e8c4b8 0%,#c7694f 100%)',
  'linear-gradient(155deg,#c8d8be 0%,#9caf88 100%)',
  'linear-gradient(155deg,#e8dfc8 0%,#c9a94e 100%)',
  'linear-gradient(155deg,#d4c8b8 0%,#8a6e52 100%)',
  'linear-gradient(155deg,#c8ccd8 0%,#6878a8 100%)',
];

export default function FeaturedSlider({ products }) {
  const trackRef     = useRef(null);
  const wrapRef      = useRef(null);
  const progressRefs = useRef([]);
  const progressRaf  = useRef(null);
  const progressTs   = useRef(null);
  const autoTimer    = useRef(null);
  const dragStart    = useRef(null);
  const dragDelta    = useRef(0);
  const isPaused     = useRef(false);

  const [current, setCurrent] = useState(0);
  const total = products.length;

  /* ── translate track ── */
  const setTrack = useCallback((idx, animated = true) => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = animated
      ? 'transform 0.55s cubic-bezier(0.22,1,0.36,1)'
      : 'none';
    el.style.transform = `translateX(-${idx * (CARD_W + CARD_GAP)}px)`;
  }, []);

  /* ── progress bar ── */
  const startProgress = useCallback((idx) => {
    cancelAnimationFrame(progressRaf.current);
    progressRefs.current.forEach(b => {
      if (b) { b.style.transition = 'none'; b.style.width = '0%'; }
    });
    progressTs.current = performance.now();
    const bar = progressRefs.current[idx];
    const tick = () => {
      const pct = Math.min(100, ((performance.now() - progressTs.current) / INTERVAL) * 100);
      if (bar) { bar.style.transition = 'none'; bar.style.width = pct + '%'; }
      if (pct < 100) progressRaf.current = requestAnimationFrame(tick);
    };
    progressRaf.current = requestAnimationFrame(tick);
  }, []);

  /* ── goTo (infinite loop) ── */
  const goTo = useCallback((idx, userAction = false) => {
    const next = ((idx % total) + total) % total;
    setCurrent(next);
    setTrack(next);
    startProgress(next);
    if (userAction) resetAuto(next);
  }, [total, setTrack, startProgress]); // eslint-disable-line

  /* ── auto-cycle ── */
  const resetAuto = useCallback((from) => {
    clearTimeout(autoTimer.current);
    const loop = (i) => {
      autoTimer.current = setTimeout(() => {
        if (!isPaused.current) { goTo(i + 1); loop(i + 1); }
        else loop(i);
      }, INTERVAL);
    };
    loop(from ?? current);
  }, [goTo, current]); // eslint-disable-line

  useEffect(() => {
    if (!total) return;
    setTrack(0, false);
    startProgress(0);
    resetAuto(0);
    return () => {
      clearTimeout(autoTimer.current);
      cancelAnimationFrame(progressRaf.current);
    };
  }, [total]); // eslint-disable-line

  /* keyboard */
  useEffect(() => {
    const fn = e => {
      if (e.key === 'ArrowRight') goTo(current + 1, true);
      if (e.key === 'ArrowLeft')  goTo(current - 1, true);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [current, goTo]);

  /* drag/swipe */
  const dragBegin = x => { dragStart.current = x; dragDelta.current = 0; };
  const dragMove  = x => { if (dragStart.current !== null) dragDelta.current = x - dragStart.current; };
  const dragEnd   = () => {
    if (dragStart.current !== null) {
      if (dragDelta.current < -55)     goTo(current + 1, true);
      else if (dragDelta.current > 55) goTo(current - 1, true);
      else                             resetAuto(current);
      dragStart.current = null;
    }
  };

  const getImg = p =>
    p?.primary_image?.image_url || p?.thumbnail || p?.image_url || null;

  /* skeleton */
  if (!total) {
    return (
      <div className="py-12 px-4 sm:px-10 bg-ivory dark:bg-[#1A1814]">
        <div className="flex gap-5 overflow-hidden">
          {[0,1,2,3].map(i => (
            <div key={i}
              className="flex-shrink-0 rounded-2xl animate-pulse bg-cream dark:bg-[#252219]"
              style={{ width: CARD_W, height: CARD_H }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="bg-ivory dark:bg-[#1A1814]">
      {/* top rule */}
      <div className="w-full h-px bg-charcoal/8 dark:bg-white/8" />

      <div className="max-w-[1400px] mx-auto">
        {/* ── Section header ── */}
        <div className="flex items-end justify-between px-6 sm:px-10 lg:px-16 pt-16 sm:pt-20 pb-6 sm:pb-8">
          <div>
            <span className="text-[10px] uppercase tracking-[0.35em] text-charcoal-muted dark:text-[#9A9590] font-medium">
              02 · Featured Works
            </span>
            <h2 className="mt-3 font-display text-charcoal dark:text-[#F0EDE8] leading-tight"
              style={{ fontSize: 'clamp(1.8rem,4.5vw,3.5rem)', fontWeight: 400, letterSpacing: '-1px' }}>
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

        {/* ── Slider track ── */}
        <div
          ref={wrapRef}
          className="overflow-hidden cursor-grab active:cursor-grabbing select-none"
          onMouseDown={e => dragBegin(e.clientX)}
          onMouseMove={e => dragMove(e.clientX)}
          onMouseUp={dragEnd}
          onMouseLeave={() => { dragEnd(); isPaused.current = false; }}
          onMouseEnter={() => { isPaused.current = true; cancelAnimationFrame(progressRaf.current); }}
          onTouchStart={e => dragBegin(e.touches[0].clientX)}
          onTouchMove={e => dragMove(e.touches[0].clientX)}
          onTouchEnd={dragEnd}
          style={{ perspective: '1400px' }}
        >
          <div
            ref={trackRef}
            className="flex"
            style={{
              gap: CARD_GAP,
              padding: `0 clamp(24px,4vw,64px) 24px`,
              willChange: 'transform',
            }}
          >
            {products.map((product, i) => {
              const img    = getImg(product);
              const isActive = i === current;

              /* 3-D infinite loop: offset from current */
              let offset = i - current;
              if (offset >  total / 2) offset -= total;
              if (offset < -total / 2) offset += total;
              const absOff = Math.abs(offset);

              const scale   = isActive ? 1 : Math.max(0.88, 1 - absOff * 0.06);
              const rotateY = offset * -6;
              const tz      = isActive ? 0 : -absOff * 30;
              const opacity = isActive ? 1 : Math.max(0.55, 1 - absOff * 0.18);

              return (
                <div
                  key={product.id}
                  onClick={() => goTo(i, true)}
                  className="flex-shrink-0 relative overflow-hidden rounded-2xl"
                  style={{
                    width: CARD_W,
                    height: CARD_H,
                    cursor: 'pointer',
                    transformStyle: 'preserve-3d',
                    transform: `scale(${scale}) rotateY(${rotateY}deg) translateZ(${tz}px)`,
                    opacity,
                    transition: 'transform 0.55s cubic-bezier(0.22,1,0.36,1), opacity 0.45s ease, box-shadow 0.4s ease',
                    boxShadow: isActive
                      ? '0 28px 72px rgba(0,0,0,0.20), 0 4px 16px rgba(0,0,0,0.10)'
                      : '0 8px 28px rgba(0,0,0,0.10)',
                  }}
                >
                  {/* Background — image or fallback gradient */}
                  {img ? (
                    <img
                      src={img}
                      alt={product.name}
                      draggable={false}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700"
                      style={{ transform: isActive ? 'scale(1.04)' : 'scale(1)' }}
                    />
                  ) : (
                    <div className="absolute inset-0"
                      style={{ background: FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length] }}
                    />
                  )}

                  {/* Dark gradient overlay — stronger at bottom */}
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0.06) 100%)' }}
                  />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-between p-5 pointer-events-none">
                    {/* Top tag */}
                    <div className="self-start">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.16em]"
                        style={{ background:'rgba(255,255,255,0.18)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)', border:'0.5px solid rgba(255,255,255,0.32)', color:'rgba(255,255,255,0.95)' }}>
                        <span className="w-[5px] h-[5px] rounded-full bg-white/85 flex-shrink-0"/>
                        {product.product_type?.replace(/_/g,' ') || 'Original'}
                      </span>
                    </div>

                    {/* Bottom info */}
                    <div>
                      <p className="text-[10px] tracking-[0.16em] mb-1" style={{ color:'rgba(255,255,255,0.5)', fontFamily:"'Inter',sans-serif" }}>
                        {String(i + 1).padStart(2,'0')}.
                      </p>
                      <h3 className="font-display text-white leading-[1.0]"
                        style={{ fontSize: 'clamp(1.7rem,5vw,2.2rem)', fontWeight: 300, letterSpacing: '-0.5px' }}>
                        {product.name}
                      </h3>
                      {product.medium && (
                        <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color:'rgba(255,255,255,0.58)', letterSpacing:'0.3px' }}>
                          {product.medium}
                        </p>
                      )}
                      <p className="mt-2 text-sm font-medium" style={{ color:'rgba(255,255,255,0.88)' }}>
                        {formatPrice(product.price)}
                      </p>
                      {/* View artwork link — active card only */}
                      {isActive && (
                        <Link
                          to={`/shop/${product.slug}`}
                          className="mt-4 pointer-events-auto inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] transition-opacity duration-300"
                          style={{ color:'white', borderBottom:'1px solid rgba(255,255,255,0.45)', paddingBottom:1 }}
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

                  {/* Progress bar */}
                  <div
                    ref={el => progressRefs.current[i] = el}
                    className="absolute bottom-0 left-0 h-[2.5px]"
                    style={{ width: '0%', background: 'rgba(255,255,255,0.80)' }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Dots + nav ── */}
        <div className="flex items-center justify-between px-6 sm:px-10 lg:px-16 py-5 sm:py-7">
          <div className="flex items-center gap-2">
            {products.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i, true)}
                aria-label={`Go to slide ${i + 1}`}
                className="rounded-full transition-all duration-300"
                style={{
                  height: 5,
                  width: i === current ? 22 : 5,
                  background: i === current
                    ? '#c7694f'
                    : 'rgba(44,44,44,0.22)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goTo(current - 1, true)}
              aria-label="Previous"
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all duration-200 text-charcoal-muted hover:text-charcoal dark:text-[#9A9590] dark:hover:text-[#F0EDE8]"
              style={{ border:'1px solid rgba(44,44,44,0.18)', background:'transparent' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='rgba(44,44,44,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='rgba(44,44,44,0.18)'}
            >←</button>
            <button
              onClick={() => goTo(current + 1, true)}
              aria-label="Next"
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all duration-200 text-charcoal-muted hover:text-charcoal dark:text-[#9A9590] dark:hover:text-[#F0EDE8]"
              style={{ border:'1px solid rgba(44,44,44,0.18)', background:'transparent' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='rgba(44,44,44,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='rgba(44,44,44,0.18)'}
            >→</button>
          </div>
        </div>

        {/* mobile view all */}
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
