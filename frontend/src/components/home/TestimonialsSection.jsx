import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import * as THREE from 'three';

/* ══════════════════════════════════════════════════════════════════════
   Three.js background for testimonials — floating low-poly ink fragments,
   brushstroke planes, and paint-splatter particles drifting through the scene.
   Responds to mouse movement with gentle parallax.
══════════════════════════════════════════════════════════════════════ */
function TestimonialsScene({ containerRef }) {
  useEffect(() => {
    const mount = containerRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    const canvas = renderer.domElement;
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';
    mount.appendChild(canvas);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 8;

    const resize = () => {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || 600;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();

    const mm = (col, op = 1) =>
      new THREE.MeshBasicMaterial({ color: col, transparent: op < 1, opacity: op });

    /* ── Brushstroke planes — elongated thin quads at various angles ── */
    const strokes = [
      { w:5.5, h:0.14, x:-5,   y: 1.8, rz: 0.10, col:0xc7694f, op:0.18 },
      { w:4.0, h:0.11, x: 3.5, y:-1.2, rz:-0.07, col:0xc9a94e, op:0.14 },
      { w:6.5, h:0.10, x:-2,   y:-2.8, rz: 0.05, col:0x9caf88, op:0.12 },
      { w:3.0, h:0.13, x: 5,   y: 2.5, rz:-0.14, col:0xc7694f, op:0.10 },
      { w:4.5, h:0.09, x:-6,   y:-0.5, rz: 0.08, col:0xc9a94e, op:0.10 },
    ];
    const strokeMeshes = strokes.map(s => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(s.w, s.h), mm(s.col, s.op));
      m.position.set(s.x, s.y, -1); m.rotation.z = s.rz;
      scene.add(m);
      return { m, baseX: s.x, baseY: s.y };
    });

    /* ── Low-poly ink fragments — small icosahedra ── */
    const inkCols = [0xc7694f, 0xc9a94e, 0x9caf88, 0x4a3728, 0xe8c4c4];
    const fragments = Array.from({ length: 18 }, (_, i) => {
      const geo = new THREE.IcosahedronGeometry(0.10 + Math.random() * 0.12, 0);
      const mesh = new THREE.Mesh(geo, mm(inkCols[i % inkCols.length], 0.22 + Math.random() * 0.18));
      const x = (Math.random() - 0.5) * 16;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 3 - 0.5;
      mesh.position.set(x, y, z);
      mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
      scene.add(mesh);
      return { mesh, baseX: x, baseY: y, spd: 0.2 + Math.random() * 0.4, phase: Math.random() * Math.PI * 2, rotSpd: (Math.random()-0.5)*0.6 };
    });

    /* ── Particle splatter ── */
    const spCanvas = document.createElement('canvas'); spCanvas.width = spCanvas.height = 32;
    const spCtx = spCanvas.getContext('2d'), spG = spCtx.createRadialGradient(16,16,0,16,16,16);
    spG.addColorStop(0,'rgba(255,255,255,1)'); spG.addColorStop(0.5,'rgba(255,255,255,0.4)'); spG.addColorStop(1,'rgba(255,255,255,0)');
    spCtx.fillStyle = spG; spCtx.fillRect(0,0,32,32);
    const spTex = new THREE.CanvasTexture(spCanvas);

    const N = 120, pPos = new Float32Array(N*3), pCol = new Float32Array(N*3), drifts = new Float32Array(N);
    const PCOLS = [new THREE.Color(0xc7694f), new THREE.Color(0xc9a94e), new THREE.Color(0x9caf88)];
    for (let i = 0; i < N; i++) {
      pPos[i*3]   = (Math.random()-0.5)*18; pPos[i*3+1] = (Math.random()-0.5)*12; pPos[i*3+2] = (Math.random()-0.5)*4;
      const c = PCOLS[i % PCOLS.length]; pCol[i*3]=c.r; pCol[i*3+1]=c.g; pCol[i*3+2]=c.b;
      drifts[i] = (Math.random()-0.5)*0.005;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color',    new THREE.BufferAttribute(pCol, 3));
    const pMat = new THREE.PointsMaterial({ size:0.22, map:spTex, vertexColors:true, transparent:true, opacity:0.55, blending:THREE.NormalBlending, depthWrite:false, sizeAttenuation:true });
    scene.add(new THREE.Points(pGeo, pMat));

    /* ── Mouse parallax ── */
    let tX = 0, tY = 0, cX = 0, cY = 0;
    const onMove = e => { tX=(e.clientX/window.innerWidth-0.5)*2; tY=-(e.clientY/window.innerHeight-0.5)*2; };
    window.addEventListener('mousemove', onMove);

    let raf; const clock = new THREE.Clock();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = clock.getDelta(), el = clock.getElapsedTime();
      cX += (tX - cX) * 0.04; cY += (tY - cY) * 0.04;

      // Drift particles
      for (let i = 0; i < N; i++) {
        pPos[i*3+1] += drifts[i];
        if (pPos[i*3+1] > 6) pPos[i*3+1] = -6;
        if (pPos[i*3+1] < -6) pPos[i*3+1] = 6;
      }
      pGeo.attributes.position.needsUpdate = true;
      pMat.opacity = 0.45 + 0.1 * Math.sin(el * 0.3);

      // Bob fragments
      fragments.forEach(f => {
        f.mesh.position.y = f.baseY + Math.sin(el * f.spd + f.phase) * 0.18;
        f.mesh.position.x = f.baseX + Math.cos(el * f.spd * 0.7 + f.phase) * 0.06;
        f.mesh.rotation.y += dt * f.rotSpd;
        f.mesh.rotation.z += dt * f.rotSpd * 0.5;
      });

      // Parallax
      strokeMeshes.forEach((s, i) => {
        const spd = 0.04 + i * 0.015;
        s.m.position.x = s.baseX + cX * spd * 2;
        s.m.position.y = s.baseY + cY * spd;
      });
      camera.position.x += (cX * 0.3 - camera.position.x) * 0.05;
      camera.position.y += (cY * 0.2 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    tick();

    const ro = new ResizeObserver(resize); ro.observe(mount);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      ro.disconnect();
      spTex.dispose(); pGeo.dispose(); pMat.dispose(); renderer.dispose();
      if (mount.contains(canvas)) mount.removeChild(canvas);
    };
  }, []); // eslint-disable-line
  return null;
}

/* ── Star rating ── */
function Stars({ n = 5 }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: n }).map((_, i) => (
        <svg key={i} className="w-3.5 h-3.5 text-gold" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialsSection({ testimonials }) {
  const containerRef = useRef(null);

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden bg-[#1A1208] dark:bg-[#0d0b08]">
      {/* Three.js background */}
      <div ref={containerRef} className="absolute inset-0" aria-hidden="true">
        <TestimonialsScene containerRef={containerRef} />
      </div>

      {/* Vignette overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 85% 70% at 50% 50%, transparent 30%, rgba(26,18,8,0.6) 70%, rgba(26,18,8,0.92) 100%)',
      }} aria-hidden="true" />

      <div className="relative z-10 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.9, ease: [0.16,1,0.3,1] }}
          className="text-center mb-16 sm:mb-20"
        >
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-white/35 font-medium">Kind Words</span>
          <h2 className="mt-4 font-display text-white leading-tight" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            What Collectors <span className="italic text-terracotta-light" style={{ color: '#E09A85' }}>Say</span>
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.12, duration: 0.85, ease: [0.16,1,0.3,1] }}
              className="relative p-6 sm:p-8 rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              {/* Quote mark */}
              <div className="absolute -top-2 -left-1 font-display text-[80px] leading-none pointer-events-none select-none"
                style={{ color: 'rgba(199,105,79,0.15)', fontStyle: 'italic' }}>"</div>

              <Stars n={t.rating} />
              <p className="mt-4 text-[13px] sm:text-sm leading-relaxed italic"
                style={{ color: 'rgba(255,255,255,0.72)' }}>
                "{t.text}"
              </p>
              <div className="mt-6 pt-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
                <div className="flex items-center gap-3">
                  {/* Avatar placeholder */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{ background: `hsl(${i*60+20},40%,50%)`, color: 'white' }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.88)' }}>{t.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{t.type}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
