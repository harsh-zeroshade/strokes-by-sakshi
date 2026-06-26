import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════════════════
   PARALLAX ART SCENE — Three.js mouse-tracking depth parallax
   5 depth layers, each moving at a different speed relative to the mouse.
   Objects: canvas frames, brushstrokes, paint circles, ink particles, brush.
═══════════════════════════════════════════════════════════════════════════ */
function ParallaxArtScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    camera.position.z = 18;

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();

    const C = {
      terracotta: new THREE.Color('#c7694f'),
      gold:       new THREE.Color('#c9a94e'),
      sage:       new THREE.Color('#9caf88'),
      charcoal:   new THREE.Color('#3a3a3a'),
      blush:      new THREE.Color('#e8c4c4'),
      walnut:     new THREE.Color('#5c3a1e'),
    };

    const layerSpeeds = [0.06, 0.14, 0.25, 0.40, 0.60];
    const layerZ      = [-16, -10,  -5,   -2,    0 ];
    const layers = layerSpeeds.map((_, i) => {
      const g = new THREE.Group();
      g.position.z = layerZ[i];
      scene.add(g);
      return g;
    });

    const mixers = [];
    const play = (obj, clip) => {
      const mx = new THREE.AnimationMixer(obj);
      const ac = mx.clipAction(clip);
      ac.setLoop(THREE.LoopRepeat, Infinity);
      ac.play();
      mixers.push(mx);
    };

    const bobClip = (name, ampY, dur, startY = 0) =>
      new THREE.AnimationClip(name, dur, [
        new THREE.VectorKeyframeTrack('.position',
          [0, dur * 0.5, dur],
          [0, startY, 0,  0, startY + ampY, 0,  0, startY, 0])
      ]);

    const rotClip = (name, axis, fullRev, dur) => {
      const q = (a) => {
        const quat = new THREE.Quaternion();
        if (axis === 'z') quat.setFromEuler(new THREE.Euler(0, 0, a));
        if (axis === 'y') quat.setFromEuler(new THREE.Euler(0, a, 0));
        return [quat.x, quat.y, quat.z, quat.w];
      };
      const n = fullRev ? 5 : 3;
      const times = Array.from({ length: n }, (_, i) => (i / (n - 1)) * dur);
      const vals  = times.map((_, i) => q((i / (n - 1)) * (fullRev ? Math.PI * 2 : Math.PI * 0.3))).flat();
      return new THREE.AnimationClip(name, dur, [
        new THREE.QuaternionKeyframeTrack('.quaternion', times, vals)
      ]);
    };

    const mat = (col, op = 1) =>
      new THREE.MeshBasicMaterial({ color: col, transparent: op < 1, opacity: op });

    /* Layer 0 — far background: faint planes */
    [
      { w:9,  h:12, x:-14, y:3,  col:C.terracotta, op:0.06 },
      { w:14, h:9,  x:12,  y:-4, col:C.gold,       op:0.05 },
      { w:7,  h:10, x:0,   y:7,  col:C.sage,       op:0.07 },
    ].forEach((d, i) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(d.w, d.h), mat(d.col, d.op));
      m.position.set(d.x, d.y, 0);
      layers[0].add(m);
      play(m, bobClip(`l0_${i}`, 0.8, 9 + i * 2, d.y));
    });

    /* Layer 1 — canvas frame outlines */
    [
      { w:5, h:7,  x:-10, y:2,  col:C.terracotta, op:0.18, rz: 0.12 },
      { w:8, h:5,  x:9,   y:-3, col:C.gold,       op:0.14, rz:-0.08 },
      { w:4, h:6,  x:2,   y:6,  col:C.sage,       op:0.16, rz: 0.05 },
      { w:6, h:4,  x:-7,  y:-6, col:C.charcoal,   op:0.12, rz:-0.15 },
    ].forEach((d, i) => {
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(d.w, d.h)),
        new THREE.LineBasicMaterial({ color: d.col, transparent: true, opacity: d.op })
      );
      edges.position.set(d.x, d.y, 0);
      edges.rotation.z = d.rz;
      layers[1].add(edges);
      play(edges, bobClip(`l1_${i}`, 1.0, 7 + i * 1.5, d.y));
    });

    /* Layer 2 — brushstrokes + paint circles */
    [
      { w:12, h:0.22, x:-4, y:2.5, col:C.terracotta, op:0.14, rz:0.10 },
      { w:9,  h:0.16, x:5,  y:-2,  col:C.gold,       op:0.12, rz:-0.06 },
      { w:7,  h:0.13, x:-6, y:-5,  col:C.sage,       op:0.10, rz:0.04 },
    ].forEach((d, i) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(d.w, d.h), mat(d.col, d.op));
      m.position.set(d.x, d.y, 0);
      m.rotation.z = d.rz;
      layers[2].add(m);
      play(m, bobClip(`l2s_${i}`, 0.5, 6 + i, d.y));
    });
    [
      { r:0.8, x:-8, y:4,  col:C.blush,      op:0.35 },
      { r:1.0, x:7,  y:3,  col:C.gold,       op:0.28 },
      { r:0.6, x:3,  y:-4, col:C.terracotta, op:0.32 },
      { r:1.2, x:-5, y:-2, col:C.sage,       op:0.22 },
    ].forEach((d, i) => {
      const m = new THREE.Mesh(new THREE.CircleGeometry(d.r, 28), mat(d.col, d.op));
      m.position.set(d.x, d.y, 0);
      layers[2].add(m);
      play(m, bobClip(`l2c_${i}`, 0.7, 5 + i * 0.8, d.y));
    });

    /* Layer 3 — paintbrush + paint tubes */
    const brush = new THREE.Group();
    brush.position.set(3, -1, 0);
    brush.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 2.8, 10), mat(C.walnut, 0.75)));
    const bFerrul = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.22, 10), mat(new THREE.Color('#b8b8b8'), 0.7));
    bFerrul.position.y = -1.55;
    const bBrist = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.5, 10), mat(C.terracotta, 0.78));
    bBrist.position.y = -2.02;
    brush.add(bFerrul, bBrist);
    layers[3].add(brush);

    play(brush, new THREE.AnimationClip('brush_sweep', 7, [
      new THREE.QuaternionKeyframeTrack('.quaternion', [0, 1.5, 3, 4.5, 7], [
        ...(() => { const q = new THREE.Quaternion(); q.setFromEuler(new THREE.Euler(0, 0, -0.5)); return [q.x, q.y, q.z, q.w]; })(),
        ...(() => { const q = new THREE.Quaternion(); q.setFromEuler(new THREE.Euler(0.2, 0.1, 0.2)); return [q.x, q.y, q.z, q.w]; })(),
        ...(() => { const q = new THREE.Quaternion(); q.setFromEuler(new THREE.Euler(-0.1, -0.1, 0.5)); return [q.x, q.y, q.z, q.w]; })(),
        ...(() => { const q = new THREE.Quaternion(); q.setFromEuler(new THREE.Euler(0.1, 0, -0.1)); return [q.x, q.y, q.z, q.w]; })(),
        ...(() => { const q = new THREE.Quaternion(); q.setFromEuler(new THREE.Euler(0, 0, -0.5)); return [q.x, q.y, q.z, q.w]; })(),
      ]),
      new THREE.VectorKeyframeTrack('.position', [0, 1, 2, 3, 4, 5, 7],
        [3, -1, 0, 4, 0, 0, 2, 1, 0, 0, 0, 0, 1, -2, 0, 3, -1, 0, 3, -1, 0]),
    ]));

    [
      { col:C.terracotta, x:-7, y:3,  dur:4.5 },
      { col:C.gold,       x:8,  y:-4, dur:5.8 },
      { col:C.sage,       x:-3, y:-3, dur:3.8 },
    ].forEach((d, i) => {
      const g = new THREE.Group();
      g.position.set(d.x, d.y, 0);
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.3, 12), mat(d.col, 0.55)));
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.2, 0.22, 12), mat(d.col, 0.45));
      cap.position.y = 0.76;
      g.add(cap);
      layers[3].add(g);
      play(g, rotClip(`tube_${i}`, 'z', true, d.dur));
    });

    /* Layer 4 — foreground ink-splatter particles */
    const sc = document.createElement('canvas');
    sc.width = sc.height = 64;
    const sctx = sc.getContext('2d');
    const sg = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    sg.addColorStop(0, 'rgba(255,255,255,1)');
    sg.addColorStop(0.45, 'rgba(255,255,255,0.5)');
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    sctx.fillStyle = sg; sctx.fillRect(0, 0, 64, 64);
    const spriteTex = new THREE.CanvasTexture(sc);

    const PALETTE = [C.terracotta, C.gold, C.sage, C.charcoal, C.blush];
    const N = 300;
    const pPos   = new Float32Array(N * 3);
    const pCol   = new Float32Array(N * 3);
    const drifts = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pPos[i*3]   = (Math.random() - 0.5) * 42;
      pPos[i*3+1] = (Math.random() - 0.5) * 28;
      pPos[i*3+2] = (Math.random() - 0.5) * 4;
      const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      pCol[i*3] = c.r; pCol[i*3+1] = c.g; pCol[i*3+2] = c.b;
      drifts[i] = (Math.random() - 0.5) * 0.006;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color',    new THREE.BufferAttribute(pCol, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.38, map: spriteTex, vertexColors: true,
      transparent: true, opacity: 0.75,
      blending: THREE.NormalBlending, depthWrite: false, sizeAttenuation: true,
    });
    layers[4].add(new THREE.Points(pGeo, pMat));

    /* Mouse / touch parallax */
    let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
    const onMouseMove = (e) => {
      targetX = (e.clientX / window.innerWidth  - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onTouchMove = (e) => {
      if (!e.touches[0]) return;
      targetX = (e.touches[0].clientX / window.innerWidth  - 0.5) * 2;
      targetY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    let raf;
    const clock = new THREE.Clock();
    const STRENGTH = 2.8;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const delta   = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      currentX += (targetX - currentX) * 0.055;
      currentY += (targetY - currentY) * 0.055;

      layers.forEach((layer, i) => {
        const s = layerSpeeds[i];
        layer.position.x += (currentX * STRENGTH * s - layer.position.x) * 0.08;
        layer.position.y += (-currentY * STRENGTH * s * 0.65 - layer.position.y) * 0.08;
      });

      for (let i = 0; i < N; i++) {
        pPos[i*3+1] += drifts[i];
        if (pPos[i*3+1] >  14) pPos[i*3+1] = -14;
        if (pPos[i*3+1] < -14) pPos[i*3+1] =  14;
      }
      pGeo.attributes.position.needsUpdate = true;
      pMat.opacity = 0.62 + 0.13 * Math.sin(elapsed * 0.45);
      camera.position.z = 18 + Math.sin(elapsed * 0.25) * 0.5;

      mixers.forEach(m => m.update(delta));
      renderer.render(scene, camera);
    };
    tick();

    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      ro.disconnect();
      spriteTex.dispose(); pGeo.dispose(); pMat.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCROLL PARALLAX BACKGROUND
   Like delassus.com — a painted-canvas background image that drifts upward
   more slowly than the page scrolls, creating a layered depth effect.
   Implementation: native scroll listener + requestAnimationFrame, no deps.
═══════════════════════════════════════════════════════════════════════════ */
function ScrollParallaxBg() {
  const bgRef = useRef(null);

  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;

    // Disable on mobile/reduced-motion to save battery and respect preferences
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;

    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          // Background moves at 40% of scroll speed (60% slower) — Delassus-style
          el.style.transform = `translateY(${scrollY * 0.40}px)`;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      ref={bgRef}
      aria-hidden="true"
      className="absolute inset-0 w-full will-change-transform"
      /* Oversized so parallax shift never reveals edges — extend 25% top/bottom */
      style={{ top: '-25%', height: '150%' }}
    >
      {/* Warm linen/canvas texture painted with brand colours — pure CSS, no external image needed */}
      <div
        className="w-full h-full"
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 15% 30%, rgba(199,105,79,0.08) 0%, transparent 65%),
            radial-gradient(ellipse 60% 50% at 85% 70%, rgba(201,169,78,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 80% 60% at 50% 50%, rgba(156,175,136,0.05) 0%, transparent 70%),
            radial-gradient(ellipse 40% 35% at 75% 15%, rgba(232,196,196,0.10) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 20% 80%, rgba(199,105,79,0.06) 0%, transparent 60%),
            #FAF7F2
          `,
        }}
      />
    </div>
  );
}

/* ─── Hero Section ─────────────────────────────────────────────────────────── */
const fadeUp = (delay = 0, duration = 1) => ({
  initial:    { opacity: 0, y: 36 },
  animate:    { opacity: 1, y: 0  },
  transition: { delay, duration, ease: [0.16, 1, 0.3, 1] },
});

export default function HeroSection() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: '100svh', background: '#FAF7F2' }}
    >
      {/* ── Layer 1: CSS scroll-parallax background (moves slow on scroll) ── */}
      <ScrollParallaxBg />

      {/* ── Layer 2: dark-mode background (sits above bg, below Three.js) ── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden dark:block"
        style={{ background: '#1A1814', zIndex: 1 }}
      />

      {/* ── Layer 3: Three.js mouse-parallax art scene ── */}
      <div className="absolute inset-0" style={{ zIndex: 2 }}>
        <ParallaxArtScene />
      </div>

      {/* ── Layer 4: radial vignette to fade scene edges into bg ── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none dark:hidden"
        style={{
          zIndex: 3,
          background: 'radial-gradient(ellipse 82% 68% at 50% 46%, transparent 18%, rgba(250,247,242,0.45) 52%, rgba(250,247,242,0.88) 80%, #FAF7F2 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{
          zIndex: 3,
          background: 'radial-gradient(ellipse 82% 68% at 50% 46%, transparent 18%, rgba(26,24,20,0.48) 52%, rgba(26,24,20,0.9) 80%, #1A1814 100%)',
        }}
      />

      {/* ── Layer 5: bottom fade into next section ── */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 inset-x-0 pointer-events-none dark:hidden"
        style={{ zIndex: 4, height: '140px', background: 'linear-gradient(to bottom, transparent, #FAF7F2)' }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 inset-x-0 pointer-events-none hidden dark:block"
        style={{ zIndex: 4, height: '140px', background: 'linear-gradient(to bottom, transparent, #1A1814)' }}
      />

      {/* ── Layer 6: hero content ── */}
      <div
        className="relative flex flex-col items-center justify-center text-center min-h-[100svh] px-5 sm:px-6"
        style={{ zIndex: 5, paddingTop: 'clamp(96px, 15vw, 128px)', paddingBottom: 'clamp(80px, 12vw, 112px)' }}
      >
        <motion.p {...fadeUp(0.2, 0.9)}
          className="text-[10px] sm:text-[11px] uppercase tracking-[0.32em] sm:tracking-[0.36em] text-charcoal-muted dark:text-[#9A9590] font-medium mb-5 sm:mb-7">
          Where Emotions Find Their Canvas
        </motion.p>

        <motion.h1
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.35 } } }}
          className="font-display text-charcoal dark:text-[#F0EDE8] leading-[1.05] tracking-tight"
          style={{ fontSize: 'clamp(2.8rem, 9.5vw, 96px)' }}
        >
          <span className="block">
            {['Art', 'That'].map(w => (
              <motion.span key={w}
                variants={{ hidden: { opacity: 0, y: 44 }, visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } } }}
                className="inline-block mr-[0.22em] last:mr-0"
              >{w}</motion.span>
            ))}
          </span>
          <span className="block mt-0.5 sm:mt-1">
            {[{ text: 'Speaks', italic: true, accent: true }, { text: 'to' }, { text: 'You' }].map(({ text, italic, accent }) => (
              <motion.span key={text}
                variants={{ hidden: { opacity: 0, y: 44 }, visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } } }}
                className={`inline-block mr-[0.22em] last:mr-0${italic ? ' italic' : ''}${accent ? ' text-terracotta dark:text-[#D4826B]' : ''}`}
              >{text}</motion.span>
            ))}
          </span>
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ delay: 1.0, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 sm:mt-8 h-px w-16 sm:w-20 origin-center"
          style={{ background: 'linear-gradient(90deg, transparent, #c7694f, transparent)' }}
        />

        <motion.p {...fadeUp(1.1, 0.9)}
          className="mt-5 sm:mt-7 text-sm sm:text-base lg:text-lg text-charcoal-muted dark:text-[#9A9590] max-w-[280px] sm:max-w-md leading-relaxed">
          Handcrafted portraits and original artwork that capture your most
          cherished moments. Every brushstroke tells a story — let yours be next.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.28, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full max-w-[280px] sm:max-w-none"
        >
          <Link to="/commission"
            className="w-full sm:w-auto inline-flex items-center justify-center
                       px-7 sm:px-9 py-3.5 rounded-full
                       bg-charcoal dark:bg-[#F0EDE8] text-ivory dark:text-[#1A1814]
                       text-[11px] sm:text-xs uppercase tracking-[0.2em] font-medium
                       transition-all duration-300
                       hover:bg-terracotta hover:text-ivory dark:hover:bg-terracotta dark:hover:text-ivory
                       hover:-translate-y-0.5 hover:shadow-lg hover:shadow-terracotta/20">
            Commission Your Artwork
          </Link>
          <Link to="/shop"
            className="w-full sm:w-auto inline-flex items-center gap-2 justify-center
                       px-7 sm:px-9 py-3.5 rounded-full
                       border-2 border-charcoal/20 dark:border-[#F0EDE8]/20
                       text-charcoal dark:text-[#F0EDE8]
                       text-[11px] sm:text-xs uppercase tracking-[0.2em] font-medium
                       transition-all duration-300
                       hover:border-terracotta/50 hover:text-terracotta">
            Explore Collection
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.55, duration: 0.8 }}
          className="mt-10 sm:mt-16 flex items-center gap-8 sm:gap-14 lg:gap-16"
        >
          {[
            { value: '200+', label: 'Artworks'   },
            { value: '98%',  label: 'Collectors'  },
            { value: '5 ★',  label: 'Rating'      },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-xl sm:text-2xl lg:text-3xl font-display text-charcoal dark:text-[#F0EDE8] leading-none">
                {value}
              </p>
              <p className="mt-1 sm:mt-1.5 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.24em] text-charcoal-muted dark:text-[#9A9590]">
                {label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 2.1, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ zIndex: 5 }}
      >
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-5 h-9 rounded-full border border-charcoal/20 dark:border-[#F0EDE8]/20 flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-2 rounded-full bg-terracotta/50" />
        </motion.div>
        <span className="text-[9px] uppercase tracking-[0.3em] text-charcoal-muted/70 dark:text-[#9A9590]/70">
          Scroll
        </span>
      </motion.div>
    </section>
  );
}
