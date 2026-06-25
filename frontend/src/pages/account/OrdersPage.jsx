import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { orderAPI } from '../../api';
import { ORDER_STATUSES } from '../../config';

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await orderAPI.all();
        setOrders(data.data || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="pt-24 min-h-screen px-4">
      <div className="max-w-4xl mx-auto py-12">
        <h1 className="text-3xl font-display text-charcoal mb-8">My Orders</h1>

        {loading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-ivory-dark rounded-xl animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-charcoal-muted">No orders yet</p>
            <Link to="/shop" className="inline-block mt-4 text-sm text-terracotta hover:underline">Browse artworks</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const statusInfo = ORDER_STATUSES.find(s => s.value === order.status);
              return (
                <Link key={order.id} to={`/account/orders/${order.id}`} className="block p-6 rounded-xl bg-cream/50 hover:bg-cream transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-charcoal">{order.order_number}</span>
                    <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: statusInfo?.color + '20', color: statusInfo?.color }}>
                      {statusInfo?.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-charcoal-muted">{order.items?.length} items</span>
                    <span className="text-charcoal font-medium">{formatPrice(order.total)}</span>
                  </div>
                  <p className="text-xs text-charcoal-muted mt-2">{new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}