// TimeBlock — era vehicles. makeVehicle(era, r) returns a group facing +Z,
// wheels on y=0, with userData.wheels for spin animation.
'use strict';
window.TB = window.TB || {};
TB.vehicles = {};

(function () {
  const V = TB.vehicles;

  const PALETTES = {
    1945: [0x1c1c1e, 0x2a2c30, 0x3a3428, 0x26323a, 0x442a22, 0x30302c],
    1965: [0xd84a3c, 0x48b8d8, 0xf0e6c8, 0xe89a3c, 0x9fd0b0, 0x222428, 0xd8d0c0],
    1985: [0xb02a20, 0x2a2c30, 0x8a8f94, 0xd8d4c8, 0x28527a, 0x6b3a5e],
    2005: [0xc0c4c8, 0x2a2c30, 0x8a8f94, 0x28527a, 0x4a4a4e, 0xe8e8e4],
    2025: [0xe8e8e6, 0x202226, 0x3a5a7a, 0xb0b4b8, 0x2a7a5a, 0x606468],
    2055: [0x14202e, 0x1a2a3c, 0x202a38, 0x0e1a28]
  };

  function wheel(radius, width) {
    const g = new THREE.Group();
    const tire = TB.mesh(new THREE.CylinderGeometry(radius, radius, width, 16), TB.mat(0x141416, { roughness: 0.9 }));
    tire.rotation.z = Math.PI / 2;
    g.add(tire);
    const hub = TB.mesh(new THREE.CylinderGeometry(radius * 0.45, radius * 0.45, width + 0.02, 12), TB.mat(0xb8bcc0, { metalness: 0.85, roughness: 0.25 }));
    hub.rotation.z = Math.PI / 2;
    g.add(hub);
    return g;
  }

  function addWheels(g, positions, radius, width) {
    g.userData.wheels = [];
    positions.forEach(function (p) {
      const w = wheel(radius, width);
      w.position.set(p[0], radius, p[1]);
      g.add(w);
      g.userData.wheels.push(w);
    });
  }

  function glassMat() {
    return new THREE.MeshStandardMaterial({ color: 0x1e2c36, roughness: 0.1, metalness: 0.7 });
  }
  function chromeMat() {
    return TB.mat(0xd8dce0, { metalness: 0.95, roughness: 0.12 });
  }

  // 1945 — tall rounded sedan
  V.sedan45 = function (col) {
    const g = new THREE.Group();
    const body = TB.mat(col, { roughness: 0.35, metalness: 0.4 });
    // lower body with rounded ends (scaled spheres as fenders)
    g.add(TB.mesh(TB.geo.box, body, 0, 0.85, 0, 1.9, 0.85, 4.4));
    g.add(TB.mesh(TB.geo.sphere, body, 0, 0.85, 2.15, 1.9, 0.85, 0.9));
    g.add(TB.mesh(TB.geo.sphere, body, 0, 0.85, -2.15, 1.9, 0.85, 0.9));
    // cabin: tall, rounded
    g.add(TB.mesh(TB.geo.sphere, body, 0, 1.55, -0.2, 1.7, 1.1, 2.6));
    g.add(TB.mesh(TB.geo.box, glassMat(), 0, 1.6, -0.2, 1.55, 0.55, 2.3));
    // separate headlamp pods + grille
    g.add(TB.mesh(TB.geo.sphere, chromeMat(), 0.7, 0.95, 2.5, 0.3, 0.3, 0.3));
    g.add(TB.mesh(TB.geo.sphere, chromeMat(), -0.7, 0.95, 2.5, 0.3, 0.3, 0.3));
    g.add(TB.mesh(TB.geo.box, chromeMat(), 0, 0.8, 2.55, 0.7, 0.6, 0.1));
    // running boards
    g.add(TB.mesh(TB.geo.box, body, 1.0, 0.42, 0, 0.25, 0.12, 2.6));
    g.add(TB.mesh(TB.geo.box, body, -1.0, 0.42, 0, 0.25, 0.12, 2.6));
    addWheels(g, [[0.95, 1.6], [-0.95, 1.6], [0.95, -1.5], [-0.95, -1.5]], 0.45, 0.28);
    g.userData.len = 5.4;
    return g;
  };

  // 1945 — stake-bed truck
  V.truck45 = function (col) {
    const g = new THREE.Group();
    const body = TB.mat(col, { roughness: 0.5, metalness: 0.3 });
    g.add(TB.mesh(TB.geo.box, body, 0, 1.0, 1.8, 1.9, 1.0, 1.6)); // hood
    g.add(TB.mesh(TB.geo.box, body, 0, 1.5, 0.7, 1.95, 1.6, 1.2)); // cab
    g.add(TB.mesh(TB.geo.box, glassMat(), 0, 1.75, 1.15, 1.6, 0.6, 0.12));
    // stake bed
    g.add(TB.mesh(TB.geo.box, TB.mat(0x6b5232, { roughness: 0.95 }), 0, 1.0, -1.6, 2.1, 0.3, 2.8));
    for (const dx of [-1, 1]) for (let i = 0; i < 3; i++) {
      g.add(TB.mesh(TB.geo.box, TB.mat(0x5a4428), dx * 1.0, 1.5, -0.5 - i * 1.1, 0.08, 0.8, 0.3));
    }
    // cargo: crates
    g.add(TB.mesh(TB.geo.box, TB.mat(0x8a6b42), 0.3, 1.55, -1.3, 0.9, 0.8, 0.9));
    g.add(TB.mesh(TB.geo.box, TB.mat(0x7a5c38), -0.4, 1.45, -2.2, 0.8, 0.6, 0.8));
    addWheels(g, [[1.0, 1.7], [-1.0, 1.7], [1.0, -1.8], [-1.0, -1.8]], 0.5, 0.3);
    g.userData.len = 6.0;
    return g;
  };

  // 1965 — long, low, tailfins, chrome
  V.finCar = function (col) {
    const g = new THREE.Group();
    const body = TB.mat(col, { roughness: 0.2, metalness: 0.5 });
    g.add(TB.mesh(TB.geo.box, body, 0, 0.72, 0, 2.1, 0.6, 5.6));
    // cabin: low greenhouse
    g.add(TB.mesh(TB.geo.box, body, 0, 1.25, -0.3, 1.9, 0.5, 2.6));
    g.add(TB.mesh(TB.geo.box, glassMat(), 0, 1.3, -0.3, 1.75, 0.42, 2.4));
    // tailfins
    for (const dx of [-0.95, 0.95]) {
      const fin = TB.mesh(TB.geo.box, body, dx, 1.15, -2.5, 0.12, 0.5, 1.1);
      fin.rotation.x = -0.15;
      g.add(fin);
      // taillight bullet
      g.add(TB.mesh(TB.geo.sphere, new THREE.MeshStandardMaterial({ color: 0xd82020, emissive: 0x881010, emissiveIntensity: 0.6 }), dx, 0.95, -2.85, 0.16, 0.16, 0.16));
    }
    // chrome: full-width grille, bumpers, side spear
    g.add(TB.mesh(TB.geo.box, chromeMat(), 0, 0.62, 2.85, 2.0, 0.28, 0.15));
    g.add(TB.mesh(TB.geo.box, chromeMat(), 0, 0.62, -2.85, 2.0, 0.28, 0.15));
    g.add(TB.mesh(TB.geo.box, chromeMat(), 0, 0.85, 2.82, 1.7, 0.22, 0.1));
    g.add(TB.mesh(TB.geo.box, chromeMat(), 1.06, 0.85, 0, 0.03, 0.06, 4.8));
    g.add(TB.mesh(TB.geo.box, chromeMat(), -1.06, 0.85, 0, 0.03, 0.06, 4.8));
    // headlights (duals!)
    for (const dx of [-0.85, -0.55, 0.55, 0.85]) {
      g.add(TB.mesh(TB.geo.sphere, chromeMat(), dx, 0.82, 2.88, 0.14, 0.14, 0.1));
    }
    addWheels(g, [[1.02, 1.9], [-1.02, 1.9], [1.02, -1.9], [-1.02, -1.9]], 0.4, 0.26);
    g.userData.len = 6.4;
    return g;
  };

  // 1985 — boxy sedan
  V.boxSedan = function (col) {
    const g = new THREE.Group();
    const body = TB.mat(col, { roughness: 0.35, metalness: 0.4 });
    g.add(TB.mesh(TB.geo.box, body, 0, 0.75, 0, 1.95, 0.7, 4.9));
    g.add(TB.mesh(TB.geo.box, body, 0, 1.4, -0.2, 1.8, 0.65, 2.5));
    g.add(TB.mesh(TB.geo.box, glassMat(), 0, 1.42, -0.2, 1.68, 0.52, 2.35));
    // black plastic bumpers + trim (very 80s)
    const plastic = TB.mat(0x1c1c1e, { roughness: 0.7 });
    g.add(TB.mesh(TB.geo.box, plastic, 0, 0.55, 2.5, 2.0, 0.3, 0.2));
    g.add(TB.mesh(TB.geo.box, plastic, 0, 0.55, -2.5, 2.0, 0.3, 0.2));
    g.add(TB.mesh(TB.geo.box, plastic, 1.0, 0.68, 0, 0.04, 0.14, 4.6));
    g.add(TB.mesh(TB.geo.box, plastic, -1.0, 0.68, 0, 0.04, 0.14, 4.6));
    // rectangular sealed-beam headlights
    for (const dx of [-0.65, 0.65]) {
      g.add(TB.mesh(TB.geo.box, TB.mat(0xe8e8d8, { emissive: 0x555540 }), dx, 0.85, 2.46, 0.5, 0.22, 0.06));
    }
    g.add(TB.mesh(TB.geo.box, new THREE.MeshStandardMaterial({ color: 0xb02020, emissive: 0x601010 }), 0, 0.85, -2.46, 1.7, 0.22, 0.06));
    addWheels(g, [[1.0, 1.6], [-1.0, 1.6], [1.0, -1.6], [-1.0, -1.6]], 0.38, 0.24);
    g.userData.len = 5.6;
    return g;
  };

  // 2005 — SUV
  V.suv = function (col) {
    const g = new THREE.Group();
    const body = TB.mat(col, { roughness: 0.3, metalness: 0.5 });
    g.add(TB.mesh(TB.geo.box, body, 0, 1.05, 0, 2.05, 1.1, 4.8));
    g.add(TB.mesh(TB.geo.box, body, 0, 1.85, -0.35, 1.95, 0.7, 3.4));
    g.add(TB.mesh(TB.geo.box, glassMat(), 0, 1.88, -0.35, 1.83, 0.56, 3.25));
    const plastic = TB.mat(0x2a2a2c, { roughness: 0.7 });
    g.add(TB.mesh(TB.geo.box, plastic, 0, 0.6, 0, 2.1, 0.35, 4.85)); // cladding
    g.add(TB.mesh(TB.geo.box, chromeMat(), 0, 0.95, 2.44, 1.2, 0.5, 0.08));
    for (const dx of [-0.75, 0.75]) {
      g.add(TB.mesh(TB.geo.box, TB.mat(0xe8e8e0, { emissive: 0x666655 }), dx, 1.15, 2.42, 0.45, 0.3, 0.06));
    }
    // roof rails
    for (const dx of [-0.8, 0.8]) g.add(TB.mesh(TB.geo.box, plastic, dx, 2.28, -0.35, 0.08, 0.08, 3.0));
    addWheels(g, [[1.05, 1.55], [-1.05, 1.55], [1.05, -1.55], [-1.05, -1.55]], 0.46, 0.3);
    g.userData.len = 5.6;
    return g;
  };

  // 2025 — smooth EV crossover (optionally a robotaxi with sensor dome)
  V.ev = function (col, taxi) {
    const g = new THREE.Group();
    const body = TB.mat(col, { roughness: 0.18, metalness: 0.6 });
    // one smooth volume: overlapping scaled spheres/boxes
    g.add(TB.mesh(TB.geo.box, body, 0, 0.95, 0, 1.95, 0.75, 4.6));
    g.add(TB.mesh(TB.geo.sphere, body, 0, 1.15, 0.1, 1.9, 1.15, 4.4));
    g.add(TB.mesh(TB.geo.box, glassMat(), 0, 1.62, 0.05, 1.7, 0.5, 2.9));
    // light bar front + rear
    g.add(TB.mesh(TB.geo.box, new THREE.MeshStandardMaterial({ color: 0xe8f4ff, emissive: 0xcfe8ff, emissiveIntensity: 1.2 }), 0, 1.05, 2.32, 1.7, 0.07, 0.05));
    g.add(TB.mesh(TB.geo.box, new THREE.MeshStandardMaterial({ color: 0xff3030, emissive: 0xd01818, emissiveIntensity: 1.0 }), 0, 1.1, -2.3, 1.6, 0.07, 0.05));
    // flush wheels
    addWheels(g, [[0.98, 1.5], [-0.98, 1.5], [0.98, -1.5], [-0.98, -1.5]], 0.42, 0.26);
    if (taxi) {
      g.add(TB.mesh(TB.geo.cyl, TB.mat(0x18202c, { roughness: 0.3 }), 0, 2.05, 0, 0.5, 0.18, 0.5));
      g.add(TB.mesh(TB.geo.sphere, new THREE.MeshStandardMaterial({ color: 0x30c8ff, emissive: 0x30c8ff, emissiveIntensity: 1.2 }), 0, 2.2, 0, 0.18, 0.18, 0.18));
    }
    g.userData.len = 5.2;
    return g;
  };

  // 2055 — hover pod (ground lane) — no wheels, glow ring underneath
  V.hoverPod = function (col, accent) {
    const g = new THREE.Group();
    const body = new THREE.MeshStandardMaterial({ color: col, roughness: 0.25, metalness: 0.7 });
    g.add(TB.mesh(TB.geo.sphere, body, 0, 1.15, 0, 1.9, 1.0, 4.2));
    g.add(TB.mesh(TB.geo.box, new THREE.MeshStandardMaterial({
      color: 0x0e1e2c, roughness: 0.05, metalness: 0.8, emissive: 0x1a3a52, emissiveIntensity: 0.4
    }), 0, 1.5, 0.4, 1.62, 0.55, 2.2));
    // glow skirt
    const glow = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 2.0, transparent: true, opacity: 0.9 });
    g.add(TB.mesh(TB.geo.sphere, glow, 0, 0.55, 0, 1.6, 0.18, 3.6));
    // front light slit
    g.add(TB.mesh(TB.geo.box, new THREE.MeshStandardMaterial({ color: 0xe8fbff, emissive: 0xbfefff, emissiveIntensity: 1.6 }), 0, 1.15, 2.05, 1.2, 0.06, 0.06));
    g.userData.hover = true;
    g.userData.len = 4.8;
    return g;
  };

  // 2055 — flying vehicle for the sky lane
  V.flyer = function (col, accent) {
    const g = new THREE.Group();
    const body = new THREE.MeshStandardMaterial({ color: col, roughness: 0.3, metalness: 0.7 });
    g.add(TB.mesh(TB.geo.sphere, body, 0, 0, 0, 1.6, 0.7, 3.2));
    for (const dx of [-1.1, 1.1]) {
      g.add(TB.mesh(TB.geo.box, body, dx, 0.1, 0, 0.9, 0.12, 1.2));
      g.add(TB.mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 14), new THREE.MeshStandardMaterial({
        color: 0x14202c, emissive: accent, emissiveIntensity: 0.9
      }), dx, 0.1, 0, 1, 1, 1));
    }
    g.add(TB.mesh(TB.geo.box, new THREE.MeshStandardMaterial({ color: 0xe8fbff, emissive: 0xbfefff, emissiveIntensity: 1.4 }), 0, 0.05, 1.62, 0.8, 0.05, 0.05));
    // nav strobes
    g.add(TB.mesh(TB.geo.sphere, new THREE.MeshStandardMaterial({ color: 0xff3030, emissive: 0xff3030, emissiveIntensity: 2 }), -1.5, 0.1, 0, 0.09, 0.09, 0.09));
    g.add(TB.mesh(TB.geo.sphere, new THREE.MeshStandardMaterial({ color: 0x30ff60, emissive: 0x30ff60, emissiveIntensity: 2 }), 1.5, 0.1, 0, 0.09, 0.09, 0.09));
    g.userData.flyer = true;
    return g;
  };

  // 1945 trolley for the tracks
  V.trolley = function () {
    const g = new THREE.Group();
    const body = TB.mat(0x8a2a20, { roughness: 0.4, metalness: 0.3 });
    const cream = TB.mat(0xe8dcb0, { roughness: 0.5 });
    g.add(TB.mesh(TB.geo.box, body, 0, 1.1, 0, 2.4, 1.4, 8.5));
    g.add(TB.mesh(TB.geo.box, cream, 0, 2.25, 0, 2.4, 0.9, 8.5));
    // windows strip
    g.add(TB.mesh(TB.geo.box, glassMat(), 0, 2.3, 0, 2.45, 0.6, 7.8));
    g.add(TB.mesh(TB.geo.box, body, 0, 2.85, 0, 2.3, 0.3, 8.3));
    // rounded ends
    g.add(TB.mesh(TB.geo.sphere, body, 0, 1.6, 4.25, 2.4, 1.9, 0.8));
    g.add(TB.mesh(TB.geo.sphere, body, 0, 1.6, -4.25, 2.4, 1.9, 0.8));
    // trolley pole
    const pole = TB.mesh(TB.geo.cyl, TB.mat(0x222), 0, 3.9, -1.5, 0.05, 2.2, 0.05);
    pole.rotation.x = 0.5;
    g.add(pole);
    // undercarriage
    g.add(TB.mesh(TB.geo.box, TB.mat(0x1a1a1c), 0, 0.45, 0, 2.0, 0.5, 7.5));
    g.add(TB.mesh(TB.geo.sphere, new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffe090, emissiveIntensity: 0.8 }), 0, 1.6, 4.95, 0.22, 0.22, 0.22));
    g.userData.len = 10;
    g.userData.trolley = true;
    return g;
  };

  // main factory: random era vehicle
  V.make = function (era, r, opts) {
    opts = opts || {};
    const col = TB.pick(r, PALETTES[era]);
    let v;
    if (era === 1945) {
      v = r() < 0.3 ? V.truck45(col) : V.sedan45(col);
    } else if (era === 1965) {
      v = V.finCar(col);
    } else if (era === 1985) {
      v = V.boxSedan(col);
    } else if (era === 2005) {
      v = r() < 0.5 ? V.suv(col) : V.boxSedan(TB.pick(r, PALETTES[2005]));
    } else if (era === 2025) {
      v = V.ev(col, r() < 0.3);
    } else {
      v = V.hoverPod(col, TB.pick(r, [0x41f2ff, 0x22e6c8, 0xff6ad8, 0xffb020]));
    }
    v.traverse(function (o) { if (o.isMesh) { o.castShadow = true; } });
    return v;
  };

})();
