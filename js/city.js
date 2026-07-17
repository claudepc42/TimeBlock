// TimeBlock — city assembly: lot timelines, per-era world builds, transitions
'use strict';
window.TB = window.TB || {};

(function () {
  // ---------------- geometry of the block ----------------
  const BX = 55, BZ = 35;          // block outer edge (includes sidewalk)
  const SIDE = 6;                  // sidewalk width
  const STREET = 16;               // street width
  const SX = BX + STREET, SZ = BZ + STREET;   // asphalt outer edge
  const OX = SX + SIDE, OZ = SZ + SIDE;       // outer sidewalk edge

  // ---------------- lot definitions ----------------
  // Each lot: position of its center, size, rotation (facade faces street).
  // timeline: era -> {id, gen} — same id = renovation wipe, new id = demolish+rebuild
  const LOTS = [
    { // L0 — SW corner
      x: -34, z: 19, w: 30, d: 20, ry: 0,
      timeline: {
        1945: { id: 'ten0', gen: (e) => TB.buildings.tenement({ w: 30, d: 20, floors: 4, era: e, seed: 11, posters: 'left', store: { name: "KELLER'S MARKET", style: 'painted', awning: ['#2a5a34', '#e8e0c8'], crates: true, trim: 0x2a4a2a } }) },
        1965: { id: 'ten0', gen: (e) => TB.buildings.tenement({ w: 30, d: 20, floors: 4, era: e, seed: 11, posters: 'left', store: { name: "KELLER'S SUPERETTE", style: 'enamel', bg: '#b03a2e', awning: ['#c23b2e', '#f0ead8'], trim: 0x8a2a20 } }) },
        1985: { id: 'ten0', gen: (e) => TB.buildings.tenement({ w: 30, d: 20, floors: 4, era: e, seed: 11, posters: 'left', store: { name: 'KWIK-STOP 24HR', style: 'plastic', bg: '#f0d020', fg: '#c0392b', trim: 0x3a3a3a } }) },
        2005: { id: 'condo0', gen: (e) => TB.buildings.glassTower({ w: 30, d: 20, era: e, seed: 12, alt: true }) },
        2025: { id: 'condo0', gen: (e) => TB.buildings.glassTower({ w: 30, d: 20, era: e, seed: 12, alt: true }) },
        2055: { id: 'condo0', gen: (e) => TB.buildings.glassTower({ w: 30, d: 20, era: e, seed: 12, alt: true }) }
      },
      billboard: true
    },
    { // L1 — rowhouses → diner → parking lot → midrise → future tower
      x: -8, z: 19, w: 22, d: 20, ry: 0,
      timeline: {
        1945: { id: 'row1', gen: (e) => TB.buildings.brownstoneRow({ w: 22, d: 16, era: e, seed: 21 }) },
        1965: { id: 'diner1', gen: (e) => TB.buildings.diner({ w: 22, d: 20, era: e, seed: 22 }) },
        1985: { id: 'diner1', gen: (e) => TB.buildings.diner({ w: 22, d: 20, era: e, seed: 22 }) },
        2005: { id: 'lot1', gen: (e) => TB.buildings.parkingLot({ w: 22, d: 20, era: e, seed: 23 }) },
        2025: { id: 'mid1', gen: (e) => TB.buildings.midrise({ w: 22, d: 20, era: e, seed: 24, store: { name: 'OAT & BEAN', style: 'backlit', fg: '#1a6b3c', awning: ['#3a5a44', '#e8e4d8'], trim: 0x2a3a30 } }) },
        2055: { id: 'ftow1', gen: (e) => TB.buildings.futureTower({ w: 22, d: 20, era: e, seed: 25, name: 'AXIOM SPIRE', accent: '#22e6c8' }) }
      }
    },
    { // L2 — the theater, six decades of marquee
      x: 15, z: 19, w: 24, d: 20, ry: 0,
      timeline: (function () {
        const t = {};
        TB.ERAS.forEach(function (e) { t[e] = { id: 'theater', gen: (era) => TB.buildings.theater({ w: 24, d: 20, era: era, seed: 31 }) }; });
        return t;
      })()
    },
    { // L3 — SE corner: art deco bank tower, permanent anchor
      x: 38, z: 19, w: 22, d: 20, ry: 0,
      timeline: (function () {
        const t = {};
        TB.ERAS.forEach(function (e) { t[e] = { id: 'deco', gen: (era) => TB.buildings.decoTower({ w: 22, d: 20, era: era, seed: 41 }) }; });
        return t;
      })()
    },
    { // L4 — NW corner: warehouse → brutalist → lofts → vertical farm
      x: -34, z: -19, w: 30, d: 20, ry: Math.PI,
      timeline: {
        1945: { id: 'ware4', gen: (e) => TB.buildings.warehouse({ w: 30, d: 20, era: e, seed: 51 }) },
        1965: { id: 'ware4', gen: (e) => TB.buildings.warehouse({ w: 30, d: 20, era: e, seed: 51 }) },
        1985: { id: 'brut4', gen: (e) => TB.buildings.brutalist({ w: 30, d: 20, era: e, seed: 52 }) },
        2005: { id: 'brut4', gen: (e) => TB.buildings.brutalist({ w: 30, d: 20, era: e, seed: 52 }) },
        2025: { id: 'brut4', gen: (e) => TB.buildings.brutalist({ w: 30, d: 20, era: e, seed: 52 }) },
        2055: { id: 'farm4', gen: (e) => TB.buildings.verticalFarm({ w: 30, d: 20, era: e, seed: 53 }) }
      }
    },
    { // L5 — tenement (bakery→laundry→video store) → glass office → mega
      x: -8, z: -19, w: 22, d: 20, ry: Math.PI,
      timeline: {
        1945: { id: 'ten5', gen: (e) => TB.buildings.tenement({ w: 22, d: 20, floors: 5, era: e, seed: 61, store: { name: "MORETTI'S BAKERY", style: 'painted', bg: '#6b3a22', awning: ['#8a5a2a', '#e8dcb0'], crates: true, trim: 0x5a3a1a } }) },
        1965: { id: 'ten5', gen: (e) => TB.buildings.tenement({ w: 22, d: 20, floors: 5, era: e, seed: 61, store: { name: 'SUDS-O-MAT LAUNDRY', style: 'enamel', bg: '#2a7ab0', trim: 0x1c5a8a } }) },
        1985: { id: 'ten5', gen: (e) => TB.buildings.tenement({ w: 22, d: 20, floors: 5, era: e, seed: 61, store: { name: 'VIDEO PALACE — VHS·BETA', style: 'neon', fg: '#41e8ff', trim: 0x222222 } }) },
        2005: { id: 'off5', gen: (e) => TB.buildings.glassTower({ w: 22, d: 20, era: e, seed: 62 }) },
        2025: { id: 'off5', gen: (e) => TB.buildings.glassTower({ w: 22, d: 20, era: e, seed: 62 }) },
        2055: { id: 'ftow5', gen: (e) => TB.buildings.futureTower({ w: 22, d: 20, era: e, seed: 63, tall: true, name: 'HELIX HAB', accent: '#c850ff' }) }
      }
    },
    { // L6 — St. Ambrose, outlasting everything
      x: 15, z: -19, w: 24, d: 20, ry: Math.PI,
      timeline: (function () {
        const t = {};
        TB.ERAS.forEach(function (e) { t[e] = { id: 'church', gen: (era) => TB.buildings.church({ w: 24, d: 20, era: era, seed: 71 }) }; });
        return t;
      })()
    },
    { // L7 — NE corner: gas station through the ages
      x: 38, z: -19, w: 22, d: 20, ry: Math.PI,
      timeline: {
        1945: { id: 'gasA', gen: (e) => TB.buildings.gasStation({ w: 22, d: 20, era: e, seed: 81 }) },
        1965: { id: 'gasA', gen: (e) => TB.buildings.gasStation({ w: 22, d: 20, era: e, seed: 81 }) },
        1985: { id: 'gasA', gen: (e) => TB.buildings.gasStation({ w: 22, d: 20, era: e, seed: 81 }) },
        2005: { id: 'gasB', gen: (e) => TB.buildings.gasStation({ w: 22, d: 20, era: e, seed: 82 }) },
        2025: { id: 'gasC', gen: (e) => TB.buildings.gasStation({ w: 22, d: 20, era: e, seed: 83 }) },
        2055: { id: 'gasD', gen: (e) => TB.buildings.gasStation({ w: 22, d: 20, era: e, seed: 84 }) }
      }
    },
    { // L8 — west: Hotel Regent
      x: -39, z: 0, w: 18, d: 20, ry: -Math.PI / 2,
      timeline: (function () {
        const t = {};
        TB.ERAS.forEach(function (e) { t[e] = { id: 'hotel', gen: (era) => TB.buildings.hotel({ w: 18, d: 20, era: era, seed: 91 }) }; });
        return t;
      })()
    },
    { // L9 — east: tenement → midrise
      x: 39, z: 0, w: 18, d: 20, ry: Math.PI / 2,
      timeline: {
        1945: { id: 'ten9', gen: (e) => TB.buildings.tenement({ w: 18, d: 20, floors: 3, era: e, seed: 101, store: { name: "GUS'S BARBER SHOP", style: 'painted', bg: '#26303a', trim: 0x1a2430, crates: false } }) },
        1965: { id: 'ten9', gen: (e) => TB.buildings.tenement({ w: 18, d: 20, floors: 3, era: e, seed: 101, store: { name: "GUS'S BARBER SHOP", style: 'enamel', bg: '#1c3a6b', trim: 0x1a2430 } }) },
        1985: { id: 'ten9', gen: (e) => TB.buildings.tenement({ w: 18, d: 20, floors: 3, era: e, seed: 101, store: { name: 'CUTZ & CURLZ', style: 'neon', fg: '#ff4fd8', trim: 0x222222 } }) },
        2005: { id: 'mid9', gen: (e) => TB.buildings.midrise({ w: 18, d: 20, era: e, seed: 102, store: { name: 'CYBER CAFÉ + PHONES', style: 'backlit', fg: '#28527a', trim: 0x2a3040 } }) },
        2025: { id: 'mid9', gen: (e) => TB.buildings.midrise({ w: 18, d: 20, era: e, seed: 102, store: { name: 'THRIFT & VINYL', style: 'led', fg: '#ffb020', trim: 0x2a3040 } }) },
        2055: { id: 'mid9', gen: (e) => TB.buildings.midrise({ w: 18, d: 20, era: e, seed: 102, store: { name: 'NEURAL LOUNGE', style: 'holo', fg: '#41f2ff', trim: 0x101820 } }) }
      }
    }
  ];

  // ---------------- path helpers ----------------
  // Rounded-rectangle path: half extents hx/hz, corner radius r.
  function rectPath(hx, hz, rad, s, out) {
    const straightX = 2 * (hx - rad), straightZ = 2 * (hz - rad);
    const corner = Math.PI * rad / 2;
    const P = 2 * straightX + 2 * straightZ + 4 * corner;
    s = ((s % P) + P) % P;
    // segments starting at (+hx - rad along +z edge?) — walk CCW starting mid south edge
    // order: south edge (+z, x: -→+ ... choose CW: along south edge east→west? We'll do CW: x+ → x- on south
    // Simpler explicit walk, CW seen from above: start at (-(hx-rad), +hz) going +x
    let d = s;
    if (d < straightX) { out.x = -(hx - rad) + d; out.z = hz; out.a = 0; return P; }
    d -= straightX;
    if (d < corner) { const t = d / corner; const ang = t * Math.PI / 2; out.x = (hx - rad) + Math.sin(ang) * rad; out.z = (hz - rad) + Math.cos(ang) * rad; out.a = -ang; return P; }
    d -= corner;
    if (d < straightZ) { out.x = hx; out.z = (hz - rad) - d; out.a = -Math.PI / 2; return P; }
    d -= straightZ;
    if (d < corner) { const t = d / corner; const ang = t * Math.PI / 2; out.x = (hx - rad) + Math.cos(ang) * rad; out.z = -(hz - rad) - Math.sin(ang) * rad; out.a = -Math.PI / 2 - ang; return P; }
    d -= corner;
    if (d < straightX) { out.x = (hx - rad) - d; out.z = -hz; out.a = Math.PI; return P; }
    d -= straightX;
    if (d < corner) { const t = d / corner; const ang = t * Math.PI / 2; out.x = -(hx - rad) - Math.sin(ang) * rad; out.z = -(hz - rad) - Math.cos(ang) * rad; out.a = Math.PI - ang; return P; }
    d -= corner;
    if (d < straightZ) { out.x = -hx; out.z = -(hz - rad) + d; out.a = Math.PI / 2; return P; }
    d -= straightZ;
    { const t = d / corner; const ang = t * Math.PI / 2; out.x = -(hx - rad) - Math.cos(ang) * rad; out.z = (hz - rad) + Math.sin(ang) * rad; out.a = Math.PI / 2 - ang; return P; }
  }

  // ---------------- ground / streets ----------------
  function buildGround(era) {
    const g = new THREE.Group();
    const env = TB.ERA_ENV[era];
    // base plane far out
    const base = TB.mesh(TB.geo.plane, TB.mat(era >= 2055 ? 0x0a1018 : (era === 1985 ? 0x241d22 : 0x35342f), { roughness: 1 }), 0, -0.05, 0, 500, 500, 1);
    base.rotation.x = -Math.PI / 2;
    base.receiveShadow = true;
    g.add(base);

    const asph = TB.tex.asphalt(era);
    const aMat = new THREE.MeshStandardMaterial({ map: asph, roughness: 0.95 });
    // street ring: 4 slabs
    const slabs = [
      [0, (BZ + SZ) / 2, 2 * SX, STREET],          // south
      [0, -(BZ + SZ) / 2, 2 * SX, STREET],         // north
      [(BX + SX) / 2, 0, STREET, 2 * BZ],          // east
      [-(BX + SX) / 2, 0, STREET, 2 * BZ]          // west
    ];
    slabs.forEach(function (s) {
      const m = TB.mesh(TB.geo.box, aMat, s[0], -0.02, s[1], s[2], 0.06, s[3]);
      m.receiveShadow = true;
      g.add(m);
    });

    const swTex = TB.tex.sidewalk(era);
    const sMat = new THREE.MeshStandardMaterial({ map: swTex, roughness: 0.95 });
    // inner sidewalk ring (on the block)
    const inner = [
      [0, BZ - SIDE / 2, 2 * BX, SIDE], [0, -(BZ - SIDE / 2), 2 * BX, SIDE],
      [BX - SIDE / 2, 0, SIDE, 2 * (BZ - SIDE)], [-(BX - SIDE / 2), 0, SIDE, 2 * (BZ - SIDE)]
    ];
    // outer sidewalk ring (far side of streets)
    const outer = [
      [0, SZ + SIDE / 2, 2 * OX, SIDE], [0, -(SZ + SIDE / 2), 2 * OX, SIDE],
      [SX + SIDE / 2, 0, SIDE, 2 * SZ], [-(SX + SIDE / 2), 0, SIDE, 2 * SZ]
    ];
    inner.concat(outer).forEach(function (s) {
      const m = TB.mesh(TB.geo.box, sMat, s[0], 0.05, s[1], s[2], 0.14, s[3]);
      m.receiveShadow = true;
      g.add(m);
    });
    // curbs
    const curbMat = TB.mat(era >= 2055 ? 0x2a3444 : 0x8a867c, { roughness: 0.9 });
    [[0, BZ + 0.15, 2 * BX + 0.6, 0.5], [0, -(BZ + 0.15), 2 * BX + 0.6, 0.5],
     [BX + 0.15, 0, 0.5, 2 * BZ], [-(BX + 0.15), 0, 0.5, 2 * BZ]].forEach(function (s) {
      g.add(TB.mesh(TB.geo.box, curbMat, s[0], 0.06, s[1], s[2], 0.16, s[3]));
    });

    // block interior courtyard
    const courtCol = { 1945: 0x4a443a, 1965: 0x55504a, 1985: 0x3c3840, 2005: 0x5a5852, 2025: 0x3f6b38, 2055: 0x14262e }[era];
    const court = TB.mesh(TB.geo.box, TB.mat(courtCol, { roughness: 1 }), 0, 0.02, 0, 2 * (BX - SIDE) - 2, 0.06, 2 * (BZ - SIDE) - 2);
    court.receiveShadow = true;
    g.add(court);

    // road markings
    g.add(TB.props.roadMarkings(era, { bx0: -BX, bx1: BX, bz0: -BZ, bz1: BZ, x0: -SX, x1: SX, z0: -SZ, z1: SZ }));
    return g;
  }

  // ---------------- street furniture per era ----------------
  function buildProps(era, items) {
    const env = TB.ERA_ENV[era];
    const r = TB.rng(era * 7 + 1);
    function place(obj, x, z, ry) {
      if (!obj || obj.children.length === 0) return null;
      obj.position.set(x, 0.12, z);
      if (ry !== undefined) obj.rotation.y = ry;
      items.push(obj);
      return obj;
    }
    // streetlights around inner sidewalk
    const lampXs = [-44, -15, 15, 44];
    lampXs.forEach(function (x) {
      place(TB.props.streetlight(era, env.streetlights), x, BZ - 1.2, 0);
      place(TB.props.streetlight(era, env.streetlights), x, -(BZ - 1.2), Math.PI);
    });
    [-18, 18].forEach(function (z) {
      place(TB.props.streetlight(era, env.streetlights), BX - 1.2, z, Math.PI / 2);
      place(TB.props.streetlight(era, env.streetlights), -(BX - 1.2), z, -Math.PI / 2);
    });
    // outer sidewalk lights
    [-40, 0, 40].forEach(function (x) {
      place(TB.props.streetlight(era, env.streetlights), x, SZ + 2, Math.PI);
      place(TB.props.streetlight(era, env.streetlights), x, -(SZ + 2), 0);
    });

    // traffic lights at the four corners (1965+)
    if (era >= 1965) {
      place(TB.props.trafficLight(era), BX + 1.5, BZ + 1.5, Math.PI * 0.75);
      place(TB.props.trafficLight(era), -(BX + 1.5), BZ + 1.5, -Math.PI * 0.75);
      place(TB.props.trafficLight(era), BX + 1.5, -(BZ + 1.5), Math.PI * 0.25);
      place(TB.props.trafficLight(era), -(BX + 1.5), -(BZ + 1.5), -Math.PI * 0.25);
    }

    // hydrants
    place(TB.props.hydrant(era), -22, BZ - 1.5);
    place(TB.props.hydrant(era), 30, -(BZ - 1.5));
    place(TB.props.hydrant(era), BX - 1.5, -8, Math.PI / 2);

    // trees: south + north sidewalk gaps
    [-24, 2, 28].forEach(function (x, i) {
      place(TB.props.tree(era, 300 + i), x, BZ - 1.6);
    });
    [-20, 4].forEach(function (x, i) {
      place(TB.props.tree(era, 320 + i), x, -(BZ - 1.6));
    });
    if (era >= 2025) {
      [-52, 20].forEach(function (x, i) { place(TB.props.tree(era, 340 + i), x, SZ + 3); });
    }

    // phone booth (goes extinct after 2005)
    place(TB.props.phoneBooth(era), BX - 2.2, 12, Math.PI / 2);
    if (era <= 1985) place(TB.props.phoneBooth(era), -30, -(BZ - 2), Math.PI);

    // mailbox, trash, papers
    place(TB.props.mailbox(era), -12, BZ - 1.4);
    place(TB.props.trashcan(era), 6, BZ - 1.3);
    place(TB.props.trashcan(era), -38, -(BZ - 1.3));
    place(TB.props.trashcan(era), BX - 1.4, 2, Math.PI / 2);
    place(TB.props.newsBox(era, 5), 24, BZ - 1.3, Math.PI);
    place(TB.props.newsBox(era, 9), -6, -(BZ - 1.3));

    // benches near theater + church
    place(TB.props.bench(era), 10, BZ - 1.5, Math.PI);
    place(TB.props.bench(era), 20, -(BZ - 1.5));
    if (era >= 2005) place(TB.props.bench(era), -48, BZ - 1.5, Math.PI);

    // bus stop south side outer walk
    place(TB.props.busStop(era), -10, SZ + 2.4, 0);

    // parking meters along south curb (1965–2005)
    if (era >= 1965 && era <= 2005) {
      [-40, -32, -24, 10, 18, 26].forEach(function (x) {
        place(TB.props.parkingMeter(era), x, BZ - 0.9);
      });
    }

    // bike share (2005+)
    place(TB.props.bikeShare(era, 4), -2, BZ - 1.5, Math.PI / 2);

    // era one-offs
    if (era <= 1965) {
      place(TB.props.barrel(), -46, -(BZ - 2.2));
      place(TB.props.barrel(), -44.6, -(BZ - 1.6));
    }
    if (era === 2025) {
      const bot = TB.props.deliveryBot();
      bot.position.set(26, 0.12, BZ - 1.5);
      bot.userData.patrol = { axis: 'x', min: -30, max: 40, speed: 2.2, dir: 1, z: BZ - 1.5 };
      items.push(bot);
    }
    if (era === 2055) {
      place(TB.props.holoKiosk('SYNTH-RAMEN ▲ 200m', '#ff6ad8'), -20, BZ - 1.8);
      place(TB.props.holoKiosk('GRAV-BALL FINALS 2NITE', '#ffb020'), 34, -(BZ - 1.8), Math.PI);
      place(TB.props.holoKiosk('◉ AIR QUALITY: PERFECT', '#22e6c8'), -(BX - 2), -10, -Math.PI / 2);
    }
    // courtyard clutter
    if (era <= 1985) {
      place(TB.props.barrel(), -10, 4);
      place(TB.props.barrel(), -8.6, 4.8);
      place(TB.props.trashcan(era), 12, -4);
    } else if (era >= 2025) {
      place(TB.props.tree(era, 400), -8, 2);
      place(TB.props.tree(era, 401), 10, -3);
      place(TB.props.bench(era), 0, 3, Math.PI);
    }
  }

  // ---------------- backdrop city ----------------
  function buildBackdrop(era) {
    const g = new THREE.Group();
    const r = TB.rng(era * 13 + 5);
    const env = TB.ERA_ENV[era];
    const heights = { 1945: [8, 18], 1965: [10, 24], 1985: [12, 30], 2005: [14, 36], 2025: [16, 42], 2055: [20, 58] }[era];
    // shared facade materials (a few variants)
    const mats = [];
    for (let i = 0; i < 4; i++) {
      let tex;
      if (era >= 2055 && i < 2) tex = TB.tex.futureFacade({ floors: 24, windowLit: 0.55, seed: era + i * 3, accent: ['#22e6c8', '#c850ff'][i] });
      else if (era >= 2005 && i < 2) tex = TB.tex.glassFacade({ floors: 14, cols: 8, windowLit: env.windowsLit, seed: era + i * 3 });
      else if (i === 3 && era >= 1985) tex = TB.tex.concreteFacade({ floors: 8, cols: 6, windowLit: env.windowsLit, grime: 0.4, seed: era + i });
      else tex = TB.tex.brickFacade({ base: ['#7a4030', '#6e4434', '#8a5a3c', '#5f4a42'][i], floors: 7, cols: 6, windowLit: env.windowsLit, grime: era <= 1985 ? 0.7 : 0.3, seed: era + i });
      mats.push(new THREE.MeshStandardMaterial({
        map: tex, roughness: 0.9,
        emissive: 0xffffff, emissiveMap: tex,
        emissiveIntensity: env.windowsLit > 0.3 ? 0.45 : 0.02
      }));
    }
    const roofMat = TB.mat(0x3a3733);
    function bdBuilding(x, z, w, d) {
      const h = heights[0] + r() * (heights[1] - heights[0]);
      const wall = TB.pick(r, mats);
      const m = new THREE.Mesh(TB.geo.box, [wall, wall, roofMat, roofMat, wall, wall]);
      m.position.set(x, h / 2, z);
      m.scale.set(w, h, d);
      g.add(m);
      return h;
    }
    // rows across each street
    for (let x = -OX + 8; x < OX - 6; x += 17 + r() * 6) {
      bdBuilding(x + r() * 3, OZ + 11 + r() * 4, 14 + r() * 6, 16 + r() * 6);
      bdBuilding(x + r() * 3, -(OZ + 11 + r() * 4), 14 + r() * 6, 16 + r() * 6);
    }
    for (let z = -OZ + 6; z < OZ - 4; z += 16 + r() * 6) {
      bdBuilding(OX + 11 + r() * 4, z + r() * 3, 16 + r() * 6, 13 + r() * 5);
      bdBuilding(-(OX + 11 + r() * 4), z + r() * 3, 16 + r() * 6, 13 + r() * 5);
    }
    // second, taller ring for skyline depth
    for (let i = 0; i < 26; i++) {
      const ang = (i / 26) * Math.PI * 2 + r() * 0.2;
      const rad = 125 + r() * 45;
      const h2 = heights[1] * (0.8 + r() * 0.9);
      const wall = TB.pick(r, mats);
      const m = new THREE.Mesh(TB.geo.box, [wall, wall, roofMat, roofMat, wall, wall]);
      m.position.set(Math.cos(ang) * rad, h2 / 2, Math.sin(ang) * rad * 0.75);
      m.scale.set(16 + r() * 14, h2, 14 + r() * 10);
      m.rotation.y = r() * Math.PI;
      g.add(m);
    }
    return g;
  }

  // ---------------- vehicles / peds ----------------
  const TRAFFIC = {
    1945: { cars: 5, speed: [5, 8], parked: 4, trolley: true },
    1965: { cars: 7, speed: [7, 10], parked: 6 },
    1985: { cars: 6, speed: [7, 11], parked: 6 },
    2005: { cars: 8, speed: [8, 11], parked: 7 },
    2025: { cars: 7, speed: [8, 12], parked: 5 },
    2055: { cars: 6, speed: [13, 17], parked: 0, flyers: 5 }
  };
  const PED_COUNT = { 1945: 15, 1965: 16, 1985: 12, 2005: 14, 2025: 16, 2055: 10 };

  function buildDynamics(era, items) {
    const r = TB.rng(era * 3 + 99);
    const cfg = TRAFFIC[era];
    const dyn = { cars: [], peds: [], flyers: [], bots: [] };
    // moving cars: two lanes, opposite directions
    for (let i = 0; i < cfg.cars; i++) {
      const v = TB.vehicles.make(era, r);
      const lane = i % 2;
      v.userData.lane = lane;
      v.userData.dist = (i / cfg.cars) * 1000 + r() * 40;
      v.userData.speed = cfg.speed[0] + r() * (cfg.speed[1] - cfg.speed[0]);
      if (v.userData.hover) v.userData.bobPhase = r() * 6;
      items.push(v);
      dyn.cars.push(v);
    }
    // trolley
    if (cfg.trolley) {
      const t = TB.vehicles.trolley();
      t.userData.trolleyX = -60;
      t.userData.trolleyDir = 1;
      items.push(t);
      dyn.trolley = t;
    }
    // parked cars along south curb + east curb
    for (let i = 0; i < cfg.parked; i++) {
      const v = TB.vehicles.make(era, r);
      if (i < 4) {
        v.position.set(-44 + i * 13 + r() * 2, 0, BZ + 2.6);
        v.rotation.y = Math.PI / 2 + (r() - 0.5) * 0.04;
      } else {
        v.position.set(BX + 2.6, 0, -20 + (i - 4) * 14 + r() * 2);
        v.rotation.y = 0 + (r() - 0.5) * 0.04;
      }
      items.push(v);
    }
    // flyers (2055)
    if (cfg.flyers) {
      for (let i = 0; i < cfg.flyers; i++) {
        const f = TB.vehicles.flyer(TB.pick(r, [0x18242e, 0x202e3c, 0x2c1e38]), TB.pick(r, [0x41f2ff, 0xff6ad8, 0xffb020]));
        f.userData.lane = i % 3;
        f.userData.dist = r() * 400;
        f.userData.speed = 18 + r() * 10;
        items.push(f);
        dyn.flyers.push(f);
      }
    }
    // pedestrians on inner + outer sidewalk loops
    const n = PED_COUNT[era];
    for (let i = 0; i < n; i++) {
      const p = TB.peds.make(era, r);
      p.userData.loop = i % 3 === 2 ? 'outer' : 'inner';
      p.userData.dist = r() * 1000;
      p.userData.dir = r() < 0.5 ? 1 : -1;
      p.userData.walkSpeed = (1.1 + r() * 0.8) * (era === 2055 ? 0.9 : 1);
      items.push(p);
      dyn.peds.push(p);
    }
    return dyn;
  }

  // ---------------- per-era world ----------------
  function buildEra(era, scene) {
    const root = new THREE.Group();
    root.name = 'era-' + era;
    const world = { era: era, root: root, lots: [], items: [], anim: [], dyn: null, smokestacks: [] };

    root.add(buildGround(era));
    root.add(buildBackdrop(era));

    LOTS.forEach(function (lot, li) {
      const spec = lot.timeline[era];
      const g = spec.gen(era);
      g.position.set(lot.x, 0, lot.z);
      g.rotation.y = lot.ry;
      root.add(g);
      world.lots.push({ id: spec.id, group: g, lot: lot, height: g.userData.height || 20 });
      if (g.userData.smokestack) {
        const p = g.userData.smokestack.clone().applyMatrix4(new THREE.Matrix4().makeRotationY(lot.ry)).add(new THREE.Vector3(lot.x, 0, lot.z));
        world.smokestacks.push(p);
      }
      // billboard rides on the L0 roof
      if (lot.billboard) {
        const bb = TB.props.billboard(era, era + 17);
        const hgt = g.userData.height || 18;
        bb.position.set(lot.x, hgt + (g.userData.flat ? 0 : 0.3), lot.z - 4);
        world.items.push(bb);
      }
    });

    buildProps(era, world.items);
    world.dyn = buildDynamics(era, world.items);
    world.items.forEach(function (it) { root.add(it); });

    // collect animated nodes (spinners, bobbers, holo)
    root.traverse(function (o) {
      const u = o.userData;
      if (u && (u.spin || u.spinY || u.bob || u.rotor || u.holoFlicker)) {
        if (u.bob) u.baseY = o.position.y;
        world.anim.push(o);
      }
    });
    // remember base scales for pop animations
    world.items.forEach(function (it) { it.userData.baseScale = it.scale.x; });

    root.visible = false;
    scene.add(root);
    return world;
  }

  // ---------------- the city object ----------------
  TB.city = {
    worlds: {},
    current: null,
    transition: null,
    _tmp: { x: 0, z: 0, a: 0 },

    buildAll: function (scene, onProgress, onDone) {
      const self = this;
      let i = 0;
      function step() {
        const era = TB.ERAS[i];
        self.worlds[era] = buildEra(era, scene);
        i++;
        onProgress(i / TB.ERAS.length);
        if (i < TB.ERAS.length) setTimeout(step, 10);
        else { onDone(); }
      }
      setTimeout(step, 10);
    },

    show: function (era) {
      this.current = era;
      for (const y in this.worlds) {
        this.worlds[y].root.visible = (+y === era);
      }
    },

    // ------------- era transition -------------
    setEra: function (era) {
      if (era === this.current && !this.transition) return;
      if (this.transition) this.finishTransition();
      const oldW = this.worlds[this.current];
      const newW = this.worlds[era];
      if (!oldW || !newW) { this.show(era); return; }

      TB.audio.whoosh(0.9);
      newW.root.visible = true;

      const acts = [];
      const D = { swap: 1.0, total: 3.1 };

      // per-lot animation
      newW.lots.forEach(function (nl, i) {
        const ol = oldW.lots[i];
        const stag = i * 0.1;
        if (ol.id === nl.id) {
          // renovation wipe: clip plane sweeps upward, replacing old with new
          const maxH = Math.max(ol.height, nl.height) + 8;
          const upPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);   // shows y < c on new
          const downPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);  // shows y > -c on old
          setClip(nl.group, upPlane);
          setClip(ol.group, downPlane);
          nl.group.visible = true;
          acts.push({
            t0: 0.3 + stag, t1: 2.0 + stag, ol: ol, nl: nl,
            up: upPlane, down: downPlane, maxH: maxH,
            update: function (t) {
              const y = TB.smoothstep(t) * this.maxH;
              this.up.constant = y;
              this.down.constant = -y;
            },
            end: function () {
              clearClip(this.nl.group);
              clearClip(this.ol.group);
              this.ol.group.visible = false;
            }
          });
        } else {
          // demolish + rebuild
          nl.group.scale.y = 0.001;
          nl.group.visible = true;
          acts.push({
            t0: 0.1 + stag, t1: 0.85 + stag, ol: ol,
            update: function (t) {
              this.ol.group.scale.y = Math.max(0.001, 1 - TB.easeInCubic(t));
            },
            end: function () {
              this.ol.group.visible = false;
              this.ol.group.scale.y = 1;
              TB.fx.burst(this.ol.group.position.x, 0.5, this.ol.group.position.z, 0x9a8f80, 40, 8);
              TB.audio.demolishThud();
            }
          });
          acts.push({
            t0: 1.15 + stag, t1: 2.1 + stag, nl: nl,
            update: function (t) {
              this.nl.group.scale.y = Math.max(0.001, TB.easeOutBack(t));
            },
            end: function () { this.nl.group.scale.y = 1; }
          });
        }
      });

      // items: old pop out, new pop in
      oldW.items.forEach(function (it, i) {
        acts.push({
          t0: (i % 10) * 0.05, t1: 0.5 + (i % 10) * 0.05, it: it,
          update: function (t) { this.it.scale.setScalar(Math.max(0.001, this.it.userData.baseScale * (1 - t))); },
          end: function () { this.it.visible = false; this.it.scale.setScalar(this.it.userData.baseScale); }
        });
      });
      newW.items.forEach(function (it, i) {
        it.scale.setScalar(0.001);
        it.visible = true;
        acts.push({
          t0: D.swap + 0.15 + (i % 12) * 0.06, t1: D.swap + 0.6 + (i % 12) * 0.06, it: it,
          update: function (t) { this.it.scale.setScalar(Math.max(0.001, this.it.userData.baseScale * TB.easeOutBack(t))); },
          end: function () { this.it.scale.setScalar(this.it.userData.baseScale); }
        });
      });

      // ground/backdrop hard-swap at the midpoint thump — hiding the new
      // ones until then avoids z-fighting between two coplanar streets
      newW.root.children[0].visible = false;
      newW.root.children[1].visible = false;
      acts.push({
        t0: D.swap, t1: D.swap, oldW: oldW, newW: newW,
        update: function () {},
        end: function () {
          this.oldW.root.children[0].visible = false;
          this.oldW.root.children[1].visible = false;
          this.newW.root.children[0].visible = true;
          this.newW.root.children[1].visible = true;
        }
      });

      this.transition = {
        from: this.current, to: era, t: 0, dur: D.total, acts: acts,
        oldW: oldW, newW: newW
      };
      this.current = era;
    },

    finishTransition: function () {
      const tr = this.transition;
      if (!tr) return;
      tr.acts.forEach(function (a) {
        if (!a.started) { /* never ran */ }
        if (!a.ended) {
          try { a.update(1); } catch (e) {}
          if (a.end) a.end();
          a.ended = true;
        }
      });
      tr.oldW.root.visible = false;
      tr.newW.root.children[0].visible = true;
      tr.newW.root.children[1].visible = true;
      // restore old world default state
      tr.oldW.root.children[0].visible = true;
      tr.oldW.root.children[1].visible = true;
      tr.oldW.lots.forEach(function (l) { l.group.visible = true; l.group.scale.y = 1; clearClip(l.group); });
      tr.oldW.items.forEach(function (it) { it.visible = true; it.scale.setScalar(it.userData.baseScale); });
      tr.newW.lots.forEach(function (l) { l.group.visible = true; l.group.scale.y = 1; clearClip(l.group); });
      this.transition = null;
    },

    // ------------- per-frame update -------------
    update: function (dt, t) {
      // transition
      if (this.transition) {
        const tr = this.transition;
        tr.t += dt;
        tr.acts.forEach(function (a) {
          if (a.ended) return;
          if (tr.t >= a.t0) {
            a.started = true;
            const k = a.t1 > a.t0 ? TB.clamp((tr.t - a.t0) / (a.t1 - a.t0), 0, 1) : 1;
            a.update(k);
            if (k >= 1) { if (a.end) a.end(); a.ended = true; }
          }
        });
        if (tr.t >= tr.dur) this.finishTransition();
      }

      // animate current (and during transition, old) dynamics
      const eras = [this.current];
      if (this.transition) eras.push(this.transition.from);
      const seen = {};
      for (const e of eras) {
        if (seen[e]) continue;
        seen[e] = true;
        const w = this.worlds[e];
        if (w && w.root.visible) this.updateWorld(w, dt, t);
      }
    },

    updateWorld: function (w, dt, t) {
      const tmp = this._tmp;
      // cars
      w.dyn.cars.forEach(function (v) {
        v.userData.dist += v.userData.speed * dt * (v.userData.lane === 0 ? 1 : -1);
        const hx = v.userData.lane === 0 ? BX + 4.5 : BX + 11.5;
        const hz = v.userData.lane === 0 ? BZ + 4.5 : BZ + 11.5;
        rectPath(hx, hz, 7, v.userData.dist, tmp);
        v.position.x = tmp.x; v.position.z = tmp.z;
        v.rotation.y = (Math.PI / 2 - tmp.a) + (v.userData.lane === 0 ? 0 : Math.PI);
        if (v.userData.hover) {
          v.position.y = 0.25 + Math.sin(t * 3 + v.userData.bobPhase) * 0.08;
        }
        if (v.userData.wheels) {
          v.userData.wheels.forEach(function (wh) {
            wh.children[0].rotation.x += v.userData.speed * dt * 2;
            wh.children[1].rotation.x = wh.children[0].rotation.x;
          });
        }
      });
      // trolley shuttles on the south street
      if (w.dyn.trolley) {
        const tr = w.dyn.trolley;
        tr.userData.trolleyX += tr.userData.trolleyDir * 6 * dt;
        if (tr.userData.trolleyX > 70) { tr.userData.trolleyDir = -1; }
        if (tr.userData.trolleyX < -70) { tr.userData.trolleyDir = 1; }
        tr.position.set(tr.userData.trolleyX, 0, BZ + 8);
        tr.rotation.y = tr.userData.trolleyDir > 0 ? Math.PI / 2 : -Math.PI / 2;
      }
      // flyers on straight sky lanes
      w.dyn.flyers.forEach(function (f) {
        f.userData.dist += f.userData.speed * dt;
        const lane = f.userData.lane;
        const s = ((f.userData.dist % 340) + 340) % 340 - 170;
        if (lane === 0) { f.position.set(s, 30, -24); f.rotation.y = Math.PI / 2; }
        else if (lane === 1) { f.position.set(-s, 40, 18); f.rotation.y = -Math.PI / 2; }
        else { f.position.set(26, 35, s); f.rotation.y = 0; }
        f.position.y += Math.sin(t * 2 + lane * 2) * 0.4;
      });
      // pedestrians
      w.dyn.peds.forEach(function (p) {
        p.userData.dist += p.userData.walkSpeed * p.userData.dir * dt;
        const inner = p.userData.loop === 'inner';
        rectPath(inner ? BX - 3 : SX + 3, inner ? BZ - 3 : SZ + 3, 4, p.userData.dist, tmp);
        p.position.x = tmp.x; p.position.z = tmp.z;
        p.rotation.y = (Math.PI / 2 - tmp.a) + (p.userData.dir > 0 ? 0 : Math.PI);
        TB.peds.animate(p, t, true);
      });
      // patrol bots
      w.items.forEach(function (it) {
        const u = it.userData;
        if (u.patrol) {
          it.position.x += u.patrol.dir * u.patrol.speed * dt;
          if (it.position.x > u.patrol.max) u.patrol.dir = -1;
          if (it.position.x < u.patrol.min) u.patrol.dir = 1;
          it.rotation.y = u.patrol.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        }
      });
      // ambient animated nodes
      w.anim.forEach(function (o) {
        const u = o.userData;
        if (u.spin) o.rotation.z += u.spin * dt;
        if (u.spinY) o.rotation.y += u.spinY * dt;
        if (u.rotor) o.rotation.z += u.rotor * dt;
        if (u.bob) o.position.y = u.baseY + Math.sin(t * 1.6 + o.id * 0.7) * u.bob * 0.3;
        if (u.holoFlicker && o.material) {
          o.material.opacity = 0.85 + Math.sin(t * 30 + Math.sin(t * 7.3) * 5) * 0.07;
        }
      });
      // smoke
      if (w.era === 1945 && w.smokestacks.length) {
        if (!w._smokeT) w._smokeT = 0;
        w._smokeT -= dt;
        if (w._smokeT <= 0) {
          w._smokeT = 0.35;
          w.smokestacks.forEach(function (p) {
            TB.fx.puff(p.x, p.y, p.z, 0x8a8478, 0.9);
          });
        }
      }
    }
  };

  function setClip(group, plane) {
    group.traverse(function (o) {
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(function (m) { m.clippingPlanes = [plane]; });
      }
    });
  }
  function clearClip(group) {
    group.traverse(function (o) {
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(function (m) { m.clippingPlanes = null; });
      }
    });
  }

  // ---------------- particle FX ----------------
  TB.fx = {
    bursts: [],
    scene: null,
    init: function (scene) { this.scene = scene; },
    burst: function (x, y, z, color, count, spread) {
      this._spawn(x, y, z, color, count, spread, 1.4, 4.5, 0.55);
    },
    puff: function (x, y, z, color, size) {
      this._spawn(x, y, z, color, 6, 0.6, 4.5, 1.1, size || 0.8, true);
    },
    _spawn: function (x, y, z, color, count, spread, life, vel, size, rise) {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      const vels = [];
      for (let i = 0; i < count; i++) {
        pos[i * 3] = x + (Math.random() - 0.5) * spread;
        pos[i * 3 + 1] = y + Math.random() * (rise ? 0.3 : spread * 0.4);
        pos[i * 3 + 2] = z + (Math.random() - 0.5) * spread;
        vels.push(new THREE.Vector3(
          (Math.random() - 0.5) * vel,
          rise ? (0.8 + Math.random() * 1.2) : Math.random() * vel * 0.8,
          (Math.random() - 0.5) * vel
        ));
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color: color, size: size, transparent: true, opacity: 0.75, depthWrite: false
      });
      const pts = new THREE.Points(geo, mat);
      this.scene.add(pts);
      this.bursts.push({ pts: pts, vels: vels, life: life, age: 0, rise: rise });
    },
    update: function (dt) {
      for (let i = this.bursts.length - 1; i >= 0; i--) {
        const b = this.bursts[i];
        b.age += dt;
        const p = b.pts.geometry.attributes.position;
        for (let j = 0; j < b.vels.length; j++) {
          p.array[j * 3] += b.vels[j].x * dt;
          p.array[j * 3 + 1] += b.vels[j].y * dt;
          p.array[j * 3 + 2] += b.vels[j].z * dt;
          if (!b.rise) b.vels[j].y -= 6 * dt;
          else { b.vels[j].x *= 0.995; b.vels[j].z *= 0.995; }
        }
        p.needsUpdate = true;
        b.pts.material.opacity = 0.75 * (1 - b.age / b.life);
        if (b.rise) b.pts.material.size += dt * 0.8;
        if (b.age >= b.life) {
          this.scene.remove(b.pts);
          b.pts.geometry.dispose();
          b.pts.material.dispose();
          this.bursts.splice(i, 1);
        }
      }
    }
  };

})();
