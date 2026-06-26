import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import HeroSection from '../components/home/HeroSection';
import FeaturedSlider from '../components/home/FeaturedSlider';
import CollectionCards from '../components/home/CollectionCards';
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
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
};

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
}

/* ── Parallax wrapper — scrolls the child at a slower rate than the page ── */
function ParallaxSection({ children, className, speed = 0.15, style = {} }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', `${speed * 100}%`]);
  return (
    <div ref={ref} className={`relative overflow-hidden ${className || ''}`} style={style}>
      <motion.div style={{ y }} className="will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}

/* ── Star rating ── */
function StarRating({ rating }) {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className={`w-4 h-4 ${i < rating ? 'text-gold' : 'text-charcoal/10'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const testimonials = [
    { id: 1, name: 'Ananya M.', text: 'Sakshi captured my parents\' anniversary portrait with such emotion — it brought tears to our eyes. The details are incredible.', rating: 5, type: 'Portrait Commission' },
    { id: 2, name: 'Rohan K.', text: 'I\'ve bought three pieces now. Each one is more beautiful than the last. The quality and care in every brushstroke is evident.', rating: 5, type: 'Collector' },
    { id: 3, name: 'Meera P.', text: 'The custom canvas of my daughter is the most treasured piece in our home. Thank you for immortalizing such a precious moment.', rating: 5, type: 'Custom Order' },
  ];

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

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) { setSubscribed(true); setEmail(''); }
  };

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <HeroSection />

      {/* ── Brand Philosophy ── */}
      <motion.section {...fadeUp} className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-charcoal-muted font-medium">
            Our Philosophy
          </span>
          <h2 className="mt-5 sm:mt-6 text-3xl sm:text-5xl lg:text-6xl font-display text-charcoal leading-tight">
            Every piece of art<br />
            <span className="italic text-terracotta">tells a story</span>
          </h2>
          <p className="mt-6 sm:mt-8 text-base sm:text-lg text-charcoal-muted leading-relaxed max-w-2xl mx-auto">
            At Strokes by Sakshi, we believe art is more than decoration — it's an emotional archive.
            Each portrait, each landscape, each abstract expression carries the weight of human experience,
            transformed into visual poetry on canvas.
          </p>
          <div className="mt-10 sm:mt-14 grid grid-cols-3 gap-4 sm:gap-8 max-w-xs sm:max-w-sm mx-auto">
            {[
              { value: '200+', label: 'Artworks' },
              { value: '98%',  label: 'Satisfied' },
              { value: '5 ★',  label: 'Rating' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-xl sm:text-3xl font-display text-charcoal leading-none">{value}</p>
                <p className="mt-1 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-charcoal-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Featured Collections ── */}
      {collections.length > 0 && (
        <motion.section {...fadeUp} className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 bg-cream/50 dark:bg-cream/10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 sm:mb-12">
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-charcoal-muted font-medium">
                Curated Collections
              </span>
              <h2 className="mt-3 sm:mt-4 text-2xl sm:text-4xl lg:text-5xl font-display text-charcoal">
                Explore Our Worlds
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-charcoal-muted">Hover to explore · Click to browse</p>
            </div>
            <CollectionCards collections={collections.slice(0, 4)} />
          </div>
        </motion.section>
      )}

      {/* ── Featured Artworks Slider ── */}
      <motion.section {...fadeUp} className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-charcoal-muted font-medium">
                Featured Works
              </span>
              <h2 className="mt-3 sm:mt-4 text-2xl sm:text-4xl lg:text-5xl font-display text-charcoal">
                Original Artworks
              </h2>
            </div>
            <Link to="/shop" className="text-xs sm:text-sm text-charcoal-muted hover:text-charcoal transition-colors uppercase tracking-wider">
              View All →
            </Link>
          </div>
          <FeaturedSlider products={featuredProducts} />
        </div>
      </motion.section>

      {/* ── Meet the Artist ── */}
      <motion.section {...fadeUp} className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 bg-cream/40 dark:bg-cream/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Image column with parallax */}
            <ParallaxSection speed={-0.08} className="order-2 lg:order-1">
              <div className="relative mx-auto max-w-sm lg:max-w-none">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-cream">
                  <img
                    src="https://picsum.photos/seed/sakshi-artist/600/750"
                    alt="Sakshi — the artist behind Strokes by Sakshi"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 bg-ivory dark:bg-[#252219] rounded-2xl shadow-xl p-4 sm:p-5 border border-border">
                  <p className="text-xs text-charcoal-muted uppercase tracking-widest">Est.</p>
                  <p className="text-2xl sm:text-3xl font-display text-terracotta">2019</p>
                </div>
              </div>
            </ParallaxSection>
            {/* Text column */}
            <div className="order-1 lg:order-2">
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-charcoal-muted font-medium">
                Meet the Artist
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-display text-charcoal leading-tight">
                Hi, I'm <span className="italic text-terracotta">Sakshi</span>
              </h2>
              <p className="mt-5 text-base sm:text-lg text-charcoal-muted leading-relaxed">
                I'm a self-taught painter based in India, working primarily with acrylics and oils on canvas.
                My work explores the intersection of emotion and form — from intimate portraits to abstract
                landscapes that breathe with colour.
              </p>
              <p className="mt-4 text-sm sm:text-base text-charcoal-muted leading-relaxed">
                Every commission is a collaboration. I listen first, then I paint — ensuring each piece
                captures not just a likeness, but a feeling. A memory. A moment that deserves to live on canvas.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/about"
                  className="px-7 py-3 rounded-full bg-charcoal text-ivory text-xs uppercase tracking-[0.2em] font-medium
                             hover:bg-terracotta transition-all duration-300">
                  My Story
                </Link>
                <Link to="/gallery"
                  className="px-7 py-3 rounded-full border-2 border-charcoal/20 text-charcoal text-xs uppercase tracking-[0.2em] font-medium
                             hover:border-terracotta/50 hover:text-terracotta transition-all duration-300 dark:text-ivory dark:border-ivory/20">
                  View Gallery
                </Link>
              </div>
              {/* Mediums */}
              <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-2">
                {['Acrylic', 'Oil', 'Watercolour', 'Pencil', 'Mixed Media'].map(m => (
                  <span key={m} className="text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full bg-cream dark:bg-[#2E2B25] text-charcoal-muted">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Commission Highlight ── */}
      <motion.section {...fadeUp} className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-charcoal" />
        <div className="absolute inset-0 bg-noise opacity-10" />
        {/* Parallax decorative circle */}
        <ParallaxSection speed={-0.12} className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-ivory/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-ivory/5" />
        </ParallaxSection>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-ivory/40 font-medium"
          >
            Commission an Original
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 text-3xl sm:text-4xl lg:text-6xl font-display text-ivory leading-tight"
          >
            Have a vision?<br />
            <span className="italic text-gold">Let's create it together</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-6 sm:mt-8 text-sm sm:text-lg text-ivory/60 max-w-xl mx-auto leading-relaxed"
          >
            Whether it's a beloved pet, a family portrait, or a completely original concept —
            I'll work with you to create something truly personal and meaningful.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-8 sm:mt-10"
          >
            <Link to="/commission"
              className="inline-flex items-center px-8 sm:px-10 py-3.5 sm:py-4 bg-ivory text-charcoal text-xs sm:text-sm uppercase tracking-[0.2em] font-medium rounded-full hover:bg-terracotta hover:text-ivory transition-all duration-300">
              Start Your Commission
            </Link>
          </motion.div>
          {/* Process Steps */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-14 sm:mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8"
          >
            {[
              { step: '01', title: 'Share Your Vision', desc: 'Tell me about your idea and share reference images.' },
              { step: '02', title: 'Get a Quote',       desc: "I'll review and provide a personalized estimate." },
              { step: '03', title: 'Creation Begins',   desc: 'Watch your vision come to life on canvas.' },
              { step: '04', title: 'Delivered with Love', desc: 'Receive your artwork, beautifully packaged.' },
            ].map((item) => (
              <div key={item.step} className="px-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-ivory/20 flex items-center justify-center mx-auto">
                  <span className="text-[10px] sm:text-xs text-gold font-medium">{item.step}</span>
                </div>
                <h4 className="mt-3 sm:mt-4 text-xs sm:text-sm font-medium text-ivory">{item.title}</h4>
                <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-ivory/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ── Testimonials ── */}
      <motion.section {...fadeUp} className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-charcoal-muted font-medium">Kind Words</span>
            <h2 className="mt-3 sm:mt-4 text-2xl sm:text-4xl font-display text-charcoal">What Collectors Say</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                className="p-6 sm:p-8 rounded-2xl bg-cream/70 dark:bg-cream/10"
              >
                <StarRating rating={t.rating} />
                <p className="mt-4 text-sm text-charcoal-muted leading-relaxed italic">"{t.body || t.text}"</p>
                <div className="mt-5 sm:mt-6 pt-4 border-t border-border">
                  <p className="text-sm font-medium text-charcoal">{t.name}</p>
                  <p className="text-xs text-charcoal-muted">{t.type}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Instagram Gallery Strip ── */}
      <motion.section {...fadeUp} className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 bg-cream/30 dark:bg-cream/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-charcoal-muted font-medium">
              @strokesbysakshi
            </span>
            <h2 className="mt-3 sm:mt-4 text-2xl sm:text-4xl font-display text-charcoal">Follow the Journey</h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
            {(featuredProducts.length > 0 ? featuredProducts.slice(0, 6) : [...Array(6)]).map((item, i) => {
              const imgUrl = item?.primary_image?.image_url
                || item?.thumbnail
                || `https://picsum.photos/seed/${70 + i}/400/400`;
              return (
                <a key={i}
                  href="https://instagram.com/strokesbysakshi"
                  target="_blank" rel="noopener noreferrer"
                  className="aspect-square rounded-lg sm:rounded-xl overflow-hidden group relative block"
                >
                  <img
                    src={imgUrl} alt={item?.name || `Artwork ${i + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-charcoal/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-ivory" fill="none" viewBox="0 0 24 24">
                      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
                    </svg>
                  </div>
                </a>
              );
            })}
          </div>
          <div className="mt-6 sm:mt-8 text-center">
            <a href="https://instagram.com/strokesbysakshi" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-charcoal-muted hover:text-terracotta transition-colors uppercase tracking-wider">
              Follow on Instagram →
            </a>
          </div>
        </div>
      </motion.section>

      {/* ── Newsletter Signup ── */}
      <motion.section {...fadeUp} className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
        {/* Parallax background blob */}
        <ParallaxSection speed={-0.1} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-terracotta/5 blur-3xl" />
        </ParallaxSection>
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-charcoal-muted font-medium">
            Stay in the Loop
          </span>
          <h2 className="mt-4 text-2xl sm:text-4xl font-display text-charcoal leading-tight">
            Get early access to<br />
            <span className="italic text-terracotta">new works & offers</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-charcoal-muted">
            Be the first to know when new paintings drop, commissions open up, or a collector sale goes live.
          </p>
          {subscribed ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-8 inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-sage/20 text-charcoal text-sm"
            >
              <svg className="w-5 h-5 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              You're on the list! Thank you.
            </motion.div>
          ) : (
            <form onSubmit={handleSubscribe}
              className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              aria-label="Newsletter signup"
            >
              <input
                type="email" required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your email address"
                className="flex-1 px-5 py-3.5 rounded-full border border-border bg-ivory dark:bg-[#252219] text-charcoal dark:text-ivory text-sm placeholder:text-charcoal-muted focus:outline-none focus:ring-2 focus:ring-terracotta/30 transition"
                aria-label="Email address"
              />
              <button type="submit"
                className="px-7 py-3.5 rounded-full bg-charcoal text-ivory text-xs uppercase tracking-[0.2em] font-medium whitespace-nowrap hover:bg-terracotta transition-all duration-300">
                Subscribe
              </button>
            </form>
          )}
          <p className="mt-4 text-[11px] text-charcoal-muted/60">No spam. Unsubscribe anytime.</p>
        </div>
      </motion.section>

      {/* ── Final CTA ── */}
      <motion.section {...fadeUp} className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-charcoal leading-tight">
            Ready to own a piece<br />
            <span className="italic text-terracotta">of original art?</span>
          </h2>
          <p className="mt-5 sm:mt-6 text-base sm:text-lg text-charcoal-muted">
            Whether you're looking for the perfect piece or want to commission something uniquely yours.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link to="/shop"
              className="w-full sm:w-auto px-8 sm:px-10 py-4 bg-charcoal text-ivory text-xs sm:text-sm uppercase tracking-[0.2em] font-medium rounded-full hover:bg-terracotta transition-all text-center">
              Browse the Collection
            </Link>
            <Link to="/contact"
              className="w-full sm:w-auto px-8 sm:px-10 py-4 border-2 border-charcoal/20 text-charcoal dark:text-ivory dark:border-ivory/20 text-xs sm:text-sm uppercase tracking-[0.2em] font-medium rounded-full hover:border-charcoal/40 transition-all text-center">
              Get in Touch
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
