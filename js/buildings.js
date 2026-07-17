// TimeBlock — building generators. Each returns a THREE.Group anchored at
// ground level, centered on X, with its street-facing facade at +Z = depth/2.
'use strict';
window.TB = window.TB || {};
TB.buildings = {};

(function () {
  const B = TB.buildings;

  // ------------------------------------------------------------------
  // shared bits
  // ------------------------------------------------------------------
  function signBoard(text, style, w, h, opts) {
    opts = opts || {};
    const tex = TB.tex.sign(text, style, opts);
    const emissiveStyles = { neon: 1.4, led: 1.2, holo: 1.6, backlit: 0.55 };
    const glow = emissiveStyles[style] || 0;
    const mat = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.7, metalness: 0.1,
      emissive: glow ? 0xffffff : 0x000000,
      emissiveMap: glow ? tex : null,
      emissiveIntensity: glow,
      transparent: style === 'holo',
      side: THREE.DoubleSide
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.userData.holo = style === 'holo';
    return m;
  }
  B.signBoard = signBoard;

  function facadeMat(tex, opts) {
    opts = opts || {};
    return new THREE.MeshStandardMaterial(Object.assign({
      map: tex, roughness: 0.9, metalness: 0.02,
      emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: opts.glow || 0
    }, opts.extra || {}));
  }

  // Box building whose 4 sides use a facade texture and roof uses flat color.
  function facadeBox(w, h, d, tex, opts) {
    opts = opts || {};
    const roof = TB.mat(opts.roofColor || 0x4a4640, { roughness: 0.95 });
    const wall = facadeMat(tex, opts);
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, [wall, wall, roof, roof, wall, wall]);
    mesh.position.y = h / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
  B.facadeBox = facadeBox;

  function cornice(w, d, y, color) {
    const m = TB.mesh(TB.geo.box, TB.mat(color || 0x6b5f4d), 0, y, 0, w + 0.8, 0.7, d + 0.8);
    m.castShadow = true;
    return m;
  }

  // Storefront strip along the front face: glass, pilasters, door, sign, awning
  function storefrontStrip(g, w, d, store, era) {
    const fz = d / 2;
    const sw = w - 1.4;
    // recess box
    g.add(TB.mesh(TB.geo.box, TB.mat(0x171310), 0, 1.85, fz - 0.3, sw, 3.7, 0.55));
    // display glass, slightly emissive so shops feel inhabited
    const lit = (era === 1985 || era === 2055) ? 0.5 : 0.18;
    const glass = new THREE.MeshStandardMaterial({
      color: 0x2e3c44, roughness: 0.12, metalness: 0.55,
      emissive: 0xffe9b8, emissiveIntensity: lit
    });
    const panes = 3;
    for (let i = 0; i < panes; i++) {
      const pw = sw / panes - 0.9;
      g.add(TB.mesh(TB.geo.box, glass, -sw / 2 + sw * (i + 0.5) / panes, 1.9, fz + 0.02, pw, 2.6, 0.08));
      // pilasters between panes
      if (i > 0) {
        g.add(TB.mesh(TB.geo.box, TB.mat(store.trim || 0x3a2c20), -sw / 2 + sw * i / panes, 1.9, fz + 0.05, 0.5, 3.7, 0.35));
      }
    }
    // kick panel
    g.add(TB.mesh(TB.geo.box, TB.mat(store.trim || 0x3a2c20), 0, 0.35, fz + 0.05, sw, 0.7, 0.3));
    // door (offset right)
    g.add(TB.mesh(TB.geo.box, TB.mat(0x241a12), sw / 2 - 1.6, 1.45, fz + 0.08, 1.5, 2.9, 0.15));
    g.add(TB.mesh(TB.geo.box, TB.mat(0xc8b878, { metalness: 0.8, roughness: 0.3 }), sw / 2 - 2.2, 1.4, fz + 0.18, 0.1, 0.5, 0.1));
    // sign board above — sits on the fascia just below the 2nd-floor cornice
    // and stands proud of the wall so awnings/cornices can't eat it
    if (store.name) {
      const s = signBoard(store.name, store.style || 'painted', Math.min(sw, store.wide ? sw : sw * 0.8), 1.4, store);
      s.position.set(0, 4.75, fz + 0.4);
      g.add(s);
    }
    // awning for older eras / cafés
    if (store.awning) {
      const aw = new THREE.Mesh(new THREE.PlaneGeometry(sw * 0.9, 2.2),
        new THREE.MeshStandardMaterial({ map: TB.tex.awning(store.awning[0], store.awning[1]), side: THREE.DoubleSide, roughness: 0.9 }));
      aw.rotation.x = -Math.PI / 3.2;
      aw.position.set(0, 3.9, fz + 1.0);
      aw.castShadow = true;
      g.add(aw);
    }
    // era street clutter at the door
    if (era <= 1965 && store.crates) {
      const crate = TB.mat(0x8a6b42);
      g.add(TB.mesh(TB.geo.box, crate, -sw / 2 + 1.2, 0.4, fz + 1.1, 0.9, 0.8, 0.9));
      g.add(TB.mesh(TB.geo.box, crate, -sw / 2 + 2.2, 0.35, fz + 1.3, 0.8, 0.7, 0.8));
    }
  }
  B.storefrontStrip = storefrontStrip;

  function fireEscape(g, w, h, d, floors) {
    const mat = TB.mat(0x1c1c1e, { roughness: 0.6, metalness: 0.7 });
    const fz = d / 2 + 0.55;
    const ew = Math.min(4.5, w * 0.35);
    const x0 = -w * 0.22;
    for (let f = 1; f < floors; f++) {
      const y = (h / floors) * f + 0.4;
      // platform
      g.add(TB.mesh(TB.geo.box, mat, x0, y, fz, ew, 0.12, 1.1));
      // railing
      g.add(TB.mesh(TB.geo.box, mat, x0, y + 0.5, fz + 0.5, ew, 0.08, 0.08));
      g.add(TB.mesh(TB.geo.box, mat, x0 - ew / 2, y + 0.25, fz + 0.5, 0.08, 0.6, 0.08));
      g.add(TB.mesh(TB.geo.box, mat, x0 + ew / 2, y + 0.25, fz + 0.5, 0.08, 0.6, 0.08));
      // diagonal ladder
      const lad = TB.mesh(TB.geo.box, mat, x0, y - (h / floors) / 2 + 0.4, fz + 0.1, 0.5, h / floors * 0.95, 0.1);
      lad.rotation.x = 0.45;
      g.add(lad);
    }
  }
  B.fireEscape = fireEscape;

  function roofClutter(g, w, h, d, era, r) {
    // water tank (pre-2025 icons of the skyline)
    if (era <= 2005 && r() < 0.75 && w > 14) {
      const tank = new THREE.Group();
      const wood = TB.mat(0x6b4a32, { roughness: 0.95 });
      const tk = TB.mesh(new THREE.CylinderGeometry(1.6, 1.8, 2.6, 12), wood, 0, 1.3, 0);
      tk.castShadow = true;
      tank.add(tk);
      tank.add(TB.mesh(TB.geo.cone, wood, 0, 3.1, 0, 4.0, 1.4, 4.0));
      for (let i = 0; i < 4; i++) {
        tank.add(TB.mesh(TB.geo.box, TB.mat(0x2c2c2c), Math.cos(i * 1.57) * 1.3, -0.9, Math.sin(i * 1.57) * 1.3, 0.18, 1.8, 0.18));
      }
      tank.position.set((r() - 0.5) * w * 0.4, h + 0.9, (r() - 0.5) * d * 0.3);
      g.add(tank);
    }
    // chimneys / vents
    const vents = era <= 1965 ? 3 : 2;
    for (let i = 0; i < vents; i++) {
      g.add(TB.mesh(TB.geo.box, TB.mat(era <= 1965 ? 0x7a4434 : 0x8a8a86),
        (r() - 0.5) * w * 0.7, h + 0.6, (r() - 0.5) * d * 0.6, 0.9, 1.2, 0.9));
    }
    // era rooftop tech
    if (era === 1985 && w > 12) {
      // big TV antenna
      const am = TB.mat(0x9a9a9a, { metalness: 0.8, roughness: 0.3 });
      const ant = new THREE.Group();
      ant.add(TB.mesh(TB.geo.cyl, am, 0, 2.2, 0, 0.06, 4.4, 0.06));
      for (let i = 0; i < 4; i++) ant.add(TB.mesh(TB.geo.box, am, 0, 3.6 - i * 0.5, 0, 1.6 - i * 0.3, 0.05, 0.05));
      ant.position.set(w * 0.3, h, -d * 0.2);
      g.add(ant);
    }
    if (era >= 2005 && era <= 2025) {
      // HVAC units + cell antennas
      for (let i = 0; i < 2; i++) {
        g.add(TB.mesh(TB.geo.box, TB.mat(0xb0b0aa, { metalness: 0.4, roughness: 0.5 }),
          (r() - 0.5) * w * 0.5, h + 0.7, (r() - 0.5) * d * 0.4, 2.2, 1.4, 2.2));
      }
      g.add(TB.mesh(TB.geo.box, TB.mat(0xdadada), w * 0.35, h + 1.6, d * 0.25, 0.3, 3.2, 0.3));
    }
    if (era === 2025 && w > 14 && r() < 0.7) {
      // rooftop solar panels
      const pm = TB.mat(0x18283e, { metalness: 0.6, roughness: 0.3 });
      for (let i = 0; i < 3; i++) {
        const p = TB.mesh(TB.geo.box, pm, -w * 0.25 + i * w * 0.22, h + 0.5, 0, w * 0.18, 0.08, d * 0.35);
        p.rotation.x = -0.25;
        g.add(p);
      }
    }
    if (era === 2055) {
      // glowing spire antenna
      const sp = TB.mesh(TB.geo.cyl, new THREE.MeshStandardMaterial({ color: 0x0c1420, emissive: 0x41f2ff, emissiveIntensity: 1.2 }),
        0, h + 2.5, 0, 0.15, 5, 0.15);
      g.add(sp);
    }
  }
  B.roofClutter = roofClutter;

  // ------------------------------------------------------------------
  // TENEMENT — brick walk-up, the 1945 workhorse
  // ------------------------------------------------------------------
  B.tenement = function (o) {
    // o: {w,d,floors,era,seed,store:{...},base}
    const g = new THREE.Group();
    const r = TB.rng(o.seed);
    const floorH = 3.4;
    const h = o.floors * floorH + 4.2; // + ground storefront floor
    const grimeAmt = o.era <= 1945 ? 1.0 : (o.era <= 1985 ? 0.8 : 0.35);
    const tex = TB.tex.brickFacade({
      base: o.base || TB.pick(r, ['#8a4a35', '#7a4030', '#96543c', '#6e3d2e']),
      floors: o.floors, cols: Math.max(3, Math.round(o.w / 4.5)),
      windowLit: TB.ERA_ENV[o.era].windowsLit, grime: grimeAmt, seed: o.seed,
      acUnits: o.era >= 1985 && o.era <= 2025
    });
    const upper = facadeBox(o.w, h - 4.2, o.d, tex, { glow: TB.ERA_ENV[o.era].windowsLit > 0.3 ? 0.35 : 0 });
    upper.position.y = 4.2 + (h - 4.2) / 2;
    g.add(upper);
    // ground floor masonry band
    g.add(TB.mesh(TB.geo.box, TB.mat(0x5a4436), 0, 2.1, 0, o.w, 4.2, o.d));
    g.add(cornice(o.w, o.d, h + 0.2, 0x6b5340));
    g.add(cornice(o.w, o.d, 4.25, 0x5c4634));
    if (o.store) storefrontStrip(g, o.w, o.d, o.store, o.era);
    if (o.fireEscape !== false) fireEscape(g, o.w, h - 4.2, o.d, o.floors);
    // side wall posters
    if (o.posters) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(5, 5),
        new THREE.MeshStandardMaterial({ map: TB.tex.posterWall(o.era, o.seed + 4), roughness: 0.95 }));
      p.rotation.y = o.posters === 'left' ? -Math.PI / 2 : Math.PI / 2;
      p.position.set((o.posters === 'left' ? -1 : 1) * (o.w / 2 + 0.06), 3.4, o.d * 0.1);
      g.add(p);
    }
    roofClutter(g, o.w, h, o.d, o.era, r);
    g.userData.height = h;
    return g;
  };

  // ------------------------------------------------------------------
  // BROWNSTONE ROW — stoops and bay windows
  // ------------------------------------------------------------------
  B.brownstoneRow = function (o) {
    const g = new THREE.Group();
    const r = TB.rng(o.seed);
    const units = Math.max(2, Math.round(o.w / 9));
    const uw = o.w / units;
    const h = 11.5;
    for (let i = 0; i < units; i++) {
      const cx = -o.w / 2 + uw * (i + 0.5);
      const base = TB.pick(r, ['#7a4a38', '#6e4434', '#82503c', '#75463a']);
      const tex = TB.tex.stoneFacade({
        base: base, floors: 3, cols: 2,
        windowLit: TB.ERA_ENV[o.era].windowsLit,
        grime: o.era <= 1985 ? 0.7 : 0.25, seed: o.seed + i
      });
      const unit = facadeBox(uw - 0.3, h, o.d, tex, { glow: TB.ERA_ENV[o.era].windowsLit > 0.3 ? 0.3 : 0 });
      unit.position.x = cx;
      g.add(unit);
      // stoop
      const stoopMat = TB.mat(0x6b5744);
      for (let s = 0; s < 4; s++) {
        g.add(TB.mesh(TB.geo.box, stoopMat, cx + uw * 0.18, 0.25 + s * 0.35, o.d / 2 + 1.4 - s * 0.45, 2.2, 0.35, 0.5));
      }
      // door
      g.add(TB.mesh(TB.geo.box, TB.mat(o.era >= 2005 ? 0x223244 : 0x2e1e14), cx + uw * 0.18, 2.6, o.d / 2 + 0.08, 1.4, 2.6, 0.15));
      // bay window bump with real panes and sills
      g.add(TB.mesh(TB.geo.box, TB.mat(TB.tex.shadeColor(base, 0.85)), cx - uw * 0.2, 5.4, o.d / 2 + 0.5, 2.6, 6.5, 1.0));
      const bayGlass = new THREE.MeshStandardMaterial({ color: 0x1c2830, roughness: 0.15, metalness: 0.5, emissive: 0xffe0a0, emissiveIntensity: TB.ERA_ENV[o.era].windowsLit > 0.3 ? 0.4 : 0.04 });
      for (let bf = 0; bf < 2; bf++) {
        const by = 3.6 + bf * 3.1;
        g.add(TB.mesh(TB.geo.box, bayGlass, cx - uw * 0.2, by, o.d / 2 + 1.02, 1.7, 1.7, 0.06));
        g.add(TB.mesh(TB.geo.box, TB.mat(0x2e2018), cx - uw * 0.2, by, o.d / 2 + 1.05, 0.09, 1.7, 0.05));
        g.add(TB.mesh(TB.geo.box, TB.mat(0x2e2018), cx - uw * 0.2, by - 0.95, o.d / 2 + 1.06, 1.9, 0.16, 0.1));
      }
      // cornice per unit
      g.add(TB.mesh(TB.geo.box, TB.mat(0x54402e), cx, h + 0.25, 0, uw + 0.2, 0.6, o.d + 0.6));
      // era planter boxes / flowers for modern eras
      if (o.era >= 2005) {
        g.add(TB.mesh(TB.geo.box, TB.mat(0x2f5a32), cx - uw * 0.2, 2.3, o.d / 2 + 1.15, 2.4, 0.35, 0.5));
      }
    }
    roofClutter(g, o.w, h, o.d, o.era, r);
    g.userData.height = h;
    return g;
  };

  // ------------------------------------------------------------------
  // DECO TOWER — the permanent bank anchor with setbacks
  // ------------------------------------------------------------------
  B.decoTower = function (o) {
    const g = new THREE.Group();
    const r = TB.rng(o.seed);
    const env = TB.ERA_ENV[o.era];
    const tiers = [
      { w: o.w, d: o.d, h: 16 },
      { w: o.w * 0.78, d: o.d * 0.78, h: 12 },
      { w: o.w * 0.55, d: o.d * 0.55, h: 10 },
      { w: o.w * 0.32, d: o.d * 0.32, h: 7 }
    ];
    let y = 0;
    tiers.forEach(function (t, i) {
      const tex = TB.tex.stoneFacade({
        base: '#b0a48c', floors: Math.round(t.h / 3.2), cols: Math.max(2, Math.round(t.w / 4)),
        windowLit: env.windowsLit, grime: o.era <= 1985 ? 0.5 : 0.15, seed: o.seed + i, frame: '#3c3830'
      });
      const box = facadeBox(t.w, t.h, t.d, tex, { glow: env.windowsLit > 0.3 ? 0.35 : 0, roofColor: 0x8a8070 });
      box.position.y = y + t.h / 2;
      g.add(box);
      // setback trim
      g.add(TB.mesh(TB.geo.box, TB.mat(0xc8bca0), 0, y + t.h + 0.15, 0, t.w + 0.6, 0.45, t.d + 0.6));
      // vertical deco fins on the base tier
      if (i === 0) {
        for (let f = -2; f <= 2; f++) {
          g.add(TB.mesh(TB.geo.box, TB.mat(0xc4b898), f * t.w / 5.5, t.h / 2 + 2, t.d / 2 + 0.15, 0.5, t.h - 4, 0.3));
        }
      }
      y += t.h;
    });
    const h = y;
    // crown: era-dependent
    if (o.era <= 2025) {
      g.add(TB.mesh(TB.geo.cone, TB.mat(0x8a7f68, { metalness: 0.5, roughness: 0.4 }), 0, h + 2.2, 0, 4.5, 4.5, 4.5));
      g.add(TB.mesh(TB.geo.cyl, TB.mat(0x777268, { metalness: 0.7 }), 0, h + 5.6, 0, 0.12, 3.0, 0.12));
    } else {
      // 2055 retrofit: holographic crown ring
      const ring = TB.mesh(TB.geo.torus, new THREE.MeshBasicMaterial({ color: 0x41f2ff, transparent: true, opacity: 0.8 }), 0, h + 3, 0, 9, 9, 9);
      ring.rotation.x = Math.PI / 2;
      ring.userData.spin = 0.4;
      g.add(ring);
    }
    // bank entrance: columns + wide steps
    const colMat = TB.mat(0xc8bca0);
    for (let i = -1; i <= 1; i += 2) {
      g.add(TB.mesh(TB.geo.cyl, colMat, i * 3.2, 3.0, o.d / 2 + 1.2, 1.0, 6.0, 1.0));
    }
    g.add(TB.mesh(TB.geo.box, colMat, 0, 6.4, o.d / 2 + 1.2, 9.5, 1.0, 2.2));
    g.add(TB.mesh(TB.geo.box, colMat, 0, 0.25, o.d / 2 + 1.6, 11, 0.5, 3.2));
    // signage per era
    const bankSigns = {
      1945: ['FIRST UNION SAVINGS', 'painted', { bg: '#2c2c2c', fg: '#d8c890' }],
      1965: ['FIRST UNION SAVINGS', 'enamel', { bg: '#1c3a6b', fg: '#ffffff' }],
      1985: ['FIRST UNION 24-HR ATM', 'plastic', { bg: '#e8e4d8', fg: '#1c3a6b' }],
      2005: ['FIRST UNION ✕ CHASE', 'backlit', { fg: '#1a4b8f' }],
      2025: ['FIRST UNION — since 1921', 'led', { fg: '#8fd0ff' }],
      2055: ['FIRST UNION QUANTUM TRUST', 'holo', { fg: '#41f2ff' }]
    }[o.era];
    const s = signBoard(bankSigns[0], bankSigns[1], 12, 1.6, bankSigns[2]);
    s.position.set(0, 8.1, o.d / 2 + 1.55);
    g.add(s);
    g.userData.height = h + 5;
    return g;
  };

  // ------------------------------------------------------------------
  // THEATER — marquee anchor, persists all six eras
  // ------------------------------------------------------------------
  B.theater = function (o) {
    const g = new THREE.Group();
    const r = TB.rng(o.seed);
    const env = TB.ERA_ENV[o.era];
    const h = 14;
    const tex = TB.tex.stoneFacade({
      base: o.era >= 2025 ? '#c8b89c' : '#b8a482',
      floors: 3, cols: 4, windowLit: env.windowsLit,
      grime: o.era === 2005 ? 0.9 : (o.era <= 1985 ? 0.6 : 0.1), seed: o.seed
    });
    g.add(facadeBox(o.w, h, o.d, tex, { glow: env.windowsLit > 0.3 ? 0.3 : 0 }));
    // tall blade sign
    const bladeStyle = o.era <= 1945 ? 'painted' : (o.era <= 1985 ? 'neon' : (o.era <= 2025 ? 'led' : 'holo'));
    const bladeText = o.era >= 2055 ? 'SENSORIUM' : (o.era >= 2025 ? 'THE PALACE' : 'PALACE');
    const blade = new THREE.Group();
    const bladeW = 2.2, bladeH = 9;
    const bmat = TB.mat(0x231d18);
    blade.add(TB.mesh(TB.geo.box, bmat, 0, 0, 0, bladeW, bladeH, 0.6));
    for (const side of [-1, 1]) {
      const st = signBoard(bladeText, bladeStyle, bladeH - 1, bladeW * 0.75, { fg: o.era === 1985 ? '#ff4fd8' : '#41d8ff', seed: o.seed });
      st.rotation.z = Math.PI / 2;
      st.position.set(0, 0, side * 0.35);
      if (side < 0) st.rotation.y = Math.PI;
      blade.add(st);
    }
    blade.position.set(-o.w * 0.28, h - 3.5, o.d / 2 + 0.35);
    g.add(blade);
    // marquee canopy with film titles
    const films = {
      1945: ['VICTORY AT DAWN', 'plus newsreel'],
      1965: ['BEACH BLANKET A-GO-GO', 'in TECHNICOLOR'],
      1985: ['LASER COP II', 'RATED PG-13 · DOLBY'],
      2005: ['FOR LEASE', 'call 555-0182'],
      2025: ['RESTORED! CLASSICS WEEK', 'members free'],
      2055: ['FULL-DIVE: EDEN', 'neural cut · 19+']
    }[o.era];
    const canopy = new THREE.Group();
    canopy.add(TB.mesh(TB.geo.box, TB.mat(0x2a241e), 0, 0, 0, o.w * 0.62, 2.2, 4.2));
    const mq = new THREE.Mesh(new THREE.PlaneGeometry(o.w * 0.58, 1.9),
      new THREE.MeshStandardMaterial({
        map: TB.tex.marquee(films, { grimy: o.era === 2005 }),
        emissive: 0xffffff, emissiveMap: TB.tex.marquee(films, { grimy: o.era === 2005 }),
        emissiveIntensity: env.streetlights ? 0.9 : 0.35
      }));
    mq.position.set(0, 0, 2.15);
    canopy.add(mq);
    // bulb strip
    if (o.era !== 2005) {
      const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff2c0, emissive: 0xffd870, emissiveIntensity: env.streetlights ? 1.6 : 0.6 });
      for (let i = 0; i < 14; i++) {
        canopy.add(TB.mesh(TB.geo.sphere, bulbMat, -o.w * 0.29 + i * o.w * 0.0447, -1.2, 2.15, 0.22, 0.22, 0.22));
      }
    }
    canopy.position.set(0, 6.2, o.d / 2 + 1.6);
    g.add(canopy);
    // entrance doors + poster cases
    for (let i = -1; i <= 1; i++) {
      g.add(TB.mesh(TB.geo.box, TB.mat(0x33241a), i * 2.1, 1.6, o.d / 2 + 0.08, 1.8, 3.2, 0.12));
    }
    for (const side of [-1, 1]) {
      const pc = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.6),
        new THREE.MeshStandardMaterial({ map: TB.tex.posterWall(o.era, o.seed + side + 10), roughness: 0.8 }));
      pc.position.set(side * o.w * 0.32, 2.4, o.d / 2 + 0.1);
      g.add(pc);
    }
    // boarded up in 2005
    if (o.era === 2005) {
      const board = TB.mat(0x8a7048);
      g.add(TB.mesh(TB.geo.box, board, 0, 1.6, o.d / 2 + 0.15, 6.5, 2.8, 0.1));
      const st = signBoard('FOR LEASE — RILEY REALTY', 'plastic', 6, 1.0, { bg: '#f0f0e8', fg: '#c0392b' });
      st.position.set(0, 3.6, o.d / 2 + 0.22);
      g.add(st);
    }
    roofClutter(g, o.w, h, o.d, o.era, r);
    g.userData.height = h;
    return g;
  };

  // ------------------------------------------------------------------
  // CHURCH — small stone chapel, unchanged across a century
  // ------------------------------------------------------------------
  B.church = function (o) {
    const g = new THREE.Group();
    const stone = TB.mat(0x8f8878, { roughness: 0.95 });
    const dark = TB.mat(0x4a4438);
    const naveW = o.w * 0.62, naveH = 9, naveD = o.d * 0.9;
    const nave = TB.mesh(TB.geo.box, stone, o.w * 0.12, naveH / 2, 0, naveW, naveH, naveD);
    nave.castShadow = nave.receiveShadow = true;
    g.add(nave);
    // pitched roof (rotated box is cheap and reads fine)
    const roof = TB.mesh(TB.geo.box, dark, o.w * 0.12, naveH + 1.6, 0, naveW * 0.76, 3.2, naveD + 0.6);
    roof.rotation.z = Math.PI / 4;
    g.add(roof);
    // tower
    const towerW = 4.6, towerH = 16;
    const tower = TB.mesh(TB.geo.box, stone, -o.w * 0.3, towerH / 2, o.d * 0.18, towerW, towerH, towerW);
    tower.castShadow = true;
    g.add(tower);
    g.add(TB.mesh(TB.geo.cone, dark, -o.w * 0.3, towerH + 2.2, o.d * 0.18, towerW * 1.15, 4.4, towerW * 1.15));
    // cross
    g.add(TB.mesh(TB.geo.box, TB.mat(0xd8cfa8), -o.w * 0.3, towerH + 5.2, o.d * 0.18, 0.18, 1.6, 0.18));
    g.add(TB.mesh(TB.geo.box, TB.mat(0xd8cfa8), -o.w * 0.3, towerH + 5.4, o.d * 0.18, 0.9, 0.18, 0.18));
    // rose window (emissive disc)
    const rose = TB.mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x30253c, emissive: 0x8a5fc8, emissiveIntensity: TB.ERA_ENV[o.era].streetlights ? 1.0 : 0.3 }),
      o.w * 0.12, 6.5, naveD / 2 + 0.05, 1, 1, 1);
    rose.rotation.x = Math.PI / 2;
    g.add(rose);
    // arched door
    g.add(TB.mesh(TB.geo.box, TB.mat(0x3c2a1a), o.w * 0.12, 1.8, naveD / 2 + 0.1, 2.2, 3.6, 0.2));
    // tiny lawn + fence + sign
    g.add(TB.mesh(TB.geo.box, TB.mat(o.era >= 2055 ? 0x1d3a2e : 0x3f6b38), o.w * 0.12, 0.05, naveD / 2 + 2.4, o.w * 0.6, 0.1, 3.4));
    const signText = {
      1945: 'ST. AMBROSE — PRAY FOR PEACE', 1965: 'ST. AMBROSE — ALL WELCOME',
      1985: 'ST. AMBROSE — BINGO TUES 7PM', 2005: 'ST. AMBROSE — WIFI IS NOT A SIN',
      2025: 'ST. AMBROSE — YES, WE COMPOST', 2055: 'ST. AMBROSE — ANALOG SUNDAYS'
    }[o.era];
    const s = signBoard(signText, 'painted', 6.5, 1.2, { bg: '#26221c', fg: '#e8dcae', seed: o.seed });
    s.position.set(o.w * 0.12, 1.2, naveD / 2 + 3.9);
    g.add(s);
    g.userData.height = towerH + 6;
    return g;
  };

  // ------------------------------------------------------------------
  // GOOGIE DINER — 1965 star of the show
  // ------------------------------------------------------------------
  B.diner = function (o) {
    const g = new THREE.Group();
    const env = TB.ERA_ENV[o.era];
    const worn = o.era >= 1985;
    const bodyW = o.w * 0.8, bodyH = 4.6, bodyD = o.d * 0.62;
    // stainless body
    const steel = TB.mat(worn ? 0x9a9a94 : 0xc8ccd0, { metalness: 0.85, roughness: worn ? 0.55 : 0.25 });
    const body = TB.mesh(TB.geo.box, steel, 0, bodyH / 2 + 0.3, 0, bodyW, bodyH, bodyD);
    body.castShadow = body.receiveShadow = true;
    g.add(body);
    // horizontal chrome ribs
    for (let i = 0; i < 3; i++) {
      g.add(TB.mesh(TB.geo.box, TB.mat(0xe8ecf0, { metalness: 0.95, roughness: 0.15 }), 0, 1.4 + i * 1.4, bodyD / 2 + 0.06, bodyW * 0.98, 0.25, 0.06));
    }
    // ribbon window
    g.add(TB.mesh(TB.geo.box, new THREE.MeshStandardMaterial({
      color: 0x28323a, roughness: 0.1, metalness: 0.6, emissive: 0xffe0a0,
      emissiveIntensity: worn && env.streetlights ? 0.8 : 0.35
    }), 0, 3.1, bodyD / 2 + 0.04, bodyW * 0.9, 1.5, 0.1));
    // swooping roof wing
    const wing = TB.mesh(TB.geo.box, TB.mat(worn ? 0xb04838 : 0xd85340, { roughness: 0.5 }), 0, bodyH + 1.2, 0, bodyW * 1.15, 0.4, bodyD * 1.25);
    wing.rotation.z = 0.06;
    wing.castShadow = true;
    g.add(wing);
    // angled sputnik sign pole
    const poleMat = TB.mat(0x8a8f96, { metalness: 0.8, roughness: 0.3 });
    const pole = TB.mesh(TB.geo.cyl, poleMat, -bodyW * 0.55, 5.5, bodyD * 0.3, 0.28, 11, 0.28);
    pole.rotation.z = 0.18;
    g.add(pole);
    const star = new THREE.Group();
    const starMat = new THREE.MeshStandardMaterial({ color: 0xffd23c, emissive: 0xffb03c, emissiveIntensity: env.streetlights ? 1.4 : 0.5 });
    star.add(TB.mesh(TB.geo.sphere, starMat, 0, 0, 0, 1.2, 1.2, 1.2));
    for (let i = 0; i < 8; i++) {
      const spike = TB.mesh(TB.geo.cyl, poleMat, 0, 0, 0, 0.07, 2.6, 0.07);
      spike.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      star.add(spike);
    }
    star.position.set(-bodyW * 0.55 - 1.9, 10.6, bodyD * 0.3);
    star.userData.spin = 0.8;
    g.add(star);
    // sign
    const dSigns = {
      1965: ['STARLITE DINER', 'neon', { fg: '#41d8ff' }],
      1985: ['STARLITE  D NER', 'neon', { fg: '#ff6a4f' }], // dead letter, of course
      2005: ["STARLITE DINER  est. '65", 'plastic', { bg: '#f2ede0', fg: '#b03a2e' }]
    }[o.era] || ['STARLITE DINER', 'neon', { fg: '#41d8ff' }];
    const s = signBoard(dSigns[0], dSigns[1], 9, 1.6, dSigns[2]);
    s.position.set(0, bodyH + 2.4, bodyD / 2 + 0.4);
    g.add(s);
    // parking pad + curb stops
    g.add(TB.mesh(TB.geo.box, TB.mat(0x3c3d40), bodyW * 0.15, 0.02, bodyD / 2 + 4.5, o.w * 0.9, 0.04, 6));
    for (let i = 0; i < 3; i++) {
      g.add(TB.mesh(TB.geo.box, TB.mat(0xd8d4c8), -o.w * 0.25 + i * o.w * 0.25, 0.15, bodyD / 2 + 2.2, 2.2, 0.3, 0.4));
    }
    g.userData.height = 12;
    return g;
  };

  // ------------------------------------------------------------------
  // WAREHOUSE — 1945/65 brick industrial
  // ------------------------------------------------------------------
  B.warehouse = function (o) {
    const g = new THREE.Group();
    const r = TB.rng(o.seed);
    const h = 12;
    const tex = TB.tex.brickFacade({
      base: '#6e4434', floors: 3, cols: Math.round(o.w / 6),
      windowLit: 0.04, grime: 1.0, seed: o.seed, frame: '#2a2a2c'
    });
    g.add(facadeBox(o.w, h, o.d, tex, {}));
    // sawtooth roof
    for (let i = 0; i < 4; i++) {
      const tooth = TB.mesh(TB.geo.box, TB.mat(0x5c5850), -o.w / 2 + o.w * (i + 0.5) / 4, h + 0.9, 0, o.w / 4 - 0.4, 1.8, o.d * 0.9);
      tooth.rotation.x = 0.0;
      g.add(tooth);
      g.add(TB.mesh(TB.geo.box, TB.mat(0x8fa8b8, { metalness: 0.4, roughness: 0.3 }), -o.w / 2 + o.w * (i + 0.5) / 4, h + 1.2, o.d * 0.28, o.w / 4 - 1, 1.2, 0.15));
    }
    // loading dock + rolling door
    g.add(TB.mesh(TB.geo.box, TB.mat(0x55504a), -o.w * 0.15, 0.6, o.d / 2 + 1.1, 8, 1.2, 2.2));
    g.add(TB.mesh(TB.geo.box, TB.mat(0x746e62, { metalness: 0.5, roughness: 0.6 }), -o.w * 0.15, 3.2, o.d / 2 + 0.06, 6.5, 4.2, 0.15));
    // painted ghost sign
    const s = signBoard(o.era <= 1945 ? 'ACME CARTAGE Co.' : 'ACME CARTAGE Co.', 'painted', o.w * 0.6, 2.2, { bg: '#6e4434', fg: '#d8c8a0', seed: o.seed });
    s.position.set(0, h - 2.4, o.d / 2 + 0.08);
    s.material.opacity = o.era >= 1965 ? 0.6 : 0.95;
    s.material.transparent = true;
    g.add(s);
    // smokestack (1945 smokes!)
    const stack = TB.mesh(new THREE.CylinderGeometry(0.8, 1.1, 9, 10), TB.mat(0x5a3428), o.w * 0.32, h + 4.5, -o.d * 0.2);
    stack.castShadow = true;
    g.add(stack);
    if (o.era <= 1945) g.userData.smokestack = new THREE.Vector3(o.w * 0.32, h + 9.2, -o.d * 0.2);
    g.userData.height = h + 9;
    return g;
  };

  // ------------------------------------------------------------------
  // BRUTALIST SLAB — 1985 office
  // ------------------------------------------------------------------
  B.brutalist = function (o) {
    const g = new THREE.Group();
    const r = TB.rng(o.seed);
    const env = TB.ERA_ENV[o.era];
    const h = 22;
    const tex = TB.tex.concreteFacade({
      base: '#8f8b82', floors: 6, cols: Math.round(o.w / 4),
      windowLit: env.windowsLit, grime: o.era <= 2005 ? 0.45 : 0.2, seed: o.seed, frame: '#33322e'
    });
    g.add(facadeBox(o.w, h, o.d, tex, { glow: env.windowsLit > 0.3 ? 0.3 : 0 }));
    // heavy top band + pilotis entrance
    g.add(TB.mesh(TB.geo.box, TB.mat(0x7d7a72), 0, h + 0.6, 0, o.w + 1, 1.4, o.d + 1));
    g.add(TB.mesh(TB.geo.box, TB.mat(0x18140f), 0, 2.0, o.d / 2 - 1.2, o.w * 0.7, 4.0, 2.4));
    for (let i = -2; i <= 2; i++) {
      g.add(TB.mesh(TB.geo.box, TB.mat(0x8f8b82), i * o.w / 6, 2.0, o.d / 2 - 0.4, 1.1, 4.0, 1.1));
    }
    const st = signBoard(o.era <= 1985 ? 'CENTRUM PLAZA' : (o.era === 2005 ? 'CENTRUM PLAZA — SUITES AVAIL' : 'THE CENTRUM LOFTS'),
      o.era <= 1985 ? 'plastic' : (o.era === 2005 ? 'backlit' : 'led'),
      { bg: '#dedad0', fg: '#5a3428', seed: o.seed });
    st.position.set(0, 4.9, o.d / 2 + 0.15);
    g.add(st);
    // 2025 loft conversion: add balconies + greenery
    if (o.era >= 2025) {
      const balc = TB.mat(0x2c3138, { metalness: 0.6, roughness: 0.4 });
      for (let f = 2; f < 6; f++) {
        for (let i = -1; i <= 1; i++) {
          g.add(TB.mesh(TB.geo.box, balc, i * o.w / 3.4, f * h / 6 + 0.4, o.d / 2 + 0.7, 3.4, 0.15, 1.3));
          g.add(TB.mesh(TB.geo.box, balc, i * o.w / 3.4, f * h / 6 + 0.95, o.d / 2 + 1.3, 3.4, 1.0, 0.08));
          if (r() < 0.5) g.add(TB.mesh(TB.geo.sphere, TB.mat(0x3f6b38), i * o.w / 3.4 + 1, f * h / 6 + 0.8, o.d / 2 + 0.9, 0.7, 0.6, 0.7));
        }
      }
    }
    roofClutter(g, o.w, h, o.d, o.era, r);
    g.userData.height = h;
    return g;
  };

  // ------------------------------------------------------------------
  // GLASS TOWER — 2005/2025 corporate
  // ------------------------------------------------------------------
  B.glassTower = function (o) {
    const g = new THREE.Group();
    const r = TB.rng(o.seed);
    const env = TB.ERA_ENV[o.era];
    const h = o.tall ? 34 : 26;
    const tints = o.era >= 2025 ? ['#8fb8d8', '#2c4a66'] : ['#7fa8c9', '#33506e'];
    const tex = TB.tex.glassFacade({
      tintA: tints[0], tintB: tints[1], floors: Math.round(h / 2.6),
      cols: Math.round(o.w / 2.6), windowLit: env.windowsLit, seed: o.seed
    });
    const body = facadeBox(o.w, h, o.d, tex, { glow: env.windowsLit > 0.3 ? 0.4 : 0.08, roofColor: 0x3a4048, extra: { metalness: 0.55, roughness: 0.25 } });
    g.add(body);
    // lobby: double-height glass + mullions + canopy
    g.add(TB.mesh(TB.geo.box, new THREE.MeshStandardMaterial({ color: 0x121a24, roughness: 0.08, metalness: 0.7, emissive: 0x9fc8e8, emissiveIntensity: 0.07 }),
      0, 2.6, o.d / 2 + 0.05, o.w * 0.85, 5.2, 0.15));
    const mull = TB.mat(0x2c3238, { metalness: 0.7, roughness: 0.3 });
    for (let mi = -3; mi <= 3; mi++) {
      g.add(TB.mesh(TB.geo.box, mull, mi * o.w * 0.12, 2.6, o.d / 2 + 0.14, 0.22, 5.2, 0.1));
    }
    g.add(TB.mesh(TB.geo.box, mull, 0, 5.15, o.d / 2 + 0.14, o.w * 0.85, 0.25, 0.12));
    g.add(TB.mesh(TB.geo.box, TB.mat(0x33383e, { metalness: 0.7, roughness: 0.3 }), 0, 5.4, o.d / 2 + 1.4, o.w * 0.6, 0.25, 2.8));
    const corpName = o.era >= 2025 ? (o.alt ? 'nimbus.ai' : 'VANTA MEDIA') : (o.alt ? 'GLOBODYNE' : 'MERIDIAN FINANCIAL');
    const st = signBoard(corpName, o.era >= 2025 ? 'led' : 'backlit', { fg: o.era >= 2025 ? '#7fe8d0' : '#28527a', seed: o.seed });
    st.scale.set(1, 1, 1);
    st.position.set(0, 6.6, o.d / 2 + 0.2);
    g.add(st);
    roofClutter(g, o.w, h, o.d, o.era, r);
    g.userData.height = h;
    return g;
  };

  // ------------------------------------------------------------------
  // MIDRISE MODERN — 2025 mixed-use with timber accents
  // ------------------------------------------------------------------
  B.midrise = function (o) {
    const g = new THREE.Group();
    const r = TB.rng(o.seed);
    const env = TB.ERA_ENV[o.era];
    const h = 18;
    const tex = TB.tex.glassFacade({
      tintA: '#a8c4b8', tintB: '#40524a', floors: 5, cols: Math.round(o.w / 3.2),
      windowLit: env.windowsLit, seed: o.seed, frame: 'rgba(90,70,50,0.95)'
    });
    g.add(facadeBox(o.w, h, o.d, tex, { glow: env.windowsLit > 0.3 ? 0.35 : 0.05, extra: { metalness: 0.3, roughness: 0.4 } }));
    // timber fins
    for (let i = 0; i <= 6; i++) {
      g.add(TB.mesh(TB.geo.box, TB.mat(0x9a6b42, { roughness: 0.8 }), -o.w / 2 + i * o.w / 6, h / 2 + 2, o.d / 2 + 0.25, 0.4, h - 4, 0.5));
    }
    // rooftop garden
    g.add(TB.mesh(TB.geo.box, TB.mat(0x39592f), 0, h + 0.3, 0, o.w * 0.8, 0.5, o.d * 0.7));
    for (let i = 0; i < 5; i++) {
      g.add(TB.mesh(TB.geo.sphere, TB.mat(0x3f6b38), (r() - 0.5) * o.w * 0.6, h + 1.1, (r() - 0.5) * o.d * 0.5, 1.4, 1.2, 1.4));
    }
    if (o.store) TB.buildings.storefrontStrip(g, o.w, o.d, o.store, o.era);
    g.userData.height = h;
    return g;
  };

  // ------------------------------------------------------------------
  // FUTURE TOWER — 2055 curved glow monolith
  // ------------------------------------------------------------------
  B.futureTower = function (o) {
    const g = new THREE.Group();
    const r = TB.rng(o.seed);
    const h = o.tall ? 46 : 36;
    const tex = TB.tex.futureFacade({ floors: Math.round(h / 1.6), windowLit: 0.6, seed: o.seed, accent: o.accent || '#22e6c8' });
    // curved: use a cylinder segment scaled elliptically
    const geo = new THREE.CylinderGeometry(1, 1, 1, 24, 1, false);
    const mat = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.4, metalness: 0.5,
      emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.9
    });
    const body = new THREE.Mesh(geo, mat);
    body.scale.set(o.w * 0.52, h, o.d * 0.52);
    body.position.y = h / 2;
    body.castShadow = body.receiveShadow = true;
    g.add(body);
    // tapering crown
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1, 1, 24), mat.clone());
    crown.scale.set(o.w * 0.52, 6, o.d * 0.52);
    crown.position.y = h + 3;
    g.add(crown);
    // glow base ring
    g.add(TB.mesh(new THREE.CylinderGeometry(1, 1, 1, 24),
      new THREE.MeshBasicMaterial({ color: o.accent ? new THREE.Color(o.accent) : 0x22e6c8 }),
      0, 0.25, 0, o.w * 0.55, 0.5, o.d * 0.55));
    // floating holo ring
    const ring = TB.mesh(TB.geo.torus, new THREE.MeshBasicMaterial({ color: o.accent ? new THREE.Color(o.accent) : 0x22e6c8, transparent: true, opacity: 0.7 }),
      0, h * 0.75, 0, o.w * 0.75, o.w * 0.75, o.w * 0.75);
    ring.rotation.x = Math.PI / 2;
    ring.userData.spin = 0.25;
    ring.userData.bob = 0.6;
    g.add(ring);
    // sky lobby fins
    for (let i = 0; i < 3; i++) {
      g.add(TB.mesh(TB.geo.box, TB.mat(0x0e1826, { metalness: 0.6, roughness: 0.3 }), 0, h * (0.3 + i * 0.22), 0, o.w * 0.62, 0.5, o.d * 0.62));
    }
    if (o.name) {
      const st = signBoard(o.name, 'holo', 10, 1.7, { fg: o.accent || '#41f2ff' });
      st.position.set(0, 7.5, o.d / 2 + 1.5);
      st.userData.bob = 0.3;
      g.add(st);
    }
    g.userData.height = h + 6;
    return g;
  };

  // ------------------------------------------------------------------
  // VERTICAL FARM — 2055 green stack
  // ------------------------------------------------------------------
  B.verticalFarm = function (o) {
    const g = new THREE.Group();
    const r = TB.rng(o.seed);
    const h = 28;
    const frame = TB.mat(0xd8dee4, { metalness: 0.5, roughness: 0.4 });
    const glass = new THREE.MeshStandardMaterial({
      color: 0x9fd8c0, roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.55,
      emissive: 0xbfffe0, emissiveIntensity: 0.5
    });
    const levels = 7;
    for (let i = 0; i < levels; i++) {
      const y = i * (h / levels);
      g.add(TB.mesh(TB.geo.box, frame, 0, y + 0.25, 0, o.w, 0.5, o.d));
      g.add(TB.mesh(TB.geo.box, glass, 0, y + (h / levels) / 2, 0, o.w * 0.92, h / levels - 0.7, o.d * 0.92));
      // crop rows glowing inside
      for (let cRow = 0; cRow < 3; cRow++) {
        g.add(TB.mesh(TB.geo.box, new THREE.MeshStandardMaterial({ color: 0x2f7a3c, emissive: 0xc850ff, emissiveIntensity: 0.55 }),
          0, y + 1.1, -o.d / 2 + o.d * (cRow + 0.5) / 3, o.w * 0.8, 0.5, 1.6));
      }
    }
    g.add(TB.mesh(TB.geo.box, frame, 0, h + 0.4, 0, o.w + 0.6, 0.8, o.d + 0.6));
    // wind micro-turbines on top
    for (let i = -1; i <= 1; i++) {
      const t = new THREE.Group();
      t.add(TB.mesh(TB.geo.cyl, frame, 0, 1.4, 0, 0.12, 2.8, 0.12));
      const rotor = new THREE.Group();
      for (let bIdx = 0; bIdx < 3; bIdx++) {
        const blade = TB.mesh(TB.geo.box, TB.mat(0xffffff), 0, 0, 0, 0.12, 1.8, 0.04);
        blade.rotation.z = bIdx * 2.094;
        blade.position.set(Math.sin(bIdx * 2.094) * 0.8, Math.cos(bIdx * 2.094) * 0.8, 0);
        rotor.add(blade);
      }
      rotor.position.y = 2.9;
      rotor.userData.rotor = 3.5;
      t.add(rotor);
      t.position.set(i * o.w * 0.3, h + 0.8, 0);
      g.add(t);
    }
    const st = signBoard('AGRISTACK URBAN FARM 07', 'holo', 11, 1.6, { fg: '#7dffb0' });
    st.position.set(0, 5.5, o.d / 2 + 1.2);
    g.add(st);
    g.userData.height = h + 5;
    return g;
  };

  // ------------------------------------------------------------------
  // GAS STATION — evolves 1945 → 2055 hover pad
  // ------------------------------------------------------------------
  B.gasStation = function (o) {
    const g = new THREE.Group();
    const era = o.era;
    const r = TB.rng(o.seed);
    // kiosk
    const kioskW = era >= 2005 ? 10 : 6.5;
    const kioskCol = era <= 1945 ? 0xd8d0b8 : (era <= 1985 ? 0xe8e4d8 : 0xdde4ea);
    const kiosk = TB.mesh(TB.geo.box, TB.mat(kioskCol), -o.w * 0.25, 1.9, -o.d * 0.2, kioskW, 3.8, 6);
    kiosk.castShadow = kiosk.receiveShadow = true;
    g.add(kiosk);
    g.add(TB.mesh(TB.geo.box, new THREE.MeshStandardMaterial({ color: 0x2c3238, emissive: 0xfff0c0, emissiveIntensity: era >= 1985 ? 0.5 : 0.2, roughness: 0.2 }),
      -o.w * 0.25, 1.7, -o.d * 0.2 + 3.02, kioskW * 0.8, 1.8, 0.08));
    // canopy
    const canopyCol = { 1945: 0xb03a2e, 1965: 0xff8f2e, 1985: 0xe8e4d8, 2005: 0x2255aa, 2025: 0x22aa66, 2055: 0x101828 }[era];
    const canopy = TB.mesh(TB.geo.box, TB.mat(canopyCol), o.w * 0.12, era <= 1965 ? 4.6 : 5.4, o.d * 0.12, o.w * 0.6, 0.55, o.d * 0.55);
    canopy.castShadow = true;
    g.add(canopy);
    if (era === 2055) {
      g.add(TB.mesh(TB.geo.box, new THREE.MeshBasicMaterial({ color: 0x41f2ff }), o.w * 0.12, 5.15, o.d * 0.12, o.w * 0.6 + 0.1, 0.08, o.d * 0.55 + 0.1));
    }
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
      g.add(TB.mesh(TB.geo.cyl, TB.mat(0xb8b8b4, { metalness: 0.6 }), o.w * 0.12 + dx * o.w * 0.22, 2.4, o.d * 0.12 + dz * o.d * 0.19, 0.3, era <= 1965 ? 4.6 : 5.4, 0.3));
    }
    // pumps
    const pumpCount = era >= 2005 ? 3 : 2;
    for (let i = 0; i < pumpCount; i++) {
      const px = o.w * 0.12 + (i - (pumpCount - 1) / 2) * 4.2;
      const pz = o.d * 0.12;
      if (era <= 1965) {
        // rounded classic pump with glass globe
        const col = era === 1945 ? 0xb03a2e : 0xff8f2e;
        g.add(TB.mesh(TB.geo.box, TB.mat(col, { roughness: 0.4 }), px, 1.1, pz, 0.9, 2.2, 0.7));
        g.add(TB.mesh(TB.geo.sphere, new THREE.MeshStandardMaterial({ color: 0xfff8e0, emissive: 0xfff0c0, emissiveIntensity: 0.4 }), px, 2.55, pz, 0.5, 0.5, 0.5));
      } else if (era <= 2025) {
        g.add(TB.mesh(TB.geo.box, TB.mat(era === 1985 ? 0xd8d4c8 : 0xe4e8ec, { roughness: 0.5 }), px, 1.0, pz, 1.3, 2.0, 0.7));
        g.add(TB.mesh(TB.geo.box, TB.mat(0x222428), px, 1.55, pz + 0.36, 0.9, 0.6, 0.05));
        if (era === 2025) {
          // EV charger style: sleeker, glowing cable port
          g.add(TB.mesh(TB.geo.box, new THREE.MeshStandardMaterial({ color: 0x30ff90, emissive: 0x30ff90, emissiveIntensity: 1.2 }), px, 1.9, pz + 0.37, 0.5, 0.1, 0.03));
        }
      } else {
        // 2055 induction pads on the ground
        g.add(TB.mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.12, 24),
          new THREE.MeshStandardMaterial({ color: 0x0c1826, emissive: 0x41f2ff, emissiveIntensity: 1.0 }), px, 0.06, pz, 1, 1, 1));
      }
    }
    // road sign pole with prices — the era gag
    const priceTxt = {
      1945: 'REGAL GAS  ·  21¢', 1965: 'REGAL  ·  31¢  FREE GLASS!', 1985: 'REGAL  ·  $1.19  SELF SERVE',
      2005: 'REGAL  ·  $2.89  ATM INSIDE', 2025: 'VOLT-N-GO  ·  ¢/kWh 31', 2055: 'GRAVPAD  ·  4 CR/LIFT'
    }[era];
    const pole = TB.mesh(TB.geo.cyl, TB.mat(0x707478, { metalness: 0.6 }), o.w * 0.42, 4.5, o.d * 0.42, 0.22, 9, 0.22);
    g.add(pole);
    const st = signBoard(priceTxt, era <= 1965 ? 'enamel' : (era <= 2005 ? 'plastic' : (era === 2025 ? 'led' : 'holo')), 6.5, 1.7, { bg: '#b03a2e', fg: '#ffffff', seed: o.seed });
    st.position.set(o.w * 0.42, 8.2, o.d * 0.42);
    g.add(st);
    // pavement
    g.add(TB.mesh(TB.geo.box, TB.mat(era >= 2055 ? 0x1a2230 : 0x45464a), 0, 0.02, 0, o.w, 0.06, o.d));
    g.userData.height = 10;
    return g;
  };

  // ------------------------------------------------------------------
  // PARKING LOT — the sad 2005 hole in the block
  // ------------------------------------------------------------------
  B.parkingLot = function (o) {
    const g = new THREE.Group();
    const r = TB.rng(o.seed);
    g.add(TB.mesh(TB.geo.box, TB.mat(0x3f4044), 0, 0.03, 0, o.w, 0.08, o.d));
    // painted stalls
    const lineMat = TB.mat(0xd8d4c0);
    const stalls = Math.floor(o.w / 3.2);
    for (let i = 0; i <= stalls; i++) {
      g.add(TB.mesh(TB.geo.box, lineMat, -o.w / 2 + i * 3.2 + 1, 0.09, o.d / 4, 0.18, 0.02, 5.5));
      g.add(TB.mesh(TB.geo.box, lineMat, -o.w / 2 + i * 3.2 + 1, 0.09, -o.d / 4, 0.18, 0.02, 5.5));
    }
    // chain-link fence on three sides
    const postMat = TB.mat(0x8a8f94, { metalness: 0.7 });
    const linkMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.6, roughness: 0.5, transparent: true, opacity: 0.28 });
    for (const side of ['L', 'R', 'B']) {
      const len = side === 'B' ? o.w : o.d;
      const n = Math.ceil(len / 4);
      for (let i = 0; i <= n; i++) {
        const t = -len / 2 + (len / n) * i;
        const px = side === 'B' ? t : (side === 'L' ? -o.w / 2 : o.w / 2);
        const pz = side === 'B' ? -o.d / 2 : t;
        g.add(TB.mesh(TB.geo.cyl, postMat, px, 1.3, pz, 0.1, 2.6, 0.1));
      }
      const fx = side === 'B' ? 0 : (side === 'L' ? -o.w / 2 : o.w / 2);
      const fz = side === 'B' ? -o.d / 2 : 0;
      const fence = TB.mesh(TB.geo.box, linkMat, fx, 1.3, fz, side === 'B' ? len : 0.06, 2.4, side === 'B' ? 0.06 : len);
      g.add(fence);
    }
    // attendant booth + sign
    g.add(TB.mesh(TB.geo.box, TB.mat(0xc8b878), -o.w / 2 + 2, 1.4, o.d / 2 - 2, 2.2, 2.8, 2.2));
    const st = signBoard('PARK-RITE  $8 ALL DAY', 'plastic', 6, 1.4, { bg: '#f0d020', fg: '#222222', seed: o.seed });
    st.position.set(-o.w / 2 + 4.5, 3.6, o.d / 2 - 0.5);
    g.add(st);
    // weeds at the fence line
    for (let i = 0; i < 10; i++) {
      g.add(TB.mesh(TB.geo.cone, TB.mat(0x5a6b38), -o.w / 2 + r() * o.w, 0.35, -o.d / 2 + 0.5 + r() * 1.2, 0.5, 0.7, 0.5));
    }
    g.userData.height = 3;
    g.userData.flat = true;
    return g;
  };

  // ------------------------------------------------------------------
  // HOTEL — persists all eras, sign evolves
  // ------------------------------------------------------------------
  B.hotel = function (o) {
    const g = new THREE.Group();
    const r = TB.rng(o.seed);
    const env = TB.ERA_ENV[o.era];
    const h = 24;
    const renovated = o.era >= 2005;
    const tex = renovated
      ? TB.tex.stoneFacade({ base: '#cfc4ac', floors: 7, cols: Math.round(o.w / 3.6), windowLit: env.windowsLit, grime: o.era === 2005 ? 0.2 : 0.1, seed: o.seed })
      : TB.tex.brickFacade({ base: '#7a4030', floors: 7, cols: Math.round(o.w / 3.6), windowLit: env.windowsLit, grime: o.era <= 1945 ? 0.8 : (o.era === 1985 ? 1.0 : 0.6), seed: o.seed, acUnits: o.era === 1985 });
    g.add(facadeBox(o.w, h, o.d, tex, { glow: env.windowsLit > 0.3 ? 0.35 : 0 }));
    g.add(cornice(o.w, o.d, h + 0.2, renovated ? 0xbfb49a : 0x5c4030));
    // entrance canopy on the facing side
    g.add(TB.mesh(TB.geo.box, TB.mat(renovated ? 0x28323c : 0x6b1f1a), 0, 4.0, o.d / 2 + 1.5, 7, 0.4, 3));
    for (const dx of [-1, 1]) {
      g.add(TB.mesh(TB.geo.cyl, TB.mat(0xc8b878, { metalness: 0.8, roughness: 0.3 }), dx * 3, 2.0, o.d / 2 + 2.6, 0.15, 4.0, 0.15));
    }
    g.add(TB.mesh(TB.geo.box, TB.mat(0x2a1c12), 0, 1.9, o.d / 2 + 0.08, 4.5, 3.8, 0.15));
    // vertical HOTEL blade sign
    const blade = new THREE.Group();
    blade.add(TB.mesh(TB.geo.box, TB.mat(0x1c1814), 0, 0, 0, 1.8, 12, 0.5));
    const bladeStyle = o.era <= 1945 ? 'painted' : (o.era <= 1985 ? 'neon' : (o.era >= 2055 ? 'holo' : 'led'));
    const txt = { 1945: 'HOTEL REGENT', 1965: 'HOTEL REGENT', 1985: 'HOT L REGENT', 2005: 'THE REGENT', 2025: 'REGENT HOUSE', 2055: 'REGENT ∞ SUITES' }[o.era];
    for (const side of [-1, 1]) {
      const st = signBoard(txt, bladeStyle, 11, 1.5, { fg: o.era === 1985 ? '#ff3a3a' : '#ffd870', seed: o.seed });
      st.rotation.z = -Math.PI / 2;
      st.position.set(0, 0, side * 0.3);
      if (side < 0) st.rotation.y = Math.PI;
      blade.add(st);
    }
    blade.position.set(0, h - 7, o.d / 2 + 1.1);
    g.add(blade);
    // 2055: spire extension
    if (o.era >= 2055) {
      const ext = TB.mesh(TB.geo.box, new THREE.MeshStandardMaterial({
        map: TB.tex.futureFacade({ floors: 8, windowLit: 0.6, seed: o.seed + 9, accent: '#ffd870' }),
        emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0
      }), 0, h + 6, 0, o.w * 0.7, 12, o.d * 0.7);
      ext.material.emissiveMap = ext.material.map;
      ext.material.emissiveIntensity = 0.8;
      g.add(ext);
    }
    roofClutter(g, o.w, h, o.d, o.era, r);
    g.userData.height = h + (o.era >= 2055 ? 12 : 0);
    return g;
  };

  // ------------------------------------------------------------------
  // CONSTRUCTION crane — used on lots mid-redevelopment
  // ------------------------------------------------------------------
  B.crane = function (o) {
    const g = new THREE.Group();
    const yel = TB.mat(0xf0b429, { roughness: 0.5 });
    const mastH = 24;
    for (let i = 0; i < mastH / 3; i++) {
      g.add(TB.mesh(TB.geo.box, yel, 0, i * 3 + 1.5, 0, 1.4, 0.18, 1.4));
    }
    g.add(TB.mesh(TB.geo.box, yel, 0, mastH / 2, 0.6, 0.15, mastH, 0.15));
    g.add(TB.mesh(TB.geo.box, yel, 0, mastH / 2, -0.6, 0.15, mastH, 0.15));
    g.add(TB.mesh(TB.geo.box, yel, 0.6, mastH / 2, 0, 0.15, mastH, 0.15));
    g.add(TB.mesh(TB.geo.box, yel, -0.6, mastH / 2, 0, 0.15, mastH, 0.15));
    const jib = TB.mesh(TB.geo.box, yel, 6, mastH + 0.6, 0, 14, 0.8, 0.8);
    g.add(jib);
    g.add(TB.mesh(TB.geo.box, yel, -3.5, mastH + 0.6, 0, 5, 0.8, 0.8));
    g.add(TB.mesh(TB.geo.box, TB.mat(0x707478), -4.5, mastH + 0.4, 0, 1.5, 1.5, 1.5)); // counterweight
    // cable + hook
    g.add(TB.mesh(TB.geo.cyl, TB.mat(0x333), 9, mastH - 3, 0, 0.04, 7, 0.04));
    g.add(TB.mesh(TB.geo.box, TB.mat(0xcc3333), 9, mastH - 6.6, 0, 0.6, 0.6, 0.6));
    g.userData.height = mastH + 2;
    return g;
  };

})();
