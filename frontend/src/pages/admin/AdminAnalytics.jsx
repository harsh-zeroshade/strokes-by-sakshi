import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import AdminLayout, { StatCard, AdminCard } from './AdminLayout';

function formatINR(v) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function AdminAnalyticsPage() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.analytics().then(({ data: d }) => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const maxRevenue = data?.orders_by_month?.length
    ? Math.max(...data.orders_by_month.map(r => +r.revenue || 0), 1)
    : 1;

  return (
    <AdminLayout title="Analytics">
      {({ dark }) => (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard dark={dark} icon="group"         label="Total Users"     value={data?.total_users ?? '—'}    color="#c7694f" />
            <StatCard dark={dark} icon="palette"       label="Total Products"  value={data?.total_products ?? '—'} color="#c9a94e" />
            <StatCard dark={dark} icon="payments"      label="Avg Order Value" value={loading ? '—' : formatINR(data?.average_order_value)} color="#9caf88" />
            <StatCard dark={dark} icon="trending_up"   label="Monthly Revenue" value={loading ? '—' : formatINR(data?.orders_by_month?.[0]?.revenue)} color="#6b6b6b" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue bar chart */}
            <AdminCard dark={dark}>
              <div className="px-5 py-4 border-b font-semibold text-sm" style={{ borderColor: dark ? '#3B475C' : '#E2E8F0' }}>
                Revenue by Month
              </div>
              <div className="px-5 py-5">
                {loading
                  ? <div className="h-48 animate-pulse rounded-lg" style={{ background: dark ? '#3D4859' : '#F3F4F6' }} />
                  : data?.orders_by_month?.length
                    ? (
                        <div className="space-y-3">
                          {[...data.orders_by_month].reverse().slice(0, 8).map((row, i) => {
                            const pct = ((+row.revenue || 0) / maxRevenue) * 100;
                            return (
                              <div key={i} className="flex items-center gap-3">
                                <span className="text-xs w-10 text-right flex-shrink-0" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>
                                  {MONTHS[(row.month - 1)]}
                                </span>
                                <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: dark ? '#3D4859' : '#F3F4F6' }}>
                                  <div
                                    className="h-full rounded-lg transition-all duration-700"
                                    style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#c7694f,#c9a94e)', minWidth: pct > 0 ? '4px' : '0' }}
                                  />
                                </div>
                                <span className="text-xs w-20 text-right flex-shrink-0 font-medium">
                                  {formatINR(row.revenue)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )
                    : <p className="text-sm text-center py-8" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>No data yet</p>
                }
              </div>
            </AdminCard>

            {/* Orders by status */}
            <AdminCard dark={dark}>
              <div className="px-5 py-4 border-b font-semibold text-sm" style={{ borderColor: dark ? '#3B475C' : '#E2E8F0' }}>
                Orders by Status
              </div>
              <div className="px-5 py-5">
                {loading
                  ? <div className="h-48 animate-pulse rounded-lg" style={{ background: dark ? '#3D4859' : '#F3F4F6' }} />
                  : data?.orders_by_status?.length
                    ? (
                        <div className="space-y-3">
                          {data.orders_by_status.map((row, i) => {
                            const total = data.orders_by_status.reduce((s, r) => s + +r.count, 0) || 1;
                            const pct   = ((+row.count) / total) * 100;
                            const COLORS = ['#c7694f','#c9a94e','#9caf88','#6b6b6b','#a85540','#7a9a68'];
                            return (
                              <div key={i} className="flex items-center gap-3">
                                <span className="text-xs w-20 capitalize flex-shrink-0" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>
                                  {row.status}
                                </span>
                                <div className="flex-1 h-5 rounded-lg overflow-hidden" style={{ background: dark ? '#3D4859' : '#F3F4F6' }}>
                                  <div className="h-full rounded-lg" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length], minWidth: '4px' }} />
                                </div>
                                <span className="text-xs w-8 text-right flex-shrink-0 font-medium">{row.count}</span>
                              </div>
                            );
                          })}
                        </div>
                      )
                    : <p className="text-sm text-center py-8" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>No data yet</p>
                }
              </div>
            </AdminCard>

            {/* Products by type */}
            <AdminCard dark={dark}>
              <div className="px-5 py-4 border-b font-semibold text-sm" style={{ borderColor: dark ? '#3B475C' : '#E2E8F0' }}>
                Products by Type
              </div>
              <div className="px-5 py-4 grid grid-cols-2 gap-3">
                {loading
                  ? [...Array(4)].map((_, i) => (
                      <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: dark ? '#3D4859' : '#F3F4F6' }} />
                    ))
                  : data?.products_by_type?.map((row, i) => {
                      const COLORS = ['#c7694f','#c9a94e','#9caf88','#6b6b6b'];
                      return (
                        <div key={i} className="rounded-xl p-4 flex flex-col gap-1"
                             style={{ background: dark ? '#3D4859' : '#F9FAFB', border: `1px solid ${dark ? '#3B475C' : '#E2E8F0'}` }}>
                          <span className="text-2xl font-semibold" style={{ color: COLORS[i % COLORS.length] }}>{row.count}</span>
                          <span className="text-xs capitalize" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>
                            {row.product_type?.replace(/_/g, ' ')}
                          </span>
                        </div>
                      );
                    })
                }
              </div>
            </AdminCard>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
