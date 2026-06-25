import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderAPI } from '../../api';
import { ORDER_STATUSES } from '../../config';

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await orderAPI.show(id);
        setOrder(data);
      } catch {}
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <div className="pt-24 min-h-screen px-4"><div className="max-w-4xl mx-auto py-12"><div className="h-64 bg-ivory-dark rounded-xl animate-pulse" /></div></div>;
  if (!order) return <div className="pt-24 min-h-screen flex items-center justify-center"><p>Order not found</p></div>;

  const statusInfo = ORDER_STATUSES.find(s => s.value === order.status);

  return (
    <div className="pt-24 min-h-screen px-4">
      <div className="max-w-4xl mx-auto py-12">
        <Link to="/account/orders" className="text-sm text-charcoal-muted hover:text-charcoal mb-6 inline-block">&larr; Back to Orders</Link>
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display text-charcoal">{order.order_number}</h1>
            <p className="text-sm text-charcoal-muted mt-1">Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <span className="text-sm px-4 py-2 rounded-full" style={{ backgroundColor: statusInfo?.color + '20', color: statusInfo?.color }}>
            {statusInfo?.label}
          </span>
        </div>

        <div className="space-y-4 mb-8">
          {order.items?.map(item => (
            <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-cream/50">
              <div className="w-16 h-16 rounded-lg bg-ivory-dark flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-charcoal">{item.product_name}</p>
                {item.variant_name && <p className="text-xs text-charcoal-muted">{item.variant_name}</p>}
                <p className="text-xs text-charcoal-muted">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm text-charcoal">{formatPrice(item.subtotal)}</p>
            </div>
          ))}
        </div>

        <div className="p-6 rounded-xl bg-cream/70">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-charcoal-muted">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between"><span className="text-sage">Discount</span><span className="text-sage">-{formatPrice(order.discount)}</span></div>}
            <div className="flex justify-between"><span className="text-charcoal-muted">Shipping</span><span>{formatPrice(order.shipping)}</span></div>
            <div className="flex justify-between text-lg font-display pt-4 border-t border-border"><span>Total</span><span>{formatPrice(order.total)}</span></div>
          </div>
          {order.shipping_address && (
            <div className="mt-6 pt-4 border-t border-border">
              <h3 className="text-xs uppercase tracking-widest text-charcoal-muted font-medium mb-2">Shipping Address</h3>
              <p className="text-sm text-charcoal">{JSON.parse(order.shipping_address).full_name}</p>
              <p className="text-sm text-charcoal-muted">{JSON.parse(order.shipping_address).street_address}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}