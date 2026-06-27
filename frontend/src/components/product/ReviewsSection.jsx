import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { reviewAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

const ease = [0.16, 1, 0.3, 1];

/* ── Star component ─────────────────────────────────────────────────── */
function Star({ filled, half, size = 16, color = '#C9A94E' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      {half ? (
        <>
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor={color} />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path d="M10 1l2.39 4.84 5.34.78-3.86 3.76.91 5.33L10 13.27l-4.78 2.51.91-5.33L2.27 6.62l5.34-.78z"
            fill="url(#half)" stroke={color} strokeWidth="1.2" />
        </>
      ) : (
        <path d="M10 1l2.39 4.84 5.34.78-3.86 3.76.91 5.33L10 13.27l-4.78 2.51.91-5.33L2.27 6.62l5.34-.78z"
          fill={filled ? color : 'none'} stroke={color} strokeWidth="1.2"
          strokeOpacity={filled ? 1 : 0.3} />
      )}
    </svg>
  );
}

function StarRow({ rating, size = 16, interactive = false, onChange }) {
  const [hovered, setHovered] = useState(0);
  const display = interactive ? (hovered || rating) : rating;
  return (
    <div className="flex items-center gap-0.5" role={interactive ? 'radiogroup' : undefined}
      aria-label={`Rating: ${rating} out of 5`}>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          className={interactive ? 'cursor-pointer transition-transform hover:scale-110' : ''}
          onClick={interactive ? () => onChange?.(i) : undefined}
          onMouseEnter={interactive ? () => setHovered(i) : undefined}
          onMouseLeave={interactive ? () => setHovered(0) : undefined}
          role={interactive ? 'radio' : undefined}
          aria-checked={interactive ? i === rating : undefined}
          tabIndex={interactive ? 0 : undefined}
          onKeyDown={interactive ? e => e.key === 'Enter' && onChange?.(i) : undefined}
        >
          <Star filled={i <= display} size={size} />
        </span>
      ))}
    </div>
  );
}

/* ── Rating bar ─────────────────────────────────────────────────────── */
function RatingBar({ star, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 group">
      <span className="text-[11px] text-charcoal-muted dark:text-[#9A9590] w-3 text-right flex-shrink-0">{star}</span>
      <Star filled size={11} />
      <div className="flex-1 h-1.5 rounded-full bg-charcoal/8 dark:bg-white/8 overflow-hidden">
        <motion.div className="h-full rounded-full bg-gold"
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease, delay: (5 - star) * 0.06 }} />
      </div>
      <span className="text-[11px] text-charcoal-muted dark:text-[#9A9590] w-6 text-right flex-shrink-0">{count}</span>
    </div>
  );
}

/* ── Single review card ─────────────────────────────────────────────── */
function ReviewCard({ review, index }) {
  const [imgOpen, setImgOpen] = useState(false);
  const initials = review.user?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '?';
  const date = new Date(review.created_at).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' });

  return (
    <>
      <motion.div
        initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
        viewport={{ once:true, margin:'-40px' }}
        transition={{ delay: index * 0.08, duration: 0.65, ease }}
        className="group relative p-5 sm:p-6 rounded-2xl border border-charcoal/8 dark:border-white/8 bg-ivory dark:bg-[#1e1c18] hover:border-charcoal/16 dark:hover:border-white/14 transition-colors duration-300"
      >
        {/* Quote mark */}
        <div className="absolute top-4 right-5 font-display text-[56px] leading-none select-none pointer-events-none text-charcoal/5 dark:text-white/5">"</div>

        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          {/* Avatar */}
          <div className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-semibold text-ivory"
            style={{ background: `hsl(${(review.user?.id || 0) * 47 + 20},45%,52%)` }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-sm font-medium text-charcoal dark:text-[#F0EDE8] truncate">{review.user?.name || 'Anonymous'}</span>
              <span className="text-[10px] text-charcoal-muted dark:text-[#9A9590]">· Verified Buyer</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRow rating={review.rating} size={12} />
              <span className="text-[10px] text-charcoal-muted dark:text-[#9A9590]">{date}</span>
            </div>
          </div>
        </div>

        {/* Title */}
        {review.title && (
          <p className="text-sm font-semibold text-charcoal dark:text-[#F0EDE8] mb-2">{review.title}</p>
        )}

        {/* Body */}
        {review.body && (
          <p className="text-sm text-charcoal-muted dark:text-[#9A9590] leading-relaxed">{review.body}</p>
        )}

        {/* Review image */}
        {review.image_url && (
          <button onClick={() => setImgOpen(true)}
            className="mt-4 block w-20 h-20 rounded-xl overflow-hidden border border-charcoal/10 dark:border-white/8 hover:opacity-90 transition-opacity">
            <img src={review.image_url} alt="Review" className="w-full h-full object-cover"/>
          </button>
        )}
      </motion.div>

      {/* Image lightbox */}
      <AnimatePresence>
        {imgOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            style={{ background:'rgba(0,0,0,0.9)', backdropFilter:'blur(4px)' }}
            onClick={() => setImgOpen(false)}>
            <motion.img initial={{ scale:0.88 }} animate={{ scale:1 }} exit={{ scale:0.88 }}
              transition={{ duration:0.3, ease }} src={review.image_url} alt="Review"
              className="max-h-[85vh] max-w-full rounded-xl shadow-2xl object-contain"
              onClick={e => e.stopPropagation()} />
            <button onClick={() => setImgOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Write review form ──────────────────────────────────────────────── */
function WriteReviewForm({ productId, orderId, onSubmitted }) {
  const [rating,  setRating]  = useState(0);
  const [title,   setTitle]   = useState('');
  const [body,    setBody]    = useState('');
  const [imgFile, setImgFile] = useState(null);
  const [imgPrev, setImgPrev] = useState(null);
  const [submitting, setSub]  = useState(false);
  const [error,   setError]   = useState('');
  const fileRef = useRef(null);

  const onFile = e => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImgFile(f);
    setImgPrev(URL.createObjectURL(f));
  };

  const removeImg = () => { setImgFile(null); setImgPrev(null); if (fileRef.current) fileRef.current.value = ''; };

  const submit = async e => {
    e.preventDefault();
    if (rating === 0) { setError('Please choose a star rating.'); return; }
    setSub(true); setError('');
    try {
      const fd = new FormData();
      fd.append('product_id', productId);
      if (orderId) fd.append('order_id', orderId);
      fd.append('rating', rating);
      if (title.trim()) fd.append('title', title.trim());
      if (body.trim())  fd.append('body',  body.trim());
      if (imgFile)      fd.append('image', imgFile);
      await reviewAPI.create(fd);
      onSubmitted?.();
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSub(false);
    }
  };

  return (
    <motion.form onSubmit={submit}
      initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.5, ease }}
      className="rounded-2xl border border-charcoal/10 dark:border-white/8 bg-cream/60 dark:bg-[#1e1c18] p-5 sm:p-6 space-y-5"
    >
      <h3 className="font-display text-lg text-charcoal dark:text-[#F0EDE8]">Write a Review</h3>

      {/* Star picker */}
      <div>
        <label className="block text-[10px] uppercase tracking-[0.22em] text-charcoal-muted dark:text-[#9A9590] mb-2">
          Your Rating <span className="text-error">*</span>
        </label>
        <StarRow rating={rating} size={28} interactive onChange={setRating} />
        {rating > 0 && (
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }}
            className="mt-1 text-[11px] text-charcoal-muted dark:text-[#9A9590]">
            {['','Terrible','Poor','Average','Good','Excellent'][rating]}
          </motion.p>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-[10px] uppercase tracking-[0.22em] text-charcoal-muted dark:text-[#9A9590] mb-2">
          Review Title <span className="opacity-40">(optional)</span>
        </label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
          maxLength={120} placeholder="Summarise your experience…"
          className="w-full px-4 py-2.5 rounded-xl border border-charcoal/12 dark:border-white/8 bg-ivory dark:bg-[#252219] text-sm text-charcoal dark:text-[#F0EDE8] placeholder:text-charcoal-muted/50 dark:placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-terracotta/30 transition"/>
      </div>

      {/* Body */}
      <div>
        <label className="block text-[10px] uppercase tracking-[0.22em] text-charcoal-muted dark:text-[#9A9590] mb-2">
          Your Review <span className="opacity-40">(optional)</span>
        </label>
        <textarea value={body} onChange={e => setBody(e.target.value)}
          rows={4} maxLength={2000} placeholder="Tell us about your experience with this artwork…"
          className="w-full px-4 py-2.5 rounded-xl border border-charcoal/12 dark:border-white/8 bg-ivory dark:bg-[#252219] text-sm text-charcoal dark:text-[#F0EDE8] placeholder:text-charcoal-muted/50 dark:placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-terracotta/30 transition resize-none"/>
        <p className="text-[10px] text-charcoal-muted/50 dark:text-white/25 text-right mt-1">{body.length}/2000</p>
      </div>

      {/* Image upload */}
      <div>
        <label className="block text-[10px] uppercase tracking-[0.22em] text-charcoal-muted dark:text-[#9A9590] mb-2">
          Add a Photo <span className="opacity-40">(optional)</span>
        </label>
        {imgPrev ? (
          <div className="relative w-20 h-20">
            <img src={imgPrev} alt="Preview" className="w-full h-full object-cover rounded-xl border border-charcoal/10"/>
            <button type="button" onClick={removeImg}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-error text-white flex items-center justify-center text-xs hover:bg-error/80 transition-colors">
              ×
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-charcoal/20 dark:border-white/15 text-xs text-charcoal-muted dark:text-[#9A9590] hover:border-terracotta/50 hover:text-terracotta transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Upload photo
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile}/>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="text-xs text-error flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <button type="submit" disabled={submitting || rating === 0}
        className="w-full py-3 rounded-xl text-[11px] uppercase tracking-[0.22em] font-medium text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: submitting ? '#9CAF88' : '#2C2C2C' }}
        onMouseEnter={e => { if (!submitting && rating > 0) e.currentTarget.style.background = '#C7694F'; }}
        onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = '#2C2C2C'; }}
      >
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
      <p className="text-[10px] text-charcoal-muted/50 dark:text-white/25 text-center">
        Reviews are moderated and published within 24 hours.
      </p>
    </motion.form>
  );
}

/* ── Main exported component ────────────────────────────────────────── */
export default function ReviewsSection({ product }) {
  const { user } = useAuth();
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [canReview,  setCanReview]  = useState(false);
  const [orderId,    setOrderId]    = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  /* Fetch reviews */
  const load = () => {
    setLoading(true);
    reviewAPI.forProduct(product.id)
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { if (product?.id) load(); }, [product?.id]); // eslint-disable-line

  /* Check if current user can submit a review */
  useEffect(() => {
    if (!user || !product?.id) return;
    reviewAPI.canReview(product.id)
      .then(({ data: d }) => { setCanReview(d.can_review); setOrderId(d.order_id); })
      .catch(() => {});
  }, [user, product?.id]);

  const handleSubmitted = () => {
    setShowForm(false);
    setSubmitted(true);
    setCanReview(false);
  };

  const avg    = data?.average_rating || 0;
  const total  = data?.total_reviews  || 0;
  const breakdown = data?.rating_breakdown || {};
  const reviews   = data?.reviews?.data || [];

  return (
    <section className="bg-ivory dark:bg-[#1A1814] border-t border-charcoal/8 dark:border-white/6">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20">

        {/* ── Section header ── */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10 sm:mb-12">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-[#9A9590]">Customer Reviews</span>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl text-charcoal dark:text-[#F0EDE8]">
              What Collectors Say
            </h2>
          </div>

          {/* Write review button */}
          {user && canReview && !showForm && !submitted && (
            <motion.button initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.5, ease }}
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] uppercase tracking-[0.2em] font-medium border border-charcoal/18 dark:border-white/12 text-charcoal dark:text-[#F0EDE8] hover:border-terracotta hover:text-terracotta transition-all duration-300">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Write a Review
            </motion.button>
          )}
        </div>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="space-y-4">
            {[0,1,2].map(i => (
              <div key={i} className="h-32 rounded-2xl bg-cream dark:bg-[#252219] animate-pulse" />
            ))}
          </div>
        )}

        {!loading && (
          <div className="grid lg:grid-cols-[300px_1fr] gap-10 lg:gap-14 items-start">

            {/* ── Left: summary + form ── */}
            <div className="space-y-6">
              {/* Rating summary */}
              <div className="p-5 rounded-2xl bg-cream/60 dark:bg-[#1e1c18] border border-charcoal/8 dark:border-white/6">
                <div className="flex items-end gap-3 mb-4">
                  <motion.span initial={{ scale:0.5, opacity:0 }} animate={{ scale:1, opacity:1 }}
                    transition={{ duration:0.5, ease }}
                    className="font-display leading-none text-charcoal dark:text-[#F0EDE8]"
                    style={{ fontSize:56, fontWeight:300 }}>
                    {avg.toFixed(1)}
                  </motion.span>
                  <div>
                    <StarRow rating={Math.round(avg)} size={18} />
                    <p className="mt-1 text-[11px] text-charcoal-muted dark:text-[#9A9590]">
                      {total} {total === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {[5,4,3,2,1].map(star => (
                    <RatingBar key={star} star={star} count={breakdown[star] || 0} total={total} />
                  ))}
                </div>
              </div>

              {/* Eligibility messages */}
              {!user && (
                <div className="p-4 rounded-xl bg-cream/50 dark:bg-[#1e1c18] border border-charcoal/8 dark:border-white/6 text-center">
                  <p className="text-xs text-charcoal-muted dark:text-[#9A9590] leading-relaxed">
                    <a href="/login" className="text-terracotta hover:underline font-medium">Sign in</a> to leave a review.
                    Only verified buyers can submit reviews.
                  </p>
                </div>
              )}
              {user && !canReview && !submitted && (
                <div className="p-4 rounded-xl bg-cream/50 dark:bg-[#1e1c18] border border-charcoal/8 dark:border-white/6">
                  <p className="text-xs text-charcoal-muted dark:text-[#9A9590] leading-relaxed text-center">
                    Only customers who have purchased and received this artwork can leave a review.
                  </p>
                </div>
              )}
              {submitted && (
                <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                  className="p-4 rounded-xl bg-sage/15 border border-sage/30 text-center">
                  <svg className="w-6 h-6 text-sage mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p className="text-xs text-charcoal dark:text-[#D8D4CE] font-medium">Review submitted!</p>
                  <p className="text-[10px] text-charcoal-muted dark:text-[#9A9590] mt-1">It will appear after moderation.</p>
                </motion.div>
              )}

              {/* Review form */}
              <AnimatePresence>
                {showForm && (
                  <div>
                    <WriteReviewForm
                      productId={product.id}
                      orderId={orderId}
                      onSubmitted={handleSubmitted}
                    />
                    <button onClick={() => setShowForm(false)}
                      className="w-full mt-3 text-[11px] uppercase tracking-[0.2em] text-charcoal-muted dark:text-[#9A9590] hover:text-charcoal dark:hover:text-[#F0EDE8] transition-colors py-2">
                      Cancel
                    </button>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Right: review cards ── */}
            <div>
              {reviews.length === 0 ? (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                  className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-cream dark:bg-[#252219] flex items-center justify-center">
                    <svg className="w-6 h-6 text-charcoal-muted dark:text-[#9A9590]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                  </div>
                  <p className="text-sm text-charcoal-muted dark:text-[#9A9590]">No reviews yet.</p>
                  <p className="text-[11px] text-charcoal-muted/60 dark:text-white/30 max-w-[220px]">Be the first to share your experience with this artwork.</p>
                </motion.div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {reviews.map((r, i) => (
                    <ReviewCard key={r.id} review={r} index={i} />
                  ))}
                </div>
              )}

              {/* Pagination hint */}
              {data?.reviews?.last_page > 1 && (
                <p className="mt-6 text-center text-[11px] text-charcoal-muted dark:text-[#9A9590]">
                  Showing {reviews.length} of {total} reviews
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
