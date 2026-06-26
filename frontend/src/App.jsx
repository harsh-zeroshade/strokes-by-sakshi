import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CartDrawer from './components/cart/CartDrawer';
import WhatsAppButton from './components/ui/WhatsAppButton';

// Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CustomOrderPage from './pages/CustomOrderPage';
import AboutPage from './pages/AboutPage';
import GalleryPage from './pages/GalleryPage';
import ContactPage from './pages/ContactPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProfilePage from './pages/account/ProfilePage';
import OrdersPage from './pages/account/OrdersPage';
import OrderDetailPage from './pages/account/OrderDetailPage';
import CustomOrdersPage from './pages/account/CustomOrdersPage';
import WishlistPage from './pages/account/WishlistPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import { AdminOrdersList, AdminOrderDetail } from './pages/admin/AdminOrders';
import { AdminCustomOrdersList } from './pages/admin/AdminCustomOrders';
import { AdminProductsList } from './pages/admin/AdminProducts';
import { AdminReviewsList } from './pages/admin/AdminReviews';
import { AdminUsersList } from './pages/admin/AdminUsers';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalytics';

/* ─────────────────────────────────────────────────────────────────────────────
   AnimatedRoutes — useLocation must live inside BrowserRouter, so it's split
   out from App. Also detects /admin routes to suppress site chrome.
───────────────────────────────────────────────────────────────────────────── */
function AnimatedRoutes() {
  const location = useLocation();
  const isAdmin  = location.pathname.startsWith('/admin');
  const isHome   = location.pathname === '/';

  return (
    <div className={isAdmin ? 'h-screen overflow-hidden' : 'min-h-screen flex flex-col bg-ivory dark:bg-[#1A1814]'}>

      {/* Site chrome — hidden on admin and homepage (hero has its own nav) */}
      {!isAdmin && !isHome && <Navbar />}
      {!isAdmin && <CartDrawer />}

      {/* Page content */}
      <main className={isAdmin ? '' : 'flex-1'}>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>

            {/* ── Public / Customer routes ── */}
            <Route path="/"                      element={<HomePage />} />
            <Route path="/shop"                  element={<ShopPage />} />
            <Route path="/shop/:slug"            element={<ProductDetailPage />} />
            <Route path="/commission"            element={<CustomOrderPage />} />
            <Route path="/about"                 element={<AboutPage />} />
            <Route path="/gallery"               element={<GalleryPage />} />
            <Route path="/contact"               element={<ContactPage />} />
            <Route path="/cart"                  element={<CartPage />} />
            <Route path="/checkout"              element={<CheckoutPage />} />
            <Route path="/login"                 element={<LoginPage />} />
            <Route path="/register"              element={<RegisterPage />} />
            <Route path="/account"               element={<ProfilePage />} />
            <Route path="/account/orders"        element={<OrdersPage />} />
            <Route path="/account/orders/:id"    element={<OrderDetailPage />} />
            <Route path="/account/custom-orders" element={<CustomOrdersPage />} />
            <Route path="/account/wishlist"      element={<WishlistPage />} />

            {/* ── Admin routes — no site Navbar/Footer ── */}
            <Route path="/admin"                 element={<AdminDashboard />} />
            <Route path="/admin/orders"          element={<AdminOrdersList />} />
            <Route path="/admin/orders/:id"      element={<AdminOrderDetail />} />
            <Route path="/admin/custom-orders"   element={<AdminCustomOrdersList />} />
            <Route path="/admin/products"        element={<AdminProductsList />} />
            <Route path="/admin/reviews"         element={<AdminReviewsList />} />
            <Route path="/admin/users"           element={<AdminUsersList />} />
            <Route path="/admin/analytics"       element={<AdminAnalyticsPage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Site footer + floating button — hidden on admin */}
      {!isAdmin && <WhatsAppButton />}
      {!isAdmin && <Footer />}
    </div>
  );
}

export default function App() {
  return <AnimatedRoutes />;
}
