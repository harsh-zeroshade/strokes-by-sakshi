import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../ui/Logo';

const NAV_LINKS = [
  { label: 'Home',       path: '/'           },
  { label: 'Shop',       path: '/shop'        },
  { label: 'Commission', path: '/commission'  },
  { label: 'Gallery',    path: '/gallery'     },
  { label: 'About',      path: '/about'       },
  { label: 'Contact',    path: '/contact'     },
];

/* ── Sun icon ── */
const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="12" cy="12" r="4" strokeLinecap="round"/>
    <path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
);

/* ── Moon icon ── */
const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
);

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { itemCount, setCartOpen } = useCart();
  const { dark, toggle } = useTheme();
  const [scrolled, setScrolled]       = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setDropdownOpen(false); }, [location]);

  const isActive = (path) => location.pathname === path;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-ivory/95 dark:bg-[#1A1814]/95 backdrop-blur-md shadow-sm border-b border-border dark:border-[#2E2B25]'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* Logo */}
          <Link to="/" aria-label="Strokes by Sakshi">
            <Logo size="md" color="terracotta" variant="full" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative text-sm tracking-wider uppercase font-medium transition-colors duration-300 ${
                  isActive(link.path)
                    ? 'text-terracotta'
                    : 'text-charcoal-muted hover:text-charcoal dark:hover:text-ivory'
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <motion.div layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-terracotta"/>
                )}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* 🌙 Theme toggle */}
            <button
              onClick={toggle}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-charcoal-muted hover:text-charcoal dark:hover:text-ivory
                         hover:bg-cream dark:hover:bg-[#2E2B25] transition-all"
            >
              <motion.span
                key={dark ? 'sun' : 'moon'}
                initial={{ rotate: -30, opacity: 0 }}
                animate={{ rotate: 0,   opacity: 1 }}
                transition={{ duration: 0.25 }}
              >
                {dark ? <SunIcon /> : <MoonIcon />}
              </motion.span>
            </button>

            {/* Search */}
            <button aria-label="Search"
              className="p-2 text-charcoal-muted hover:text-charcoal dark:hover:text-ivory transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </button>

            {/* Account */}
            {user ? (
              <div className="relative">
                <button onClick={() => setDropdownOpen(p => !p)} aria-label="Account"
                  className="p-2 text-charcoal-muted hover:text-charcoal dark:hover:text-ivory transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </button>
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 mt-2 w-56
                                 bg-ivory dark:bg-[#252219]
                                 border border-border dark:border-[#3A3630]
                                 rounded-xl shadow-xl py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-border dark:border-[#2E2B25]">
                        <p className="text-sm font-medium text-charcoal dark:text-ivory">{user.name}</p>
                        <p className="text-xs text-charcoal-muted">{user.email}</p>
                      </div>
                      {[
                        { to: '/account',               label: 'My Profile'      },
                        { to: '/account/orders',        label: 'My Orders'       },
                        { to: '/account/custom-orders', label: 'Custom Orders'   },
                        { to: '/account/wishlist',      label: 'Wishlist'        },
                      ].map(item => (
                        <Link key={item.to} to={item.to}
                          className="block px-4 py-2 text-sm
                                     text-charcoal dark:text-[#D8D4CE]
                                     hover:text-charcoal dark:hover:text-ivory
                                     hover:bg-cream dark:hover:bg-[#3A3630]">
                          {item.label}
                        </Link>
                      ))}
                      {isAdmin && (
                        <Link to="/admin"
                          className="block px-4 py-2 text-sm text-terracotta
                                     hover:bg-cream dark:hover:bg-[#3A3630]
                                     border-t border-border dark:border-[#3A3630]">
                          Admin Panel
                        </Link>
                      )}
                      <button onClick={logout}
                        className="w-full text-left px-4 py-2 text-sm
                                   text-charcoal dark:text-[#D8D4CE]
                                   hover:text-charcoal dark:hover:text-ivory
                                   hover:bg-cream dark:hover:bg-[#3A3630]
                                   border-t border-border dark:border-[#3A3630]">
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" aria-label="Login"
                className="p-2 text-charcoal-muted hover:text-charcoal dark:hover:text-ivory transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </Link>
            )}

            {/* Cart */}
            <button onClick={() => setCartOpen(true)} aria-label="Cart"
              className="relative p-2 text-charcoal-muted hover:text-charcoal dark:hover:text-ivory transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
              {itemCount > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-terracotta text-white
                             text-xs rounded-full flex items-center justify-center font-medium">
                  {itemCount}
                </motion.span>
              )}
            </button>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(p => !p)} aria-label="Menu"
              className="lg:hidden p-2 text-charcoal dark:text-ivory hover:text-terracotta transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/>
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16"/>
                }
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-ivory dark:bg-[#1A1814] border-t border-border dark:border-[#2E2B25] overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {NAV_LINKS.map(link => (
                <Link key={link.path} to={link.path}
                  className={`block py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-cream dark:bg-[#252219] text-terracotta'
                      : 'text-charcoal-muted hover:bg-cream hover:text-charcoal dark:hover:bg-[#252219] dark:hover:text-ivory'
                  }`}>
                  {link.label}
                </Link>
              ))}
              {/* Theme toggle in mobile menu too */}
              <button onClick={toggle}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-lg text-sm font-medium
                           text-charcoal-muted hover:bg-cream dark:hover:bg-[#252219]
                           dark:text-[#9A9590] hover:text-charcoal dark:hover:text-ivory transition-colors">
                {dark ? <SunIcon /> : <MoonIcon />}
                {dark ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
