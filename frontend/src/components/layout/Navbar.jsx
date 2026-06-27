import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../ui/Logo';

const NAV_LINKS = [
  { label: 'Shop',       path: '/shop'       },
  { label: 'Commission', path: '/commission' },
  { label: 'Gallery',    path: '/gallery'    },
  { label: 'About',      path: '/about'      },
  { label: 'Contact',    path: '/contact'    },
];

const MENU_LINKS = [
  { num: '01.', label: 'Shop',       path: '/shop'       },
  { num: '02.', label: 'Commission', path: '/commission' },
  { num: '03.', label: 'Gallery',    path: '/gallery'    },
  { num: '04.', label: 'About',      path: '/about'      },
  { num: '05.', label: 'Contact',    path: '/contact'    },
];

/* ── Animated nav link — text slides up on hover revealing duplicate ── */
function NavLink({ to, label, active }) {
  return (
    <Link to={to} className="relative group py-1 overflow-hidden block">
      <span className={`relative text-[11px] uppercase tracking-[0.18em] font-medium block transition-colors duration-300
        ${active ? 'text-terracotta' : 'text-charcoal-muted group-hover:text-charcoal dark:text-[#9A9590] dark:group-hover:text-[#F0EDE8]'}`}>
        {/* Static text */}
        <span className="block transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full group-hover:opacity-0">
          {label}
        </span>
        {/* Hover duplicate slides up from below */}
        <span className="absolute inset-x-0 top-0 block translate-y-full opacity-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:opacity-100 text-charcoal dark:text-[#F0EDE8]">
          {label}
        </span>
      </span>
      {/* Active underline */}
      {active && (
        <motion.span layoutId="nav-line"
          className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-terracotta rounded-full"
          transition={{ type:'spring', stiffness:400, damping:35 }}/>
      )}
    </Link>
  );
}

/* ── Animated hamburger → X ── */
function Hamburger({ open, onClick }) {
  return (
    <button onClick={onClick} aria-label={open ? 'Close menu' : 'Open menu'}
      className="relative w-10 h-10 flex flex-col items-center justify-center gap-[5px] cursor-pointer"
      style={{ background:'none', border:'none', padding:0 }}>
      <motion.span
        animate={{ rotate: open ? 45 : 0, y: open ? 6 : 0 }}
        transition={{ duration: 0.35, ease: [0.16,1,0.3,1] }}
        className="block w-[22px] h-px bg-current origin-center"
      />
      <motion.span
        animate={{ opacity: open ? 0 : 1, scaleX: open ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        className="block w-[22px] h-px bg-current origin-center"
      />
      <motion.span
        animate={{ rotate: open ? -45 : 0, y: open ? -6 : 0 }}
        transition={{ duration: 0.35, ease: [0.16,1,0.3,1] }}
        className="block w-[22px] h-px bg-current origin-center"
      />
    </button>
  );
}

const SunIcon  = () => <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="4"/><path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>;
const MoonIcon = () => <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>;
const UserIcon = () => <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>;
const BagIcon  = () => <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>;

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { itemCount, setCartOpen } = useCart();
  const { dark, toggle } = useTheme();
  const [scrolled,     setScrolled]     = useState(false);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    fn(); window.addEventListener('scroll', fn, { passive:true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMenuOpen(false); setDropdownOpen(false); }, [location]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const isActive = p => location.pathname === p;

  /* icon button base classes */
  const iconBtn = "p-2.5 rounded-lg text-charcoal-muted hover:text-charcoal dark:text-[#9A9590] dark:hover:text-[#F0EDE8] hover:bg-charcoal/5 dark:hover:bg-white/5 transition-all duration-200";

  return (
    <>
      {/* ══ HEADER ══════════════════════════════════════════════════════ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-ivory/95 dark:bg-[#1A1814]/95 backdrop-blur-md border-b border-charcoal/8 dark:border-white/8 shadow-[0_1px_24px_rgba(0,0,0,0.06)]'
          : 'bg-transparent'
      }`}>
        {/* Desktop — 3-col */}
        <div className="hidden lg:grid grid-cols-[1fr_auto_1fr] items-center h-[68px] max-w-[1400px] mx-auto px-8 xl:px-12">
          {/* Left: Logo */}
          <Link to="/" aria-label="Strokes by Sakshi" className="inline-flex">
            <Logo size="md" color="terracotta" variant="full" />
          </Link>

          {/* Centre: Nav */}
          <nav className="flex items-center gap-7 xl:gap-8">
            {NAV_LINKS.map(l => (
              <NavLink key={l.path} to={l.path} label={l.label} active={isActive(l.path)} />
            ))}
          </nav>

          {/* Right: icons */}
          <div className="flex items-center justify-end gap-0">
            {/* Theme */}
            <button onClick={toggle} aria-label="Toggle theme" className={iconBtn}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={dark?'sun':'moon'}
                  initial={{ rotate:-30, opacity:0, scale:0.7 }}
                  animate={{ rotate:0, opacity:1, scale:1 }}
                  exit={{ rotate:30, opacity:0, scale:0.7 }}
                  transition={{ duration:0.22 }}
                  className="block"
                >
                  {dark ? <SunIcon /> : <MoonIcon />}
                </motion.span>
              </AnimatePresence>
            </button>

            {/* Account */}
            <div className="relative">
              {user ? (
                <button onClick={() => setDropdownOpen(p=>!p)} aria-label="Account" className={iconBtn}>
                  <UserIcon />
                </button>
              ) : (
                <Link to="/login" aria-label="Sign in" className={`${iconBtn} inline-flex items-center justify-center`}>
                  <UserIcon />
                </Link>
              )}
              <AnimatePresence>
                {dropdownOpen && user && (
                  <motion.div
                    initial={{ clipPath:'inset(0 0 100% 0)' }}
                    animate={{ clipPath:'inset(0 0 0% 0)' }}
                    exit={{ clipPath:'inset(0 0 100% 0)' }}
                    transition={{ duration:0.6, ease:[0.77,0,0.18,1] }}
                    className="absolute right-0 mt-2 w-60 bg-ivory dark:bg-[#1e1c18] border border-charcoal/10 dark:border-white/8 rounded-2xl shadow-2xl shadow-black/10 py-2 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-charcoal/8 dark:border-white/8">
                      <p className="text-sm font-medium text-charcoal dark:text-[#F0EDE8]">{user.name}</p>
                      <p className="text-xs text-charcoal-muted mt-0.5">{user.email}</p>
                    </div>
                    {[
                      { to:'/account',               label:'My Profile'    },
                      { to:'/account/orders',        label:'My Orders'     },
                      { to:'/account/custom-orders', label:'Custom Orders' },
                      { to:'/account/wishlist',      label:'Wishlist'      },
                    ].map(item => (
                      <Link key={item.to} to={item.to} onClick={()=>setDropdownOpen(false)}
                        className="block px-4 py-2.5 text-[13px] text-charcoal dark:text-[#D8D4CE] hover:bg-cream dark:hover:bg-white/5 transition-colors">
                        {item.label}
                      </Link>
                    ))}
                    {isAdmin && (
                      <Link to="/admin" onClick={()=>setDropdownOpen(false)}
                        className="block px-4 py-2.5 text-[13px] text-terracotta hover:bg-cream dark:hover:bg-white/5 border-t border-charcoal/8 dark:border-white/8 transition-colors">
                        Admin Panel
                      </Link>
                    )}
                    <button onClick={()=>{logout();setDropdownOpen(false);}}
                      className="w-full text-left px-4 py-2.5 text-[13px] text-charcoal dark:text-[#D8D4CE] hover:bg-cream dark:hover:bg-white/5 border-t border-charcoal/8 dark:border-white/8 transition-colors">
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart */}
            <button onClick={()=>setCartOpen(true)} aria-label="Cart" className={`${iconBtn} relative`}>
              <BagIcon />
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    initial={{scale:0}} animate={{scale:1}} exit={{scale:0}}
                    className="absolute top-1 right-1 w-[18px] h-[18px] bg-terracotta text-white text-[9px] rounded-full flex items-center justify-center font-semibold leading-none">
                    {itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Divider */}
            <div className="w-px h-4 bg-charcoal/15 dark:bg-white/15 mx-2" />

            {/* Hamburger */}
            <div className="text-charcoal-muted dark:text-[#9A9590]">
              <Hamburger open={menuOpen} onClick={()=>setMenuOpen(p=>!p)} />
            </div>
          </div>
        </div>

        {/* Mobile */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 sm:px-6">
          <Link to="/"><Logo size="sm" color="terracotta" variant="full" /></Link>
          <div className="flex items-center gap-0.5 text-charcoal dark:text-[#F0EDE8]">
            <button onClick={()=>setCartOpen(true)} aria-label="Cart" className={`${iconBtn} relative`}>
              <BagIcon />
              {itemCount>0 && <span className="absolute top-1 right-1 w-4 h-4 bg-terracotta text-white text-[9px] rounded-full flex items-center justify-center font-semibold">{itemCount}</span>}
            </button>
            <button onClick={toggle} aria-label="Toggle theme" className={iconBtn}>
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            <Hamburger open={menuOpen} onClick={()=>setMenuOpen(p=>!p)} />
          </div>
        </div>
      </header>

      {/* ══ FULL-SCREEN OVERLAY MENU ════════════════════════════════════ */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              transition={{ duration:0.35 }}
              className="fixed inset-0 z-[800]"
              style={{ background:'rgba(10,9,7,0.55)', backdropFilter:'blur(4px)' }}
              onClick={()=>setMenuOpen(false)}
            />

            {/* Panel — clips in from top */}
            <motion.div
              initial={{ clipPath:'inset(0 0 100% 0)' }}
              animate={{ clipPath:'inset(0 0 0% 0)' }}
              exit={{ clipPath:'inset(0 0 100% 0)' }}
              transition={{ duration:0.6, ease:[0.77,0,0.18,1] }}
              className="fixed inset-0 z-[850] flex flex-col"
              style={{ background:'#0d0b08' }}
            >
              {/* Menu top */}
              <div className="flex justify-between items-start p-7 sm:p-8 lg:p-10">
                <Link to="/" onClick={()=>setMenuOpen(false)} className="no-underline">
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:400, color:'white', letterSpacing:'-0.3px', lineHeight:1 }}>
                    Strokes
                    <span style={{ display:'block', fontSize:13, letterSpacing:2, opacity:0.45, fontFamily:"'Inter',sans-serif", fontWeight:300 }}>by Sakshi</span>
                  </div>
                </Link>
                <div className="flex items-center gap-3 mt-1">
                  {/* Theme inside menu */}
                  <button onClick={toggle} aria-label="Toggle theme"
                    className="p-2 rounded-lg transition-colors"
                    style={{ color:'rgba(255,255,255,0.5)', background:'none', border:'none', cursor:'pointer' }}
                    onMouseEnter={e=>e.currentTarget.style.color='white'}
                    onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.5)'}
                  >
                    {dark ? <SunIcon /> : <MoonIcon />}
                  </button>
                  <button onClick={()=>setMenuOpen(false)}
                    style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:11, letterSpacing:2, textTransform:'uppercase', fontFamily:"'Inter',sans-serif" }}
                    onMouseEnter={e=>e.currentTarget.style.color='white'}
                    onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.5)'}
                  >
                    Close <span style={{ fontSize:17, lineHeight:1 }}>✕</span>
                  </button>
                </div>
              </div>

              {/* Nav links — staggered reveal */}
              <div className="flex-1 flex items-center px-8 sm:px-12 lg:px-16 overflow-hidden">
                <nav style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  {MENU_LINKS.map((item, i) => (
                    <motion.div key={item.path}
                      initial={{ opacity:0, y:40 }}
                      animate={{ opacity:1, y:0 }}
                      transition={{ delay:0.1+i*0.07, duration:0.6, ease:[0.16,1,0.3,1] }}
                    >
                      <Link to={item.path} onClick={()=>setMenuOpen(false)}
                        className="group flex items-baseline gap-4 py-1.5 no-underline"
                        style={{ color: isActive(item.path) ? '#C7694F' : 'rgba(255,255,255,0.18)', transition:'color 0.25s ease' }}
                        onMouseEnter={e=>{ if(!isActive(item.path)) e.currentTarget.style.color='white'; }}
                        onMouseLeave={e=>{ if(!isActive(item.path)) e.currentTarget.style.color='rgba(255,255,255,0.18)'; }}
                      >
                        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, letterSpacing:2, color:'rgba(255,255,255,0.25)', flexShrink:0, paddingTop:6 }}>{item.num}</span>
                        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(2.4rem,6vw,5rem)', fontWeight:300, letterSpacing:'-1.5px', lineHeight:1.15 }}>
                          {item.label}
                        </span>
                        {/* Animated arrow on active */}
                        <motion.span
                          animate={{ x: isActive(item.path) ? 0 : -8, opacity: isActive(item.path) ? 1 : 0 }}
                          style={{ color:'#C7694F', fontSize:20, paddingBottom:4, flexShrink:0 }}
                        >→</motion.span>
                      </Link>
                    </motion.div>
                  ))}
                </nav>
              </div>

              {/* Menu bottom */}
              <motion.div
                initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:0.5, duration:0.5 }}
                className="px-8 sm:px-12 lg:px-16 pb-8 sm:pb-10 flex items-end justify-between"
              >
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {user ? (
                    <>
                      <span style={{ fontSize:12, color:'rgba(255,255,255,0.35)', fontFamily:"'Inter',sans-serif" }}>{user.name}</span>
                      <button onClick={()=>{logout();setMenuOpen(false);}}
                        style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', fontSize:11, cursor:'pointer', fontFamily:"'Inter',sans-serif", textAlign:'left', letterSpacing:1, textTransform:'uppercase', padding:0 }}>
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link to="/login" onClick={()=>setMenuOpen(false)}
                      style={{ color:'rgba(255,255,255,0.3)', fontSize:11, textDecoration:'none', fontFamily:"'Inter',sans-serif", letterSpacing:1, textTransform:'uppercase' }}>
                      Sign In
                    </Link>
                  )}
                </div>
                <div style={{ display:'flex', gap:16 }}>
                  {[
                    { label:'Instagram', href:'https://instagram.com/strokesbysakshi' },
                    { label:'WhatsApp',  href:'https://wa.me/919876543210' },
                  ].map(s => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                      style={{ color:'rgba(255,255,255,0.28)', fontSize:11, letterSpacing:1, textDecoration:'none', fontFamily:"'Inter',sans-serif", textTransform:'uppercase', transition:'color 0.2s' }}
                      onMouseEnter={e=>e.currentTarget.style.color='white'}
                      onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.28)'}
                    >{s.label}</a>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
