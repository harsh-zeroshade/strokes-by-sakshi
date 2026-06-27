import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { productAPI, wishlistAPI } from '../api';
import { useCart } from '../context/CartContext';
import { STORAGE_URL } from '../config';

/* ─── helpers ─────────────────────────────────────────────────────── */
function getImg(src) {
  if (!src) return null;
  const url = src?.image_url || src?.primary_image?.image_url || src?.thumbnail || src;
  if (!url || typeof url !== 'string') return null;
  return url.startsWith('http') ? url : `${STORAGE_URL}/${url}`;
}

function fmtPrice(p) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(p);
}

const ease = [0.16, 1, 0.3, 1];

/* stagger parent */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};
/* each child */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.75, ease } },
};

/* ─── Skeleton ─────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="pt-16 sm:pt-20 min-h-screen bg-ivory dark:bg-[#1A1814] px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1400px] mx-auto py-8 sm:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          <div className="aspect-[4/5] rounded-2xl bg-cream dark:bg-[#252219] animate-pulse" />
          <div className="space-y-5 pt-2">
            {[80, 50, 100, 60, 40].map((w, i) => (
              <div key={i} className={`h-5 rounded bg-cream dark:bg-[#252219] animate-pulse w-[${w}%]`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Image Zoom Modal ─────────────────────────────────────────────── */
function ZoomModal({ src, alt, onClose }) {
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-8"
        style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.img
          initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.88, opacity: 0 }} transition={{ duration: 0.4, ease }}
          src={src} alt={alt}
          className="max-h-[90vh] max-w-full object-contain rounded-xl shadow-2xl"
          onClick={e => e.stopPropagation()}
        />
        <button onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          aria-label="Close zoom">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Main Component ───────────────────────────────────────────────── */
export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product,       setProduct]       = useState(null);
  const [related,       setRelated]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [qty,           setQty]           = useState(1);
  const [variant,       setVariant]       = useState(null);
  const [added,         setAdded]         = useState(false);
  const [wishlisted,    setWishlisted]    = useState(false);
  const [imgIdx,        setImgIdx]        = useState(0);
  const [zoomed,        setZoomed]        = useState(false);
  const [activeTab,     setActiveTab]     = useState('description');

  useEffect(() => {
    setLoading(true); setImgIdx(0); setVariant(null); setAdded(false);
    productAPI.show(slug)
      .then(({ data }) => { setProduct(data.product); setRelated(data.related || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAdd = async () => {
    if (!product?.is_in_stock) return;
    try {
      await addToCart(product.id, qty, variant?.id || null);
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    } catch (e) { console.error(e); }
  };

  const toggleWish = async () => {
    try {
      await wishlistAPI.toggle(product.id);
      setWishlisted(w => !w);
    } catch (e) { console.error(e); }
  };

  if (loading) return <Skeleton />;
  if (!product) return (
    <div className="pt-24 min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-charcoal-muted">Artwork not found.</p>
      <Link to="/shop" className="text-sm uppercase tracking-widest text-terracotta hover:underline">Back to shop</Link>
    </div>
  );

  const images   = product.images?.length > 0 ? product.images : [];
  const mainImg  = images[imgIdx] ? getImg(images[imgIdx]) : getImg(product);
  const price    = product.price + (variant?.price_modifier || 0);
  const discount = product.compare_price && product.compare_price > price
    ? Math.round(((product.compare_price - price) / product.compare_price) * 100) : 0;

  const TABS = [
    { id: 'description', label: 'Description',  show: !!(product.description || product.short_description) },
    { id: 'story',       label: 'The Story',    show: !!product.story },
    { id: 'details',     label: 'Details',      show: true },
    { id: 'shipping',    label: 'Shipping',     show: true },
  ].filter(t => t.show);

  return (
    <div className="min-h-screen bg-ivory dark:bg-[#1A1814]">
      {/* Zoom modal */}
      {zoomed && mainImg && (
        <ZoomModal src={mainImg} alt={product.name} onClose={() => setZoomed(false)} />
      )}

      {/* ── Sticky breadcrumb bar ── */}
      <div className="sticky top-[64px] sm:top-[68px] z-40 bg-ivory/90 dark:bg-[#1A1814]/90 backdrop-blur-md border-b border-charcoal/6 dark:border-white/6">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center gap-2 text-[11px] text-charcoal-muted dark:text-[#9A9590]">
          <button onClick={() => navigate(-1)} className="hover:text-charcoal dark:hover:text-[#F0EDE8] transition-colors flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <span className="opacity-40">·</span>
          <Link to="/shop" className="hover:text-charcoal dark:hover:text-[#F0EDE8] transition-colors uppercase tracking-wider">Shop</Link>
          <span className="opacity-40">/</span>
          <span className="text-charcoal dark:text-[#F0EDE8] uppercase tracking-wider truncate max-w-[180px] sm:max-w-none">{product.name}</span>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-20">
        <div className="grid lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 xl:gap-20">

          {/* ════════════════════════════════════════
              LEFT — Image gallery
          ════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease }}
            className="flex flex-col gap-3"
          >
            {/* Main image */}
            <div
              className="relative rounded-2xl overflow-hidden bg-cream dark:bg-[#252219] cursor-zoom-in group"
              style={{ aspectRatio: '4/5' }}
              onClick={() => mainImg && setZoomed(true)}
            >
              <AnimatePresence mode="wait">
                <motion.div key={imgIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }} className="absolute inset-0">
                  {mainImg ? (
                    <img src={mainImg} alt={images[imgIdx]?.alt_text || product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-display text-6xl text-charcoal-muted/30">{product.name?.charAt(0)}</span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Top badges */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-wrap gap-2 z-10">
                <span className="text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full font-medium"
                  style={{ background:'rgba(250,247,242,0.90)', backdropFilter:'blur(8px)', color:'#6b6b6b' }}>
                  {product.product_type?.replace(/_/g,' ') || 'Original'}
                </span>
                {!product.is_in_stock && (
                  <span className="text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full font-medium bg-error/85 text-ivory">
                    Sold
                  </span>
                )}
                {discount > 0 && (
                  <span className="text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full font-medium bg-sage text-ivory">
                    {discount}% off
                  </span>
                )}
              </div>

              {/* Zoom hint */}
              <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {images.map((img, i) => (
                  <button key={img.id || i} onClick={() => setImgIdx(i)}
                    className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      imgIdx === i
                        ? 'border-charcoal dark:border-[#F0EDE8] opacity-100 scale-105'
                        : 'border-transparent opacity-50 hover:opacity-80'
                    }`}
                  >
                    <img src={getImg(img)} alt="" className="w-full h-full object-cover"/>
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* ════════════════════════════════════════
              RIGHT — Product info
          ════════════════════════════════════════ */}
          <motion.div
            variants={stagger} initial="hidden" animate="show"
            className="flex flex-col gap-6 sm:gap-7 pt-0 lg:pt-2"
          >
            {/* Collection */}
            {product.collection && (
              <motion.div variants={fadeUp}>
                <Link to={`/shop?collection=${product.collection.slug}`}
                  className="text-[10px] uppercase tracking-[0.3em] text-terracotta hover:text-terracotta-dark transition-colors">
                  {product.collection.name}
                </Link>
              </motion.div>
            )}

            {/* Title */}
            <motion.h1 variants={fadeUp}
              className="font-display text-charcoal dark:text-[#F0EDE8] leading-[1.02]"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}>
              {product.name}
            </motion.h1>

            {/* Price row */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-baseline gap-3">
              <span className="font-display text-2xl sm:text-3xl text-terracotta">{fmtPrice(price)}</span>
              {product.compare_price > price && (
                <span className="text-base sm:text-lg text-charcoal-muted dark:text-[#9A9590] line-through">{fmtPrice(product.compare_price)}</span>
              )}
              <span className="text-xs text-sage">incl. taxes</span>
            </motion.div>

            {/* Short description */}
            {product.short_description && (
              <motion.p variants={fadeUp}
                className="text-sm sm:text-base text-charcoal-muted dark:text-[#9A9590] leading-relaxed">
                {product.short_description}
              </motion.p>
            )}

            {/* Quick specs */}
            <motion.div variants={fadeUp}
              className="grid grid-cols-2 gap-x-4 gap-y-3 py-4 border-y border-charcoal/8 dark:border-white/8">
              {[
                { label: 'Medium',      value: product.medium },
                { label: 'Surface',     value: product.surface },
                { label: 'Dimensions',  value: (product.width_cm && product.height_cm) ? `${product.width_cm} × ${product.height_cm} cm` : null },
                { label: 'Orientation', value: product.orientation },
              ].filter(s => s.value).map(s => (
                <div key={s.label}>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-charcoal-muted dark:text-[#9A9590]">{s.label}</p>
                  <p className="text-sm text-charcoal dark:text-[#F0EDE8] mt-0.5 capitalize">{s.value}</p>
                </div>
              ))}
            </motion.div>

            {/* Variants */}
            {product.variants?.length > 0 && (
              <motion.div variants={fadeUp}>
                <p className="text-[10px] uppercase tracking-[0.22em] text-charcoal-muted dark:text-[#9A9590] mb-2">Options</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map(v => (
                    <button key={v.id} onClick={() => setVariant(v)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all duration-200 ${
                        variant?.id === v.id
                          ? 'border-charcoal dark:border-[#F0EDE8] bg-charcoal dark:bg-[#F0EDE8] text-ivory dark:text-[#1A1814]'
                          : 'border-border dark:border-[#2E2B25] text-charcoal-muted dark:text-[#9A9590] hover:border-charcoal/40 dark:hover:border-white/30'
                      }`}>
                      {v.name}{v.price_modifier > 0 ? ` (+${fmtPrice(v.price_modifier)})` : ''}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Qty + Add to Cart */}
            <motion.div variants={fadeUp} className="flex gap-3">
              {/* Quantity */}
              <div className="flex items-center rounded-xl border border-charcoal/12 dark:border-white/10 overflow-hidden flex-shrink-0">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-10 h-11 flex items-center justify-center text-charcoal dark:text-[#F0EDE8] hover:bg-cream dark:hover:bg-white/5 transition-colors text-lg leading-none">
                  −
                </button>
                <span className="w-8 text-center text-sm font-medium text-charcoal dark:text-[#F0EDE8]">{qty}</span>
                <button onClick={() => setQty(q => Math.min(10, q + 1))}
                  className="w-10 h-11 flex items-center justify-center text-charcoal dark:text-[#F0EDE8] hover:bg-cream dark:hover:bg-white/5 transition-colors text-lg leading-none">
                  +
                </button>
              </div>

              {/* Add to Cart */}
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleAdd}
                disabled={!product.is_in_stock || added}
                className="flex-1 h-11 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.22em] font-medium rounded-xl transition-all duration-300 disabled:cursor-not-allowed"
                style={{
                  background: added ? '#9CAF88' : '#2C2C2C',
                  color: 'white',
                  opacity: !product.is_in_stock ? 0.45 : 1,
                }}
                onMouseEnter={e => { if (!added && product.is_in_stock) e.currentTarget.style.background = '#C7694F'; }}
                onMouseLeave={e => { if (!added) e.currentTarget.style.background = added ? '#9CAF88' : '#2C2C2C'; }}
              >
                <AnimatePresence mode="wait">
                  {added ? (
                    <motion.span key="added" initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
                      className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                      Added
                    </motion.span>
                  ) : (
                    <motion.span key="add" initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}>
                      {product.is_in_stock ? 'Add to Cart' : 'Unavailable'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Wishlist */}
              <motion.button whileTap={{ scale: 0.9 }} onClick={toggleWish}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl border transition-all duration-200"
                style={{ borderColor: wishlisted ? '#C7694F' : 'rgba(44,44,44,0.12)', background: wishlisted ? 'rgba(199,105,79,0.08)' : 'transparent' }}>
                <svg className="w-4.5 h-4.5" fill={wishlisted ? '#C7694F' : 'none'} viewBox="0 0 24 24"
                  stroke={wishlisted ? '#C7694F' : 'currentColor'} strokeWidth={1.8} style={{ width:18, height:18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </motion.button>
            </motion.div>

            {/* Commission link */}
            <motion.div variants={fadeUp}>
              <Link to="/commission"
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-charcoal/10 dark:border-white/8 text-sm text-charcoal-muted dark:text-[#9A9590] hover:border-terracotta/40 hover:text-terracotta transition-all duration-300 group">
                <span>Want something like this? Commission a piece</span>
                <svg className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div variants={fadeUp}
              className="flex flex-wrap gap-3 sm:gap-4 py-4 border-t border-charcoal/8 dark:border-white/8">
              {[
                { icon:'🎨', text:'Handcrafted original' },
                { icon:'📦', text:'Secure packaging' },
                { icon:'↩️', text:'Easy returns' },
              ].map(b => (
                <div key={b.text} className="flex items-center gap-1.5 text-[11px] text-charcoal-muted dark:text-[#9A9590]">
                  <span>{b.icon}</span>
                  <span>{b.text}</span>
                </div>
              ))}
            </motion.div>

            {/* Tabbed content */}
            <motion.div variants={fadeUp} className="border-t border-charcoal/8 dark:border-white/8 pt-1">
              {/* Tab nav */}
              <div className="flex gap-0 overflow-x-auto scrollbar-hide -mx-1 px-1">
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`flex-shrink-0 px-3 py-2.5 text-[11px] uppercase tracking-[0.18em] font-medium transition-colors duration-200 relative ${
                      activeTab === t.id
                        ? 'text-charcoal dark:text-[#F0EDE8]'
                        : 'text-charcoal-muted dark:text-[#9A9590] hover:text-charcoal dark:hover:text-[#F0EDE8]'
                    }`}>
                    {t.label}
                    {activeTab === t.id && (
                      <motion.div layoutId="tab-line"
                        className="absolute bottom-0 left-3 right-3 h-[1.5px] bg-terracotta rounded-full"
                        transition={{ type:'spring', stiffness:400, damping:32 }}/>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab panels */}
              <div className="mt-4 min-h-[80px]">
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab}
                    initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                    transition={{ duration:0.25 }}>
                    {activeTab === 'description' && (
                      <p className="text-sm leading-relaxed text-charcoal-muted dark:text-[#9A9590]">
                        {product.description || product.short_description || 'No description available.'}
                      </p>
                    )}
                    {activeTab === 'story' && (
                      <blockquote className="border-l-2 border-terracotta/40 pl-4 italic text-sm leading-relaxed text-charcoal dark:text-[#D8D4CE]">
                        {product.story}
                      </blockquote>
                    )}
                    {activeTab === 'details' && (
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        {[
                          { dt:'Medium',      dd: product.medium },
                          { dt:'Surface',     dd: product.surface },
                          { dt:'Dimensions',  dd: (product.width_cm && product.height_cm) ? `${product.width_cm} × ${product.height_cm} cm` : null },
                          { dt:'Orientation', dd: product.orientation },
                          { dt:'Type',        dd: product.product_type?.replace(/_/g,' ') },
                          { dt:'Collection',  dd: product.collection?.name },
                          { dt:'SKU',         dd: product.sku },
                        ].filter(d => d.dd).map(d => (
                          <div key={d.dt} className="flex gap-2">
                            <dt className="text-charcoal-muted dark:text-[#9A9590] flex-shrink-0 w-24">{d.dt}</dt>
                            <dd className="text-charcoal dark:text-[#D8D4CE] capitalize">{d.dd}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {activeTab === 'shipping' && (
                      <ul className="text-sm text-charcoal-muted dark:text-[#9A9590] space-y-2.5">
                        {[
                          'Free shipping across India on orders over ₹5,000',
                          'International shipping available — calculated at checkout',
                          'Artwork is wrapped in acid-free tissue and boxed with corner protectors',
                          'Delivery typically within 5–8 business days',
                          '14-day return policy on undamaged artworks',
                        ].map((l, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-sage mt-0.5 flex-shrink-0">✓</span>
                            {l}
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ── Related Works ── */}
      {related.length > 0 && (
        <section className="bg-cream/40 dark:bg-[#141210] border-t border-charcoal/8 dark:border-white/6">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <div className="flex items-end justify-between mb-8 sm:mb-10">
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-[#9A9590]">You may also like</span>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl text-charcoal dark:text-[#F0EDE8]">Related Works</h2>
              </div>
              <Link to="/shop" className="hidden sm:flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-charcoal-muted hover:text-charcoal dark:text-[#9A9590] dark:hover:text-[#F0EDE8] transition-colors">
                View All <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {related.slice(0, 4).map((item, i) => (
                <motion.div key={item.id}
                  initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
                  viewport={{ once:true, margin:'-60px' }}
                  transition={{ delay: i*0.1, duration:0.7, ease }}>
                  <Link to={`/shop/${item.slug}`} className="group block">
                    <div className="aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden bg-cream dark:bg-[#252219] relative">
                      {getImg(item) ? (
                        <img src={getImg(item)} alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy"/>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-display text-4xl text-charcoal-muted/30">{item.name?.charAt(0)}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
                    </div>
                    <div className="mt-2 sm:mt-3 px-0.5">
                      <h3 className="text-xs sm:text-sm font-medium text-charcoal dark:text-[#D8D4CE] group-hover:text-terracotta dark:group-hover:text-terracotta transition-colors truncate leading-snug">{item.name}</h3>
                      <p className="text-xs sm:text-sm text-terracotta mt-0.5 font-medium">{fmtPrice(item.price)}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
