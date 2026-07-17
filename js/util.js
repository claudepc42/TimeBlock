// TimeBlock — utilities
'use strict';
window.TB = window.TB || {};

TB.ERAS = [1945, 1965, 1985, 2005, 2025, 2055];

// Deterministic PRNG (mulberry32) so the city looks the same every load
TB.rng = function (seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

TB.pick = function (r, arr) { return arr[Math.floor(r() * arr.length)]; };
TB.lerp = function (a, b, t) { return a + (b - a) * t; };
TB.clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };
TB.smoothstep = function (t) { return t * t * (3 - 2 * t); };

TB.lerpColor = function (out, a, b, t) {
  out.r = TB.lerp(a.r, b.r, t);
  out.g = TB.lerp(a.g, b.g, t);
  out.b = TB.lerp(a.b, b.b, t);
  return out;
};

// Canvas helper: create a canvas + 2d ctx
TB.canvas = function (w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return { c: c, x: c.getContext('2d') };
};

TB.texFromCanvas = function (c, repeatX, repeatY) {
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 4;
  if (repeatX || repeatY) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeatX || 1, repeatY || 1);
  }
  return t;
};

// Simple ease for transitions
TB.easeOutBack = function (t) {
  const c1 = 1.2, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
TB.easeInCubic = function (t) { return t * t * t; };
TB.easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };

// Dispose a group recursively (geometries + materials, not shared textures)
TB.disposeGroup = function (root) {
  root.traverse(function (o) {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(function (m) {
        for (const k in m) {
          if (m[k] && m[k].isTexture) m[k].dispose();
        }
        m.dispose();
      });
    }
  });
};

// Shared geometry cache
TB.geo = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
  cyl6: new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
  sphere: new THREE.SphereGeometry(0.5, 12, 10),
  cone: new THREE.ConeGeometry(0.5, 1, 10),
  plane: new THREE.PlaneGeometry(1, 1),
  torus: new THREE.TorusGeometry(0.5, 0.08, 8, 24)
};

// Quick mesh helpers
TB.mesh = function (geo, mat, x, y, z, sx, sy, sz) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x || 0, y || 0, z || 0);
  m.scale.set(sx || 1, sy || 1, sz || 1);
  return m;
};

TB.mat = function (color, opts) {
  const p = Object.assign({ color: color, roughness: 0.85, metalness: 0.0 }, opts || {});
  return new THREE.MeshStandardMaterial(p);
};
