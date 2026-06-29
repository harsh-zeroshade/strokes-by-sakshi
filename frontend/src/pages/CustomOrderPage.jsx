import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import * as THREE from 'three';
import { customOrderAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { ARTWORK_TYPES, SIZES, URGENCY_OPTIONS, ORIENTATIONS, FRAME_COLORS } from '../config';

const ease = [0.16, 1, 0.3, 1];
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.85, delay, ease },
});

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(price);
}

/* ── Three.js hero canvas ── */
function CommissionHeroCanvas() {
  const mountRef = useRef(null);
  useEffect(() => {
    const el = mountRef.current; if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0, 7);
    const ribbons = [];
    [
      { color: '#C7694F', w: 0.06,  speed: 0.28, amp: 1.8, off: 0,            op: 0.70 },
      { color: '#C9A94E', w: 0.035, speed: 0.18, amp: 1.4, off: Math.PI*0.6,  op: 0.50 },
      { color: '#9CAF88', w: 0.022, speed: 0.38, amp: 2.2, off: Math.PI*1.3,  op: 0.35 },
      { color: '#FAF7F2', w: 0.014, speed: 0.44, amp: 2.6, off: Math.PI*1.9,  op: 0.18 },
    ].forEach(def => {
      const pts = [];
      for (let i = 0; i <= 180; i++) {
        const t = (i / 180) * Math.PI * 4 - Math.PI * 2;
        pts.push(new THREE.Vector3(t * 0.9, Math.sin(t + def.off) * def.amp, Math.cos(t * 0.5 + def.off) * 1.0));
      }
      const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 360, def.w, 8, false);
      const mat = new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: def.op, depthWrite: false });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh); ribbons.push({ mesh, def });
    });

    const N = 400, dP = new Float32Array(N * 3), dC = new Float32Array(N * 3);
    const pal = [new THREE.Color('#C7694F'), new THREE.Color('#9CAF88'), new THREE.Color('#FAF7F2'), new THREE.Color('#C9A94E')];
    for (let i = 0; i < N; i++) {
      dP[i*3]=(Math.random()-0.5)*16; dP[i*3+1]=(Math.random()-0.5)*8; dP[i*3+2]=(Math.random()-0.5)*4;
      const c = pal[i % pal.length]; dC[i*3]=c.r; dC[i*3+1]=c.g; dC[i*3+2]=c.b;
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute('position', new THREE.BufferAttribute(dP, 3));
    dotGeo.setAttribute('color', new THREE.BufferAttribute(dC, 3));
    const dotMat = new THREE.PointsMaterial({ size: 0.045, vertexColors: true, transparent: true, opacity: 0.28, depthWrite: false });
    scene.add(new THREE.Points(dotGeo, dotMat));

    let mx = 0, my = 0, animId;
    const onMouse = e => { mx = (e.clientX / window.innerWidth - 0.5) * 1.0; my = -(e.clientY / window.innerHeight - 0.5) * 0.6; };
    const onResize = () => { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    window.addEventListener('mousemove', onMouse);
    window.addEventListener('resize', onResize);
    const clock = new THREE.Clock();
    const tick = () => {
      animId = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      ribbons.forEach(({ mesh, def }) => {
        mesh.rotation.x += (my * 0.14 - mesh.rotation.x) * 0.04;
        mesh.rotation.y += (mx * 0.10 - mesh.rotation.y) * 0.04;
        mesh.position.y = Math.sin(t * def.speed * 0.5) * 0.12;
      });
      renderer.render(scene, camera);
    };
    tick();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      ribbons.forEach(({ mesh }) => { mesh.geometry.dispose(); mesh.material.dispose(); });
      dotGeo.dispose(); dotMat.dispose(); renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);
  return <div ref={mountRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />;
}

/* ── Step panel wrapper ── */
function StepPanel({ children }) {
  return (
    <motion.div
      key={Math.random()}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease }}
      className="space-y-8"
    >
      {children}
    </motion.div>
  );
}

export default function CustomOrderPage() {
  const { user } = useAuth();
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY       = useTransform(scrollY, [0, 400], [0, -60]);

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

  const onDrop = useCallback((accepted) => {
    setFiles(prev => [
      ...prev,
      ...accepted.map(f => Object.assign(f, {
        preview: URL.createObjectURL(f),
        uid: Math.random().toString(36).slice(2),
      })),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'], 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 5,
  });

  const removeFile = uid => setFiles(prev => prev.filter(f => f.uid !== uid));
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const getPriceEstimate = () => {
    const type    = ARTWORK_TYPES.find(t => t.value === form.order_type);
    const size    = SIZES.find(s => s.value === form.size);
    const urgency = URGENCY_OPTIONS.find(u => u.value === form.urgency);
    if (!type || !size || !urgency) return 0;
    return type.basePrice * size.multiplier * urgency.multiplier + (form.is_framed ? 2000 : 0);
  };

  const goTo = next => { setError(null); setStep(next); };

  const handleSubmit = async () => {
    setLoading(true); setError(null);
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
    } finally { setLoading(false); }
  };

  /* ── Success screen ── */
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-ivory dark:bg-[#1A1814]" style={{ paddingTop: 80 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease }} className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-sage/20 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-display text-charcoal dark:text-[#F0EDE8]">Your Vision is Received</h1>
          <p className="mt-4 text-charcoal-muted dark:text-[#9A9590] leading-relaxed">
            Thank you! We'll review your request and get back to you within 24–48 hours with a personalised quote.
          </p>
          <Link to="/"
            className="inline-block mt-8 px-8 py-3 bg-charcoal text-ivory text-sm uppercase tracking-wider rounded-full hover:bg-terracotta transition-colors">
            Return Home
          </Link>
          {user && (
            <Link to="/account/custom-orders" className="block mt-4 text-sm text-terracotta hover:underline">
              Track your order →
            </Link>
          )}
        </motion.div>
      </div>
    );
  }

  const stepLabels = ['Details', 'Design', 'Review'];

  return (
    <div className="min-h-screen bg-ivory dark:bg-[#1A1814]">

      {/* ══ HERO — dark with Three.js ribbons ══ */}
      <section style={{
        position: 'relative', height: '100vh', minHeight: 620,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center', overflow: 'hidden', background: '#0D0D0D',
      }}>
        <div style={{ position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 85% 65% at 50% 52%, #18140c 0%, #0D0D0D 72%)' }} />
        <CommissionHeroCanvas />

        <motion.div style={{
          position: 'relative', zIndex: 2, opacity: heroOpacity, y: heroY,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 20, padding: '0 24px', maxWidth: 700,
        }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.38em', textTransform: 'uppercase',
              color: '#C7694F', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 48, height: 1, background: '#C7694F', opacity: 0.45 }} />
            Commission an Original
            <span style={{ width: 48, height: 1, background: '#C7694F', opacity: 0.45 }} />
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.05, delay: 0.38, ease }}
            className="font-display" style={{
              fontSize: 'clamp(3.2rem,9vw,7.5rem)', fontWeight: 600,
              lineHeight: 0.96, letterSpacing: '-0.025em', color: '#F7F2EA',
            }}>
            Let's Create<br />
            <em style={{ fontStyle: 'italic', color: '#C7694F', fontSize: '0.58em',
              fontWeight: 400, display: 'block', marginTop: 10, letterSpacing: '0.02em' }}>
              Together
            </em>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.65 }}
            style={{ fontSize: 15, fontWeight: 300, color: 'rgba(247,242,234,0.5)',
              lineHeight: 1.75, maxWidth: 460 }}>
            Share your vision and I'll bring it to life on canvas — a one-of-a-kind artwork,
            made entirely for you.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.88 }}
            style={{ display: 'flex', gap: 32, paddingTop: 22,
              borderTop: '1px solid rgba(247,242,234,0.07)', width: '100%', justifyContent: 'center' }}>
            {[{ num: '200+', label: 'Artworks' }, { num: '6+', label: 'Years' }, { num: '98%', label: 'Happy Collectors' }]
              .map(({ num, label }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span className="font-display" style={{ fontSize: 24, fontWeight: 600, color: '#C7694F', lineHeight: 1 }}>{num}</span>
                  <span style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(247,242,234,0.35)' }}>{label}</span>
                </div>
              ))}
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }}
          style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 2 }}>
          <motion.div animate={{ scaleY: [1, 0.35, 1], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 1, height: 52, background: 'linear-gradient(to bottom,#C7694F,transparent)' }} />
          <span style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(247,242,234,0.35)' }}>
            Scroll
          </span>
        </motion.div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="bg-ivory dark:bg-[#1A1814]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="pt-16 sm:pt-20 select-none pointer-events-none overflow-hidden">
            <span className="font-display leading-none block text-charcoal/4 dark:text-white/4"
              style={{ fontSize: 'clamp(80px,16vw,160px)', letterSpacing: '-4px' }}>01</span>
          </div>
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 -mt-4 sm:-mt-8 lg:-mt-10 pb-16 sm:pb-20">
            <motion.div {...fadeUp(0)}>
              <span className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-[#9A9590] font-medium">The Process</span>
              <h2 className="mt-4 font-display text-charcoal dark:text-[#F0EDE8] leading-[1.0]"
                style={{ fontSize: 'clamp(2.4rem,5.5vw,4.5rem)', fontWeight: 400 }}>
                How a commission<br />
                <em className="not-italic text-terracotta">comes to life</em>
              </h2>
              <div className="mt-6 h-px w-10 bg-terracotta/40" />
            </motion.div>
            <div className="flex flex-col gap-0">
              {[
                { n: '01', title: 'Share Your Vision',   body: 'Fill in the form below — artwork type, size, timeline, and any references. The more detail, the better.' },
                { n: '02', title: 'Receive a Quote',     body: 'Within 24–48 hours you\'ll get a personalised quote and a discussion of your requirements.' },
                { n: '03', title: 'Watch it Come Alive', body: 'Once confirmed, work begins. Progress updates are shared so you\'re part of every brushstroke.' },
                { n: '04', title: 'Delivered to You',    body: 'Your artwork is carefully packaged and shipped to your door, ready to find its forever home.' },
              ].map((step, i) => (
                <motion.div key={step.n} {...fadeUp(i * 0.09)}
                  className="flex gap-5 py-5 border-b border-charcoal/8 dark:border-white/6 last:border-b-0">
                  <span className="font-display text-xs flex-shrink-0 mt-0.5 text-terracotta" style={{ letterSpacing: 1, minWidth: 24 }}>{step.n}</span>
                  <div>
                    <h4 className="text-sm font-medium text-charcoal dark:text-[#F0EDE8]">{step.title}</h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-charcoal-muted dark:text-[#9A9590]">{step.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-full h-px bg-charcoal/8 dark:bg-white/6" />
      </section>

      {/* ══ 02 — COMMISSION FORM ══ */}
      <section className="bg-cream/40 dark:bg-[#141210]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="pt-16 sm:pt-20 select-none pointer-events-none overflow-hidden">
            <span className="font-display leading-none block text-charcoal/4 dark:text-white/4"
              style={{ fontSize: 'clamp(80px,16vw,160px)', letterSpacing: '-4px' }}>02</span>
          </div>

          <div className="-mt-4 sm:-mt-8 pb-16 sm:pb-24">
            <motion.div {...fadeUp(0)} className="mb-10">
              <span className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-[#9A9590] font-medium">Your Commission</span>
              <h2 className="mt-3 font-display text-charcoal dark:text-[#F0EDE8]"
                style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 400, letterSpacing: '-0.01em' }}>
                Build your <em className="not-italic text-terracotta">artwork brief</em>
              </h2>
            </motion.div>

            {/* Step indicator */}
            <motion.div {...fadeUp(0.1)} className="flex items-center gap-2 mb-10">
              {stepLabels.map((label, i) => (
                <div key={label} className="flex items-center">
                  <button
                    onClick={() => i + 1 < step && goTo(i + 1)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                      step === i + 1
                        ? 'bg-terracotta text-ivory scale-110 shadow-md'
                        : step > i + 1
                        ? 'bg-charcoal dark:bg-[#F0EDE8] text-ivory dark:text-[#1A1814] cursor-pointer'
                        : 'bg-cream dark:bg-[#252219] text-charcoal-muted'
                    }`}>
                    {step > i + 1 ? '✓' : i + 1}
                  </button>
                  <span className={`ml-2 text-xs hidden sm:inline transition-colors ${
                    step >= i + 1 ? 'text-charcoal dark:text-[#F0EDE8] font-medium' : 'text-charcoal-muted dark:text-[#9A9590]'
                  }`}>{label}</span>
                  {i < 2 && (
                    <div className={`w-10 sm:w-16 h-px mx-3 transition-colors ${
                      step > i + 1 ? 'bg-charcoal dark:bg-[#9A9590]' : 'bg-border dark:bg-[#2E2B25]'
                    }`} />
                  )}
                </div>
              ))}
            </motion.div>

            {/* ── Form card ── */}
            <motion.div {...fadeUp(0.15)}
              className="rounded-2xl border border-charcoal/8 dark:border-white/6 bg-ivory dark:bg-[#1e1c18] overflow-hidden">
              <div className="p-6 sm:p-8">
                <AnimatePresence mode="wait">

                  {/* STEP 1 — Artwork Details */}
                  {step === 1 && (
                    <StepPanel key="step1">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-[#9A9590] font-medium mb-4">What type of artwork?</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {ARTWORK_TYPES.map(type => (
                            <button key={type.value} onClick={() => set('order_type', type.value)}
                              className={`p-4 rounded-xl border text-left transition-all ${
                                form.order_type === type.value
                                  ? 'border-terracotta bg-terracotta/5 shadow-sm'
                                  : 'border-border dark:border-[#2E2B25] hover:border-charcoal-muted dark:hover:border-[#9A9590]'
                              }`}>
                              <p className="text-sm font-medium text-charcoal dark:text-[#F0EDE8]">{type.label}</p>
                              <p className="text-xs text-charcoal-muted dark:text-[#9A9590] mt-1">From {formatPrice(type.basePrice)}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-[#9A9590] font-medium mb-4">Preferred Size</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {SIZES.map(s => (
                            <button key={s.value} onClick={() => set('size', s.value)}
                              className={`p-3 rounded-xl border text-center transition-all ${
                                form.size === s.value
                                  ? 'border-terracotta bg-terracotta/5 shadow-sm'
                                  : 'border-border dark:border-[#2E2B25] hover:border-charcoal-muted dark:hover:border-[#9A9590]'
                              }`}>
                              <p className="text-xs font-medium text-charcoal dark:text-[#F0EDE8]">{s.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-[#9A9590] font-medium mb-4">Orientation</p>
                        <div className="flex flex-wrap gap-3">
                          {ORIENTATIONS.map(o => (
                            <button key={o.value} onClick={() => set('orientation', o.value)}
                              className={`px-6 py-3 rounded-xl border text-sm transition-all ${
                                form.orientation === o.value
                                  ? 'border-terracotta bg-terracotta/5 shadow-sm'
                                  : 'border-border dark:border-[#2E2B25] hover:border-charcoal-muted dark:hover:border-[#9A9590]'
                              }`}>
                              <span className="text-charcoal dark:text-[#F0EDE8]">{o.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <button onClick={() => set('is_framed', !form.is_framed)} className="flex items-center gap-3 cursor-pointer">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            form.is_framed ? 'bg-charcoal dark:bg-[#F0EDE8] border-charcoal dark:border-[#F0EDE8]' : 'border-border dark:border-[#2E2B25]'
                          }`}>
                            {form.is_framed && (
                              <svg className="w-3 h-3 text-ivory dark:text-[#1A1814]" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm text-charcoal dark:text-[#F0EDE8]">Add framing (+₹2,000)</span>
                        </button>
                        {form.is_framed && (
                          <div className="mt-3 flex gap-2 flex-wrap">
                            {FRAME_COLORS.map(fc => (
                              <button key={fc.value} onClick={() => set('frame_color', fc.value)} title={fc.label}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${
                                  form.frame_color === fc.value ? 'border-charcoal scale-110 shadow' : 'border-transparent hover:scale-105'
                                }`} style={{ backgroundColor: fc.hex }} />
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-[#9A9590] font-medium mb-4">Timeline</p>
                        <div className="grid grid-cols-3 gap-3">
                          {URGENCY_OPTIONS.map(u => (
                            <button key={u.value} onClick={() => set('urgency', u.value)}
                              className={`p-3 rounded-xl border text-center transition-all ${
                                form.urgency === u.value
                                  ? 'border-terracotta bg-terracotta/5 shadow-sm'
                                  : 'border-border dark:border-[#2E2B25] hover:border-charcoal-muted dark:hover:border-[#9A9590]'
                              }`}>
                              <p className="text-xs font-medium text-charcoal dark:text-[#F0EDE8]">{u.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Estimate */}
                      <div className="p-6 rounded-2xl bg-cream/70 dark:bg-[#252219] border border-border dark:border-[#2E2B25] flex items-center justify-between">
                        <div>
                          <p className="text-sm text-charcoal-muted dark:text-[#9A9590]">Estimated Price</p>
                          <p className="text-xs text-charcoal-muted dark:text-[#9A9590] mt-0.5">Final price may vary</p>
                        </div>
                        <span className="text-3xl font-display text-charcoal dark:text-[#F0EDE8]">{formatPrice(getPriceEstimate())}</span>
                      </div>

                      <button onClick={() => goTo(2)}
                        className="w-full py-3.5 bg-charcoal dark:bg-[#F0EDE8] text-ivory dark:text-[#1A1814] text-sm uppercase tracking-wider rounded-xl hover:bg-terracotta dark:hover:bg-terracotta dark:hover:text-ivory transition-colors">
                        Continue to Design →
                      </button>
                    </StepPanel>
                  )}

                  {/* STEP 2 — Design */}
                  {step === 2 && (
                    <StepPanel key="step2">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-[#9A9590] font-medium mb-4">
                          Reference Images <span className="text-charcoal-muted/60 dark:text-[#9A9590]/60 normal-case">(optional, up to 5)</span>
                        </p>
                        <div {...getRootProps()}
                          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
                            isDragActive ? 'border-terracotta bg-terracotta/5' : 'border-border dark:border-[#2E2B25] hover:border-charcoal-muted dark:hover:border-[#9A9590]'
                          }`}>
                          <input {...getInputProps()} />
                          <div className="w-14 h-14 mx-auto rounded-full bg-cream dark:bg-[#252219] flex items-center justify-center mb-4">
                            <svg className="w-7 h-7 text-charcoal-muted dark:text-[#9A9590]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <p className="text-sm text-charcoal-muted dark:text-[#9A9590]">
                            {isDragActive ? 'Drop files here…' : 'Drag & drop, or click to browse'}
                          </p>
                          <p className="text-xs text-charcoal-muted dark:text-[#9A9590] mt-1">JPG, PNG, PDF — max 10 MB each</p>
                        </div>
                        {files.length > 0 && (
                          <div className="mt-4 grid grid-cols-5 gap-2">
                            {files.map(f => (
                              <div key={f.uid} className="relative aspect-square rounded-lg bg-ivory-dark dark:bg-[#252219] overflow-hidden group">
                                <img src={f.preview} alt={f.name} className="w-full h-full object-cover" />
                                <button onClick={() => removeFile(f.uid)}
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm text-charcoal-muted dark:text-[#9A9590] mb-2">Color Style / Palette</label>
                          <input type="text" value={form.color_style} onChange={e => set('color_style', e.target.value)}
                            placeholder="e.g., warm tones, pastels, monochrome"
                            className="w-full px-4 py-3 bg-transparent border border-border dark:border-[#2E2B25] rounded-lg text-sm text-charcoal dark:text-[#F0EDE8] placeholder:text-charcoal-muted/40 focus:outline-none focus:border-charcoal dark:focus:border-[#9A9590]" />
                        </div>
                        <div>
                          <label className="block text-sm text-charcoal-muted dark:text-[#9A9590] mb-2">Background Style</label>
                          <input type="text" value={form.background_style} onChange={e => set('background_style', e.target.value)}
                            placeholder="e.g., abstract, solid, landscape"
                            className="w-full px-4 py-3 bg-transparent border border-border dark:border-[#2E2B25] rounded-lg text-sm text-charcoal dark:text-[#F0EDE8] placeholder:text-charcoal-muted/40 focus:outline-none focus:border-charcoal dark:focus:border-[#9A9590]" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-charcoal-muted dark:text-[#9A9590] mb-2">Notes for the Artist</label>
                        <textarea value={form.customer_instructions} onChange={e => set('customer_instructions', e.target.value)}
                          rows={4} placeholder="Describe your vision, key emotions, specific details to include or avoid…"
                          className="w-full px-4 py-3 bg-transparent border border-border dark:border-[#2E2B25] rounded-lg text-sm text-charcoal dark:text-[#F0EDE8] placeholder:text-charcoal-muted/40 focus:outline-none focus:border-charcoal dark:focus:border-[#9A9590] resize-none" />
                      </div>

                      <div>
                        <button onClick={() => set('is_gift', !form.is_gift)} className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            form.is_gift ? 'bg-charcoal dark:bg-[#F0EDE8] border-charcoal dark:border-[#F0EDE8]' : 'border-border dark:border-[#2E2B25]'
                          }`}>
                            {form.is_gift && (
                              <svg className="w-3 h-3 text-ivory dark:text-[#1A1814]" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm text-charcoal dark:text-[#F0EDE8]">This is a gift</span>
                        </button>
                        {form.is_gift && (
                          <div className="mt-4 space-y-3">
                            <input type="text" value={form.recipient_name} onChange={e => set('recipient_name', e.target.value)}
                              placeholder="Recipient's name"
                              className="w-full px-4 py-3 bg-transparent border border-border dark:border-[#2E2B25] rounded-lg text-sm text-charcoal dark:text-[#F0EDE8] placeholder:text-charcoal-muted/40 focus:outline-none focus:border-charcoal dark:focus:border-[#9A9590]" />
                            <textarea value={form.recipient_message} onChange={e => set('recipient_message', e.target.value)}
                              rows={2} placeholder="Message for the recipient"
                              className="w-full px-4 py-3 bg-transparent border border-border dark:border-[#2E2B25] rounded-lg text-sm text-charcoal dark:text-[#F0EDE8] placeholder:text-charcoal-muted/40 focus:outline-none focus:border-charcoal dark:focus:border-[#9A9590] resize-none" />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button onClick={() => goTo(1)}
                          className="px-6 py-3 border border-border dark:border-[#2E2B25] text-charcoal-muted dark:text-[#9A9590] text-sm rounded-xl hover:border-charcoal dark:hover:border-[#9A9590] transition-colors">
                          ← Back
                        </button>
                        <button onClick={() => goTo(3)}
                          className="flex-1 py-3 bg-charcoal dark:bg-[#F0EDE8] text-ivory dark:text-[#1A1814] text-sm uppercase tracking-wider rounded-xl hover:bg-terracotta dark:hover:bg-terracotta dark:hover:text-ivory transition-colors">
                          Review & Submit →
                        </button>
                      </div>
                    </StepPanel>
                  )}

                  {/* STEP 3 — Review */}
                  {step === 3 && (
                    <StepPanel key="step3">
                      <h2 className="text-2xl font-display text-charcoal dark:text-[#F0EDE8]">Review Your Commission</h2>

                      <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-cream/70 dark:bg-[#252219] border border-border dark:border-[#2E2B25]">
                          <p className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-[#9A9590] font-medium mb-4">Artwork Details</p>
                          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            {[
                              ['Type',        ARTWORK_TYPES.find(t => t.value === form.order_type)?.label],
                              ['Size',        SIZES.find(s => s.value === form.size)?.label],
                              ['Orientation', form.orientation],
                              ['Timeline',    URGENCY_OPTIONS.find(u => u.value === form.urgency)?.label],
                              ['Framing',     form.is_framed ? `Yes${form.frame_color ? ` · ${FRAME_COLORS.find(f => f.value === form.frame_color)?.label}` : ''}` : 'No'],
                            ].map(([label, val]) => (
                              <div key={label}>
                                <dt className="text-charcoal-muted dark:text-[#9A9590]">{label}</dt>
                                <dd className="text-charcoal dark:text-[#F0EDE8] capitalize">{val}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>

                        {files.length > 0 && (
                          <div className="p-5 rounded-2xl bg-cream/70 dark:bg-[#252219] border border-border dark:border-[#2E2B25]">
                            <p className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-[#9A9590] font-medium mb-3">
                              Reference Images ({files.length})
                            </p>
                            <div className="flex gap-2 flex-wrap">
                              {files.map(f => (
                                <img key={f.uid} src={f.preview} alt="" className="w-14 h-14 rounded-lg object-cover" />
                              ))}
                            </div>
                          </div>
                        )}

                        {form.customer_instructions && (
                          <div className="p-5 rounded-2xl bg-cream/70 dark:bg-[#252219] border border-border dark:border-[#2E2B25]">
                            <p className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted dark:text-[#9A9590] font-medium mb-2">Your Notes</p>
                            <p className="text-sm text-charcoal dark:text-[#F0EDE8] leading-relaxed">{form.customer_instructions}</p>
                          </div>
                        )}

                        <div className="p-6 rounded-2xl bg-charcoal dark:bg-[#F0EDE8] text-ivory dark:text-[#1A1814] flex items-center justify-between">
                          <div>
                            <p className="text-sm text-ivory/60 dark:text-[#1A1814]/60">Estimated Total</p>
                            <p className="text-xs text-ivory/40 dark:text-[#1A1814]/40 mt-0.5">Final price confirmed after review</p>
                          </div>
                          <span className="text-3xl font-display">{formatPrice(getPriceEstimate())}</span>
                        </div>
                      </div>

                      {error && (
                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                          {error}
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button onClick={() => goTo(2)}
                          className="px-6 py-3 border border-border dark:border-[#2E2B25] text-charcoal-muted dark:text-[#9A9590] text-sm rounded-xl hover:border-charcoal dark:hover:border-[#9A9590] transition-colors">
                          ← Back
                        </button>
                        <button onClick={handleSubmit} disabled={loading}
                          className="flex-1 py-3.5 bg-terracotta text-ivory text-sm uppercase tracking-wider rounded-xl hover:bg-terracotta-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          {loading ? (
                            <span className="flex items-center justify-center gap-2">
                              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white" />
                              Submitting…
                            </span>
                          ) : 'Submit Commission Request'}
                        </button>
                      </div>
                    </StepPanel>
                  )}

                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
        <div className="w-full h-px bg-charcoal/8 dark:bg-white/6" />
      </section>

      {/* ══ FINAL CTA ══ */}
      <section className="bg-ivory dark:bg-[#1A1814]">
        <motion.div {...fadeUp(0)}
          className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-24 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8">
          <div>
            <h2 className="font-display text-charcoal dark:text-[#F0EDE8] leading-[0.96]"
              style={{ fontSize: 'clamp(2.4rem,6vw,5.5rem)', fontWeight: 400 }}>
              Have a question<br />
              <em className="not-italic text-terracotta">first?</em>
            </h2>
          </div>
          <div className="flex flex-col gap-3 flex-shrink-0">
            <Link to="/contact"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 text-[11px] uppercase tracking-[0.22em] font-medium text-ivory hover:-translate-y-[2px] transition-all duration-300"
              style={{ background: '#C7694F', borderRadius: 2 }}
              onMouseEnter={e => e.currentTarget.style.background = '#a85540'}
              onMouseLeave={e => e.currentTarget.style.background = '#C7694F'}>
              Get in Touch
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link to="/about" className="text-[11px] uppercase tracking-[0.2em] text-charcoal-muted dark:text-[#9A9590] hover:text-terracotta transition-colors text-center">
              About the Artist →
            </Link>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
