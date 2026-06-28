import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { adminAPI } from '../../api';
import AdminLayout, { AdminCard, Badge } from './AdminLayout';
import { resolveStoragePath } from '../../utils/imageUrl';

const STATUSES = ['draft','pending','in_review','quote_sent','quote_approved','in_progress','shipped','delivered','cancelled'];

function formatINR(v) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);
}

/* ── List ───────────────────────────────────────────────────────────────────── */
export function AdminCustomOrdersList() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    adminAPI.customOrders().then(({ data }) => setOrders(data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.order_number?.toLowerCase().includes(search.toLowerCase()) || o.user?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <AdminLayout title="Commissions">
      {({ dark }) => (
        <div className="space-y-5">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="flex items-center gap-2 flex-1 min-w-[180px] max-w-sm px-3 py-2 rounded-lg"
              style={{ background: dark ? '#1f2937' : '#fff', border: `1px solid ${dark ? '#3B475C' : '#E2E8F0'}` }}
            >
              <span className="material-symbols-rounded text-base" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>search</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                className="bg-transparent outline-none text-sm w-full" style={{ color: dark ? '#F1F5F9' : '#1F2936' }} />
            </div>
            <select
              value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: dark ? '#1f2937' : '#fff', border: `1px solid ${dark ? '#3B475C' : '#E2E8F0'}`, color: dark ? '#F1F5F9' : '#1F2936' }}
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <span className="text-sm" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>{filtered.length} commissions</span>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading
              ? [...Array(6)].map((_, i) => (
                  <div key={i} className="h-40 rounded-xl animate-pulse" style={{ background: dark ? '#1f2937' : '#fff' }} />
                ))
              : filtered.map(order => (
                  <CommissionCard key={order.id} order={order} dark={dark} onUpdate={updated =>
                    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
                  } />
                ))
            }
          </div>
          {!loading && !filtered.length && (
            <p className="text-center py-16 text-sm" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>No commissions found</p>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

/* ── Commission card ────────────────────────────────────────────────────────── */
function CommissionCard({ order, dark, onUpdate }) {
  const [quotePrice, setQuotePrice]  = useState(order.final_price || '');
  const [artistNotes, setArtistNotes] = useState(order.artist_notes || '');
  const [status, setStatus]          = useState(order.status);
  const [saving, setSaving]          = useState(false);
  const [expanded, setExpanded]      = useState(false);

  const sendQuote = async () => {
    if (!quotePrice) return;
    setSaving(true);
    try {
      const { data } = await adminAPI.sendQuote(order.id, { final_price: +quotePrice, artist_notes: artistNotes });
      onUpdate(data);
    } catch {} finally { setSaving(false); }
  };

  const updateStatus = async (s) => {
    setSaving(true);
    try {
      const { data } = await adminAPI.updateCustomOrderStatus(order.id, { status: s });
      setStatus(data.status); onUpdate(data);
    } catch {} finally { setSaving(false); }
  };

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ background: dark ? '#1f2937' : '#fff', boxShadow: `0 1px 4px ${dark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.07)'}` }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-start justify-between border-b" style={{ borderColor: dark ? '#3B475C' : '#E2E8F0' }}>
        <div>
          <p className="text-sm font-semibold">{order.order_number}</p>
          <p className="text-xs mt-0.5" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>{order.user?.name}</p>
        </div>
        <Badge status={status} />
      </div>

      {/* Details */}
      <div className="px-4 py-3 flex-1 space-y-1 text-xs" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>
        <p><span className="font-medium">Type:</span> {order.order_type?.replace(/_/g, ' ')}</p>
        <p><span className="font-medium">Size:</span> {order.size} · {order.orientation}</p>
        <p><span className="font-medium">Timeline:</span> {order.urgency}</p>
        {order.final_price && (
          <p><span className="font-medium">Quote:</span> {formatINR(order.final_price)}</p>
        )}
        {order.customer_instructions && !expanded && (
          <p className="line-clamp-2">{order.customer_instructions}</p>
        )}
        {expanded && order.customer_instructions && (
          <p>{order.customer_instructions}</p>
        )}
        {order.customer_instructions && (
          <button className="text-terracotta text-xs" onClick={() => setExpanded(p => !p)}>
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Reference files */}
      {order.files?.length > 0 && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          {order.files.map(f => (
            <a
              key={f.id}
              href={resolveStoragePath(f.file_path)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2 py-1 rounded flex items-center gap-1"
              style={{ background: dark ? '#3D4859' : '#F0EBE3', color: dark ? '#A6B7D2' : '#798EAE' }}
            >
              <span className="material-symbols-rounded text-sm">attach_file</span>
              {f.original_name?.substring(0, 12)}…
            </a>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t space-y-2" style={{ borderColor: dark ? '#3B475C' : '#E2E8F0' }}>
        {/* Quote (when pending/in_review) */}
        {['pending','in_review'].includes(status) && (
          <div className="flex gap-2">
            <input
              type="number" value={quotePrice} onChange={e => setQuotePrice(e.target.value)}
              placeholder="Quote price ₹"
              className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none"
              style={{ background: dark ? '#3D4859' : '#F9FAFB', border: `1px solid ${dark ? '#3B475C' : '#E2E8F0'}`, color: dark ? '#F1F5F9' : '#1F2936' }}
            />
            <button
              onClick={sendQuote} disabled={saving || !quotePrice}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
              style={{ background: '#c9a94e' }}
            >
              {saving ? '…' : 'Send Quote'}
            </button>
          </div>
        )}

        {/* Status change */}
        <select
          value={status} onChange={e => updateStatus(e.target.value)} disabled={saving}
          className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
          style={{ background: dark ? '#3D4859' : '#F9FAFB', border: `1px solid ${dark ? '#3B475C' : '#E2E8F0'}`, color: dark ? '#F1F5F9' : '#1F2936' }}
        >
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>
    </div>
  );
}
