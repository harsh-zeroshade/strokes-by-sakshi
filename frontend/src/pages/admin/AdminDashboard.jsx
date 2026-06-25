import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../api';
import AdminLayout, { StatCard, AdminCard, Badge } from './AdminLayout';

function formatINR(v) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);
}

export default function AdminDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.dashboard()
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Dashboard">
      {({ dark }) => (
        <div className="space-y-6">

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard dark={dark} icon="receipt_long"   label="Total Orders"    value={data?.total_orders ?? '—'}        color="#c7694f" />
            <StatCard dark={dark} icon="payments"       label="Revenue"         value={loading ? '—' : formatINR(data?.total_revenue)} color="#c9a94e" />
            <StatCard dark={dark} icon="brush"          label="Commissions"     value={data?.total_custom_orders ?? '—'} color="#9caf88" />
            <StatCard dark={dark} icon="pending_actions" label="Pending"        value={data?.pending_custom_orders ?? '—'} color="#6b6b6b" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent orders */}
            <AdminCard dark={dark}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: dark ? '#3B475C' : '#E2E8F0' }}>
                <h2 className="text-sm font-semibold">Recent Orders</h2>
                <Link to="/admin/orders" className="text-xs text-terracotta hover:underline">View all →</Link>
              </div>
              <div className="divide-y" style={{ borderColor: dark ? '#3B475C' : '#E2E8F0' }}>
                {loading
                  ? [...Array(4)].map((_, i) => (
                      <div key={i} className="px-5 py-3 flex items-center gap-3 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-32 dark:bg-gray-700" />
                        <div className="h-4 bg-gray-200 rounded w-20 ml-auto dark:bg-gray-700" />
                      </div>
                    ))
                  : (data?.recent_orders || []).map(o => (
                      <Link
                        key={o.id}
                        to={`/admin/orders/${o.id}`}
                        className="flex items-center justify-between px-5 py-3 hover:bg-opacity-50 transition-colors"
                        style={{ background: 'transparent' }}
                      >
                        <div>
                          <p className="text-sm font-medium">{o.order_number}</p>
                          <p className="text-xs mt-0.5" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>
                            {o.user?.name} · {new Date(o.created_at).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <Badge status={o.status} />
                      </Link>
                    ))}
                {!loading && !data?.recent_orders?.length && (
                  <p className="px-5 py-6 text-sm text-center" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>No orders yet</p>
                )}
              </div>
            </AdminCard>

            {/* Recent commissions */}
            <AdminCard dark={dark}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: dark ? '#3B475C' : '#E2E8F0' }}>
                <h2 className="text-sm font-semibold">Recent Commissions</h2>
                <Link to="/admin/custom-orders" className="text-xs text-terracotta hover:underline">View all →</Link>
              </div>
              <div className="divide-y" style={{ borderColor: dark ? '#3B475C' : '#E2E8F0' }}>
                {loading
                  ? [...Array(4)].map((_, i) => (
                      <div key={i} className="px-5 py-3 animate-pulse flex gap-3">
                        <div className="h-4 bg-gray-200 rounded w-32 dark:bg-gray-700" />
                        <div className="h-4 bg-gray-200 rounded w-20 ml-auto dark:bg-gray-700" />
                      </div>
                    ))
                  : (data?.recent_custom_orders || []).map(o => (
                      <Link
                        key={o.id}
                        to={`/admin/custom-orders/${o.id}`}
                        className="flex items-center justify-between px-5 py-3 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium">{o.order_number}</p>
                          <p className="text-xs mt-0.5 capitalize" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>
                            {o.user?.name} · {o.order_type?.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <Badge status={o.status} />
                      </Link>
                    ))}
                {!loading && !data?.recent_custom_orders?.length && (
                  <p className="px-5 py-6 text-sm text-center" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>No commissions yet</p>
                )}
              </div>
            </AdminCard>
          </div>

          {/* Quick links */}
          <AdminCard dark={dark}>
            <div className="px-5 py-4 border-b" style={{ borderColor: dark ? '#3B475C' : '#E2E8F0' }}>
              <h2 className="text-sm font-semibold">Quick Actions</h2>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { to: '/admin/products/new', icon: 'add_circle',     label: 'New Product',    color: '#c7694f' },
                { to: '/admin/orders',       icon: 'receipt_long',   label: 'View Orders',    color: '#c9a94e' },
                { to: '/admin/reviews',      icon: 'star',           label: 'Mod Reviews',    color: '#9caf88' },
                { to: '/admin/analytics',    icon: 'insert_chart',   label: 'Analytics',      color: '#6b6b6b' },
              ].map(({ to, icon, label, color }) => (
                <Link
                  key={label}
                  to={to}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all hover:-translate-y-0.5"
                  style={{ background: dark ? '#3D4859' : '#F9FAFB', border: `1px solid ${dark ? '#3B475C' : '#E2E8F0'}` }}
                >
                  <span className="material-symbols-rounded text-2xl" style={{ color }}>{icon}</span>
                  <span className="text-xs font-medium">{label}</span>
                </Link>
              ))}
            </div>
          </AdminCard>
        </div>
      )}
    </AdminLayout>
  );
}
