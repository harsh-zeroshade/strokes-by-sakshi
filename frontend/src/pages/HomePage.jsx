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
      <FeaturedSlider products={featuredProducts} />

      {/* ══════════════════════════════════════════════════════════
          COMMISSION — Delassus-style: dark full-bleed, large number,
          side-by-side headline + process steps, accent CTA button
      ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-cream/40 dark:bg-[#0d0b08]">
        {/* Subtle warm gradient wash */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 20% 50%, rgba(199,105,79,0.07) 0%, transparent 65%), radial-gradient(ellipse 50% 70% at 85% 80%, rgba(201,169,78,0.05) 0%, transparent 60%)' }} />

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">

          {/* Large eyebrow number */}
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ duration: 1.2 }}
            className="pt-16 sm:pt-20 select-none pointer-events-none"
          >
            <span
              className="font-display leading-none block select-none pointer-events-none"
              style={{ fontSize: 'clamp(80px,16vw,180px)', letterSpacing: '-4px', color: 'rgba(199,105,79,0.08)' }}>
              03
            </span>
          </motion.div>

          {/* Top label */}
          <motion.span
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="block text-[10px] uppercase tracking-[0.35em] font-medium -mt-4 sm:-mt-8 lg:-mt-12 mb-10 text-charcoal-muted dark:text-white/30"
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
              <h2 className="font-display text-charcoal dark:text-white leading-[1.0] tracking-tight"
                style={{ fontSize: 'clamp(2.6rem,6vw,5.5rem)' }}>
                Have a<br/>
                vision?<br/>
                <em className="not-italic text-gold">Let's create</em><br/>
                <em className="not-italic text-gold">it together</em>
              </h2>
              <p className="mt-7 text-sm sm:text-base leading-relaxed max-w-md text-charcoal-muted dark:text-white/50">
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
                  className="text-[11px] uppercase tracking-[0.22em] transition-colors duration-300 text-charcoal/50 dark:text-white/40 hover:text-charcoal dark:hover:text-white/85"
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
                  className="flex gap-6 py-5 border-b border-charcoal/10 dark:border-white/7"
                >
                  <span className="font-display text-xs flex-shrink-0 mt-0.5 text-gold" style={{ letterSpacing: 1 }}>{step.n}</span>
                  <div>
                    <h4 className="text-sm font-medium text-charcoal dark:text-white/88">{step.title}</h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-charcoal-muted dark:text-white/40">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Bottom rule */}
        <div className="w-full h-px bg-charcoal/8 dark:bg-white/6" />
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-5 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-white/20">Strokes by Sakshi · Est. 2019</span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-white/20">India</span>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <TestimonialsSection testimonials={testimonials} />

      {/* ══════════════════════════════════════════════════════════
          FOLLOW THE JOURNEY — Delassus-style full-bleed dark grid
          Section 05: large @handle background text, asymmetric grid,
          hover reveals with scale + overlay, bottom follow CTA
      ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-cream/30 dark:bg-[#0d0b08]">
        {/* Giant background handle */}
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center select-none pointer-events-none overflow-hidden">
          <span className="font-display whitespace-nowrap"
            style={{ fontSize:'clamp(80px,18vw,220px)', color:'rgba(199,105,79,0.04)', letterSpacing:'-4px', fontWeight:300, lineHeight:1 }}>
            @strokesbysakshi
          </span>
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
          {/* Section number */}
          <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }} transition={{ duration:1.2 }}
            className="pt-16 sm:pt-20 select-none pointer-events-none">
            <span className="font-display leading-none block text-terracotta/8 dark:text-[rgba(199,105,79,0.06)]"
              style={{ fontSize:'clamp(80px,16vw,180px)', letterSpacing:'-4px' }}>05</span>
          </motion.div>

          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-4 sm:-mt-8 lg:-mt-12 mb-10 sm:mb-14">
            <div>
              <span className="text-[10px] uppercase tracking-[0.35em] font-medium text-charcoal-muted dark:text-white/30">
                05 · Follow the Journey
              </span>
              <h2 className="mt-3 font-display text-charcoal dark:text-white leading-tight"
                style={{ fontSize:'clamp(1.8rem,4.5vw,3.5rem)' }}>
                Behind the <em className="not-italic text-terracotta">Canvas</em>
              </h2>
            </div>
            <a href="https://instagram.com/strokesbysakshi" target="_blank" rel="noopener noreferrer"
              className="self-start sm:self-end inline-flex items-center gap-2.5 text-[11px] uppercase tracking-[0.22em] transition-colors duration-300 text-charcoal-muted hover:text-charcoal dark:text-white/45 dark:hover:text-white">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
              </svg>
              @strokesbysakshi
            </a>
          </div>

          {/* Asymmetric grid */}
          {(() => {
            const items = featuredProducts.length > 0
              ? featuredProducts.slice(0, 6)
              : [...Array(6)].map((_, i) => ({ _placeholder: i }));
            return (
              <div className="grid grid-cols-6 grid-rows-2 gap-2 sm:gap-3" style={{ height:'clamp(320px,55vw,620px)' }}>
                {[
                  { colSpan:'col-span-3 row-span-2', idx:0 },
                  { colSpan:'col-span-2 row-span-1', idx:1 },
                  { colSpan:'col-span-1 row-span-1', idx:2 },
                  { colSpan:'col-span-1 row-span-1', idx:3 },
                  { colSpan:'col-span-2 row-span-1', idx:4 },
                ].map(({ colSpan, idx }) => {
                  const item = items[idx];
                  const imgUrl = item?.primary_image?.image_url || item?.thumbnail
                    || `https://picsum.photos/seed/${80+idx}/600/600`;
                  return (
                    <motion.a key={idx} href="https://instagram.com/strokesbysakshi"
                      target="_blank" rel="noopener noreferrer"
                      className={`${colSpan} relative overflow-hidden group ${idx >= 4 ? 'hidden sm:block' : ''}`}
                      initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
                      viewport={{ once:true, margin:'-60px' }}
                      transition={{ delay:idx*0.07, duration:0.7, ease:[0.16,1,0.3,1] }}
                    >
                      <img src={imgUrl} alt={item?.name || `Artwork ${idx+1}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy" />
                      <div className="absolute inset-0 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background:'linear-gradient(to top, rgba(13,11,8,0.82) 0%, transparent 60%)' }}>
                        <div className="flex items-center gap-2">
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.5">
                            <rect x="2" y="2" width="20" height="20" rx="5"/>
                            <circle cx="12" cy="12" r="4"/>
                            <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none"/>
                          </svg>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-white/80">View</span>
                        </div>
                      </div>
                    </motion.a>
                  );
                })}
              </div>
            );
          })()}

          {/* Bottom CTA row */}
          <div className="mt-8 sm:mt-10 pb-16 sm:pb-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <p className="text-xs sm:text-sm leading-relaxed max-w-sm text-charcoal-muted dark:text-white/35">
              Follow the process — from blank canvas to finished piece. Updates, behind-the-scenes and new drops.
            </p>
            <a href="https://instagram.com/strokesbysakshi" target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-3 px-8 py-3.5 text-[11px] uppercase tracking-[0.22em] font-medium transition-all duration-300 text-charcoal dark:text-white"
              style={{ border:'1px solid rgba(44,44,44,0.25)' }}
              onMouseEnter={e => { e.currentTarget.style.background='#2C2C2C'; e.currentTarget.style.color='white'; e.currentTarget.style.borderColor='transparent'; }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=''; e.currentTarget.style.borderColor='rgba(44,44,44,0.25)'; }}
            >
              Follow on Instagram
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="w-full h-px bg-charcoal/8 dark:bg-white/6" />
      </section>

      {/* ══════════════════════════════════════════════════════════
          FINAL CTA — Delassus-style: ivory bg, giant serif headline
          centered, section 06, two sharp-edge CTA buttons side by side,
          bottom metadata strip matching Commission section footer bar
      ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-ivory dark:bg-[#1A1814]">
        {/* Top rule */}
        <div className="w-full h-px bg-charcoal/8 dark:bg-white/8" />

        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
          {/* Giant background number */}
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ duration: 1.2 }}
            className="pt-16 sm:pt-20 select-none pointer-events-none"
          >
            <span className="font-display leading-none block"
              style={{ fontSize: 'clamp(80px,16vw,180px)', color: 'rgba(44,44,44,0.05)', letterSpacing: '-4px' }}>
              06
            </span>
          </motion.div>

          <div className="pb-20 sm:pb-28 -mt-4 sm:-mt-8 lg:-mt-14">
            {/* Eyebrow */}
            <motion.span
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.7 }}
              className="block text-[10px] uppercase tracking-[0.35em] text-charcoal-muted dark:text-[#9A9590] font-medium mb-8 sm:mb-10"
            >
              06 · Start Your Journey
            </motion.span>

            {/* Giant headline — full width like Delassus product name */}
            <motion.h2
              initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 1.0, ease: [0.16,1,0.3,1] }}
              className="font-display text-charcoal dark:text-[#F0EDE8] leading-[0.95] tracking-tight"
              style={{ fontSize: 'clamp(3rem,9.5vw,10rem)' }}
            >
              Ready to own<br/>
              a piece of<br/>
              <em className="not-italic text-terracotta">original art?</em>
            </motion.h2>

            {/* Divider */}
            <motion.div
              initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 1.0, ease: [0.16,1,0.3,1] }}
              className="mt-10 sm:mt-12 h-px origin-left"
              style={{ background: 'rgba(44,44,44,0.12)' }}
            />

            {/* Bottom row — body copy left, CTAs right */}
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8">
              <motion.p
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.8 }}
                className="text-sm sm:text-base leading-relaxed max-w-sm text-charcoal-muted dark:text-[#9A9590]"
              >
                Whether you're looking for the perfect piece for your home or want to commission
                something uniquely yours — the canvas is waiting.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: 0.35, duration: 0.8 }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto"
              >
                <Link
                  to="/shop"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 text-[11px] uppercase tracking-[0.22em] font-medium transition-all duration-300 hover:-translate-y-[2px] whitespace-nowrap"
                  style={{ background: '#2C2C2C', color: 'white', borderRadius: 0 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#C7694F'}
                  onMouseLeave={e => e.currentTarget.style.background = '#2C2C2C'}
                >
                  Browse the Collection
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                  </svg>
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 text-[11px] uppercase tracking-[0.22em] font-medium transition-all duration-300 whitespace-nowrap dark:text-[#F0EDE8]"
                  style={{ border: '1px solid rgba(44,44,44,0.25)', color: '#2C2C2C', borderRadius: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#2C2C2C'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2C2C2C'; }}
                >
                  Get in Touch
                </Link>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom rule + metadata strip */}
        <div className="w-full h-px bg-charcoal/8 dark:bg-white/8" />
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-5 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-[#9A9590]">
            Strokes by Sakshi · Every brushstroke tells a story
          </span>
          <Link to="/shop"
            className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-[#9A9590] hover:text-terracotta transition-colors">
            Shop →
          </Link>
        </div>
      </section>
      </div>  {/* end scrollable content wrapper */}
    </div>
  );
}
