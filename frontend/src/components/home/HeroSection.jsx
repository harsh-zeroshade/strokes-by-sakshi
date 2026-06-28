import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../ui/Logo';

/* ══════════════════════════════════════════════════════════════════════════
   COLLECTIONS CONFIG — adapted from Delassus PRODUCTS pattern
   Each collection has: bg color, accent color, title, 3D art objects
══════════════════════════════════════════════════════════════════════════════ */
const COLLECTIONS = [
  {
    name: 'Portraits',
    bg: '#C7694F',
    accent: '#E8A87C',
    objects: [
      { fn: 'makeCanvas',   x: -0.08, y: 0.20, z: 0,    s: 1.30, ry: 0,    bob: 1.0, bspd: 0.50, bph: 0    },
      { fn: 'makePalette',  x: -0.50, y:-0.08, z: 0.18, s: 0.90, ry: 0.4,  bob: 0.9, bspd: 0.68, bph: 1.3  },
      { fn: 'makeBrush',    x:  0.50, y:-0.05, z:-0.08, s: 1.00, ry:-0.3,  bob: 1.1, bspd: 0.58, bph: 0.7  },
    ],
  },
  {
    name: 'Landscapes',
    bg: '#9CAF88',
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
    bg: '#4A3728',
    accent: '#C9A94E',
    objects: [
      { fn: 'makeInkDrop',  x: -0.08, y: 0.20, z: 0,    s: 1.30, ry: 0,    bob: 0.9, bspd: 0.50, bph: 0    },
      { fn: 'makeCanvas',   x: -0.50, y:-0.05, z: 0.18, s: 0.80, ry: 0.6,  bob: 1.1, bspd: 0.70, bph: 1.0  },
      { fn: 'makePalette',  x:  0.50, y:-0.04, z:-0.10, s: 0.95, ry:-0.5,  bob: 0.8, bspd: 0.60, bph: 1.8  },
    ],
  },
  {
    name: 'Commissions',
    bg: '#2C2C2C',
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
══════════════════════════════════════════════════════════════════════════════ */
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
  const frameGeo = new THREE.BoxGeometry(1.1, 1.4, 0.06);
  const frameColors = []; const fp = frameGeo.attributes.position;
  for (let i = 0; i < fp.count / 3; i++) {
    const c = jitColor(0.36, 0.22, 0.14, 0.04);
    for (let j = 0; j < 3; j++) frameColors.push(...c);
  }
  frameGeo.setAttribute('color', new THREE.Float32BufferAttribute(frameColors, 3));
  g.add(new THREE.Mesh(frameGeo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })));
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
  const hGeo = new THREE.CylinderGeometry(0.045, 0.055, 1.8, 6);
  const hColors = []; const hp = hGeo.attributes.position;
  for (let i = 0; i < hp.count / 3; i++) {
    for (let j = 0; j < 3; j++) hColors.push(...jitColor(0.60, 0.36, 0.15, 0.05));
  }
  hGeo.setAttribute('color', new THREE.Float32BufferAttribute(hColors, 3));
  g.add(new THREE.Mesh(hGeo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })));
  const ferGeo = new THREE.CylinderGeometry(0.058, 0.058, 0.18, 6);
  g.add(new THREE.Mesh(ferGeo, flatMat(0xb8b8b8)));
  const fer = g.children[g.children.length - 1]; fer.position.y = -0.96;
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
  const dGeo = new THREE.IcosahedronGeometry(0.52, 1);
  const pos = dGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    pos.setY(i, y * (y > 0 ? 1.25 : 0.75));
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
══════════════════════════════════════════════════════════════════════════════ */
export default function HeroSection() {
  const canvasRef   = useRef(null);
  const sectionRef  = useRef(null);
  const [activeIdx, setActiveIdx]   = useState(0);
  const [title,     setTitle]       = useState(COLLECTIONS[0].name);
  const [titleState, setTitleState] = useState('in');
  const [menuOpen,  setMenuOpen]    = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { user, isAdmin, logout } = useAuth();
  const { itemCount, setCartOpen } = useCart();
  const { dark, toggle } = useTheme();

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

    setTitleState('out');
    setTimeout(() => {
      setTitle(COLLECTIONS[idx].name);
      setTitleState('in');
    }, 270);

    t.outGroups = [...t.groups];
    t.groups = [];
    const nd = buildGroup(idx);
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
          padding: 'clamp(16px, 3vw, 28px) clamp(12px, 3vw, 32px) 0',
        }}>
          {/* Logo — same component as Navbar for consistency */}
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Logo size="md" color="ivory" variant="full" />
          </Link>

          {/* Right side: icons + hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0px, 0.5vw, 4px)', marginTop: 2 }}>
            {/* Theme toggle */}
            <button onClick={toggle} aria-label="Toggle theme"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 'clamp(4px, 1vw, 8px)', color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'white'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
            >
              {dark
                ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="4"/><path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                : <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
              }
            </button>

            {/* Cart */}
            <button onClick={() => setCartOpen(true)} aria-label="Cart"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 'clamp(4px, 1vw, 8px)', color: 'rgba(255,255,255,0.75)', position: 'relative', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'white'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
              {itemCount > 0 && (
                <span style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, background: 'white', color: col.bg, fontSize: 9, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, lineHeight: 1 }}>
                  {itemCount}
                </span>
              )}
            </button>

            {/* Account */}
            <div style={{ position: 'relative' }}>
              {user ? (
                <button onClick={() => setDropdownOpen(p => !p)} aria-label="Account"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 'clamp(2px, 0.5vw, 4px)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name}
                      style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.25)' }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'white', background: `hsl(${(user.id||0)*47+10},42%,52%)` }}>
                      {user.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '?'}
                    </div>
                  )}
                </button>
              ) : (
                <Link to="/login" aria-label="Login"
                  style={{ display: 'flex', alignItems: 'center', padding: 'clamp(4px, 1vw, 8px)', color: 'rgba(255,255,255,0.75)', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'white'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                </Link>
              )}
              {/* Account dropdown — full screen overlay */}
              <AnimatePresence>
                {dropdownOpen && user && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(10,9,7,0.55)', backdropFilter: 'blur(4px)' }}
                      onClick={() => setDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ clipPath: 'inset(0 0 100% 0)' }}
                      animate={{ clipPath: 'inset(0 0 0% 0)' }}
                      exit={{ clipPath: 'inset(0 0 100% 0)' }}
                      transition={{ duration: 0.6, ease: [0.77, 0, 0.18, 1] }}
                      style={{ position: 'fixed', inset: 0, zIndex: 850, display: 'flex', flexDirection: 'column', background: '#0d0b08' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 'clamp(16px, 3vw, 28px) clamp(12px, 3vw, 32px) 0' }}>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(18px, 2.5vw, 22px)', fontWeight: 400, color: 'white', letterSpacing: '-0.3px', lineHeight: 1 }}>
                          <div>{user.name}</div>
                          <span style={{ display: 'block', fontSize: 'clamp(11px, 1.5vw, 13px)', letterSpacing: 2, opacity: 0.45, fontFamily: "'Inter', sans-serif", fontWeight: 300, marginTop: 2 }}>{user.email}</span>
                        </div>
                        <button onClick={() => setDropdownOpen(false)}
                          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 'clamp(10px, 1.2vw, 11px)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}
                          onMouseEnter={e => e.currentTarget.style.color = 'white'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                        >
                          Close <span style={{ fontSize: 17, lineHeight: 1 }}>✕</span>
                        </button>
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 clamp(24px, 6vw, 80px)', overflow: 'hidden' }}>
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          {[
                            { to: '/account',               label: 'My Profile'    },
                            { to: '/account/orders',        label: 'My Orders'     },
                            { to: '/account/custom-orders', label: 'Custom Orders' },
                            { to: '/account/wishlist',      label: 'Wishlist'      },
                            ...(isAdmin ? [{ to: '/admin', label: 'Admin Panel' }] : []),
                          ].map((item, i) => (
                            <motion.div key={item.to}
                              initial={{ opacity: 0, y: 40 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 + i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            >
                              <Link to={item.to} onClick={() => setDropdownOpen(false)}
                                style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 300, color: 'rgba(255,255,255,0.18)', textDecoration: 'none', letterSpacing: '-1.5px', lineHeight: 1.15, display: 'flex', alignItems: 'baseline', gap: 16, padding: '12px 0', transition: 'color 0.25s ease' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.18)'}
                              >
                                {item.label}
                              </Link>
                            </motion.div>
                          ))}
                        </nav>
                      </div>
                      <motion.div
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        style={{ padding: '0 clamp(24px, 6vw, 80px) clamp(24px, 4vw, 44px)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}
                      >
                        <button onClick={() => { logout(); setDropdownOpen(false); }}
                          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 11, cursor: 'pointer', fontFamily: "'Inter', sans-serif", textAlign: 'left', letterSpacing: 1, textTransform: 'uppercase', padding: 0 }}>
                          Sign Out
                        </button>
                        <div style={{ display: 'flex', gap: 16 }}>
                          {[
                            { label: 'Instagram', href: 'https://instagram.com/strokesbysakshi' },
                            { label: 'WhatsApp',  href: 'https://wa.me/1234567890' },
                          ].map(s => (
                            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                              style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, letterSpacing: 1, textDecoration: 'none', fontFamily: "'Inter', sans-serif", textTransform: 'uppercase', transition: 'color 0.2s' }}
                              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.28)'}
                            >{s.label}</a>
                          ))}
                        </div>
                      </motion.div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />

            {/* Hamburger */}
            <button onClick={() => setMenuOpen(true)} aria-label="Open menu"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 'clamp(4px, 1vw, 8px)', display: 'flex', flexDirection: 'column', gap: 5 }}
            >
              {[0,1,2].map(i => (
                <span key={i} style={{ display: 'block', width: 'clamp(20px, 3vw, 26px)', height: 1, background: 'white' }} />
              ))}
            </button>
          </div>
        </div>

        {/* ── BIG TITLE ── */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: titleState === 'out'
              ? 'translate(-50%, -50%) translateY(14px)'
              : 'translate(-50%, -50%) translateY(0px)',
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(48px, 14vw, 160px)',
            fontWeight: 300,
            color: 'white',
            letterSpacing: '-2px',
            lineHeight: 1,
            pointerEvents: 'none',
            zIndex: 20,
            whiteSpace: 'nowrap',
            opacity: titleState === 'out' ? 0 : 1,
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
            position: 'absolute', bottom: 'clamp(48px, 6vw, 56px)', left: 0, right: 0,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 50, flexWrap: 'wrap', gap: 'clamp(0px, 1vw, 4px)',
            padding: '0 clamp(8px, 2vw, 16px)',
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
                fontSize: 'clamp(11px, 1.5vw, 13px)', fontWeight: 400, letterSpacing: '0.3px',
                padding: '6px clamp(10px, 2vw, 20px) 8px',
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
                position: 'absolute', bottom: 0, left: 'clamp(10px, 2vw, 20px)', right: 'clamp(10px, 2vw, 20px)',
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
            position: 'absolute',
            right: 'clamp(12px, 4vw, 52px)',
            bottom: 'clamp(80px, 10vw, 46px)',
            zIndex: 50,
            display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 14px)',
            padding: 'clamp(10px, 1.5vw, 15px) clamp(16px, 3vw, 28px)',
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(11px, 1.2vw, 13px)', fontWeight: 500, letterSpacing: '0.5px',
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
          padding: '0 clamp(12px, 3vw, 32px) clamp(12px, 2vw, 18px)', zIndex: 50,
          display: 'flex', alignItems: 'center', gap: 'clamp(12px, 3vw, 28px)',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1vw, 10px)' }}>
            <Link to="/about" style={{ color: 'white', fontSize: 'clamp(9px, 1.1vw, 11px)', fontWeight: 400, letterSpacing: '1.5px', textDecoration: 'none', opacity: 1, fontFamily: "'Inter', sans-serif", textTransform: 'uppercase', borderBottom: '1.5px solid white', paddingBottom: 1 }}>About</Link>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>·</span>
            <Link to="/contact" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 'clamp(9px, 1.1vw, 11px)', fontWeight: 400, letterSpacing: '1.5px', textDecoration: 'none', fontFamily: "'Inter', sans-serif", textTransform: 'uppercase' }}>Contact</Link>
          </div>
          <div style={{ display: 'flex', gap: 'clamp(12px, 2vw, 24px)' }}>
            <Link to="/commission" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 'clamp(9px, 1.1vw, 11px)', letterSpacing: '0.5px', textDecoration: 'none', fontFamily: "'Inter', sans-serif" }}>Commission</Link>
            <Link to="/gallery" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 'clamp(9px, 1.1vw, 11px)', letterSpacing: '0.5px', textDecoration: 'none', fontFamily: "'Inter', sans-serif" }}>Gallery</Link>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 'clamp(16px, 3vw, 28px) clamp(12px, 3vw, 32px) 0' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(18px, 2.5vw, 20px)', fontWeight: 400, color: 'white', letterSpacing: '-0.3px' }}>
            Strokes<br/>
            <span style={{ fontSize: 'clamp(11px, 1.5vw, 13px)', letterSpacing: 2, opacity: 0.5, fontFamily: "'Inter', sans-serif", fontWeight: 300 }}>by Sakshi</span>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 'clamp(10px, 1.2vw, 11px)', letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'Inter', sans-serif", opacity: 0.6, display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
          >
            <span>Close</span>
            <span style={{ fontSize: 18, lineHeight: 1 }}>✕</span>
          </button>
        </div>

        {/* Menu links */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 clamp(24px, 6vw, 80px)' }}>
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
                  fontSize: 'clamp(28px, 6vw, 68px)',
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.22)',
                  textDecoration: 'none',
                  letterSpacing: '-1px',
                  lineHeight: 1.25,
                  display: 'flex', alignItems: 'baseline', gap: 'clamp(8px, 1.5vw, 16px)',
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
        <div style={{ padding: '0 clamp(24px, 6vw, 80px) clamp(24px, 4vw, 44px)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Instagram', href: 'https://instagram.com/strokesbysakshi' },
              { label: 'WhatsApp',  href: 'https://wa.me/1234567890' },
            ].map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                style={{ color: 'rgba(255,255,255,0.35)', fontSize: 'clamp(11px, 1.2vw, 13px)', letterSpacing: '0.5px', textDecoration: 'none', transition: 'color 0.2s', fontFamily: "'Inter', sans-serif" }}
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