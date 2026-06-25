import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useCart } from '../context/CartContext';

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
}

export default function CartPage() {
  const { cart, removeItem, updateQuantity, applyCoupon, removeCoupon } = useCart();
  const items = cart?.items || [];

  return (
    <div className="pt-24 min-h-screen px-4">
      <div className="max-w-4xl mx-auto py-12">
        <h1 className="text-3xl sm:text-4xl font-display text-charcoal mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-charcoal-muted">Your cart is empty</p>
            <Link to="/shop" className="inline-block mt-4 text-sm text-terracotta hover:underline">Continue browsing</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <motion.div key={item.id} layout className="flex gap-6 p-4 rounded-xl bg-cream/50">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-ivory-dark flex-shrink-0 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center text-charcoal-muted text-sm">{item.product?.name?.charAt(0)}</div>
                </div>
                <div className="flex-1">
                  <Link to={`/shop/${item.product?.slug}`} className="text-sm font-medium text-charcoal hover:text-terracotta transition-colors">
                    {item.product?.name}
                  </Link>
                  {item.variant && <p className="text-xs text-charcoal-muted">{item.variant.name}</p>}
                  <p className="text-sm text-terracotta mt-1">{formatPrice(item.unit_price)}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-border rounded">
                      <button onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)} className="px-3 py-1 text-sm hover:bg-cream">−</button>
                      <span className="px-4 py-1 text-sm">{item.quantity}</span>
                      <button onClick={() => item.quantity < 10 && updateQuantity(item.id, item.quantity + 1)} className="px-3 py-1 text-sm hover:bg-cream">+</button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-xs text-charcoal-muted hover:text-error">Remove</button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-charcoal">{formatPrice(item.subtotal)}</p>
                </div>
              </motion.div>
            ))}

            <div className="mt-8 p-6 rounded-xl bg-cream/70">
              <div className="flex items-center justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(cart?.subtotal || 0)}</span>
              </div>
              {cart?.discount > 0 && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-sage">Discount</span>
                  <span className="text-sage">-{formatPrice(cart.discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-lg font-display mt-4 pt-4 border-t border-border">
                <span>Total</span>
                <span>{formatPrice(cart?.total || 0)}</span>
              </div>
              <Link to="/checkout" className="block mt-6 py-3 bg-charcoal text-ivory text-center text-sm uppercase tracking-wider rounded-lg hover:bg-charcoal-light transition-colors">
                Proceed to Checkout
              </Link>
              <Link to="/shop" className="block mt-3 text-center text-xs text-charcoal-muted hover:text-charcoal">
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}