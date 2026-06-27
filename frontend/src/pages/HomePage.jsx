import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import HeroSection from '../components/home/HeroSection';
import FeaturedSlider from '../components/home/FeaturedSlider';
import CollectionCards from '../components/home/CollectionCards';
import TestimonialsSection from '../components/home/TestimonialsSection';
import { productAPI } from '../api';
import { STORAGE_URL } from '../config';

function getImageUrl(product) {
  const url = product.primary_image?.image_url || product.thumbnail || product.image_url;
  if (!url) return null;
  return url.startsWith('http') ? url : `${STORAGE_URL}/${url}`;
}

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
};

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(price);
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [testimonials] = useState([
    { id: 1, name: 'Ananya M.', text: "Sakshi captured my parents' anniversary portrait with such emotion — it brought tears to our eyes. The details are incredible.", rating: 5, type: 'Portrait Commission' },
    { id: 2, name: 'Rohan K.', text: "I've bought three pieces now. Each one is more beautiful than the last. The quality and care in every brushstroke is evident.", rating: 5, type: 'Collector' },
    { id: 3, name: 'Meera P.', text: "The custom canvas of my daughter is the most treasured piece in our home. Thank you for immortalizing such a precious moment.", rating: 5, type: 'Custom Order' },
  ]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [{ data: feat }, { data: coll }] = await Promise.all([
          productAPI.featured(),
          productAPI.collections(),
        ]);
        setFeaturedProducts(Array.isArray(feat) ? feat : []);
        setCollections(Array.isArray(coll) ? coll : []);
      } catch {}
    };
    loadData();
  }, []);

  return (
    <div>
      {/* ── Hero ── */}
      <HeroSection />

      {/* ── SPACER — pushes the rest of the page below the fixed hero ── */}
      <div style={{ height: '100vh' }} aria-hidden="true" />

      {/* ── Scrollable content sits on top of the fixed hero ── */}
      <div className="relative bg-ivory dark:bg-[#1A1814]" style={{ zIndex: 10, isolation: 'isolate' }}>

      {/* ══════════════════════════════════════════════════════════
          OUR PHILOSOPHY — Delassus-style: full-bleed, large number,
          split text left / quote right, thin rule dividers
      ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-ivory dark:bg-[#1A1814]">
        {/* Top rule */}
        <div className="w-full h-px bg-charcoal/8 dark:bg-white/8" />

        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
          {/* Large eyebrow number — Delassus aesthetic */}
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ duration: 1.2 }}
            className="pt-16 sm:pt-20 select-none pointer-events-none"
          >
            <span className="font-display text-[clamp(80px,16vw,180px)] font-300 leading-none"
              style={{ color: 'rgba(199,105,79,0.08)', letterSpacing: '-4px', display: 'block' }}>
              01
            </span>
          </motion.div>

          {/* Split layout */}
          <div className="grid lg:grid-cols-2 gap-0 -mt-8 sm:-mt-12 lg:-mt-16 pb-20 sm:pb-28">
            {/* Left — big headline */}
            <motion.div
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.9, ease: [0.16,1,0.3,1] }}
              className="flex flex-col justify-end pr-0 lg:pr-16 pb-0 lg:pb-0"
            >
              <span className="text-[10px] uppercase tracking-[0.35em] text-charcoal-muted dark:text-[#9A9590] font-medium mb-5">
                Our Philosophy
              </span>
              <h2 className="font-display text-charcoal dark:text-[#F0EDE8] leading-[1.0] tracking-tight"
                style={{ fontSize: 'clamp(2.8rem,6.5vw,6rem)' }}>
                Every piece<br/>
                of art<br/>
                <em className="not-italic text-terracotta">tells a story</em>
              </h2>
              <div className="mt-8 h-px w-12 bg-terracotta/40" />
            </motion.div>

            {/* Right — body copy + stats */}
            <motion.div
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: 0.18, duration: 0.9, ease: [0.16,1,0.3,1] }}
              className="flex flex-col justify-end pt-10 lg:pt-0 lg:pl-4 lg:border-l border-charcoal/10 dark:border-white/8"
            >
              <p className="text-base sm:text-lg text-charcoal-muted dark:text-[#9A9590] leading-relaxed max-w-prose">
                At Strokes by Sakshi, art is more than decoration — it's an emotional archive.
                Each portrait, landscape, and abstract expression carries the weight of human
                experience, transformed into visual poetry on canvas.
              </p>
              <p className="mt-5 text-sm text-charcoal-muted/70 dark:text-[#9A9590]/70 leading-relaxed max-w-prose">
                Every piece begins with a conversation. I listen to what matters to you —
                a face, a place, a feeling — and I paint it so it lasts a lifetime.
              </p>

              {/* Stat row */}
              <div className="mt-10 flex items-center gap-10 sm:gap-14">
                {[
                  { v: '200+', l: 'Original works' },
                  { v: '98%',  l: 'Satisfied collectors' },
                  { v: '6+',   l: 'Years creating' },
                ].map(({ v, l }) => (
                  <div key={l}>
                    <p className="font-display text-2xl sm:text-3xl text-charcoal dark:text-[#F0EDE8] leading-none">{v}</p>
                    <p className="mt-1.5 text-[10px] uppercase tracking-[0.2em] text-charcoal-muted dark:text-[#9A9590]">{l}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link to="/about"
                  className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-charcoal dark:text-[#F0EDE8] hover:text-terracotta dark:hover:text-terracotta transition-colors duration-300">
                  Meet the Artist
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                  </svg>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom rule */}
        <div className="w-full h-px bg-charcoal/8 dark:bg-white/8" />
      </section>

      {/* ── Featured Collections ── */}
      {collections.length > 0 && (
        <motion.section {...fadeUp} className="py-16 lg:py-24 px-4 sm:px-6 bg-cream/50 dark:bg-cream/5">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="text-[10px] uppercase tracking-[0.35em] text-charcoal-muted font-medium">02 · Curated Collections</span>
                <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-display text-charcoal dark:text-[#F0EDE8]">
                  Explore Our Worlds
                </h2>
              </div>
              <p className="hidden sm:block text-xs text-charcoal-muted dark:text-[#9A9590]">Hover to explore · Click to browse</p>
            </div>
            <CollectionCards collections={collections.slice(0, 4)} />
          </div>
        </motion.section>
      )}

      {/* ── Featured Artworks ── */}
      <motion.section {...fadeUp} className="py-16 lg:py-24 px-4 sm:px-6 dark:bg-[#1A1814]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-[10px] uppercase tracking-[0.35em] text-charcoal-muted font-medium">
                {collections.length > 0 ? '03' : '02'} · Featured Works
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-display text-charcoal dark:text-[#F0EDE8]">
                Original Artworks
              </h2>
            </div>
            <Link to="/shop"
              className="text-[11px] uppercase tracking-[0.2em] text-charcoal-muted hover:text-charcoal dark:text-[#9A9590] dark:hover:text-[#F0EDE8] transition-colors flex items-center gap-2">
              View All
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </Link>
          </div>
          <FeaturedSlider products={featuredProducts} />
        </div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════
          COMMISSION — Delassus-style: dark full-bleed, large number,
          side-by-side headline + process steps, accent CTA button
      ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: '#0d0b08' }}>
        {/* Subtle warm gradient wash */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 20% 50%, rgba(199,105,79,0.10) 0%, transparent 65%), radial-gradient(ellipse 50% 70% at 85% 80%, rgba(201,169,78,0.07) 0%, transparent 60%)' }} />

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">

          {/* Large eyebrow number */}
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ duration: 1.2 }}
            className="pt-16 sm:pt-20 select-none pointer-events-none"
          >
            <span className="font-display leading-none block"
              style={{ fontSize: 'clamp(80px,16vw,180px)', color: 'rgba(199,105,79,0.08)', letterSpacing: '-4px' }}>
              03
            </span>
          </motion.div>

          {/* Top label */}
          <motion.span
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="block text-[10px] uppercase tracking-[0.35em] font-medium -mt-4 sm:-mt-8 lg:-mt-12 mb-10"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Commission an Original
          </motion.span>

          {/* Split — headline left, steps right */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 pb-8">

            {/* Left — headline + CTA */}
            <motion.div
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.95, ease: [0.16,1,0.3,1] }}
            >
              <h2 className="font-display text-white leading-[1.0] tracking-tight"
                style={{ fontSize: 'clamp(2.6rem,6vw,5.5rem)' }}>
                Have a<br/>
                vision?<br/>
                <em className="not-italic" style={{ color: '#C9A94E' }}>Let's create</em><br/>
                <em className="not-italic" style={{ color: '#C9A94E' }}>it together</em>
              </h2>
              <p className="mt-7 text-sm sm:text-base leading-relaxed max-w-md"
                style={{ color: 'rgba(255,255,255,0.52)' }}>
                Whether it's a beloved pet, a family portrait, or a completely original concept —
                I'll work with you to create something truly personal and meaningful.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link to="/commission"
                  className="inline-flex items-center gap-3 px-8 py-4 text-[11px] uppercase tracking-[0.22em] font-medium transition-all duration-300 hover:-translate-y-[2px]"
                  style={{ background: '#C7694F', color: 'white', borderRadius: 0 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#a85540'}
                  onMouseLeave={e => e.currentTarget.style.background = '#C7694F'}
                >
                  Start Your Commission
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                  </svg>
                </Link>
                <Link to="/gallery"
                  className="text-[11px] uppercase tracking-[0.22em] transition-colors duration-300"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                >
                  View past work →
                </Link>
              </div>
            </motion.div>

            {/* Right — numbered process steps */}
            <motion.div
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: 0.2, duration: 0.95, ease: [0.16,1,0.3,1] }}
              className="flex flex-col justify-center gap-0"
            >
              {[
                { n: '01', title: 'Share Your Vision',   desc: 'Tell me about your idea and share reference images or a quick brief.' },
                { n: '02', title: 'Get a Quote',         desc: "I'll review and send you a personalised estimate within 48 hours." },
                { n: '03', title: 'Creation Begins',     desc: 'Watch your vision come to life — I share progress updates throughout.' },
                { n: '04', title: 'Delivered with Love', desc: 'Your artwork arrives beautifully packaged, ready to hang.' },
              ].map((step, i) => (
                <motion.div
                  key={step.n}
                  initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: 0.25 + i * 0.1, duration: 0.7 }}
                  className="flex gap-6 py-5 border-b"
                  style={{ borderColor: 'rgba(255,255,255,0.07)' }}
                >
                  <span className="font-display text-xs flex-shrink-0 mt-0.5" style={{ color: '#C9A94E', letterSpacing: 1 }}>{step.n}</span>
                  <div>
                    <h4 className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.88)' }}>{step.title}</h4>
                    <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Bottom rule */}
        <div className="w-full h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-5 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'rgba(255,255,255,0.2)' }}>Strokes by Sakshi · Est. 2019</span>
          <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'rgba(255,255,255,0.2)' }}>India</span>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <TestimonialsSection testimonials={testimonials} />

      {/* ── Instagram Gallery Strip ── */}
      <motion.section {...fadeUp} className="py-16 lg:py-24 px-4 sm:px-6 bg-cream/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-[0.3em] text-charcoal-muted font-medium">
              @strokesbysakshi
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-display text-charcoal">Follow the Journey</h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
            {(featuredProducts.length > 0 ? featuredProducts.slice(0, 6) : [...Array(6)]).map((item, i) => {
              const imgUrl = item?.primary_image?.image_url
                || item?.thumbnail
                || `https://picsum.photos/seed/${70 + i}/400/400`;
              return (
                <a
                  key={i}
                  href="https://instagram.com/strokesbysakshi"
                  target="_blank" rel="noopener noreferrer"
                  className="aspect-square rounded-lg sm:rounded-xl overflow-hidden group relative block"
                >
                  <img
                    src={imgUrl}
                    alt={item?.name || `Artwork ${i + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-charcoal/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-ivory" fill="none" viewBox="0 0 24 24">
                      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                    </svg>
                  </div>
                </a>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <a
              href="https://instagram.com/strokesbysakshi"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex text-sm text-charcoal-muted hover:text-terracotta transition-colors uppercase tracking-wider"
            >
              Follow on Instagram →
            </a>
          </div>
        </div>
      </motion.section>

      {/* ── Final CTA ── */}
      <motion.section {...fadeUp} className="py-24 lg:py-32 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-charcoal leading-tight">
            Ready to own a piece<br />
            <span className="italic text-terracotta">of original art?</span>
          </h2>
          <p className="mt-6 text-base sm:text-lg text-charcoal-muted">
            Whether you're looking for the perfect piece or want to commission something uniquely yours.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link to="/shop"
              className="w-full sm:w-auto px-10 py-4 bg-charcoal text-ivory text-sm uppercase tracking-[0.2em] font-medium rounded-full hover:bg-charcoal-light transition-all text-center">
              Browse the Collection
            </Link>
            <Link to="/contact"
              className="w-full sm:w-auto px-10 py-4 border-2 border-charcoal/20 text-charcoal text-sm uppercase tracking-[0.2em] font-medium rounded-full hover:border-charcoal/40 transition-all text-center">
              Get in Touch
            </Link>
          </div>
        </div>
      </motion.section>
      </div>  {/* end scrollable content wrapper */}
    </div>
  );
}
