import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../ui/Logo';

const NAV_LINKS = [
  { label: 'Home',       path: '/'          },
  { label: 'Shop',       path: '/shop'       },
  { label: 'Commission', path: '/commission' },
  { label: 'Gallery',    path: '/gallery'    },
  { label: 'About',      path: '/about'      },
  { label: 'Contact',    path: '/contact'    },
];

const SunIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="12" cy="12" r="4"/>
    <path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
);
const MoonIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
);
const SearchIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
  </svg>
);
const UserIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
  </svg>
);
const BagIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
  </svg>
);

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { itemCount, setCartOpen } = useCart();
  const { dark, toggle } = useTheme();
  const [scrolled,     setScrolled]     = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location]);

  /* Lock body scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isActive = p => location.pathname === p;
  const isHero   = location.pathname === '/';

  /*
   * Color logic (Delassus-style):
   * - Over hero (transparent): white/ivory links for visibility on the warm bg
   * - After scroll or on non-hero pages: charcoal/muted links on light bg
   */
  const transparent = isHero && !scrolled;

  const linkColor = transparent
    ? 'text-charcoal/80 dark:text-[#F0EDE8]/80 hover:text-charcoal dark:hover:text-[#F0EDE8]'
    : 'text-charcoal-muted dark:text-[#9A9590] hover:text-charcoal dark:hover:text-[#F0EDE8]';

  const iconColor = transparent
    ? 'text-charcoal/70 dark:text-[#F0EDE8]/70 hover:text-charcoal dark:hover:text-[#F0EDE8]'
    : 'text-charcoal-muted dark:text-[#9A9590] hover:text-charcoal dark:hover:text-[#F0EDE8]';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-ivory/96 dark:bg-[#1A1814]/96 backdrop-blur-md border-b border-border/60 dark:border-[#2E2B25]/60 shadow-[0_1px_20px_rgba(0,0,0,0.06)]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        {/* ── Desktop layout — three-column: logo | nav | icons ── */}
        <div className="hidden lg:grid grid-cols-3 items-center h-[72px] max-w-[1400px] mx-auto px-8 xl:px-12">

          {/* Left — Logo */}
          <div className="flex items-center">
            <Link to="/" aria-label="Strokes by Sakshi" className="group flex items-center gap-2.5">
              <Logo size="md" color="terracotta" variant="full" />
            </Link>
          </div>

          {/* Centre — Nav links */}
          <nav className="flex items-center justify-center gap-7 xl:gap-8">
            {NAV_LINKS.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative text-[11px] uppercase tracking-[0.18em] font-medium transition-colors duration-300 py-1 ${
                  isActive(link.path) ? 'text-terracotta' : linkColor
                }`}
              >
                {link.label}
                {/* Active underline — animated */}
                {isActive(link.path) && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute -bottom-px left-0 right-0 h-[1.5px] bg-terracotta rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Right — icons */}
          <div className="flex items-center justify-end gap-0.5">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className={`p-2.5 rounded-lg transition-all duration-200 ${iconColor} hover:bg-charcoal/6 dark:hover:bg-[#F0EDE8]/8`}
            >
              <motion.span key={dark ? 'sun' : 'moon'} initial={{ rotate:-20, opacity:0 }} animate={{ rotate:0, opacity:1 }} transition={{ duration:0.22 }}>
                {dark ? <SunIcon /> : <MoonIcon />}
              </motion.span>
            </button>

            {/* Search */}
            <button aria-label="Search" className={`p-2.5 rounded-lg transition-all duration-200 ${iconColor} hover:bg-charcoal/6 dark:hover:bg-[#F0EDE8]/8`}>
              <SearchIcon />
            </button>

            {/* Account */}
            {user ? (
              <div className="relative">
                <button onClick={() => setDropdownOpen(p => !p)} aria-label="Account"
                  className={`p-2.5 rounded-lg transition-all duration-200 ${iconColor} hover:bg-charcoal/6 dark:hover:bg-[#F0EDE8]/8`}>
                  <UserIcon />
                </button>
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity:0, y:8, scale:0.97 }}
                      animate={{ opacity:1, y:0, scale:1 }}
                      exit={{ opacity:0, y:6, scale:0.97 }}
                      transition={{ duration:0.18 }}
                      className="absolute right-0 mt-2 w-56 bg-ivory dark:bg-[#252219] border border-border dark:border-[#3A3630] rounded-2xl shadow-2xl shadow-charcoal/10 py-2 z-50"
                    >
                      <div className="px-4 py-3 border-b border-border dark:border-[#2E2B25]">
                        <p className="text-sm font-medium text-charcoal dark:text-[#F0EDE8]">{user.name}</p>
                        <p className="text-xs text-charcoal-muted mt-0.5">{user.email}</p>
                      </div>
                      {[
                        { to:'/account',               label:'My Profile'    },
                        { to:'/account/orders',        label:'My Orders'     },
                        { to:'/account/custom-orders', label:'Custom Orders' },
                        { to:'/account/wishlist',      label:'Wishlist'      },
                      ].map(item => (
                        <Link key={item.to} to={item.to}
                          className="block px-4 py-2.5 text-[13px] text-charcoal dark:text-[#D8D4CE] hover:bg-cream dark:hover:bg-[#3A3630] transition-colors">
                          {item.label}
                        </Link>
                      ))}
                      {isAdmin && (
                        <Link to="/admin"
                          className="block px-4 py-2.5 text-[13px] text-terracotta hover:bg-cream dark:hover:bg-[#3A3630] border-t border-border dark:border-[#3A3630] transition-colors">
                          Admin Panel
                        </Link>
                      )}
                      <button onClick={logout}
                        className="w-full text-left px-4 py-2.5 text-[13px] text-charcoal dark:text-[#D8D4CE] hover:bg-cream dark:hover:bg-[#3A3630] border-t border-border dark:border-[#3A3630] transition-colors">
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" aria-label="Login"
                className={`p-2.5 rounded-lg transition-all duration-200 ${iconColor} hover:bg-charcoal/6 dark:hover:bg-[#F0EDE8]/8`}>
                <UserIcon />
              </Link>
            )}

            {/* Cart */}
            <button onClick={() => setCartOpen(true)} aria-label={`Cart (${itemCount} items)`}
              className={`relative p-2.5 rounded-lg transition-all duration-200 ${iconColor} hover:bg-charcoal/6 dark:hover:bg-[#F0EDE8]/8`}>
              <BagIcon />
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale:0 }} animate={{ scale:1 }}
                  className="absolute top-1 right-1 w-[18px] h-[18px] bg-terracotta text-white text-[9px] rounded-full flex items-center justify-center font-semibold leading-none">
                  {itemCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile layout ── */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 sm:px-6">
          <Link to="/" aria-label="Strokes by Sakshi">
            <Logo size="sm" color="terracotta" variant="full" />
          </Link>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setCartOpen(true)} aria-label="Cart"
              className={`relative p-2 rounded-lg transition-colors ${iconColor}`}>
              <BagIcon />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-terracotta text-white text-[9px] rounded-full flex items-center justify-center font-semibold">
                  {itemCount}
                </span>
              )}
            </button>
            <button onClick={toggle} aria-label="Toggle theme" className={`p-2 rounded-lg transition-colors ${iconColor}`}>
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            {/* Hamburger / Close */}
            <button
              onClick={() => setMobileOpen(p => !p)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              className={`p-2 rounded-lg transition-colors ${iconColor}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile full-screen menu overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            transition={{ duration:0.22 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: dark ? 'rgba(26,24,20,0.98)' : 'rgba(250,247,242,0.98)', backdropFilter:'blur(12px)' }}
          >
            {/* Close button */}
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute top-5 right-4 p-2 text-charcoal dark:text-[#F0EDE8] hover:text-terracotta transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <nav className="flex flex-col items-center justify-center h-full gap-1 pb-20">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity:0, y:20 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ delay: i * 0.06, duration:0.4, ease:[0.16,1,0.3,1] }}
                >
                  <Link
                    to={link.path}
                    className={`block py-3 px-6 text-2xl font-display font-medium transition-colors text-center ${
                      isActive(link.path)
                        ? 'text-terracotta'
                        : 'text-charcoal dark:text-[#F0EDE8] hover:text-terracotta dark:hover:text-terracotta'
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              {/* Auth in mobile */}
              <motion.div
                initial={{ opacity:0 }} animate={{ opacity:1 }}
                transition={{ delay:0.38, duration:0.4 }}
                className="mt-6 flex flex-col items-center gap-3"
              >
                {user ? (
                  <button onClick={logout}
                    className="text-sm text-charcoal-muted dark:text-[#9A9590] hover:text-terracotta transition-colors uppercase tracking-widest">
                    Sign Out
                  </button>
                ) : (
                  <Link to="/login"
                    className="text-sm text-charcoal-muted dark:text-[#9A9590] hover:text-terracotta transition-colors uppercase tracking-widest">
                    Sign In
                  </Link>
                )}
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
