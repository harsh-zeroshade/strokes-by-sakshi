import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';

/* ══════════════════════════════════════════════════════════════════════════
   COLLECTIONS CONFIG — adapted from Delassus PRODUCTS pattern
   Each collection has: bg color, accent color, title, 3D art objects
══════════════════════════════════════════════════════════════════════════ */
const COLLECTIONS = [
  {
    name: 'Portraits',
    bg: '#C7694F',          // terracotta
    accent: '#E8A87C',
    objects: [
      { fn: 'makeCanvas',   x: -0.08, y: 0.20, z: 0,    s: 1.30, ry: 0,    bob: 1.0, bspd: 0.50, bph: 0    },
      { fn: 'makePalette',  x: -0.50, y:-0.08, z: 0.18, s: 0.90, ry: 0.4,  bob: 0.9, bspd: 0.68, bph: 1.3  },
      { fn: 'makeBrush',    x:  0.50, y:-0.05, z:-0.08, s: 1.00, ry:-0.3,  bob: 1.1, bspd: 0.58, bph: 0.7  },
    ],
  },
  {
    name: 'Landscapes',
    bg: '#9CAF88',          // sage
    accent: '#7A9A68',
    objects: [
      { fn: 'makeCanvas',   x: -0.08, y: 0.22, z: 0,    s: 1.35, ry: 0,    bob: 1.0, bspd: 0.50, bph: 0    },
      { fn: 'makeInkDrop',  x: -0.52, y:-0.04, z: 0.15, s: 1.05, ry: 0.3,  bob: 0.9, bspd: 0.65, bph: 1.2  },
      { fn: 'makeBrush',    x:  0.52, y:-0.06, z:-0.05, s: 1.10, ry:-0.3,  bob: 1.2, bspd: 0.55, bph: 0.5  },
      { fn: 'makePalette',  x: -0.28, y:-0.36, z: 0.28, s: 0.55, ry: 0,    bob: 0.7, bspd: 0.90, bph: 2.1  },
    ],
  },
  {
    name: 'Abstract',
    bg: '#4A3728',          // deep walnut
    accent: '#C9A94E',
    objects: [
      { fn: 'makeInkDrop',  x: -0.08, y: 0.20, z: 0,    s: 1.30, ry: 0,    bob: 0.9, bspd: 0.50, bph: 0    },
      { fn: 'makeCanvas',   x: -0.50, y:-0.05, z: 0.18, s: 0.80, ry: 0.6,  bob: 1.1, bspd: 0.70, bph: 1.0  },
      { fn: 'makePalette',  x:  0.50, y:-0.04, z:-0.10, s: 0.95, ry:-0.5,  bob: 0.8, bspd: 0.60, bph: 1.8  },
    ],
  },
  {
    name: 'Commissions',
    bg: '#2C2C2C',          // charcoal
    accent: '#C7694F',
    objects: [
      { fn: 'makeBrush',    x: -0.08, y: 0.20, z: 0,    s: 1.30, ry: 0,    bob: 1.0, bspd: 0.50, bph: 0    },
      { fn: 'makeCanvas',   x: -0.50, y:-0.05, z: 0.18, s: 0.90, ry: 0.4,  bob: 0.85,bspd: 0.70, bph: 1.4  },
      { fn: 'makeInkDrop',  x:  0.50, y:-0.03, z:-0.10, s: 0.80, ry:-0.3,  bob: 1.1, bspd: 0.60, bph: 0.6  },
    ],
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   3D OBJECT MAKERS — art-themed low-poly geometry
══════════════════════════════════════════════════════════════════════════ */
function flatMat(color, opts = {}) {
  return new THREE.MeshLambertMaterial({ color, flatShading: true, ...opts });
}
function jitColor(r, g, b, amount = 0.06) {
  const j = () => (Math.random() - 0.5) * amount;
  return [r + j(), g + j(), b + j()];
}

/* Canvas frame with a painted surface */
function makeCanvas() {
  const g = new THREE.Group();
  // Frame
  const frameGeo = new THREE.BoxGeometry(1.1, 1.4, 0.06);
  const frameColors = []; const fp = frameGeo.attributes.position;
  for (let i = 0; i < fp.count / 3; i++) {
    const c = jitColor(0.36, 0.22, 0.14, 0.04);
    for (let j = 0; j < 3; j++) frameColors.push(...c);
  }
  frameGeo.setAttribute('color', new THREE.Float32BufferAttribute(frameColors, 3));
  g.add(new THREE.Mesh(frameGeo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })));
  // Canvas surface
  const surfGeo = new THREE.PlaneGeometry(0.92, 1.22, 4, 5);
  const surfColors = []; const sp = surfGeo.attributes.position;
  const palette = [[0.97,0.93,0.88],[0.78,0.38,0.22],[0.79,0.67,0.30],[0.61,0.69,0.53]];
  for (let i = 0; i < sp.count / 3; i++) {
    const c = palette[i % palette.length];
    for (let j = 0; j < 3; j++) surfColors.push(...jitColor(c[0],c[1],c[2],0.06));
  }
  surfGeo.setAttribute('color', new THREE.Float32BufferAttribute(surfColors, 3));
  const surf = new THREE.Mesh(surfGeo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  surf.position.z = 0.05;
  g.add(surf);
  return g;
}

/* Paint palette */
function makePalette() {
  const g = new THREE.Group();
  const geo = new THREE.CylinderGeometry(0.52, 0.52, 0.06, 7);
  // flatten one side for thumb hole
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    if (x < -0.28) pos.setX(i, x * 0.55);
    if (x < -0.28) pos.setZ(i, z * 0.80);
  }
  geo.computeVertexNormals();
  const colors = [];
  for (let i = 0; i < pos.count / 3; i++) {
    const c = jitColor(0.96, 0.94, 0.88, 0.04);
    for (let j = 0; j < 3; j++) colors.push(...c);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })));
  // Paint dabs
  const dabs = [
    [0.22, 0.04, 0.12, 0.78, 0.38, 0.22],
    [-0.10, 0.04, 0.32, 0.79, 0.67, 0.30],
    [0.10, 0.04,-0.28, 0.61, 0.69, 0.53],
    [0.30, 0.04,-0.10, 0.79, 0.52, 0.28],
    [-0.28, 0.04, 0.05, 0.38, 0.30, 0.62],
  ];
  dabs.forEach(([dx, dy, dz, r, gr, b]) => {
    const dg = new THREE.SphereGeometry(0.09, 4, 4);
    const dc = []; const dp = dg.attributes.position;
    for (let i = 0; i < dp.count / 3; i++) {
      for (let j = 0; j < 3; j++) dc.push(...jitColor(r, gr, b, 0.05));
    }
    dg.setAttribute('color', new THREE.Float32BufferAttribute(dc, 3));
    const dm = new THREE.Mesh(dg, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
    dm.position.set(dx, dy, dz); dm.scale.y = 0.35;
    g.add(dm);
  });
  g.rotation.x = -0.3;
  return g;
}

/* Paintbrush */
function makeBrush() {
  const g = new THREE.Group();
  // Handle
  const hGeo = new THREE.CylinderGeometry(0.045, 0.055, 1.8, 6);
  const hColors = []; const hp = hGeo.attributes.position;
  for (let i = 0; i < hp.count / 3; i++) {
    for (let j = 0; j < 3; j++) hColors.push(...jitColor(0.60, 0.36, 0.15, 0.05));
  }
  hGeo.setAttribute('color', new THREE.Float32BufferAttribute(hColors, 3));
  g.add(new THREE.Mesh(hGeo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })));
  // Ferrule
  const ferGeo = new THREE.CylinderGeometry(0.058, 0.058, 0.18, 6);
  g.add(new THREE.Mesh(ferGeo, flatMat(0xb8b8b8)));
  const fer = g.children[g.children.length - 1]; fer.position.y = -0.96;
  // Bristle
  const brGeo = new THREE.ConeGeometry(0.055, 0.45, 6);
  const brColors = []; const brp = brGeo.attributes.position;
  for (let i = 0; i < brp.count / 3; i++) {
    for (let j = 0; j < 3; j++) brColors.push(...jitColor(0.78, 0.38, 0.22, 0.06));
  }
  brGeo.setAttribute('color', new THREE.Float32BufferAttribute(brColors, 3));
  const br = new THREE.Mesh(brGeo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  br.position.y = -1.30; br.rotation.x = Math.PI;
  g.add(br);
  g.rotation.z = 0.35;
  return g;
}

/* Ink drop / splash */
function makeInkDrop() {
  const g = new THREE.Group();
  // Main drop (icosahedron)
  const dGeo = new THREE.IcosahedronGeometry(0.52, 1);
  const pos = dGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    pos.setY(i, y * (y > 0 ? 1.25 : 0.75)); // teardrop shape
  }
  dGeo.computeVertexNormals();
  const dColors = [];
  const inkPalette = [[0.17,0.10,0.06],[0.14,0.08,0.05],[0.20,0.12,0.07]];
  for (let i = 0; i < pos.count / 3; i++) {
    const c = inkPalette[i % inkPalette.length];
    for (let j = 0; j < 3; j++) dColors.push(...jitColor(c[0],c[1],c[2],0.03));
  }
  dGeo.setAttribute('color', new THREE.Float32BufferAttribute(dColors, 3));
  g.add(new THREE.Mesh(dGeo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })));
  // Splash ring
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const sGeo = new THREE.SphereGeometry(0.06 + Math.random() * 0.04, 4, 4);
    const sm = new THREE.Mesh(sGeo, flatMat(0x2a1a0f));
    const r = 0.62 + Math.random() * 0.12;
    sm.position.set(Math.cos(a) * r, -0.28 + Math.random() * 0.1, Math.sin(a) * r);
    g.add(sm);
  }
  return g;
}

const MAKERS = { makeCanvas, makePalette, makeBrush, makeInkDrop };

/* ══════════════════════════════════════════════════════════════════════════
   HERO SECTION
══════════════════════════════════════════════════════════════════════════ */
export default function HeroSection() {
  const canvasRef   = useRef(null);
  const sectionRef  = useRef(null);
  const [activeIdx, setActiveIdx]   = useState(0);
  const [title,     setTitle]       = useState(COLLECTIONS[0].name);
  const [titleState, setTitleState] = useState('in'); // 'in' | 'out'
  const [menuOpen,  setMenuOpen]    = useState(false);

  /* Three.js state stored in refs so they survive re-renders */
  const threeRef = useRef({
    renderer: null, scene: null, camera: null,
    groups: [], outGroups: [],
    transitioning: false, transStart: 0,
    mouseX: 0, mouseY: 0, tMX: 0, tMY: 0,
    currentIdx: 0, rafId: null,
  });

  /* ── INIT THREE.JS ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const t = threeRef.current;

    t.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    t.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    t.renderer.setClearColor(0x000000, 0);

    t.scene = new THREE.Scene();
    t.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    t.camera.position.set(0, 0, 5);

    // Lights
    t.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(3, 5, 4); t.scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.25);
    dir2.position.set(-4, -2, 2); t.scene.add(dir2);

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      t.renderer.setSize(w, h, false);
      t.camera.aspect = w / h;
      t.camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Mouse parallax
    const onMove = e => {
      t.tMX = (e.clientX / window.innerWidth - 0.5) * 2;
      t.tMY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onTouch = e => {
      if (!e.touches[0]) return;
      t.tMX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
      t.tMY = -(e.touches[0].clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onTouch, { passive: true });

    // Build initial group
    buildGroup(0);

    // Animate loop
    const clock = new THREE.Clock();
    const tick = () => {
      t.rafId = requestAnimationFrame(tick);
      const dt = clock.getDelta();
      const el = clock.getElapsedTime();

      // Smooth mouse
      t.mouseX += (t.tMX - t.mouseX) * 0.05;
      t.mouseY += (t.tMY - t.mouseY) * 0.05;

      // Transition easing
      let tProg = 1;
      if (t.transitioning) {
        const raw = Math.min(1, (performance.now() - t.transStart) / 900);
        tProg = raw < 0.5 ? 4*raw*raw*raw : (raw-1)*(2*raw-2)*(2*raw-2)+1;
        if (tProg >= 1) {
          t.transitioning = false;
          t.outGroups.forEach(gd => t.scene.remove(gd.group));
          t.outGroups = [];
        }
      }

      // Fade out old groups
      t.outGroups.forEach(gd => {
        gd.fruits.forEach(f => { f.mesh.position.y = f.baseY + tProg * 1.8; });
        gd.group.traverse(o => { if (o.material) { o.material.transparent = true; o.material.opacity = 1 - tProg; } });
      });

      // Animate active groups
      t.groups.forEach(gd => {
        gd.fruits.forEach(f => {
          const bobY = Math.sin(el * f.bspd + f.bph) * f.bob * 0.12;
          f.mesh.position.y = f.baseY + bobY;
          f.mesh.rotation.y += dt * 0.18;
        });
        gd.group.rotation.x = t.mouseY * 0.04;
        gd.group.rotation.y = t.mouseX * 0.06;
        if (t.transitioning) {
          gd.group.traverse(o => { if (o.material) { o.material.transparent = true; o.material.opacity = tProg; } });
        } else {
          gd.group.traverse(o => { if (o.material) { o.material.transparent = false; o.material.opacity = 1; } });
        }
      });

      t.renderer.render(t.scene, t.camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(t.rafId);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onTouch);
      ro.disconnect();
      t.renderer.dispose();
    };
  }, []); // eslint-disable-line

  /* ── BUILD GROUP ── */
  const buildGroup = useCallback((idx) => {
    const t = threeRef.current;
    if (!t.scene) return;
    const col = COLLECTIONS[idx];
    const group = new THREE.Group();
    const fruits = [];
    col.objects.forEach(obj => {
      const maker = MAKERS[obj.fn];
      if (!maker) return;
      const mesh = maker();
      const W = (t.camera.aspect || 1.6) * 2;
      mesh.position.set(obj.x * W, obj.y * 2, obj.z);
      mesh.scale.setScalar(obj.s);
      mesh.rotation.y = obj.ry;
      group.add(mesh);
      fruits.push({ mesh, bob: obj.bob, bspd: obj.bspd, bph: obj.bph, baseY: obj.y * 2 });
    });
    t.scene.add(group);
    t.groups = [{ group, fruits }];
    return { group, fruits };
  }, []);

  /* ── SWITCH COLLECTION ── */
  const switchTo = useCallback((idx) => {
    const t = threeRef.current;
    if (idx === t.currentIdx) return;

    // Title swap animation
    setTitleState('out');
    setTimeout(() => {
      setTitle(COLLECTIONS[idx].name);
      setTitleState('in');
    }, 270);

    // 3D transition
    t.outGroups = [...t.groups];
    t.groups = [];
    const nd = buildGroup(idx);
    // Start new group invisible, shifted below
    nd.fruits.forEach(f => { f.mesh.position.y = f.baseY - 1.4; });
    nd.group.traverse(o => { if (o.material) { o.material.transparent = true; o.material.opacity = 0; } });
    t.groups = [nd];
    t.transitioning = true;
    t.transStart = performance.now();
    t.currentIdx = idx;
    setActiveIdx(idx);
  }, [buildGroup]);

  /* ── AUTO CYCLE ── */
  const autoCycleRef = useRef(null);
  const resetCycle = useCallback(() => {
    if (autoCycleRef.current) clearInterval(autoCycleRef.current);
    autoCycleRef.current = setInterval(() => {
      const t = threeRef.current;
      switchTo((t.currentIdx + 1) % COLLECTIONS.length);
    }, 4500);
  }, [switchTo]);

  useEffect(() => {
    resetCycle();
    return () => clearInterval(autoCycleRef.current);
  }, [resetCycle]);

  /* ── KEYBOARD ── */
  useEffect(() => {
    const onKey = e => {
      const t = threeRef.current;
      if (e.key === 'Escape') setMenuOpen(false);
      if (e.key === 'ArrowRight') { switchTo((t.currentIdx + 1) % COLLECTIONS.length); resetCycle(); }
      if (e.key === 'ArrowLeft')  { switchTo((t.currentIdx + COLLECTIONS.length - 1) % COLLECTIONS.length); resetCycle(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [switchTo, resetCycle]);

  const col = COLLECTIONS[activeIdx];

  return (
    <>
      {/* ══════════════════════════════════════════════════════════
          HERO — full viewport, bg color transitions per collection
      ══════════════════════════════════════════════════════════ */}
      <section
        ref={sectionRef}
        className="relative overflow-hidden"
        style={{
          position: 'fixed', inset: 0, zIndex: 1,
          backgroundColor: col.bg,
          transition: 'background-color 0.85s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Three.js canvas */}
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />

        {/* ── NAVBAR ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '28px 32px 0',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 400, color: 'white', letterSpacing: '-0.3px', lineHeight: 1 }}>
                Strokes
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                {/* 3×3 dot grid — exact Delassus pattern */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 4px)', gap: '2.5px', marginTop: 1 }}>
                  {[...Array(9)].map((_, i) => (
                    <div key={i} style={{ width: 4, height: 4, background: 'white', borderRadius: '50%' }} />
                  ))}
                </div>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 300, color: 'white', letterSpacing: '0.5px', lineHeight: 1 }}>
                  by Sakshi
                </span>
              </div>
              {/* Badge */}
              <div style={{ marginTop: 8, border: '1px solid rgba(255,255,255,0.5)', borderRadius: 2, padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <svg width="11" height="11" viewBox="0 0 20 20" fill="white" opacity="0.8"><polygon points="10,2 18,7 18,13 10,18 2,13 2,7"/></svg>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, color: 'rgba(255,255,255,0.8)', letterSpacing: '1.5px', fontStyle: 'italic' }}>India</span>
              </div>
            </Link>
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginTop: 2, display: 'flex', flexDirection: 'column', gap: 5 }}
          >
            {[0,1,2].map(i => (
              <span key={i} style={{ display: 'block', width: 26, height: 1, background: 'white' }} />
            ))}
          </button>
        </div>

        {/* ── BIG TITLE ── */}
        <div
          style={{
            position: 'absolute',
            top: '42%', left: '42%',
            transform: 'translate(-40%, -52%)',
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(72px, 12vw, 160px)',
            fontWeight: 300,
            color: 'white',
            letterSpacing: '-2px',
            lineHeight: 1,
            pointerEvents: 'none',
            zIndex: 20,
            whiteSpace: 'nowrap',
            opacity: titleState === 'out' ? 0 : 1,
            transform: titleState === 'out'
              ? 'translate(-40%, -52%) translateY(14px)'
              : 'translate(-40%, -52%) translateY(0px)',
            transition: titleState === 'out'
              ? 'opacity 0.25s ease, transform 0.25s ease'
              : 'opacity 0.45s ease, transform 0.45s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {title}
        </div>

        {/* ── COLLECTION TABS — bottom center ── */}
        <div
          onClick={resetCycle}
          style={{
            position: 'absolute', bottom: 56, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 50,
          }}
        >
          {COLLECTIONS.map((c, i) => (
            <button
              key={c.name}
              onClick={() => switchTo(i)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: i === activeIdx ? 'white' : 'rgba(255,255,255,0.55)',
                fontFamily: "'Inter', sans-serif",
                fontSize: 13, fontWeight: 400, letterSpacing: '0.3px',
                padding: '6px 20px 8px',
                position: 'relative',
                transition: 'color 0.3s',
                userSelect: 'none', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (i !== activeIdx) e.currentTarget.style.color = 'rgba(255,255,255,0.88)'; }}
              onMouseLeave={e => { if (i !== activeIdx) e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
            >
              {c.name}
              {/* Active underline */}
              <span style={{
                position: 'absolute', bottom: 0, left: 20, right: 20,
                height: '1.5px', background: 'white', borderRadius: 1,
                transform: i === activeIdx ? 'scaleX(1)' : 'scaleX(0)',
                transformOrigin: 'center',
                transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </button>
          ))}
        </div>

        {/* ── DISCOVER / BROWSE BUTTON ── */}
        <Link
          to="/shop"
          style={{
            position: 'absolute', right: 52, bottom: 46, zIndex: 50,
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '15px 28px',
            fontFamily: "'Inter', sans-serif",
            fontSize: 13, fontWeight: 500, letterSpacing: '0.5px',
            color: '#1a1a1a',
            backgroundColor: col.accent,
            textDecoration: 'none', border: 'none', cursor: 'pointer',
            transition: 'background-color 0.6s ease, transform 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateX(5px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
        >
          Browse Collection
          <span style={{ fontSize: 17, transition: 'transform 0.25s' }}>→</span>
        </Link>

        {/* ── FOOTER BAR ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '0 32px 18px', zIndex: 50,
          display: 'flex', alignItems: 'center', gap: 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/about" style={{ color: 'white', fontSize: 11, fontWeight: 400, letterSpacing: '1.5px', textDecoration: 'none', opacity: 1, fontFamily: "'Inter', sans-serif", textTransform: 'uppercase', borderBottom: '1.5px solid white', paddingBottom: 1 }}>About</Link>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>·</span>
            <Link to="/contact" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 400, letterSpacing: '1.5px', textDecoration: 'none', fontFamily: "'Inter', sans-serif", textTransform: 'uppercase' }}>Contact</Link>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link to="/commission" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, letterSpacing: '0.5px', textDecoration: 'none', fontFamily: "'Inter', sans-serif" }}>Commission</Link>
            <Link to="/gallery" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, letterSpacing: '0.5px', textDecoration: 'none', fontFamily: "'Inter', sans-serif" }}>Gallery</Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FULL-SCREEN MENU OVERLAY — clip-path wipe animation
      ══════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 800,
          background: '#0d0d0d',
          clipPath: menuOpen ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)',
          transition: 'clip-path 0.6s cubic-bezier(0.77,0,0.18,1)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Menu top */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '28px 32px 0' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 400, color: 'white', letterSpacing: '-0.3px' }}>
            Strokes<br/>
            <span style={{ fontSize: 13, letterSpacing: 2, opacity: 0.5, fontFamily: "'Inter', sans-serif", fontWeight: 300 }}>by Sakshi</span>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Inter', sans-serif", opacity: 0.6, display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
          >
            <span>Close Menu</span>
            <span style={{ fontSize: 18, lineHeight: 1 }}>✕</span>
          </button>
        </div>

        {/* Menu links */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 80px' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { num: '01.', label: 'Shop',       path: '/shop'       },
              { num: '02.', label: 'Commission', path: '/commission' },
              { num: '03.', label: 'Gallery',    path: '/gallery'    },
              { num: '04.', label: 'About',      path: '/about'      },
              { num: '05.', label: 'Contact',    path: '/contact'    },
            ].map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(38px, 5.5vw, 68px)',
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.22)',
                  textDecoration: 'none',
                  letterSpacing: '-1px',
                  lineHeight: 1.25,
                  display: 'flex', alignItems: 'baseline', gap: 16,
                  transition: 'color 0.25s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.22)'}
              >
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 400, letterSpacing: 2, color: 'rgba(255,255,255,0.3)' }}>{item.num}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Menu bottom */}
        <div style={{ padding: '0 80px 44px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Instagram', href: 'https://instagram.com/strokesbysakshi' },
              { label: 'WhatsApp',  href: 'https://wa.me/1234567890' },
            ].map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, letterSpacing: '0.5px', textDecoration: 'none', transition: 'color 0.2s', fontFamily: "'Inter', sans-serif" }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
              >{s.label}</a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
