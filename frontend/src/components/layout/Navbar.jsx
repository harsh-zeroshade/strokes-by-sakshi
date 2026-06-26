import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../ui/Logo';

/* Inner-page navbar — shown on every page except "/" (homepage has its own) */

const NAV_LINKS = [
  { label: 'Shop',       path: '/shop'       },
  { label: 'Commission', path: '/commission' },
  { label: 'Gallery',    path: '/gallery'    },
  { label: 'About',      path: '/about'      },
  { label: 'Contact',    path: '/contact'    },
];

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
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); setDropdownOpen(false); }, [location]);
  useEffect(() => { document.body.style.overflow = menuOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [menuOpen]);

  const isActive = p => location.pathname === p;

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-ivory/96 dark:bg-[#1A1814]/96 backdrop-blur-md border-b border-border/60 dark:border-[#2E2B25]/60 shadow-[0_1px_20px_rgba(0,0,0,0.05)]'
          : 'bg-transparent'
      }`}>
        {/* Desktop */}
        <div className="hidden lg:grid grid-cols-3 items-center h-[68px] max-w-[1400px] mx-auto px-8 xl:px-12">
          <Link to="/" aria-label="Strokes by Sakshi">
            <Logo size="md" color="terracotta" variant="full" />
          </Link>
          <nav className="flex items-center justify-center gap-7 xl:gap-8">
            {NAV_LINKS.map(link => (
              <Link key={link.path} to={link.path}
                className={`relative text-[11px] uppercase tracking-[0.18em] font-medium transition-colors duration-300 py-1 ${
                  isActive(link.path) ? 'text-terracotta' : 'text-charcoal-muted hover:text-charcoal dark:text-[#9A9590] dark:hover:text-[#F0EDE8]'
                }`}>
                {link.label}
                {isActive(link.path) && (
                  <motion.span layoutId="nav-underline"
                    className="absolute -bottom-px left-0 right-0 h-[1.5px] bg-terracotta rounded-full"
                    transition={{ type:'spring', stiffness:380, damping:32 }} />
                )}
              </Link>
            ))}
          </nav>
          <div className="flex items-center justify-end gap-0.5">
            <button onClick={toggle} aria-label="Toggle theme"
              className="p-2.5 rounded-lg text-charcoal-muted hover:text-charcoal dark:text-[#9A9590] dark:hover:text-[#F0EDE8] hover:bg-charcoal/5 transition-all">
              <motion.span key={dark?'sun':'moon'} initial={{rotate:-20,opacity:0}} animate={{rotate:0,opacity:1}} transition={{duration:0.22}}>
                {dark ? <SunIcon /> : <MoonIcon />}
              </motion.span>
            </button>
            {user ? (
              <div className="relative">
                <button onClick={() => setDropdownOpen(p=>!p)} aria-label="Account"
                  className="p-2.5 rounded-lg text-charcoal-muted hover:text-charcoal dark:text-[#9A9590] dark:hover:text-[#F0EDE8] hover:bg-charcoal/5 transition-all">
                  <UserIcon />
                </button>
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:6}} transition={{duration:0.16}}
                      className="absolute right-0 mt-2 w-56 bg-ivory dark:bg-[#252219] border border-border dark:border-[#3A3630] rounded-2xl shadow-2xl py-2 z-50">
                      <div className="px-4 py-3 border-b border-border dark:border-[#2E2B25]">
                        <p className="text-sm font-medium text-charcoal dark:text-[#F0EDE8]">{user.name}</p>
                        <p className="text-xs text-charcoal-muted mt-0.5">{user.email}</p>
                      </div>
                      {[{to:'/account',label:'My Profile'},{to:'/account/orders',label:'My Orders'},{to:'/account/custom-orders',label:'Custom Orders'},{to:'/account/wishlist',label:'Wishlist'}].map(item=>(
                        <Link key={item.to} to={item.to} className="block px-4 py-2.5 text-[13px] text-charcoal dark:text-[#D8D4CE] hover:bg-cream dark:hover:bg-[#3A3630] transition-colors">{item.label}</Link>
                      ))}
                      {isAdmin && <Link to="/admin" className="block px-4 py-2.5 text-[13px] text-terracotta hover:bg-cream dark:hover:bg-[#3A3630] border-t border-border dark:border-[#3A3630] transition-colors">Admin Panel</Link>}
                      <button onClick={logout} className="w-full text-left px-4 py-2.5 text-[13px] text-charcoal dark:text-[#D8D4CE] hover:bg-cream dark:hover:bg-[#3A3630] border-t border-border dark:border-[#3A3630] transition-colors">Sign Out</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" aria-label="Login" className="p-2.5 rounded-lg text-charcoal-muted hover:text-charcoal dark:text-[#9A9590] dark:hover:text-[#F0EDE8] hover:bg-charcoal/5 transition-all"><UserIcon /></Link>
            )}
            <button onClick={() => setCartOpen(true)} aria-label="Cart" className="relative p-2.5 rounded-lg text-charcoal-muted hover:text-charcoal dark:text-[#9A9590] dark:hover:text-[#F0EDE8] hover:bg-charcoal/5 transition-all">
              <BagIcon />
              {itemCount > 0 && <motion.span initial={{scale:0}} animate={{scale:1}} className="absolute top-1 right-1 w-[18px] h-[18px] bg-terracotta text-white text-[9px] rounded-full flex items-center justify-center font-semibold leading-none">{itemCount}</motion.span>}
            </button>
          </div>
        </div>

        {/* Mobile */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 sm:px-6">
          <Link to="/"><Logo size="sm" color="terracotta" variant="full" /></Link>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setCartOpen(true)} aria-label="Cart" className="relative p-2 text-charcoal-muted hover:text-charcoal dark:text-[#9A9590] transition-colors">
              <BagIcon />
              {itemCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-terracotta text-white text-[9px] rounded-full flex items-center justify-center font-semibold">{itemCount}</span>}
            </button>
            <button onClick={toggle} aria-label="Toggle theme" className="p-2 text-charcoal-muted hover:text-charcoal dark:text-[#9A9590] transition-colors">{dark?<SunIcon/>:<MoonIcon/>}</button>
            <button onClick={() => setMenuOpen(p=>!p)} aria-label="Menu" className="p-2 text-charcoal dark:text-[#F0EDE8] hover:text-terracotta transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen overlay menu — same clip-path wipe as hero menu */}
      <div style={{
        position:'fixed', inset:0, zIndex:900,
        background:'#0d0d0d',
        clipPath: menuOpen ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)',
        transition:'clip-path 0.6s cubic-bezier(0.77,0,0.18,1)',
        display:'flex', flexDirection:'column',
        pointerEvents: menuOpen ? 'auto' : 'none',
      }}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'28px 32px 0'}}>
          <Link to="/" onClick={() => setMenuOpen(false)} style={{textDecoration:'none'}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:400,color:'white',letterSpacing:'-0.3px'}}>Strokes<br/><span style={{fontSize:13,letterSpacing:2,opacity:0.5,fontFamily:"'Inter',sans-serif",fontWeight:300}}>by Sakshi</span></div>
          </Link>
          <button onClick={() => setMenuOpen(false)} style={{background:'none',border:'none',color:'white',cursor:'pointer',fontSize:11,letterSpacing:2,textTransform:'uppercase',fontFamily:"'Inter',sans-serif",opacity:0.6,display:'flex',alignItems:'center',gap:8,marginTop:4}}>
            <span>Close</span><span style={{fontSize:18,lineHeight:1}}>✕</span>
          </button>
        </div>
        <div style={{flex:1,display:'flex',alignItems:'center',padding:'0 clamp(32px,6vw,80px)'}}>
          <nav style={{display:'flex',flexDirection:'column',gap:4}}>
            {[{num:'01.',label:'Shop',path:'/shop'},{num:'02.',label:'Commission',path:'/commission'},{num:'03.',label:'Gallery',path:'/gallery'},{num:'04.',label:'About',path:'/about'},{num:'05.',label:'Contact',path:'/contact'}].map(item=>(
              <Link key={item.path} to={item.path} onClick={() => setMenuOpen(false)}
                style={{fontFamily:"'Playfair Display',serif",fontSize:'clamp(36px,5.5vw,68px)',fontWeight:300,color:'rgba(255,255,255,0.22)',textDecoration:'none',letterSpacing:'-1px',lineHeight:1.25,display:'flex',alignItems:'baseline',gap:16,transition:'color 0.25s ease'}}
                onMouseEnter={e=>e.currentTarget.style.color='white'}
                onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.22)'}>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:400,letterSpacing:2,color:'rgba(255,255,255,0.3)'}}>{item.num}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div style={{padding:'0 clamp(32px,6vw,80px) 44px',display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {user ? <button onClick={()=>{logout();setMenuOpen(false);}} style={{background:'none',border:'none',color:'rgba(255,255,255,0.35)',fontSize:13,cursor:'pointer',fontFamily:"'Inter',sans-serif",textAlign:'left'}}>Sign Out</button>
                  : <Link to="/login" onClick={()=>setMenuOpen(false)} style={{color:'rgba(255,255,255,0.35)',fontSize:13,textDecoration:'none',fontFamily:"'Inter',sans-serif"}}>Sign In</Link>}
          </div>
        </div>
      </div>
    </>
  );
}
