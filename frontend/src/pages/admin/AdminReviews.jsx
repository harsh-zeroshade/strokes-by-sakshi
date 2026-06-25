import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import AdminLayout, { AdminCard } from './AdminLayout';

export function AdminReviewsList() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all'); // all | pending | approved

  useEffect(() => {
    adminAPI.reviews().then(({ data }) => setReviews(data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const approve = async (id) => {
    await adminAPI.approveReview(id).catch(() => {});
    setReviews(prev => prev.map(r => r.id === id ? { ...r, is_approved: true } : r));
  };

  const filtered = reviews.filter(r => {
    if (filter === 'pending')  return !r.is_approved;
    if (filter === 'approved') return r.is_approved;
    return true;
  });

  return (
    <AdminLayout title="Reviews">
      {({ dark }) => (
        <div className="space-y-5">
          {/* Filter tabs */}
          <div className="flex gap-2">
            {[
              { key: 'all',      label: 'All',      count: reviews.length },
              { key: 'pending',  label: 'Pending',  count: reviews.filter(r => !r.is_approved).length },
              { key: 'approved', label: 'Approved', count: reviews.filter(r => r.is_approved).length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className="px-4 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={{
                  background: filter === tab.key ? '#c7694f' : dark ? '#3D4859' : '#F0EBE3',
                  color: filter === tab.key ? '#fff' : dark ? '#A6B7D2' : '#798EAE',
                }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {loading
              ? [...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: dark ? '#1f2937' : '#fff' }} />
                ))
              : filtered.map(review => (
                  <AdminCard key={review.id} dark={dark}>
                    <div className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Stars */}
                          <div className="flex items-center gap-1 mb-1.5">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className="material-symbols-rounded text-sm" style={{ color: i < review.rating ? '#c9a94e' : dark ? '#3D4859' : '#E5E7EB' }}>
                                {i < review.rating ? 'star' : 'star_border'}
                              </span>
                            ))}
                            <span className="text-xs ml-1 font-semibold">{review.rating}/5</span>
                          </div>

                          {review.title && <p className="text-sm font-semibold">{review.title}</p>}
                          <p className="text-sm mt-1 leading-relaxed" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>
                            {review.body}
                          </p>

                          <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>
                            <span>{review.user?.name}</span>
                            <span>·</span>
                            <span>{review.product?.name}</span>
                            <span>·</span>
                            <span>{new Date(review.created_at).toLocaleDateString('en-IN')}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              background: review.is_approved ? '#D1FAE5' : '#FEF3C7',
                              color: review.is_approved ? '#059669' : '#D97706',
                            }}
                          >
                            {review.is_approved ? 'Approved' : 'Pending'}
                          </span>
                          {!review.is_approved && (
                            <button
                              onClick={() => approve(review.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                              style={{ background: '#9caf88' }}
                            >
                              <span className="material-symbols-rounded text-sm">check_circle</span>
                              Approve
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </AdminCard>
                ))
            }
            {!loading && !filtered.length && (
              <p className="text-center py-16 text-sm" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>No reviews found</p>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
