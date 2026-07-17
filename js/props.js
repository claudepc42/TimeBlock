// TimeBlock — street furniture, per-era props
'use strict';
window.TB = window.TB || {};
TB.props = {};

(function () {
  const P = TB.props;

  // ---------- streetlight ----------
  P.streetlight = function (era, lit) {
    const g = new THREE.Group();
    const metal = TB.mat(era <= 1965 ? 0x2a2e2a : (era >= 2055 ? 0x1a2230 : 0x555a5e), { metalness: 0.7, roughness: 0.4 });
    if (era <= 1965) {
      // ornate: fluted pole, glass lantern
      g.add(TB.mesh(TB.geo.cyl, metal, 0, 2.6, 0, 0.22, 5.2, 0.22));
      g.add(TB.mesh(TB.geo.cyl, metal, 0, 0.25, 0, 0.5, 0.5, 0.5));
      const lamp = TB.mesh(TB.geo.sphere, new THREE.MeshStandardMaterial({
        color: 0xfff4d0, emissive: 0xffe8a8, emissiveIntensity: lit ? 1.8 : 0.05
      }), 0, 5.6, 0, 0.55, 0.7, 0.55);
      g.add(lamp);
      g.add(TB.mesh(TB.geo.cone, metal, 0, 6.15, 0, 0.5, 0.4, 0.5));
      g.userData.lampY = 5.6;
    } else if (era <= 2025) {
      // cobra head
      g.add(TB.mesh(TB.geo.cyl, metal, 0, 3.6, 0, 0.18, 7.2, 0.18));
      const arm = TB.mesh(TB.geo.cyl, metal, 0.9, 7.1, 0, 0.1, 2.2, 0.1);
      arm.rotation.z = Math.PI / 2.4;
      g.add(arm);
      const head = TB.mesh(TB.geo.box, metal, 1.8, 7.4, 0, 1.3, 0.25, 0.45);
      g.add(head);
      g.add(TB.mesh(TB.geo.box, new THREE.MeshStandardMaterial({
        color: 0xfff8e8, emissive: era >= 2005 ? 0xf8fbff : 0xffd88a, emissiveIntensity: lit ? 2.0 : 0.05
      }), 1.8, 7.28, 0, 1.1, 0.08, 0.35));
      g.userData.lampY = 7.3; g.userData.lampX = 1.8;
    } else {
      // 2055: slim mast with floating light blade
      g.add(TB.mesh(TB.geo.cyl, metal, 0, 3.8, 0, 0.1, 7.6, 0.1));
      const blade = TB.mesh(TB.geo.box, new THREE.MeshStandardMaterial({
        color: 0xbfe8ff, emissive: 0x9fdcff, emissiveIntensity: lit ? 2.4 : 0.2, transparent: true, opacity: 0.9
      }), 0, 7.8, 0, 2.6, 0.1, 0.5);
      blade.userData.bob = 0.15;
      g.add(blade);
      g.userData.lampY = 7.8;
    }
    return g;
  };

  // ---------- traffic light (1985+) / trolley pole (1945) ----------
  P.trafficLight = function (era) {
    const g = new THREE.Group();
    const metal = TB.mat(0x3a3e42, { metalness: 0.7, roughness: 0.4 });
    g.add(TB.mesh(TB.geo.cyl, metal, 0, 2.6, 0, 0.15, 5.2, 0.15));
    const head = TB.mesh(TB.geo.box, TB.mat(era >= 2055 ? 0x101820 : 0x2a2c1e), 0, 5.6, 0, 0.55, 1.5, 0.5);
    g.add(head);
    const cols = [0xff3a2e, 0xffc82e, 0x3aff5e];
    for (let i = 0; i < 3; i++) {
      const on = i === 2; // stuck on green, city of dreams
      g.add(TB.mesh(TB.geo.sphere, new THREE.MeshStandardMaterial({
        color: cols[i], emissive: cols[i], emissiveIntensity: on ? 1.6 : 0.08
      }), 0, 6.1 - i * 0.5, 0.27, 0.28, 0.28, 0.12));
    }
    if (era >= 2025) {
      // pedestrian countdown box
      g.add(TB.mesh(TB.geo.box, new THREE.MeshStandardMaterial({ color: 0x101418, emissive: 0xff8800, emissiveIntensity: 0.9 }), 0.4, 3.4, 0, 0.4, 0.4, 0.2));
    }
    return g;
  };

  // ---------- fire hydrant ----------
  P.hydrant = function (era) {
    const col = era <= 1965 ? 0x1c5c2e : (era <= 2005 ? 0xc23b2e : (era >= 2055 ? 0x2a3a4e : 0xd8a020));
    const m = TB.mat(col, { roughness: 0.5, metalness: 0.3 });
    const g = new THREE.Group();
    g.add(TB.mesh(TB.geo.cyl, m, 0, 0.55, 0, 0.5, 1.1, 0.5));
    g.add(TB.mesh(TB.geo.sphere, m, 0, 1.15, 0, 0.5, 0.4, 0.5));
    g.add(TB.mesh(TB.geo.cyl, m, 0, 0.75, 0, 0.75, 0.18, 0.75));
    const c1 = TB.mesh(TB.geo.cyl, m, 0.32, 0.65, 0, 0.22, 0.3, 0.22);
    c1.rotation.z = Math.PI / 2; g.add(c1);
    const c2 = TB.mesh(TB.geo.cyl, m, -0.32, 0.65, 0, 0.22, 0.3, 0.22);
    c2.rotation.z = Math.PI / 2; g.add(c2);
    return g;
  };

  // ---------- tree that grows with the decades ----------
  P.tree = function (era, seed) {
    const r = TB.rng(seed);
    const ageScale = { 1945: 0.45, 1965: 0.65, 1985: 0.85, 2005: 1.0, 2025: 1.1, 2055: 1.15 }[era];
    const g = new THREE.Group();
    const trunk = TB.mesh(new THREE.CylinderGeometry(0.14, 0.22, 2.6, 8), TB.mat(0x5a4030, { roughness: 0.95 }), 0, 1.3, 0);
    trunk.castShadow = true;
    g.add(trunk);
    const leafCol = era >= 2055 ? 0x2a6b52 : (era === 1985 ? 0x4a6b2e : 0x4a7a34);
    const leaves = TB.mat(leafCol, { roughness: 0.95 });
    const blobs = 3 + Math.floor(r() * 3);
    for (let i = 0; i < blobs; i++) {
      const b = TB.mesh(TB.geo.sphere, leaves,
        (r() - 0.5) * 1.6, 2.8 + r() * 1.4, (r() - 0.5) * 1.6,
        1.6 + r() * 1.2, 1.4 + r() * 0.9, 1.6 + r() * 1.2);
      b.castShadow = true;
      g.add(b);
    }
    // planter or grate
    if (era >= 2005) {
      g.add(TB.mesh(TB.geo.box, TB.mat(0x4a5058, { metalness: 0.5 }), 0, 0.08, 0, 1.8, 0.16, 1.8));
    }
    g.scale.setScalar(ageScale);
    return g;
  };

  // ---------- phone booth: 1945 wood → 1965/85 glass → 2005 kiosk → gone ----------
  P.phoneBooth = function (era) {
    const g = new THREE.Group();
    if (era <= 1945) {
      const wood = TB.mat(0x6b3a22, { roughness: 0.9 });
      g.add(TB.mesh(TB.geo.box, wood, 0, 1.4, 0, 1.2, 2.8, 1.2));
      g.add(TB.mesh(TB.geo.box, TB.mat(0x28323a, { roughness: 0.2 }), 0, 1.6, 0.61, 0.8, 1.4, 0.05));
      g.add(TB.mesh(TB.geo.box, wood, 0, 2.95, 0, 1.35, 0.3, 1.35));
      const s = TB.buildings.signBoard('TELEPHONE', 'painted', 1.2, 0.35, { bg: '#26303a', fg: '#e8dcae' });
      s.position.set(0, 2.6, 0.62);
      g.add(s);
    } else if (era <= 1985) {
      const alu = TB.mat(0xa8b0b8, { metalness: 0.7, roughness: 0.3 });
      const glass = new THREE.MeshStandardMaterial({ color: 0x9fb8c8, transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.4 });
      for (const dy of [0.15, 2.65]) g.add(TB.mesh(TB.geo.box, alu, 0, dy, 0, 1.2, 0.3, 1.2));
      for (const dx of [-0.55, 0.55]) for (const dz of [-0.55, 0.55]) {
        g.add(TB.mesh(TB.geo.box, alu, dx, 1.4, dz, 0.12, 2.6, 0.12));
      }
      g.add(TB.mesh(TB.geo.box, glass, 0, 1.4, 0, 1.1, 2.3, 1.1));
      g.add(TB.mesh(TB.geo.box, TB.mat(0x1a1c20), 0, 1.5, -0.35, 0.5, 0.7, 0.3));
      const s = TB.buildings.signBoard('PHONE', era === 1985 ? 'plastic' : 'enamel', 1.1, 0.35, { bg: '#1c3a6b', fg: '#ffffff' });
      s.position.set(0, 2.45, 0.61);
      g.add(s);
    } else if (era === 2005) {
      // open kiosk on a pole, half-shell
      const alu = TB.mat(0x9aa2aa, { metalness: 0.7, roughness: 0.3 });
      g.add(TB.mesh(TB.geo.cyl, alu, 0, 1.0, 0, 0.14, 2.0, 0.14));
      const shell = TB.mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.2, 12, 1, true, 0, Math.PI), alu, 0, 1.9, 0);
      g.add(shell);
      g.add(TB.mesh(TB.geo.box, TB.mat(0x1a1c20), 0, 1.7, 0.1, 0.4, 0.6, 0.25));
    }
    return g; // 2025+: returns empty group — payphones are extinct
  };

  // ---------- mailbox / trash / newspaper boxes ----------
  P.mailbox = function (era) {
    const g = new THREE.Group();
    if (era >= 2055) return g;
    const col = era <= 1965 ? 0x2a4a2a : 0x2255aa;
    const m = TB.mat(col, { roughness: 0.5, metalness: 0.4 });
    g.add(TB.mesh(TB.geo.box, m, 0, 0.85, 0, 0.8, 1.1, 0.7));
    const top = TB.mesh(TB.geo.cyl, m, 0, 1.42, 0, 0.8, 0.72, 0.7);
    top.rotation.z = Math.PI / 2;
    top.scale.set(0.36, 0.8, 0.7);
    g.add(top);
    for (const dx of [-0.25, 0.25]) g.add(TB.mesh(TB.geo.box, m, dx, 0.15, 0, 0.12, 0.3, 0.12));
    return g;
  };

  P.trashcan = function (era) {
    const g = new THREE.Group();
    if (era <= 1985) {
      const m = TB.mat(0x777d82, { metalness: 0.8, roughness: 0.5 });
      const can = TB.mesh(new THREE.CylinderGeometry(0.45, 0.38, 1.0, 12), m, 0, 0.5, 0);
      g.add(can);
      // ridges
      for (let i = 0; i < 3; i++) {
        const ridge = TB.mesh(new THREE.TorusGeometry(0.44 - i * 0.02, 0.02, 6, 16), m, 0, 0.25 + i * 0.25, 0);
        ridge.rotation.x = Math.PI / 2;
        g.add(ridge);
      }
    } else if (era <= 2025) {
      g.add(TB.mesh(TB.geo.box, TB.mat(0x2f5a32, { roughness: 0.6 }), 0, 0.55, 0, 0.8, 1.1, 0.8));
      g.add(TB.mesh(TB.geo.box, TB.mat(0x223f24), 0, 1.15, 0, 0.9, 0.1, 0.9));
      if (era === 2025) {
        // recycling twin
        g.add(TB.mesh(TB.geo.box, TB.mat(0x2255aa, { roughness: 0.6 }), 1.0, 0.55, 0, 0.8, 1.1, 0.8));
      }
    } else {
      // 2055 smart compactor with status glow
      g.add(TB.mesh(TB.geo.box, TB.mat(0x1a2430, { metalness: 0.5, roughness: 0.4 }), 0, 0.7, 0, 0.9, 1.4, 0.9));
      g.add(TB.mesh(TB.geo.box, new THREE.MeshStandardMaterial({ color: 0x22e6c8, emissive: 0x22e6c8, emissiveIntensity: 1.4 }), 0, 1.2, 0.46, 0.5, 0.08, 0.02));
    }
    return g;
  };

  P.newsBox = function (era, seed) {
    const g = new THREE.Group();
    if (era < 1985 || era > 2005) return g;
    const r = TB.rng(seed);
    const n = era === 1985 ? 3 : 2;
    const cols = [0xc23b2e, 0x2255aa, 0xf0b429, 0x2a7a3c];
    for (let i = 0; i < n; i++) {
      const m = TB.mat(cols[(seed + i) % 4], { roughness: 0.5 });
      g.add(TB.mesh(TB.geo.box, m, i * 0.75, 0.6, 0, 0.65, 1.2, 0.6));
      g.add(TB.mesh(TB.geo.box, TB.mat(0xd8d8d0, { roughness: 0.2 }), i * 0.75, 0.85, 0.31, 0.5, 0.4, 0.02));
    }
    return g;
  };

  // ---------- bench ----------
  P.bench = function (era) {
    const g = new THREE.Group();
    const wood = TB.mat(era >= 2025 ? 0x9a6b42 : 0x5f4632, { roughness: 0.9 });
    const iron = TB.mat(0x2a2e32, { metalness: 0.7, roughness: 0.4 });
    for (let i = 0; i < 3; i++) g.add(TB.mesh(TB.geo.box, wood, 0, 0.55 + i * 0.02, -0.05 + i * 0.18, 2.4, 0.07, 0.16));
    for (let i = 0; i < 2; i++) g.add(TB.mesh(TB.geo.box, wood, 0, 0.85 + i * 0.25, -0.32, 2.4, 0.07, 0.16));
    for (const dx of [-1, 1]) {
      g.add(TB.mesh(TB.geo.box, iron, dx * 1.05, 0.28, 0, 0.1, 0.56, 0.7));
      g.add(TB.mesh(TB.geo.box, iron, dx * 1.05, 0.9, -0.3, 0.1, 0.7, 0.1));
    }
    return g;
  };

  // ---------- bus stop (1965+) ----------
  P.busStop = function (era) {
    const g = new THREE.Group();
    if (era <= 1945) {
      const pole = TB.mesh(TB.geo.cyl, TB.mat(0x3a3e42, { metalness: 0.6 }), 0, 1.6, 0, 0.1, 3.2, 0.1);
      g.add(pole);
      const s = TB.buildings.signBoard('TROLLEY', 'painted', 1.3, 0.45, { bg: '#26303a', fg: '#e8dcae' });
      s.position.y = 3.0;
      g.add(s);
      return g;
    }
    const frame = TB.mat(era >= 2055 ? 0x1a2430 : 0x4a5058, { metalness: 0.7, roughness: 0.35 });
    const glass = new THREE.MeshStandardMaterial({ color: 0xa8c8d8, transparent: true, opacity: 0.3, roughness: 0.1 });
    g.add(TB.mesh(TB.geo.box, frame, 0, 2.5, 0, 4.2, 0.15, 1.6));
    for (const dx of [-2, 2]) g.add(TB.mesh(TB.geo.box, frame, dx, 1.25, -0.7, 0.12, 2.5, 0.12));
    g.add(TB.mesh(TB.geo.box, glass, 0, 1.35, -0.75, 4.0, 2.2, 0.05));
    g.add(TB.mesh(TB.geo.box, frame, 0, 0.5, -0.35, 3.6, 0.1, 0.5));
    // ad panel — lit from 1985 on
    const ad = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.7), new THREE.MeshStandardMaterial({
      map: TB.tex.posterWall(era, 77), emissive: 0xffffff,
      emissiveMap: TB.tex.posterWall(era, 77), emissiveIntensity: era >= 1985 ? 0.5 : 0
    }));
    ad.position.set(1.95, 1.45, -0.6);
    ad.rotation.y = Math.PI;
    g.add(ad);
    if (era >= 2025) {
      const s = TB.buildings.signBoard(era >= 2055 ? 'POD ⋅ 2 MIN' : 'BUS ⋅ 4 MIN', era >= 2055 ? 'holo' : 'led', 2.2, 0.5, { fg: '#ffb020' });
      s.position.set(0, 2.9, 0.1);
      g.add(s);
    }
    return g;
  };

  // ---------- bike rack / share station (2005+) ----------
  P.bikeShare = function (era, seed) {
    const g = new THREE.Group();
    if (era < 2005) return g;
    const r = TB.rng(seed);
    const metal = TB.mat(0x8a9098, { metalness: 0.8, roughness: 0.3 });
    const n = era >= 2025 ? 4 : 2;
    for (let i = 0; i < n; i++) {
      const x = i * 1.1;
      if (era >= 2025 && r() < 0.7) {
        // docked e-bike / scooter silhouettes
        const col = TB.pick(r, [0xd84a3c, 0x30b060, 0x3070d0, 0xf0f0f0]);
        const bike = new THREE.Group();
        bike.add(TB.mesh(TB.geo.cyl, metal, 0, 0.45, 0.35, 0.35, 0.08, 0.35));
        bike.add(TB.mesh(TB.geo.cyl, metal, 0, 0.45, -0.35, 0.35, 0.08, 0.35));
        bike.children.forEach(function (wm) { wm.rotation.z = Math.PI / 2; });
        bike.add(TB.mesh(TB.geo.box, TB.mat(col), 0, 0.62, 0, 0.08, 0.1, 0.9));
        bike.add(TB.mesh(TB.geo.cyl, TB.mat(col), 0, 0.85, 0.35, 0.05, 0.5, 0.05));
        bike.add(TB.mesh(TB.geo.box, TB.mat(0x222), 0, 1.02, 0.35, 0.35, 0.05, 0.05));
        bike.position.set(x, 0, 0);
        g.add(bike);
      } else {
        // simple U-rack
        const u = TB.mesh(new THREE.TorusGeometry(0.4, 0.05, 8, 16, Math.PI), metal, x, 0.45, 0);
        g.add(u);
      }
    }
    if (era >= 2025) {
      g.add(TB.mesh(TB.geo.box, new THREE.MeshStandardMaterial({ color: 0x14202c, emissive: 0x30b0ff, emissiveIntensity: 0.8 }), -1.0, 0.85, 0, 0.5, 1.7, 0.3));
    }
    return g;
  };

  // ---------- parking meter (1965–2005) ----------
  P.parkingMeter = function (era) {
    const g = new THREE.Group();
    if (era < 1965 || era > 2005) return g;
    const m = TB.mat(0x8a8f94, { metalness: 0.8, roughness: 0.4 });
    g.add(TB.mesh(TB.geo.cyl, m, 0, 0.7, 0, 0.07, 1.4, 0.07));
    g.add(TB.mesh(TB.geo.box, m, 0, 1.55, 0, 0.35, 0.45, 0.15));
    g.add(TB.mesh(TB.geo.box, TB.mat(0xd8d8c8, { roughness: 0.3 }), 0, 1.58, 0.08, 0.25, 0.25, 0.02));
    return g;
  };

  // ---------- fire escape shadow era clutter: crates, barrels ----------
  P.barrel = function () {
    const g = new THREE.Group();
    const m = TB.mat(0x6b5232, { roughness: 0.9 });
    g.add(TB.mesh(new THREE.CylinderGeometry(0.45, 0.4, 1.1, 12), m, 0, 0.55, 0));
    for (const y of [0.25, 0.85]) g.add(TB.mesh(new THREE.TorusGeometry(0.45, 0.03, 6, 16), TB.mat(0x3a3a3a, { metalness: 0.6 }), 0, y, 0));
    g.children.forEach(function (c) { if (c.geometry.type === 'TorusGeometry') c.rotation.x = Math.PI / 2; });
    return g;
  };

  // ---------- delivery robot (2025) ----------
  P.deliveryBot = function () {
    const g = new THREE.Group();
    g.add(TB.mesh(TB.geo.box, TB.mat(0xf0f0ec, { roughness: 0.3 }), 0, 0.55, 0, 0.7, 0.6, 1.0));
    g.add(TB.mesh(TB.geo.box, TB.mat(0x18202c), 0, 0.85, 0.2, 0.6, 0.08, 0.5));
    for (const dx of [-0.3, 0.3]) for (const dz of [-0.35, 0.35]) {
      const w = TB.mesh(TB.geo.cyl, TB.mat(0x222428), dx, 0.18, dz, 0.36, 0.12, 0.36);
      w.rotation.z = Math.PI / 2;
      g.add(w);
    }
    const flagPole = TB.mesh(TB.geo.cyl, TB.mat(0xcccccc), 0.25, 1.3, -0.4, 0.02, 0.9, 0.02);
    g.add(flagPole);
    g.add(TB.mesh(TB.geo.box, TB.mat(0xff8020), 0.32, 1.65, -0.4, 0.18, 0.12, 0.02));
    g.userData.isBot = true;
    return g;
  };

  // ---------- hover drone (2055) ----------
  P.drone = function (accent) {
    const g = new THREE.Group();
    g.add(TB.mesh(TB.geo.box, TB.mat(0x1a2430, { metalness: 0.6, roughness: 0.3 }), 0, 0, 0, 0.8, 0.25, 0.8));
    for (const dx of [-0.45, 0.45]) for (const dz of [-0.45, 0.45]) {
      g.add(TB.mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 12), TB.mat(0x2a3644, { metalness: 0.5 }), dx, 0.05, dz, 1, 1, 1));
    }
    g.add(TB.mesh(TB.geo.box, new THREE.MeshStandardMaterial({ color: accent || 0x41f2ff, emissive: accent || 0x41f2ff, emissiveIntensity: 1.6 }), 0, -0.1, 0, 0.4, 0.06, 0.4));
    g.add(TB.mesh(TB.geo.box, TB.mat(0x8a5a2a), 0, -0.35, 0, 0.45, 0.35, 0.45)); // package
    return g;
  };

  // ---------- billboard structure (roof-mounted) ----------
  P.billboard = function (era, seed) {
    const g = new THREE.Group();
    const w = 14, h = 7;
    const frame = TB.mat(era >= 2055 ? 0x101c28 : 0x3a3e42, { metalness: 0.6, roughness: 0.4 });
    // support struts
    for (const dx of [-w / 3, 0, w / 3]) {
      const strut = TB.mesh(TB.geo.box, frame, dx, 1.6, -0.9, 0.25, 3.2, 0.25);
      strut.rotation.x = -0.35;
      g.add(strut);
      g.add(TB.mesh(TB.geo.box, frame, dx, 1.8, 0, 0.25, 3.6, 0.25));
    }
    const tex = TB.tex.billboard(era, seed);
    const isHolo = era >= 2055;
    const mat = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.6,
      emissive: 0xffffff, emissiveMap: tex,
      emissiveIntensity: isHolo ? 1.2 : (era === 1985 ? 0.7 : 0.12),
      transparent: isHolo, opacity: isHolo ? 0.92 : 1
    });
    const board = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    board.position.set(0, 3.6 + h / 2 - 1.6, 0.2);
    g.add(board);
    if (isHolo) board.userData.holoFlicker = true;
    // catwalk + lamps for the classic eras
    if (era <= 2005) {
      g.add(TB.mesh(TB.geo.box, frame, 0, 1.9, 0.5, w * 0.9, 0.1, 0.6));
      for (const dx of [-w / 3, 0, w / 3]) {
        const lampArm = TB.mesh(TB.geo.cyl, frame, dx, 7.6, 0.9, 0.06, 1.6, 0.06);
        lampArm.rotation.x = 0.7;
        g.add(lampArm);
        g.add(TB.mesh(TB.geo.sphere, new THREE.MeshStandardMaterial({
          color: 0xfff0c0, emissive: 0xffe8a8, emissiveIntensity: TB.ERA_ENV[era].streetlights ? 1.5 : 0.05
        }), dx, 8.2, 1.3, 0.25, 0.25, 0.25));
      }
    }
    return g;
  };

  // ---------- crosswalk + lane markings painted as ground decals ----------
  P.roadMarkings = function (era, streetRect) {
    // streetRect: {x0,z0,x1,z1} outer edges of asphalt ring; block inside
    const g = new THREE.Group();
    const white = TB.mat(era === 1945 ? 0xa8a49a : 0xd8d8d0, { roughness: 0.9 });
    const yellow = TB.mat(0xd8b020, { roughness: 0.9 });
    const y = 0.03;
    const bx0 = streetRect.bx0, bx1 = streetRect.bx1, bz0 = streetRect.bz0, bz1 = streetRect.bz1;
    const sx0 = streetRect.x0, sx1 = streetRect.x1, sz0 = streetRect.z0, sz1 = streetRect.z1;
    function dash(mat, x, z, w, d) {
      const m = TB.mesh(TB.geo.box, mat, x, y, z, w, 0.02, d);
      m.receiveShadow = true;
      g.add(m);
    }
    // center dashes: horizontal streets (top/bottom of block)
    const midS = (bz1 + sz1) / 2, midN = (bz0 + sz0) / 2;
    for (let x = bx0 - 14; x <= bx1 + 14; x += 6) {
      if (era >= 1965) { dash(yellow, x, midS, 3, 0.35); dash(yellow, x, midN, 3, 0.35); }
    }
    const midW = (bx0 + sx0) / 2, midE = (bx1 + sx1) / 2;
    for (let z = bz0 - 14; z <= bz1 + 14; z += 6) {
      if (era >= 1965) { dash(yellow, midW, z, 0.35, 3); dash(yellow, midE, z, 0.35, 3); }
    }
    // crosswalks at the four corners (zebra from 1965; plain lines 1945)
    const cwLen = (sz1 - bz1) - 1.2;
    function crosswalkH(cx, cz) {
      for (let i = -3; i <= 3; i++) dash(white, cx + i * 1.3, cz, 0.7, cwLen);
    }
    function crosswalkV(cx, cz) {
      for (let i = -3; i <= 3; i++) dash(white, cx, cz + i * 1.3, cwLen, 0.7);
    }
    if (era >= 1965) {
      crosswalkH(0, midS); crosswalkH(0, midN);
      crosswalkV(midW, 0); crosswalkV(midE, 0);
    }
    // 2025 bike lane strip on south street
    if (era === 2025) {
      const green = TB.mat(0x2a8a4a, { roughness: 0.9 });
      const bl = TB.mesh(TB.geo.box, green, 0, 0.025, bz1 + 2.2, bx1 - bx0, 0.02, 1.6);
      bl.receiveShadow = true;
      g.add(bl);
    }
    // 2055 glowing guide lanes
    if (era >= 2055) {
      const glow = new THREE.MeshStandardMaterial({ color: 0x103048, emissive: 0x2a9ad8, emissiveIntensity: 1.2 });
      for (const zz of [midS, midN]) g.add(TB.mesh(TB.geo.box, glow, 0, y, zz, bx1 - bx0 + 28, 0.02, 0.25));
      for (const xx of [midW, midE]) g.add(TB.mesh(TB.geo.box, glow, xx, y, 0, 0.25, 0.02, bz1 - bz0 + 28));
    }
    return g;
  };

  // ---------- floating holo-ad kiosk (2055 street level) ----------
  P.holoKiosk = function (text, accent) {
    const g = new THREE.Group();
    g.add(TB.mesh(new THREE.CylinderGeometry(0.5, 0.7, 0.5, 16), TB.mat(0x101c28, { metalness: 0.6 }), 0, 0.25, 0));
    const s = TB.buildings.signBoard(text, 'holo', 3.4, 1.0, { fg: accent || '#ff6ad8' });
    s.position.y = 2.2;
    s.userData.bob = 0.25;
    s.userData.spinY = 0.6;
    g.add(s);
    return g;
  };

})();
