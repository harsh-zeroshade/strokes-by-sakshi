import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../../context/CartContext';

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, removeItem, updateQuantity } = useCart();
  const items = cart?.items || [];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-ivory shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-xl font-display text-charcoal">
                Your Cart
                <span className="text-charcoal-muted text-sm font-body ml-2">({items.length} items)</span>
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 text-charcoal-muted hover:text-charcoal transition-colors"
                aria-label="Close cart"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cream flex items-center justify-center">
                    <svg className="w-8 h-8 text-charcoal-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <p className="text-charcoal-muted">Your cart is empty</p>
                  <Link to="/shop" onClick={() => setCartOpen(false)} className="inline-block mt-4 text-sm text-terracotta hover:text-terracotta-dark underline">
                    Browse Artworks
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 p-3 rounded-lg bg-cream/50"
                  >
                    {/* Image */}
                    <div className="w-20 h-20 rounded-md bg-ivory-dark flex-shrink-0 overflow-hidden">
                      {item.product?.thumbnail ? (
                        <img src={item.product.thumbnail} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-charcoal-muted text-xs">{item.product?.name?.charAt(0)}</div>
                      )}
                    </div>
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-charcoal truncate">{item.product?.name}</h4>
                      {item.variant && <p className="text-xs text-charcoal-muted">{item.variant.name}</p>}
                      <p className="text-sm text-terracotta font-medium mt-1">{formatPrice(item.unit_price)}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-border rounded">
                          <button
                            onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-1 text-xs hover:bg-cream transition-colors"
                          >−</button>
                          <span className="px-3 py-1 text-xs font-medium">{item.quantity}</span>
                          <button
                            onClick={() => item.quantity < 10 && updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-1 text-xs hover:bg-cream transition-colors"
                          >+</button>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-xs text-charcoal-muted hover:text-error transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border px-6 py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-charcoal-muted">Subtotal</span>
                  <span className="text-lg font-display text-charcoal">{formatPrice(cart?.total || 0)}</span>
                </div>
                {cart?.discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-sage">Discount</span>
                    <span className="text-sage">-{formatPrice(cart.discount)}</span>
                  </div>
                )}
                <Link
                  to="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="block w-full py-3 px-6 bg-charcoal text-ivory text-center text-sm font-medium tracking-wider uppercase rounded-lg hover:bg-charcoal-light transition-colors"
                >
                  Checkout
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setCartOpen(false)}
                  className="block w-full py-2 text-center text-xs text-charcoal-muted hover:text-charcoal transition-colors"
                >
                  View Full Cart
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}