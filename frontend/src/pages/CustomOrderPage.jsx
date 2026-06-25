import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Link } from 'react-router-dom';
import { customOrderAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { ARTWORK_TYPES, SIZES, URGENCY_OPTIONS, ORIENTATIONS, FRAME_COLORS } from '../config';

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(price);
}

// Simple step transition wrapper — no framer-motion to avoid AnimatePresence conflicts
function StepPanel({ children }) {
  return (
    <div className="space-y-8 animate-fadeIn">
      {children}
    </div>
  );
}

export default function CustomOrderPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    order_type: 'portrait',
    medium: '',
    size: 'medium',
    orientation: 'portrait',
    is_framed: false,
    frame_color: '',
    color_style: '',
    background_style: '',
    urgency: 'standard',
    customer_instructions: '',
    is_gift: false,
    recipient_name: '',
    recipient_message: '',
    due_date: '',
  });

  // ── Dropzone ──────────────────────────────────────────────────────────
  const onDrop = useCallback((accepted) => {
    setFiles(prev => [
      ...prev,
      ...accepted.map(f =>
        Object.assign(f, {
          preview: URL.createObjectURL(f),
          uid: Math.random().toString(36).slice(2),
        })
      ),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 5,
  });

  const removeFile = uid => setFiles(prev => prev.filter(f => f.uid !== uid));

  // ── Form helpers ──────────────────────────────────────────────────────
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const getPriceEstimate = () => {
    const type    = ARTWORK_TYPES.find(t => t.value === form.order_type);
    const size    = SIZES.find(s => s.value === form.size);
    const urgency = URGENCY_OPTIONS.find(u => u.value === form.urgency);
    if (!type || !size || !urgency) return 0;
    return type.basePrice * size.multiplier * urgency.multiplier + (form.is_framed ? 2000 : 0);
  };

  const goTo = next => { setError(null); setStep(next); };

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (typeof v === 'boolean') fd.append(k, v ? '1' : '0');
        else if (v !== null && v !== undefined && v !== '') fd.append(k, v);
      });
      files.forEach(f => fd.append('files[]', f));
      await customOrderAPI.create(fd);
      setSubmitted(true);
    } catch (e) {
      setError(
        e.response?.data?.message ||
        Object.values(e.response?.data?.errors || {}).flat().join(' ') ||
        'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-24">
        <div className="text-center max-w-md animate-fadeIn">
          <div className="w-20 h-20 mx-auto rounded-full bg-sage/20 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-display text-charcoal">Your Vision is Received</h1>
          <p className="mt-4 text-charcoal-muted leading-relaxed">
            Thank you! We'll review your request and get back to you within 24–48 hours with a personalised quote.
          </p>
          <Link
            to="/"
            className="inline-block mt-8 px-8 py-3 bg-charcoal text-ivory text-sm uppercase tracking-wider rounded-full hover:bg-charcoal-light transition-colors"
          >
            Return Home
          </Link>
          {user && (
            <Link to="/account/custom-orders" className="block mt-4 text-sm text-terracotta hover:underline">
              Track your order →
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ── Steps header ──────────────────────────────────────────────────────
  const stepLabels = ['Details', 'Design', 'Review'];

  return (
    <div className="pt-24 min-h-screen">
      {/* Page header */}
      <div className="px-4 py-12 sm:py-16 bg-cream/30">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-charcoal-muted font-medium">
            Commission an Original
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-display text-charcoal">
            Let's Create Together
          </h1>
          <p className="mt-4 text-lg text-charcoal-muted">
            Share your vision, and I'll bring it to life on canvas.
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="max-w-3xl mx-auto px-4 pt-10 pb-6">
        <div className="flex items-center justify-center gap-2">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center">
              <button
                onClick={() => i + 1 < step && goTo(i + 1)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                  step === i + 1
                    ? 'bg-terracotta text-ivory scale-110 shadow-md'
                    : step > i + 1
                    ? 'bg-charcoal text-ivory cursor-pointer'
                    : 'bg-cream text-charcoal-muted'
                }`}
              >
                {step > i + 1 ? '✓' : i + 1}
              </button>
              <span className={`ml-2 text-xs hidden sm:inline transition-colors ${
                step >= i + 1 ? 'text-charcoal font-medium' : 'text-charcoal-muted'
              }`}>
                {label}
              </span>
              {i < 2 && (
                <div className={`w-10 sm:w-16 h-px mx-3 transition-colors ${
                  step > i + 1 ? 'bg-charcoal' : 'bg-border'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Step content ─────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 pb-24">

        {/* STEP 1 — Artwork Details */}
        {step === 1 && (
          <StepPanel>
            {/* Artwork type */}
            <div>
              <p className="text-xs uppercase tracking-widest text-charcoal-muted font-medium mb-4">
                What type of artwork?
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ARTWORK_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => set('order_type', type.value)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      form.order_type === type.value
                        ? 'border-terracotta bg-terracotta/5 shadow-sm'
                        : 'border-border hover:border-charcoal-muted'
                    }`}
                  >
                    <p className="text-sm font-medium text-charcoal">{type.label}</p>
                    <p className="text-xs text-charcoal-muted mt-1">From {formatPrice(type.basePrice)}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <p className="text-xs uppercase tracking-widest text-charcoal-muted font-medium mb-4">
                Preferred Size
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SIZES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => set('size', s.value)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      form.size === s.value
                        ? 'border-terracotta bg-terracotta/5 shadow-sm'
                        : 'border-border hover:border-charcoal-muted'
                    }`}
                  >
                    <p className="text-xs font-medium text-charcoal">{s.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Orientation */}
            <div>
              <p className="text-xs uppercase tracking-widest text-charcoal-muted font-medium mb-4">
                Orientation
              </p>
              <div className="flex flex-wrap gap-3">
                {ORIENTATIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => set('orientation', o.value)}
                    className={`px-6 py-3 rounded-xl border text-sm transition-all ${
                      form.orientation === o.value
                        ? 'border-terracotta bg-terracotta/5 shadow-sm'
                        : 'border-border hover:border-charcoal-muted'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Framing */}
            <div>
              <button
                onClick={() => set('is_framed', !form.is_framed)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  form.is_framed ? 'bg-charcoal border-charcoal' : 'border-border'
                }`}>
                  {form.is_framed && (
                    <svg className="w-3 h-3 text-ivory" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-charcoal">Add framing (+₹2,000)</span>
              </button>

              {form.is_framed && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {FRAME_COLORS.map(fc => (
                    <button
                      key={fc.value}
                      onClick={() => set('frame_color', fc.value)}
                      title={fc.label}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        form.frame_color === fc.value
                          ? 'border-charcoal scale-110 shadow'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: fc.hex }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Timeline */}
            <div>
              <p className="text-xs uppercase tracking-widest text-charcoal-muted font-medium mb-4">
                Timeline
              </p>
              <div className="grid grid-cols-3 gap-3">
                {URGENCY_OPTIONS.map(u => (
                  <button
                    key={u.value}
                    onClick={() => set('urgency', u.value)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      form.urgency === u.value
                        ? 'border-terracotta bg-terracotta/5 shadow-sm'
                        : 'border-border hover:border-charcoal-muted'
                    }`}
                  >
                    <p className="text-xs font-medium text-charcoal">{u.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Estimate */}
            <div className="p-6 rounded-2xl bg-cream/70 border border-border flex items-center justify-between">
              <div>
                <p className="text-sm text-charcoal-muted">Estimated Price</p>
                <p className="text-xs text-charcoal-muted mt-0.5">Final price may vary</p>
              </div>
              <span className="text-3xl font-display text-charcoal">{formatPrice(getPriceEstimate())}</span>
            </div>

            <button
              onClick={() => goTo(2)}
              className="w-full py-3.5 bg-charcoal text-ivory text-sm uppercase tracking-wider rounded-xl hover:bg-charcoal-light transition-colors"
            >
              Continue to Design →
            </button>
          </StepPanel>
        )}

        {/* STEP 2 — Design */}
        {step === 2 && (
          <StepPanel>
            {/* Dropzone */}
            <div>
              <p className="text-xs uppercase tracking-widest text-charcoal-muted font-medium mb-4">
                Reference Images <span className="text-charcoal-muted/60 normal-case">(optional, up to 5)</span>
              </p>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-terracotta bg-terracotta/5'
                    : 'border-border hover:border-charcoal-muted'
                }`}
              >
                <input {...getInputProps()} />
                <div className="w-14 h-14 mx-auto rounded-full bg-cream flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-charcoal-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm text-charcoal-muted">
                  {isDragActive ? 'Drop files here…' : 'Drag & drop, or click to browse'}
                </p>
                <p className="text-xs text-charcoal-muted mt-1">JPG, PNG, PDF — max 10 MB each</p>
              </div>

              {files.length > 0 && (
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {files.map(f => (
                    <div key={f.uid} className="relative aspect-square rounded-lg bg-ivory-dark overflow-hidden group">
                      <img src={f.preview} alt={f.name} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeFile(f.uid)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Style */}
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-charcoal-muted mb-2">Color Style / Palette</label>
                <input
                  type="text"
                  value={form.color_style}
                  onChange={e => set('color_style', e.target.value)}
                  placeholder="e.g., warm tones, pastels, monochrome"
                  className="w-full px-4 py-3 bg-transparent border border-border rounded-lg text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <div>
                <label className="block text-sm text-charcoal-muted mb-2">Background Style</label>
                <input
                  type="text"
                  value={form.background_style}
                  onChange={e => set('background_style', e.target.value)}
                  placeholder="e.g., abstract, solid, landscape"
                  className="w-full px-4 py-3 bg-transparent border border-border rounded-lg text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm text-charcoal-muted mb-2">Notes for the Artist</label>
              <textarea
                value={form.customer_instructions}
                onChange={e => set('customer_instructions', e.target.value)}
                rows={4}
                placeholder="Describe your vision, key emotions, specific details to include or avoid…"
                className="w-full px-4 py-3 bg-transparent border border-border rounded-lg text-sm text-charcoal focus:outline-none focus:border-charcoal resize-none"
              />
            </div>

            {/* Gift */}
            <div>
              <button
                onClick={() => set('is_gift', !form.is_gift)}
                className="flex items-center gap-3"
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  form.is_gift ? 'bg-charcoal border-charcoal' : 'border-border'
                }`}>
                  {form.is_gift && (
                    <svg className="w-3 h-3 text-ivory" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-charcoal">This is a gift</span>
              </button>

              {form.is_gift && (
                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    value={form.recipient_name}
                    onChange={e => set('recipient_name', e.target.value)}
                    placeholder="Recipient's name"
                    className="w-full px-4 py-3 bg-transparent border border-border rounded-lg text-sm text-charcoal focus:outline-none focus:border-charcoal"
                  />
                  <textarea
                    value={form.recipient_message}
                    onChange={e => set('recipient_message', e.target.value)}
                    rows={2}
                    placeholder="Message for the recipient"
                    className="w-full px-4 py-3 bg-transparent border border-border rounded-lg text-sm text-charcoal focus:outline-none focus:border-charcoal resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => goTo(1)}
                className="px-6 py-3 border border-border text-charcoal-muted text-sm rounded-xl hover:border-charcoal transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => goTo(3)}
                className="flex-1 py-3 bg-charcoal text-ivory text-sm uppercase tracking-wider rounded-xl hover:bg-charcoal-light transition-colors"
              >
                Review &amp; Submit →
              </button>
            </div>
          </StepPanel>
        )}

        {/* STEP 3 — Review */}
        {step === 3 && (
          <StepPanel>
            <h2 className="text-2xl font-display text-charcoal">Review Your Commission</h2>

            <div className="space-y-4">
              {/* Summary */}
              <div className="p-5 rounded-2xl bg-cream/70 border border-border">
                <p className="text-xs uppercase tracking-widest text-charcoal-muted font-medium mb-4">
                  Artwork Details
                </p>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {[
                    ['Type',        ARTWORK_TYPES.find(t => t.value === form.order_type)?.label],
                    ['Size',        SIZES.find(s => s.value === form.size)?.label],
                    ['Orientation', form.orientation],
                    ['Timeline',    URGENCY_OPTIONS.find(u => u.value === form.urgency)?.label],
                    ['Framing',     form.is_framed ? `Yes${form.frame_color ? ` · ${FRAME_COLORS.find(f => f.value === form.frame_color)?.label}` : ''}` : 'No'],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <dt className="text-charcoal-muted">{label}</dt>
                      <dd className="text-charcoal capitalize">{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Reference images */}
              {files.length > 0 && (
                <div className="p-5 rounded-2xl bg-cream/70 border border-border">
                  <p className="text-xs uppercase tracking-widest text-charcoal-muted font-medium mb-3">
                    Reference Images ({files.length})
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {files.map(f => (
                      <img key={f.uid} src={f.preview} alt="" className="w-14 h-14 rounded-lg object-cover" />
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {form.customer_instructions && (
                <div className="p-5 rounded-2xl bg-cream/70 border border-border">
                  <p className="text-xs uppercase tracking-widest text-charcoal-muted font-medium mb-2">
                    Your Notes
                  </p>
                  <p className="text-sm text-charcoal leading-relaxed">{form.customer_instructions}</p>
                </div>
              )}

              {/* Price */}
              <div className="p-6 rounded-2xl bg-charcoal text-ivory flex items-center justify-between">
                <div>
                  <p className="text-sm text-ivory/60">Estimated Total</p>
                  <p className="text-xs text-ivory/40 mt-0.5">Final price confirmed after review</p>
                </div>
                <span className="text-3xl font-display">{formatPrice(getPriceEstimate())}</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => goTo(2)}
                className="px-6 py-3 border border-border text-charcoal-muted text-sm rounded-xl hover:border-charcoal transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3.5 bg-terracotta text-ivory text-sm uppercase tracking-wider rounded-xl hover:bg-terracotta-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Submitting…
                  </span>
                ) : (
                  'Submit Commission Request'
                )}
              </button>
            </div>
          </StepPanel>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease both; }
      `}</style>
    </div>
  );
}
