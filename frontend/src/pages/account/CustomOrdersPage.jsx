import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { customOrderAPI } from '../../api';
import { CUSTOM_ORDER_STATUSES } from '../../config';

export default function CustomOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await customOrderAPI.all();
        setOrders(data.data || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="pt-24 min-h-screen px-4">
      <div className="max-w-4xl mx-auto py-12">
        <h1 className="text-3xl font-display text-charcoal mb-8">Custom Orders</h1>

        {loading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-ivory-dark rounded-xl animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-charcoal-muted">No custom orders yet</p>
            <Link to="/commission" className="inline-block mt-4 text-sm text-terracotta hover:underline">Commission your artwork</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const statusInfo = CUSTOM_ORDER_STATUSES.find(s => s.value === order.status);
              return (
                <div key={order.id} className="p-6 rounded-xl bg-cream/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-charcoal">{order.order_number}</span>
                    <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: statusInfo?.color + '20', color: statusInfo?.color }}>
                      {statusInfo?.label}
                    </span>
                  </div>
                  <p className="text-sm text-charcoal-muted capitalize">{order.order_type?.replace('_', ' ')}</p>
                  {order.final_price && <p className="text-sm text-terracotta mt-1">₹{order.final_price}</p>}
                  <p className="text-xs text-charcoal-muted mt-2">{new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}