import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/* ── Nav items ─────────────────────────────────────────────────────────────── */
const NAV = [
  { key: 'dashboard',      label: 'Dashboard',      icon: 'grid_view',        path: '/admin' },
  { key: 'orders',         label: 'Orders',          icon: 'receipt_long',     path: '/admin/orders' },
  { key: 'custom-orders',  label: 'Commissions',     icon: 'brush',            path: '/admin/custom-orders' },
  { key: 'products',       label: 'Products',        icon: 'palette',          path: '/admin/products' },
  { key: 'reviews',        label: 'Reviews',         icon: 'star',             path: '/admin/reviews' },
  { key: 'users',          label: 'Customers',       icon: 'group',            path: '/admin/users' },
  { key: 'analytics',      label: 'Analytics',       icon: 'insert_chart',     path: '/admin/analytics' },
];

/* ── Sidebar ───────────────────────────────────────────────────────────────── */
function Sidebar({ collapsed, onToggle, dark, onThemeToggle }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-10 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className="flex flex-col flex-shrink-0 h-screen sticky top-0 z-20 transition-all duration-400 overflow-hidden"
        style={{
          width: collapsed ? '72px' : '256px',
          background: dark ? '#1f2937' : '#ffffff',
          borderRight: `1px solid ${dark ? '#3B475C' : '#E2E8F0'}`,
          boxShadow: `0 3px 12px ${dark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)'}`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${dark ? '#3B475C' : '#E2E8F0'}` }}
        >
          <div className={`flex items-center gap-3 overflow-hidden transition-all duration-400 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
            {/* Logo icon */}
            <svg width="36" height="36" viewBox="0 0 80 80" fill="#C7694F" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
              <g transform="translate(40,40) rotate(-45) translate(-40,-40)">
                <rect x="36" y="6"  width="8" height="46" rx="4" />
                <rect x="35" y="48" width="10" height="7" rx="1.5" opacity="0.8"/>
                <ellipse cx="40" cy="64" rx="6" ry="10" />
                <ellipse cx="40" cy="70" rx="3" ry="4" opacity="0.6" />
              </g>
              <g transform="translate(40,40) rotate(45) translate(-40,-40)">
                <rect x="36" y="10" width="8" height="42" rx="2" />
                <polygon points="36,52 44,52 40,64" />
                <circle cx="40" cy="63" r="2" opacity="0.7" />
                <rect x="35" y="6" width="10" height="7" rx="2" opacity="0.75" />
                <rect x="35" y="11" width="10" height="2" rx="1" opacity="0.5" />
              </g>
            </svg>
            <div className="whitespace-nowrap">
              <p className="text-sm font-semibold leading-tight" style={{ color: dark ? '#F1F5F9' : '#1F2936' }}>
                Strokes by Sakshi
              </p>
              <p className="text-[10px]" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>Admin Panel</p>
            </div>
          </div>

          {/* Collapsed icon — always visible */}
          {collapsed && (
            <svg width="32" height="32" viewBox="0 0 80 80" fill="#C7694F" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 absolute left-4">
              <g transform="translate(40,40) rotate(-45) translate(-40,-40)">
                <rect x="36" y="6"  width="8" height="46" rx="4" />
                <rect x="35" y="48" width="10" height="7" rx="1.5" opacity="0.8"/>
                <ellipse cx="40" cy="64" rx="6" ry="10" />
              </g>
              <g transform="translate(40,40) rotate(45) translate(-40,-40)">
                <rect x="36" y="10" width="8" height="42" rx="2" />
                <polygon points="36,52 44,52 40,64" />
                <rect x="35" y="6" width="10" height="7" rx="2" opacity="0.75" />
              </g>
            </svg>
          )}

          <button
            onClick={onToggle}
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200"
            style={{ background: dark ? '#3D4859' : '#ECECFD', color: dark ? '#F1F5F9' : '#1F2936' }}
          >
            <span
              className="material-symbols-rounded transition-transform duration-400 text-xl"
              style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              chevron_left
            </span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'thin', scrollbarColor: '#798EAE transparent' }}>
          <ul className="flex flex-col gap-1">
            {NAV.map(item => {
              const active = location.pathname === item.path ||
                (item.path !== '/admin' && location.pathname.startsWith(item.path));
              return (
                <li key={item.key}>
                  <Link
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap"
                    style={{
                      background: active ? '#c7694f' : 'transparent',
                      color: active ? '#ffffff' : dark ? '#F1F5F9' : '#1F2936',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = dark ? '#3D4859' : '#F0EBE3'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span className="material-symbols-rounded text-xl flex-shrink-0">{item.icon}</span>
                    <span
                      className="text-sm font-medium transition-all duration-300"
                      style={{ opacity: collapsed ? 0 : 1, pointerEvents: collapsed ? 'none' : 'auto' }}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer — theme toggle */}
        <div
          className="px-3 py-4 flex-shrink-0"
          style={{ borderTop: `1px solid ${dark ? '#3B475C' : '#E2E8F0'}` }}
        >
          <button
            onClick={onThemeToggle}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 whitespace-nowrap"
            style={{ background: dark ? '#3D4859' : '#F0EBE3', color: dark ? '#F1F5F9' : '#1F2936' }}
          >
            <span className="material-symbols-rounded text-xl flex-shrink-0">
              {dark ? 'light_mode' : 'dark_mode'}
            </span>
            <span
              className="text-sm font-medium flex-1 text-left transition-all duration-300"
              style={{ opacity: collapsed ? 0 : 1 }}
            >
              {dark ? 'Light Mode' : 'Dark Mode'}
            </span>
            {/* Toggle track */}
            <div
              className="relative flex-shrink-0 transition-all duration-300"
              style={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : '40px', height: '22px' }}
            >
              <div
                className="absolute inset-0 rounded-full transition-colors duration-300"
                style={{ background: dark ? '#c7694f' : '#c3d1ec' }}
              />
              <div
                className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform duration-300"
                style={{ left: '3px', transform: dark ? 'translateX(18px)' : 'translateX(0)' }}
              />
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}

/* ── Top bar ───────────────────────────────────────────────────────────────── */
function Topbar({ onToggle, dark, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header
      className="h-14 flex items-center justify-between px-5 flex-shrink-0 sticky top-0 z-10"
      style={{
        background: dark ? '#111827' : '#f9fafb',
        borderBottom: `1px solid ${dark ? '#3B475C' : '#E2E8F0'}`,
      }}
    >
      {/* Left: mobile hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: dark ? '#3D4859' : '#ECECFD', color: dark ? '#F1F5F9' : '#1F2936' }}
        >
          <span className="material-symbols-rounded text-xl">menu</span>
        </button>
        <h1 className="text-base font-semibold" style={{ color: dark ? '#F1F5F9' : '#1F2936' }}>
          {title}
        </h1>
      </div>

      {/* Right: user info */}
      <div className="flex items-center gap-3">
        <Link
          to="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: dark ? '#3D4859' : '#ECECFD', color: dark ? '#A6B7D2' : '#798EAE' }}
        >
          <span className="material-symbols-rounded text-sm">open_in_new</span>
          View Site
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-terracotta flex items-center justify-center">
            <span className="text-white text-xs font-semibold">{user?.name?.charAt(0)?.toUpperCase()}</span>
          </div>
          <span className="hidden sm:block text-sm font-medium" style={{ color: dark ? '#F1F5F9' : '#1F2936' }}>
            {user?.name}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: dark ? '#3D4859' : '#ECECFD', color: dark ? '#A6B7D2' : '#798EAE' }}
          title="Sign out"
        >
          <span className="material-symbols-rounded text-sm">logout</span>
        </button>
      </div>
    </header>
  );
}

/* ── Layout wrapper ─────────────────────────────────────────────────────────── */
export default function AdminLayout({ children, title = 'Admin' }) {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('admin-theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Only redirect AFTER auth has finished loading
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/login', { replace: true });
    }
  }, [loading, user, isAdmin, navigate]);

  // Collapse on mobile by default
  useEffect(() => {
    if (window.innerWidth < 1024) setCollapsed(true);
  }, []);

  const toggleSidebar = useCallback(() => setCollapsed(p => !p), []);
  const toggleTheme   = useCallback(() => {
    setDark(p => {
      const next = !p;
      localStorage.setItem('admin-theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  // Show nothing while auth is still loading — prevents flash to /login
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f9fafb' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
          <p className="text-sm text-charcoal-muted">Loading…</p>
        </div>
      </div>
    );
  }

  // Not admin — redirect effect will fire, render nothing meanwhile
  if (!user || !isAdmin) return null;

  return (
    <>
      {/* Google Material Symbols */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0"
      />

      <div
        className="flex h-screen overflow-hidden"
        style={{ background: dark ? '#111827' : '#f9fafb', fontFamily: 'Poppins, sans-serif' }}
      >
        <Sidebar collapsed={collapsed} onToggle={toggleSidebar} dark={dark} onThemeToggle={toggleTheme} />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Topbar onToggle={toggleSidebar} dark={dark} title={title} />

          <main
            className="flex-1 overflow-y-auto p-5 sm:p-6"
            style={{ color: dark ? '#F1F5F9' : '#1F2936' }}
          >
            {/* Pass dark down via context-like prop */}
            {typeof children === 'function' ? children({ dark }) : children}
          </main>
        </div>
      </div>
    </>
  );
}

/* ── Shared UI helpers (used by all admin pages) ────────────────────────────── */
export function StatCard({ icon, label, value, sub, color = '#c7694f', dark }) {
  return (
    <div
      className="rounded-xl p-5 flex items-start gap-4"
      style={{ background: dark ? '#1f2937' : '#ffffff', boxShadow: `0 1px 4px ${dark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.07)'}` }}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '20' }}>
        <span className="material-symbols-rounded text-xl" style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest font-medium" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>{label}</p>
        <p className="text-2xl font-semibold mt-0.5 leading-none" style={{ color: dark ? '#F1F5F9' : '#1F2936' }}>{value}</p>
        {sub && <p className="text-xs mt-1" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>{sub}</p>}
      </div>
    </div>
  );
}

export function AdminCard({ children, dark, className = '' }) {
  return (
    <div
      className={`rounded-xl overflow-hidden ${className}`}
      style={{
        background: dark ? '#1f2937' : '#ffffff',
        boxShadow: `0 1px 4px ${dark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.07)'}`,
      }}
    >
      {children}
    </div>
  );
}

export function Badge({ status }) {
  const map = {
    pending:       { bg: '#FEF3C7', text: '#D97706' },
    confirmed:     { bg: '#D1FAE5', text: '#059669' },
    processing:    { bg: '#DBEAFE', text: '#2563EB' },
    shipped:       { bg: '#EDE9FE', text: '#7C3AED' },
    delivered:     { bg: '#D1FAE5', text: '#059669' },
    cancelled:     { bg: '#FEE2E2', text: '#DC2626' },
    refunded:      { bg: '#F3F4F6', text: '#6B7280' },
    in_review:     { bg: '#DBEAFE', text: '#2563EB' },
    quote_sent:    { bg: '#FEF3C7', text: '#D97706' },
    quote_approved:{ bg: '#D1FAE5', text: '#059669' },
    in_progress:   { bg: '#EDE9FE', text: '#7C3AED' },
    draft:         { bg: '#F3F4F6', text: '#6B7280' },
    active:        { bg: '#D1FAE5', text: '#059669' },
    inactive:      { bg: '#FEE2E2', text: '#DC2626' },
  };
  const style = map[status] || { bg: '#F3F4F6', text: '#6B7280' };
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
      style={{ background: style.bg, color: style.text }}
    >
      {status?.replace(/_/g, ' ')}
    </span>
  );
}
