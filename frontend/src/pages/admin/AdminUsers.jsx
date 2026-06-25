import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import AdminLayout, { AdminCard } from './AdminLayout';

export function AdminUsersList() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    adminAPI.users().then(({ data }) => setUsers(data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Customers">
      {({ dark }) => (
        <div className="space-y-5">
          {/* Search */}
          <div
            className="flex items-center gap-2 max-w-sm px-3 py-2 rounded-lg"
            style={{ background: dark ? '#1f2937' : '#fff', border: `1px solid ${dark ? '#3B475C' : '#E2E8F0'}` }}
          >
            <span className="material-symbols-rounded text-base" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers…"
              className="bg-transparent outline-none text-sm w-full" style={{ color: dark ? '#F1F5F9' : '#1F2936' }} />
          </div>

          <AdminCard dark={dark}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${dark ? '#3B475C' : '#E2E8F0'}` }}>
                    {['Customer', 'Email', 'Phone', 'Orders', 'Commissions', 'Role', 'Joined'].map(h => (
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
                    : filtered.map(user => (
                        <tr
                          key={user.id}
                          className="border-b"
                          style={{ borderColor: dark ? '#3B475C' : '#F3F4F6' }}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold"
                                   style={{ background: user.is_admin ? '#c7694f' : '#9caf88' }}>
                                {user.name?.charAt(0)?.toUpperCase()}
                              </div>
                              <span className="font-medium">{user.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>{user.email}</td>
                          <td className="px-4 py-3" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>{user.phone || '—'}</td>
                          <td className="px-4 py-3 text-center font-medium">{user.orders_count ?? 0}</td>
                          <td className="px-4 py-3 text-center font-medium">{user.custom_orders_count ?? 0}</td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                background: user.is_admin ? '#FEE2E2' : '#D1FAE5',
                                color: user.is_admin ? '#DC2626' : '#059669',
                              }}
                            >
                              {user.is_admin ? 'Admin' : 'Customer'}
                            </span>
                          </td>
                          <td className="px-4 py-3" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>
                            {new Date(user.created_at).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
              {!loading && !filtered.length && (
                <p className="text-center py-12 text-sm" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>No customers found</p>
              )}
            </div>
          </AdminCard>
        </div>
      )}
    </AdminLayout>
  );
}
