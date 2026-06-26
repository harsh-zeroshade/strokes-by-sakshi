import { Link } from 'react-router-dom';
import { SITE_CONFIG } from '../../config';
import Logo from '../ui/Logo';
import SocialIcons from '../ui/SocialIcons';

const footerLinks = {
  shop: [
    { label: 'All Artworks', path: '/shop' },
    { label: 'Original Paintings', path: '/shop?type=original' },
    { label: 'Prints', path: '/shop?type=print' },
    { label: 'Limited Editions', path: '/shop?type=limited_edition' },
  ],
  company: [
    { label: 'About Sakshi', path: '/about' },
    { label: 'Commission Process', path: '/commission' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Contact', path: '/contact' },
  ],
  support: [
    { label: 'FAQs', path: '/contact#faq' },
    { label: 'Shipping & Returns', path: '/contact#shipping' },
    { label: 'Order Tracking', path: '/account/orders' },
    { label: 'Care Guide', path: '/about#care' },
  ],
};

export default function Footer() {
  return (
    // Footer always uses a fixed dark background
    <footer style={{ background: '#2C2C2C', position: 'relative', zIndex: 10 }} className="text-ivory">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" aria-label="Strokes by Sakshi">
              <Logo size="md" color="ivory" variant="full" />
            </Link>
            <p className="mt-4 text-ivory/60 text-sm leading-relaxed max-w-md">
              {SITE_CONFIG.description}
            </p>

            {/* Social Icons — fill-from-bottom tooltip style */}
            <div className="mt-6 -ml-2">
              <SocialIcons links={SITE_CONFIG.social} />
            </div>

            {/* Contact info */}
            <div className="mt-6 space-y-2">
              <a href={`mailto:${SITE_CONFIG.email}`} className="flex items-center gap-2 text-xs text-ivory/50 hover:text-ivory/80 transition-colors">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {SITE_CONFIG.email}
              </a>
              <p className="flex items-center gap-2 text-xs text-ivory/50">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {SITE_CONFIG.address}
              </p>
            </div>
          </div>

          {/* Nav links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs uppercase tracking-widest text-ivory/40 font-medium mb-4">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-sm text-ivory/70 hover:text-ivory transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-ivory/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ivory/40">
            &copy; {new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved.
          </p>
          <p className="text-xs text-ivory/30 italic font-display">
            Every brushstroke carries a story
          </p>
        </div>
      </div>
    </footer>
  );
}
