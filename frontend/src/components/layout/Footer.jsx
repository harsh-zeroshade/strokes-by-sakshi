import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { SITE_CONFIG } from '../../config';
import Logo from '../ui/Logo';

const SHOP_LINKS = [
  { label: 'All Artworks',     path: '/shop'                       },
  { label: 'Original Paintings',path: '/shop?type=original'        },
  { label: 'Prints',           path: '/shop?type=print'            },
  { label: 'Limited Editions', path: '/shop?type=limited_edition'  },
];
const COMPANY_LINKS = [
  { label: 'About Sakshi',     path: '/about'      },
  { label: 'Commission',       path: '/commission' },
  { label: 'Gallery',          path: '/gallery'    },
  { label: 'Contact',          path: '/contact'    },
];
const SUPPORT_LINKS = [
  { label: 'FAQs',             path: '/contact#faq'       },
  { label: 'Shipping & Returns',path: '/contact#shipping' },
  { label: 'Order Tracking',   path: '/account/orders'    },
  { label: 'Care Guide',       path: '/about#care'        },
];

/* Animated link with slide-up duplicate text */
function FooterLink({ to, label }) {
  return (
    <Link to={to}
      className="group relative inline-block overflow-hidden text-[13px] leading-none"
      style={{ color:'rgba(255,255,255,0.45)' }}
    >
      <span className="block transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full" style={{ display:'block' }}>
        {label}
      </span>
      <span className="absolute inset-x-0 top-0 block translate-y-full transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0"
        style={{ color:'white' }}>
        {label}
      </span>
    </Link>
  );
}

/* Newsletter form */
function Newsletter() {
  const [email, setEmail]     = useState('');
  const [done,  setDone]      = useState(false);
  const [focus, setFocus]     = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (email.trim()) { setDone(true); setEmail(''); }
  };

  return done ? (
    <motion.p initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
      className="text-sm" style={{color:'rgba(255,255,255,0.55)'}}>
      ✓ You're on the list. Thank you.
    </motion.p>
  ) : (
    <form onSubmit={submit} className="relative mt-4" aria-label="Newsletter">
      <div className={`flex items-center border-b transition-colors duration-300 ${focus ? 'border-white/50' : 'border-white/15'}`}>
        <input
          type="email" required
          value={email}
          onChange={e=>setEmail(e.target.value)}
          onFocus={()=>setFocus(true)}
          onBlur={()=>setFocus(false)}
          placeholder="Your email address"
          className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-white/25"
          style={{ color:'rgba(255,255,255,0.8)', fontFamily:"'Inter',sans-serif" }}
          aria-label="Email for newsletter"
        />
        <button type="submit"
          className="text-[10px] uppercase tracking-[0.2em] py-2.5 pl-4 transition-colors duration-200"
          style={{ color:'rgba(255,255,255,0.45)', background:'none', border:'none', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}
          onMouseEnter={e=>e.currentTarget.style.color='white'}
          onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.45)'}
        >
          Subscribe →
        </button>
      </div>
    </form>
  );
}

export default function Footer() {
  return (
    <footer style={{ background:'#0d0b08', position:'relative', zIndex:10 }}>

      {/* ── TOP RULE ── */}
      <div style={{ height:1, background:'rgba(255,255,255,0.06)' }} />

      {/* ── MAIN GRID ── */}
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 pt-16 sm:pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12 lg:gap-8">

          {/* Brand column */}
          <div>
            {/* Logo — same design as hero */}
            <Link to="/" className="no-underline inline-block" aria-label="Strokes by Sakshi">
              <Logo size="md" color="ivory" variant="full" />
            </Link>

            <p className="mt-5 text-sm leading-relaxed max-w-xs"
              style={{ color:'rgba(255,255,255,0.38)', fontFamily:"'Inter',sans-serif", lineHeight:1.7 }}>
              {SITE_CONFIG.description}
            </p>

            {/* Contact */}
            <div className="mt-6 space-y-2">
              <a href={`mailto:${SITE_CONFIG.email}`}
                className="flex items-center gap-2 text-xs transition-colors duration-200 group"
                style={{ color:'rgba(255,255,255,0.3)', textDecoration:'none' }}
                onMouseEnter={e=>e.currentTarget.style.color='rgba(255,255,255,0.7)'}
                onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.3)'}
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                {SITE_CONFIG.email}
              </a>
              <p className="flex items-center gap-2 text-xs" style={{ color:'rgba(255,255,255,0.25)' }}>
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {SITE_CONFIG.address}
              </p>
            </div>

            {/* Newsletter */}
            <div className="mt-8">
              <p className="text-[10px] uppercase tracking-[0.25em] mb-2" style={{ color:'rgba(255,255,255,0.28)' }}>
                New works · Early access
              </p>
              <Newsletter />
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.28em] font-medium mb-5"
              style={{ color:'rgba(255,255,255,0.28)' }}>Shop</h4>
            <ul className="space-y-3">
              {SHOP_LINKS.map(l => <li key={l.path}><FooterLink to={l.path} label={l.label}/></li>)}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.28em] font-medium mb-5"
              style={{ color:'rgba(255,255,255,0.28)' }}>Company</h4>
            <ul className="space-y-3">
              {COMPANY_LINKS.map(l => <li key={l.path}><FooterLink to={l.path} label={l.label}/></li>)}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.28em] font-medium mb-5"
              style={{ color:'rgba(255,255,255,0.28)' }}>Support</h4>
            <ul className="space-y-3">
              {SUPPORT_LINKS.map(l => <li key={l.path}><FooterLink to={l.path} label={l.label}/></li>)}
            </ul>
          </div>
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
        <div style={{ height:1, background:'rgba(255,255,255,0.06)' }} />
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left — copyright + tagline */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
          <p className="text-[11px]" style={{ color:'rgba(255,255,255,0.22)', fontFamily:"'Inter',sans-serif" }}>
            © {new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved.
          </p>
          <span className="hidden sm:block w-px h-3" style={{ background:'rgba(255,255,255,0.12)' }} />
          <p className="text-[11px] font-display italic" style={{ color:'rgba(255,255,255,0.18)' }}>
            Every brushstroke carries a story
          </p>
        </div>

        {/* Center — credits */}
        <div className="hidden lg:flex flex-col items-center gap-1">
          <p className="text-[11px]" style={{ color:'rgba(255,255,255,0.32)', fontFamily:"'Inter',sans-serif" }}>
            Created by <span style={{ color:'rgba(255,255,255,0.6)' }}>Harsh Pathak</span>
          </p>
          <a href="mailto:harsh.zeroshade@gmail.com"
            className="text-[11px] transition-colors duration-200"
            style={{ color:'rgba(255,255,255,0.28)', textDecoration:'none', fontFamily:"'Inter',sans-serif" }}
            onMouseEnter={e=>e.currentTarget.style.color='rgba(255,255,255,0.7)'}
            onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.28)'}
          >
            harsh.zeroshade@gmail.com
          </a>
        </div>

        {/* Right — social icons with SVG */}
        <div className="flex items-center gap-2">
          {/* Instagram */}
          <a href={SITE_CONFIG.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 group"
            style={{ border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.35)' }}
            onMouseEnter={e=>{ e.currentTarget.style.background='#E1306C'; e.currentTarget.style.color='white'; e.currentTarget.style.borderColor='transparent'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>
          {/* Facebook */}
          <a href={SITE_CONFIG.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
            style={{ border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.35)' }}
            onMouseEnter={e=>{ e.currentTarget.style.background='#1877F2'; e.currentTarget.style.color='white'; e.currentTarget.style.borderColor='transparent'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
          {/* Pinterest */}
          <a href={SITE_CONFIG.social.pinterest} target="_blank" rel="noopener noreferrer" aria-label="Pinterest"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
            style={{ border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.35)' }}
            onMouseEnter={e=>{ e.currentTarget.style.background='#BD081C'; e.currentTarget.style.color='white'; e.currentTarget.style.borderColor='transparent'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
            </svg>
          </a>
          {/* YouTube */}
          <a href={SITE_CONFIG.social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
            style={{ border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.35)' }}
            onMouseEnter={e=>{ e.currentTarget.style.background='#FF0000'; e.currentTarget.style.color='white'; e.currentTarget.style.borderColor='transparent'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
            </svg>
          </a>
          {/* WhatsApp */}
          <a href={SITE_CONFIG.social.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
            style={{ border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.35)' }}
            onMouseEnter={e=>{ e.currentTarget.style.background='#25D366'; e.currentTarget.style.color='white'; e.currentTarget.style.borderColor='transparent'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
        </div>
      </div>

      {/* ── MOBILE CREDITS ── */}
      <div className="lg:hidden max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 pb-6 -mt-1">
        <p className="text-[11px]" style={{ color:'rgba(255,255,255,0.32)', fontFamily:"'Inter',sans-serif" }}>
          Created by <span style={{ color:'rgba(255,255,255,0.6)' }}>Harsh Pathak</span> ·{' '}
          <a href="mailto:harsh.zeroshade@gmail.com"
            className="transition-colors duration-200"
            style={{ color:'rgba(255,255,255,0.28)', textDecoration:'none' }}
            onMouseEnter={e=>e.currentTarget.style.color='rgba(255,255,255,0.7)'}
            onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.28)'}
          >
            harsh.zeroshade@gmail.com
          </a>
        </p>
      </div>
    </footer>
  );
}
