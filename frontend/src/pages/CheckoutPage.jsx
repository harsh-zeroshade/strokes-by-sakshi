import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { orderAPI } from '../api';

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, refreshCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [form, setForm] = useState({
    full_name: user?.name || '',
    phone: user?.phone || '',
    street_address: '',
    apartment: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    notes: '',
    payment_method: 'cod',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await orderAPI.checkout({
        shipping_address: {
          full_name: form.full_name,
          phone: form.phone,
          street_address: form.street_address,
          apartment: form.apartment,
          city: form.city,
          state: form.state,
          postal_code: form.postal_code,
          country: form.country,
        },
        notes: form.notes,
        payment_method: form.payment_method,
      });
      await refreshCart();
      navigate(`/account/orders/${data.order.id}`);
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-display text-charcoal">Sign in to Checkout</h1>
          <p className="mt-4 text-charcoal-muted">Please sign in or create an account to complete your order.</p>
          <Link to="/login" className="inline-block mt-6 px-8 py-3 bg-charcoal text-ivory text-sm uppercase tracking-wider rounded-full hover:bg-charcoal-light transition-colors">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen px-4">
      <div className="max-w-4xl mx-auto py-12">
        <h1 className="text-3xl sm:text-4xl font-display text-charcoal mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h2 className="text-lg font-display text-charcoal">Shipping Address</h2>

            {/* Error message */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <input type="text" required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} placeholder="Full Name" className="col-span-full px-4 py-3 bg-transparent border border-border rounded-lg text-sm focus:outline-none focus:border-charcoal-muted" />
              <input type="tel" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Phone" className="col-span-full px-4 py-3 bg-transparent border border-border rounded-lg text-sm focus:outline-none focus:border-charcoal-muted" />
              <input type="text" required value={form.street_address} onChange={e => setForm({...form, street_address: e.target.value})} placeholder="Street Address" className="col-span-full px-4 py-3 bg-transparent border border-border rounded-lg text-sm focus:outline-none focus:border-charcoal-muted" />
              <input type="text" value={form.apartment} onChange={e => setForm({...form, apartment: e.target.value})} placeholder="Apartment (optional)" className="px-4 py-3 bg-transparent border border-border rounded-lg text-sm focus:outline-none focus:border-charcoal-muted" />
              <input type="text" required value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="City" className="px-4 py-3 bg-transparent border border-border rounded-lg text-sm focus:outline-none focus:border-charcoal-muted" />
              <input type="text" required value={form.state} onChange={e => setForm({...form, state: e.target.value})} placeholder="State" className="px-4 py-3 bg-transparent border border-border rounded-lg text-sm focus:outline-none focus:border-charcoal-muted" />
              <input type="text" required value={form.postal_code} onChange={e => setForm({...form, postal_code: e.target.value})} placeholder="Postal Code" className="px-4 py-3 bg-transparent border border-border rounded-lg text-sm focus:outline-none focus:border-charcoal-muted" />
              <input type="text" required value={form.country} onChange={e => setForm({...form, country: e.target.value})} placeholder="Country" className="px-4 py-3 bg-transparent border border-border rounded-lg text-sm focus:outline-none focus:border-charcoal-muted" />
            </div>

            <div>
              <h3 className="text-sm font-medium text-charcoal mb-3">Payment Method</h3>
              <div className="space-y-2">
                {[
                  { value: 'cod', label: 'Cash on Delivery' },
                  { value: 'razorpay', label: 'Razorpay (Card / UPI / Net Banking)' },
                  { value: 'stripe', label: 'Stripe (International Cards)' },
                ].map(pm => (
                  <label key={pm.value} className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-cream/50 transition-colors">
                    <input type="radio" name="payment" value={pm.value} checked={form.payment_method === pm.value} onChange={e => setForm({...form, payment_method: e.target.value})} className="accent-charcoal" />
                    <span className="text-sm text-charcoal">{pm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} placeholder="Order notes (optional)" className="w-full px-4 py-3 bg-transparent border border-border rounded-lg text-sm focus:outline-none focus:border-charcoal-muted resize-none" />
          </div>

          <div>
            <div className="p-6 rounded-xl bg-cream/70 sticky top-28">
              <h2 className="text-lg font-display text-charcoal mb-4">Order Summary</h2>
              <div className="space-y-3">
                {cart?.items?.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-charcoal-muted">{item.product?.name} × {item.quantity}</span>
                    <span className="text-charcoal">{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-border space-y-2">
                <div className="flex justify-between text-sm"><span className="text-charcoal-muted">Subtotal</span><span>{formatPrice(cart?.subtotal || 0)}</span></div>
                {cart?.discount > 0 && <div className="flex justify-between text-sm"><span className="text-sage">Discount</span><span className="text-sage">-{formatPrice(cart.discount)}</span></div>}
                <div className="flex justify-between text-sm"><span className="text-charcoal-muted">Shipping</span><span className="text-charcoal-muted">Calculated at next step</span></div>
                <div className="flex justify-between text-lg font-display pt-4 border-t border-border"><span>Total</span><span>{formatPrice(cart?.total || 0)}</span></div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full mt-6 py-3 bg-charcoal text-ivory text-sm uppercase tracking-wider rounded-lg hover:bg-charcoal-light transition-colors disabled:opacity-50">
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}