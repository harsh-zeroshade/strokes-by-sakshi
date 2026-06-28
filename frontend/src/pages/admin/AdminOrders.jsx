import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api';
import AdminLayout, { AdminCard, Badge } from './AdminLayout';
import { resolveProductImage } from '../../utils/imageUrl';

const STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled','refunded'];

function formatINR(v) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);
}

/* ── Order list ─────────────────────────────────────────────────────────────── */
export function AdminOrdersList() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    adminAPI.orders().then(({ data }) => setOrders(data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o =>
    o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
    o.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Orders">
      {({ dark }) => (
        <div className="space-y-5">
          {/* Search */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 flex-1 max-w-sm px-3 py-2 rounded-lg"
              style={{ background: dark ? '#1f2937' : '#fff', border: `1px solid ${dark ? '#3B475C' : '#E2E8F0'}` }}
            >
              <span className="material-symbols-rounded text-base" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>search</span>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search orders or customers…"
                className="bg-transparent outline-none text-sm w-full"
                style={{ color: dark ? '#F1F5F9' : '#1F2936' }}
              />
            </div>
            <span className="text-sm" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>{filtered.length} orders</span>
          </div>

          <AdminCard dark={dark}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${dark ? '#3B475C' : '#E2E8F0'}` }}>
                    {['Order', 'Customer', 'Date', 'Total', 'Payment', 'Status', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                          style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? [...Array(6)].map((_, i) => (
                        <tr key={i} className="animate-pulse border-b" style={{ borderColor: dark ? '#3B475C' : '#F3F4F6' }}>
                          {[...Array(7)].map((__, j) => (
                            <td key={j} className="px-4 py-3">
                              <div className="h-4 rounded" style={{ background: dark ? '#3D4859' : '#E5E7EB' }} />
                            </td>
                          ))}
                        </tr>
                      ))
                    : filtered.map(order => (
                        <tr
                          key={order.id}
                          className="border-b cursor-pointer transition-colors"
                          style={{ borderColor: dark ? '#3B475C' : '#F3F4F6' }}
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                          onMouseEnter={e => e.currentTarget.style.background = dark ? '#1a2535' : '#F9FAFB'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td className="px-4 py-3 font-medium">{order.order_number}</td>
                          <td className="px-4 py-3" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>{order.user?.name}</td>
                          <td className="px-4 py-3" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>
                            {new Date(order.created_at).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-4 py-3 font-medium">{formatINR(order.total)}</td>
                          <td className="px-4 py-3"><Badge status={order.payment_status} /></td>
                          <td className="px-4 py-3"><Badge status={order.status} /></td>
                          <td className="px-4 py-3">
                            <span className="material-symbols-rounded text-base" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>chevron_right</span>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
              {!loading && !filtered.length && (
                <p className="text-center py-12 text-sm" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>No orders found</p>
              )}
            </div>
          </AdminCard>
        </div>
      )}
    </AdminLayout>
  );
}

/* ── Order detail ───────────────────────────────────────────────────────────── */
export function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder]   = useState(null);
  const [status, setStatus] = useState('');
  const [tracking, setTracking] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState('');

  useEffect(() => {
    adminAPI.orderDetail(id).then(({ data }) => {
      setOrder(data);
      setStatus(data.status);
      setTracking(data.tracking_number || '');
    }).catch(() => {});
  }, [id]);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const { data } = await adminAPI.updateOrderStatus(id, { status, tracking_number: tracking });
      setOrder(data); setMsg('Saved successfully');
    } catch { setMsg('Error saving'); }
    finally { setSaving(false); }
  };

  return (
    <AdminLayout title={`Order ${order?.order_number || '…'}`}>
      {({ dark }) => !order ? (
        <div className="flex items-center justify-center h-48">
          <span className="material-symbols-rounded animate-spin text-2xl text-terracotta">progress_activity</span>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Left: items */}
          <div className="lg:col-span-2 space-y-5">
            <AdminCard dark={dark}>
              <div className="px-5 py-4 border-b font-semibold text-sm" style={{ borderColor: dark ? '#3B475C' : '#E2E8F0' }}>
                Order Items
              </div>
              <div className="divide-y" style={{ borderColor: dark ? '#3B475C' : '#E2E8F0' }}>
                {order.items?.map(item => (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden bg-gray-100">
                      {resolveProductImage(item.product)
                        ? <img src={resolveProductImage(item.product)} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            {item.product?.name?.charAt(0)}
                          </div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product?.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>
                        Qty: {item.quantity} × {formatINR(item.unit_price)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{formatINR(item.subtotal)}</p>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 space-y-1.5 border-t" style={{ borderColor: dark ? '#3B475C' : '#E2E8F0' }}>
                {[
                  ['Subtotal', order.subtotal],
                  ['Discount', -order.discount],
                  ['Shipping', order.shipping],
                  ['Tax', order.tax],
                ].map(([l, v]) => v != null && (
                  <div key={l} className="flex justify-between text-sm">
                    <span style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>{l}</span>
                    <span>{formatINR(v)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-1 border-t" style={{ borderColor: dark ? '#3B475C' : '#E2E8F0' }}>
                  <span>Total</span><span className="text-terracotta">{formatINR(order.total)}</span>
                </div>
              </div>
            </AdminCard>

            {/* Shipping address */}
            {order.shipping_address && (
              <AdminCard dark={dark}>
                <div className="px-5 py-4 border-b font-semibold text-sm" style={{ borderColor: dark ? '#3B475C' : '#E2E8F0' }}>
                  Shipping Address
                </div>
                <div className="px-5 py-4 text-sm space-y-1" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>
                  {typeof order.shipping_address === 'object'
                    ? Object.values(order.shipping_address).filter(Boolean).map((v, i) => <p key={i}>{v}</p>)
                    : <p>{order.shipping_address}</p>
                  }
                </div>
              </AdminCard>
            )}
          </div>

          {/* Right: status management */}
          <div className="space-y-5">
            <AdminCard dark={dark}>
              <div className="px-5 py-4 border-b font-semibold text-sm" style={{ borderColor: dark ? '#3B475C' : '#E2E8F0' }}>
                Update Status
              </div>
              <div className="px-5 py-4 space-y-4">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>
                    Status
                  </label>
                  <select
                    value={status} onChange={e => setStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: dark ? '#3D4859' : '#F9FAFB', border: `1px solid ${dark ? '#3B475C' : '#E2E8F0'}`, color: dark ? '#F1F5F9' : '#1F2936' }}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>
                    Tracking Number
                  </label>
                  <input
                    value={tracking} onChange={e => setTracking(e.target.value)}
                    placeholder="e.g. DTDC1234567"
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: dark ? '#3D4859' : '#F9FAFB', border: `1px solid ${dark ? '#3B475C' : '#E2E8F0'}`, color: dark ? '#F1F5F9' : '#1F2936' }}
                  />
                </div>
                {msg && <p className={`text-xs ${msg.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>}
                <button
                  onClick={save} disabled={saving}
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                  style={{ background: '#c7694f' }}
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </AdminCard>

            {/* Customer */}
            <AdminCard dark={dark}>
              <div className="px-5 py-4 border-b font-semibold text-sm" style={{ borderColor: dark ? '#3B475C' : '#E2E8F0' }}>
                Customer
              </div>
              <div className="px-5 py-4 space-y-2 text-sm">
                <p className="font-medium">{order.user?.name}</p>
                <p style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>{order.user?.email}</p>
                <p style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>{order.user?.phone}</p>
              </div>
            </AdminCard>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
