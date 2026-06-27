import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { SITE_CONFIG } from '../../config';

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

const SOCIALS = [
  { key:'instagram', label:'IG',        href: SITE_CONFIG.social.instagram },
  { key:'facebook',  label:'FB',        href: SITE_CONFIG.social.facebook  },
  { key:'pinterest', label:'Pin',       href: SITE_CONFIG.social.pinterest },
  { key:'youtube',   label:'YT',        href: SITE_CONFIG.social.youtube   },
  { key:'whatsapp',  label:'WA',        href: SITE_CONFIG.social.whatsapp  },
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
            {/* Logo text — Delassus style */}
            <Link to="/" className="no-underline inline-block" aria-label="Strokes by Sakshi">
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:300, color:'white', letterSpacing:'-0.5px', lineHeight:1 }}>
                Strokes
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,3.5px)', gap:'2.5px' }}>
                  {[...Array(9)].map((_,i)=>(
                    <div key={i} style={{ width:3.5, height:3.5, background:'rgba(255,255,255,0.4)', borderRadius:'50%' }}/>
                  ))}
                </div>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:300, color:'rgba(255,255,255,0.5)', letterSpacing:'0.5px' }}>
                  by Sakshi
                </span>
              </div>
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

        {/* Right — social row */}
        <div className="flex items-center gap-1">
          {SOCIALS.map(s => (
            <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer"
              aria-label={s.label}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] uppercase tracking-wider transition-all duration-200"
              style={{ color:'rgba(255,255,255,0.28)', border:'1px solid rgba(255,255,255,0.1)', textDecoration:'none' }}
              onMouseEnter={e=>{ e.currentTarget.style.color='white'; e.currentTarget.style.borderColor='rgba(255,255,255,0.35)'; e.currentTarget.style.background='rgba(255,255,255,0.07)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.color='rgba(255,255,255,0.28)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.background='transparent'; }}
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
