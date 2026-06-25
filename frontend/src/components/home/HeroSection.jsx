import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════════════════
   PARALLAX DEPTH SCENE  (inspired by threejs.org/examples/#webgl_effects_parallaxbarrier)

   Concept:
   • Objects live on 5 depth layers (z = -20 … 0)
   • Each layer moves at a different speed relative to mouse → strong 3D parallax
   • Layer 0 (back) barely moves; Layer 4 (front) moves the most
   • Art-themed objects: canvas frames, paint circles, brushstrokes, ink dots
   • AnimationMixer keyframe clips give each object its own idle animation
   • On mouse move: all layer groups translate XY at layerSpeed * mouseOffset
═══════════════════════════════════════════════════════════════════════════ */
function ParallaxArtScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    /* ── renderer ── */
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

    /* ── brand colours ── */
    const C = {
      terracotta: new THREE.Color('#c7694f'),
      terraDark:  new THREE.Color('#a85540'),
      gold:       new THREE.Color('#c9a94e'),
      goldMuted:  new THREE.Color('#8f6e3a'),
      sage:       new THREE.Color('#9caf88'),
      sageDark:   new THREE.Color('#7a9a68'),
      charcoal:   new THREE.Color('#3a3a3a'),
      blush:      new THREE.Color('#e8c4c4'),
      walnut:     new THREE.Color('#5c3a1e'),
    };

    /* ── 5 depth layers — each is a THREE.Group ──
       layerSpeeds: how much the layer moves per unit of mouse offset.
       Back layers move slow → front layers move fast = parallax.
    ── */
    const LAYER_COUNT = 5;
    const layerSpeeds = [0.06, 0.14, 0.25, 0.40, 0.60]; // back→front
    const layerZ      = [-16,  -10,  -5,    -2,    0  ];
    const layers      = layerSpeeds.map((_, i) => {
      const g = new THREE.Group();
      g.position.z = layerZ[i];
      scene.add(g);
      return g;
    });

    /* ── AnimationMixer pool ── */
    const mixers = [];
    const play = (obj, clip) => {
      const mx = new THREE.AnimationMixer(obj);
      const ac = mx.clipAction(clip);
      ac.setLoop(THREE.LoopRepeat, Infinity);
      ac.play();
      mixers.push(mx);
    };

    /* ── helper: build a looping bob clip ── */
    const bobClip = (name, ampY, dur, startY = 0) =>
      new THREE.AnimationClip(name, dur, [
        new THREE.VectorKeyframeTrack('.position',
          [0, dur * 0.5, dur],
          [0, startY, 0,  0, startY + ampY, 0,  0, startY, 0])
      ]);

    /* ── helper: build a looping rotation clip ── */
    const rotClip = (name, axis, fullRev, dur) => {
      const q = (a) => {
        const quat = new THREE.Quaternion();
        if (axis === 'z') quat.setFromEuler(new THREE.Euler(0, 0, a));
        if (axis === 'y') quat.setFromEuler(new THREE.Euler(0, a, 0));
        return [quat.x, quat.y, quat.z, quat.w];
      };
      const n = fullRev ? 5 : 3;
      const times  = Array.from({ length: n }, (_, i) => (i / (n-1)) * dur);
      const vals   = times.map((_, i) => q((i / (n-1)) * (fullRev ? Math.PI*2 : Math.PI*0.3))).flat();
      return new THREE.AnimationClip(name, dur, [
        new THREE.QuaternionKeyframeTrack('.quaternion', times, vals)
      ]);
    };

    const mat = (col, op = 1, wire = false) =>
      new THREE.MeshBasicMaterial({ color: col, transparent: op < 1, opacity: op, wireframe: wire });

    /* ══════════════════════════════════════════════════════
       LAYER 0 — far background (z=-16): large faint frames
    ══════════════════════════════════════════════════════ */
    const L0 = layers[0];
    [
      { w:9, h:12, x:-14, y:3,  col:C.terracotta, op:0.06 },
      { w:14,h:9,  x:12,  y:-4, col:C.gold,       op:0.05 },
      { w:7, h:10, x:0,   y:7,  col:C.sage,       op:0.07 },
    ].forEach((d,i) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(d.w, d.h),
        mat(d.col, d.op)
      );
      m.position.set(d.x, d.y, 0);
      L0.add(m);
      play(m, bobClip(`l0_${i}`, 0.8, 9+i*2, d.y));
    });

    /* ══════════════════════════════════════════════════════
       LAYER 1 — deep mid (z=-10): canvas frame outlines
    ══════════════════════════════════════════════════════ */
    const L1 = layers[1];
    [
      { w:5, h:7,  x:-10, y:2,   col:C.terracotta, op:0.18, rz: 0.12 },
      { w:8, h:5,  x:9,   y:-3,  col:C.gold,       op:0.14, rz:-0.08 },
      { w:4, h:6,  x:2,   y:6,   col:C.sage,       op:0.16, rz: 0.05 },
      { w:6, h:4,  x:-7,  y:-6,  col:C.charcoal,   op:0.12, rz:-0.15 },
    ].forEach((d, i) => {
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(d.w, d.h)),
        new THREE.LineBasicMaterial({ color: d.col, transparent: true, opacity: d.op })
      );
      edges.position.set(d.x, d.y, 0);
      edges.rotation.z = d.rz;
      L1.add(edges);
      play(edges, bobClip(`l1_${i}`, 1.0, 7+i*1.5, d.y));
    });

    /* ══════════════════════════════════════════════════════
       LAYER 2 — mid (z=-5): paint palette dabs + brushstroke planes
    ══════════════════════════════════════════════════════ */
    const L2 = layers[2];
    // Brushstroke planes — elongated thin rectangles
    [
      { w:12, h:0.22, x:-4, y:2.5, col:C.terracotta, op:0.14, rz:0.10 },
      { w: 9, h:0.16, x: 5, y:-2,  col:C.gold,       op:0.12, rz:-0.06 },
      { w: 7, h:0.13, x:-6, y:-5,  col:C.sage,       op:0.10, rz: 0.04 },
    ].forEach((d,i) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(d.w, d.h),
        mat(d.col, d.op)
      );
      m.position.set(d.x, d.y, 0);
      m.rotation.z = d.rz;
      L2.add(m);
      play(m, bobClip(`l2s_${i}`, 0.5, 6+i, d.y));
    });
    // Paint circles
    [
      { r:0.8, x:-8,  y:4,  col:C.blush,      op:0.35 },
      { r:1.0, x: 7,  y:3,  col:C.gold,       op:0.28 },
      { r:0.6, x: 3,  y:-4, col:C.terracotta, op:0.32 },
      { r:1.2, x:-5,  y:-2, col:C.sage,       op:0.22 },
    ].forEach((d,i) => {
      const m = new THREE.Mesh(
        new THREE.CircleGeometry(d.r, 28),
        mat(d.col, d.op)
      );
      m.position.set(d.x, d.y, 0);
      L2.add(m);
      play(m, bobClip(`l2c_${i}`, 0.7, 5+i*0.8, d.y));
    });

    /* ══════════════════════════════════════════════════════
       LAYER 3 — near-mid (z=-2): paintbrush + paint tubes
    ══════════════════════════════════════════════════════ */
    const L3 = layers[3];

    // Paintbrush group
    const brush = new THREE.Group();
    brush.position.set(3, -1, 0);
    const bHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.045,2.8,10), mat(C.walnut, 0.75));
    const bFerrul = new THREE.Mesh(new THREE.CylinderGeometry(0.072,0.072,0.22,10), mat(new THREE.Color('#b8b8b8'), 0.7));
    bFerrul.position.y = -1.55;
    const bBrist  = new THREE.Mesh(new THREE.ConeGeometry(0.065,0.5,10), mat(C.terracotta, 0.78));
    bBrist.position.y = -2.02;
    brush.add(bHandle, bFerrul, bBrist);
    L3.add(brush);

    // Brush sweeping keyframe
    play(brush, new THREE.AnimationClip('brush_sweep', 7, [
      new THREE.QuaternionKeyframeTrack('.quaternion', [0,1.5,3,4.5,7], [
        ...(() => { const q=new THREE.Quaternion(); q.setFromEuler(new THREE.Euler(0,0,-0.5)); return[q.x,q.y,q.z,q.w]; })(),
        ...(() => { const q=new THREE.Quaternion(); q.setFromEuler(new THREE.Euler(0.2,0.1, 0.2)); return[q.x,q.y,q.z,q.w]; })(),
        ...(() => { const q=new THREE.Quaternion(); q.setFromEuler(new THREE.Euler(-0.1,-0.1,0.5)); return[q.x,q.y,q.z,q.w]; })(),
        ...(() => { const q=new THREE.Quaternion(); q.setFromEuler(new THREE.Euler(0.1,0,-0.1)); return[q.x,q.y,q.z,q.w]; })(),
        ...(() => { const q=new THREE.Quaternion(); q.setFromEuler(new THREE.Euler(0,0,-0.5)); return[q.x,q.y,q.z,q.w]; })(),
      ]),
      new THREE.VectorKeyframeTrack('.position', [0,1,2,3,4,5,7],
        [3,-1,0, 4,0,0, 2,1,0, 0,0,0, 1,-2,0, 3,-1,0, 3,-1,0]),
    ]));

    // Paint tubes
    [
      { col:C.terracotta, x:-7, y:3,  dur:4.5 },
      { col:C.gold,       x: 8, y:-4, dur:5.8 },
      { col:C.sage,       x:-3, y:-3, dur:3.8 },
    ].forEach((d,i) => {
      const g = new THREE.Group();
      g.position.set(d.x, d.y, 0);
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,1.3,12), mat(d.col, 0.55)));
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.2,0.22,12), mat(d.col, 0.45));
      cap.position.y = 0.76;
      g.add(cap);
      L3.add(g);
      play(g, rotClip(`tube_${i}`, 'z', true, d.dur));
    });

    /* ══════════════════════════════════════════════════════
       LAYER 4 — foreground (z=0): large ink splatter points
    ══════════════════════════════════════════════════════ */
    const L4 = layers[4];
    const sc = document.createElement('canvas');
    sc.width = sc.height = 64;
    const sctx = sc.getContext('2d');
    const sg = sctx.createRadialGradient(32,32,0,32,32,32);
    sg.addColorStop(0,'rgba(255,255,255,1)');
    sg.addColorStop(0.45,'rgba(255,255,255,0.5)');
    sg.addColorStop(1,'rgba(255,255,255,0)');
    sctx.fillStyle = sg; sctx.fillRect(0,0,64,64);
    const spriteTex = new THREE.CanvasTexture(sc);

    const PALETTE = [C.terracotta, C.gold, C.sage, C.charcoal, C.blush];
    const N = 300;
    const pPos = new Float32Array(N*3);
    const pCol = new Float32Array(N*3);
    const drifts = new Float32Array(N);
    for (let i=0; i<N; i++) {
      pPos[i*3]   = (Math.random()-0.5)*42;
      pPos[i*3+1] = (Math.random()-0.5)*28;
      pPos[i*3+2] = (Math.random()-0.5)*4;
      const c = PALETTE[Math.floor(Math.random()*PALETTE.length)];
      pCol[i*3]=c.r; pCol[i*3+1]=c.g; pCol[i*3+2]=c.b;
      drifts[i] = (Math.random()-0.5)*0.006;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color',    new THREE.BufferAttribute(pCol, 3));
    const pMat = new THREE.PointsMaterial({
      size:0.38, map:spriteTex, vertexColors:true,
      transparent:true, opacity:0.75,
      blending:THREE.NormalBlending, depthWrite:false, sizeAttenuation:true,
    });
    const pts = new THREE.Points(pGeo, pMat);
    L4.add(pts);

    /* ── parallax mouse tracking ── */
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    const onMouseMove = (e) => {
      // Normalise -1 → +1
      targetX = (e.clientX / window.innerWidth  - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    // Touch support
    const onTouchMove = (e) => {
      if (!e.touches[0]) return;
      targetX = (e.touches[0].clientX / window.innerWidth  - 0.5) * 2;
      targetY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive:true });

    /* ── RAF loop ── */
    let raf;
    const clock = new THREE.Clock();
    const PARALLAX_STRENGTH = 2.8; // world units at max mouse offset

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const delta   = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth mouse lerp
      currentX += (targetX - currentX) * 0.055;
      currentY += (targetY - currentY) * 0.055;

      // Apply parallax to each layer — deeper layers move less
      layers.forEach((layer, i) => {
        const speed = layerSpeeds[i];
        layer.position.x += (currentX * PARALLAX_STRENGTH * speed - layer.position.x) * 0.08;
        layer.position.y += (-currentY * PARALLAX_STRENGTH * speed * 0.65 - layer.position.y) * 0.08;
      });

      // Drift particles
      for (let i=0; i<N; i++) {
        pPos[i*3+1] += drifts[i];
        if (pPos[i*3+1] > 14) pPos[i*3+1] = -14;
        if (pPos[i*3+1] <-14) pPos[i*3+1] =  14;
      }
      pGeo.attributes.position.needsUpdate = true;
      pMat.opacity = 0.62 + 0.13 * Math.sin(elapsed * 0.45);

      // Subtle camera breathe (z oscillation adds a sense of depth)
      camera.position.z = 18 + Math.sin(elapsed * 0.25) * 0.5;

      // Update all animation mixers
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

/* ─── Hero Section ─────────────────────────────────────────────────────────── */
const fadeUp = (delay = 0, duration = 1) => ({
  initial:    { opacity: 0, y: 36 },
  animate:    { opacity: 1, y: 0  },
  transition: { delay, duration, ease: [0.16, 1, 0.3, 1] },
});

export default function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-ivory dark:bg-[#1A1814]"
             style={{ minHeight: '100svh' }}>

      <ParallaxArtScene />

      {/* Radial vignette — light mode */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none dark:hidden" style={{
        background: 'radial-gradient(ellipse 82% 68% at 50% 46%, transparent 18%, rgba(250,247,242,0.48) 52%, rgba(250,247,242,0.9) 80%, #FAF7F2 100%)',
      }}/>
      {/* Radial vignette — dark mode */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none hidden dark:block" style={{
        background: 'radial-gradient(ellipse 82% 68% at 50% 46%, transparent 18%, rgba(26,24,20,0.48) 52%, rgba(26,24,20,0.9) 80%, #1A1814 100%)',
      }}/>

      {/* Bottom blend — light */}
      <div aria-hidden="true" className="absolute bottom-0 inset-x-0 h-32 pointer-events-none dark:hidden"
        style={{ background: 'linear-gradient(to bottom, transparent, #FAF7F2)' }}/>
      {/* Bottom blend — dark */}
      <div aria-hidden="true" className="absolute bottom-0 inset-x-0 h-32 pointer-events-none hidden dark:block"
        style={{ background: 'linear-gradient(to bottom, transparent, #1A1814)' }}/>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center
                      min-h-[100svh] pt-28 pb-28 px-4 sm:px-6">

        <motion.p {...fadeUp(0.2, 0.9)}
          className="text-[11px] uppercase tracking-[0.36em] text-charcoal-muted dark:text-[#9A9590] font-medium mb-7">
          Where Emotions Find Their Canvas
        </motion.p>

        <motion.h1
          initial="hidden" animate="visible"
          variants={{ hidden:{}, visible:{ transition:{ staggerChildren:0.1, delayChildren:0.35 }}}}
          className="font-display text-charcoal dark:text-[#F0EDE8] leading-[1.06] tracking-tight"
          style={{ fontSize:'clamp(3rem,8vw,92px)' }}
        >
          <span className="block">
            {['Art','That'].map(w => (
              <motion.span key={w}
                variants={{ hidden:{opacity:0,y:44}, visible:{opacity:1,y:0,transition:{duration:1,ease:[0.16,1,0.3,1]}}}}
                className="inline-block mr-[0.22em] last:mr-0">{w}</motion.span>
            ))}
          </span>
          <span className="block mt-1">
            {[{text:'Speaks',italic:true,accent:true},{text:'to'},{text:'You'}].map(({text,italic,accent})=>(
              <motion.span key={text}
                variants={{ hidden:{opacity:0,y:44}, visible:{opacity:1,y:0,transition:{duration:1,ease:[0.16,1,0.3,1]}}}}
                className={`inline-block mr-[0.22em] last:mr-0 ${italic?'italic':''} ${accent?'text-terracotta dark:text-[#D4826B]':''}`}>{text}</motion.span>
            ))}
          </span>
        </motion.h1>

        <motion.div initial={{scaleX:0}} animate={{scaleX:1}}
          transition={{delay:1.0,duration:1.1,ease:[0.16,1,0.3,1]}}
          className="mt-8 h-px w-20 origin-center"
          style={{background:'linear-gradient(90deg,transparent,#c7694f,transparent)'}}/>

        <motion.p {...fadeUp(1.1, 0.9)}
          className="mt-7 text-base sm:text-lg text-charcoal-muted dark:text-[#9A9590] max-w-md leading-relaxed">
          Handcrafted portraits and original artwork that capture your most
          cherished moments. Every brushstroke tells a story — let yours be next.
        </motion.p>

        <motion.div initial={{opacity:0,y:22}} animate={{opacity:1,y:0}}
          transition={{delay:1.28,duration:0.9,ease:[0.16,1,0.3,1]}}
          className="mt-10 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <Link to="/commission"
            className="inline-flex items-center justify-center px-9 py-3.5 rounded-full
                       bg-charcoal dark:bg-[#F0EDE8] text-ivory dark:text-[#1A1814]
                       text-xs uppercase tracking-[0.22em] font-medium
                       transition-all duration-300
                       hover:bg-terracotta hover:text-ivory dark:hover:bg-terracotta dark:hover:text-ivory
                       hover:-translate-y-0.5 hover:shadow-lg hover:shadow-terracotta/20">
            Commission Your Artwork
          </Link>
          <Link to="/shop"
            className="inline-flex items-center gap-2 justify-center px-9 py-3.5 rounded-full
                       border-2 border-charcoal/18 dark:border-[#F0EDE8]/20
                       text-charcoal dark:text-[#F0EDE8]
                       text-xs uppercase tracking-[0.22em] font-medium
                       transition-all duration-300
                       hover:border-terracotta/50 hover:text-terracotta">
            Explore Collection
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </Link>
        </motion.div>

        <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}}
          transition={{delay:1.55,duration:0.8}}
          className="mt-16 flex items-center gap-10 sm:gap-16">
          {[{value:'200+',label:'Artworks'},{value:'98%',label:'Happy Collectors'},{value:'5 ★',label:'Rating'}].map(({value,label})=>(
            <div key={label} className="text-center">
              <p className="text-2xl sm:text-3xl font-display text-charcoal dark:text-[#F0EDE8] leading-none">{value}</p>
              <p className="mt-1.5 text-[10px] uppercase tracking-[0.24em] text-charcoal-muted dark:text-[#9A9590]">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div initial={{opacity:0}} animate={{opacity:1}}
        transition={{delay:2.1,duration:1}}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
        <motion.div animate={{y:[0,7,0]}} transition={{duration:2.4,repeat:Infinity,ease:'easeInOut'}}
          className="w-5 h-9 rounded-full border border-charcoal/20 dark:border-[#F0EDE8]/20
                     flex items-start justify-center pt-1.5">
          <div className="w-1 h-2 rounded-full bg-terracotta/50"/>
        </motion.div>
        <span className="text-[9px] uppercase tracking-[0.3em] text-charcoal-muted/70 dark:text-[#9A9590]/70">Scroll</span>
      </motion.div>
    </section>
  );
}
