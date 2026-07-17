// TimeBlock — pedestrians with era wardrobes and a simple walk cycle.
'use strict';
window.TB = window.TB || {};
TB.peds = {};

(function () {

  // Era wardrobes: [topColors], [bottomColors], hat chance, hat type, skirt chance, accent
  const WARDROBE = {
    1945: {
      tops: [0x5a4a3a, 0x4a4440, 0x3a3e46, 0x6b5844, 0x44484e, 0x7a6a52],
      bottoms: [0x3a3630, 0x2e3236, 0x4a4038],
      hat: 0.85, hatType: 'fedora', skirt: 0.45,
      skirts: [0x6b4a3c, 0x54424e, 0x4a5240], glow: 0
    },
    1965: {
      tops: [0xd8d0c0, 0x48b8d8, 0xe89a3c, 0xd84a3c, 0xf0e6c8, 0x9fd0b0, 0x4a4e54],
      bottoms: [0x3a3e46, 0x54423a, 0x8a8478, 0x2e3236],
      hat: 0.35, hatType: 'trilby', skirt: 0.45,
      skirts: [0xe8b83c, 0xd85480, 0x68b890, 0xd8d0c0], glow: 0
    },
    1985: {
      tops: [0xe83c8c, 0x30c8d8, 0xf0e030, 0xb02a20, 0x8a2ad8, 0x30d860, 0x2a2c30],
      bottoms: [0x4a6a9a, 0x3a5a8a, 0x2a2c30, 0x8a8f94], // denim!
      hat: 0.1, hatType: 'cap', skirt: 0.25,
      skirts: [0xe83c8c, 0x30c8d8, 0x2a2c30], glow: 0
    },
    2005: {
      tops: [0x8a8f94, 0x4a4e54, 0xb0b4b8, 0x28527a, 0xc23b2e, 0xe8e8e4, 0x2a5a2e],
      bottoms: [0x3a5a8a, 0x2e4a72, 0x2a2c30, 0x8a7a5a],
      hat: 0.15, hatType: 'cap', skirt: 0.2,
      skirts: [0x4a4e54, 0x8a5a6a], glow: 0
    },
    2025: {
      tops: [0x202226, 0xe8e8e6, 0x3a5a7a, 0x6a7a6a, 0xb0a890, 0x484850, 0xd8c8b8],
      bottoms: [0x202226, 0x3a3e46, 0x5a5e64, 0x2e4a3a],
      hat: 0.2, hatType: 'beanie', skirt: 0.18,
      skirts: [0x202226, 0x6a5a4a], glow: 0, phone: 0.5
    },
    2055: {
      tops: [0x1a2430, 0x2a3444, 0x30284a, 0x14303c, 0x3c1a34, 0xd8dce4],
      bottoms: [0x141c28, 0x1e2836, 0x241c34],
      hat: 0.12, hatType: 'visor', skirt: 0.15,
      skirts: [0x1a2430, 0x30284a], glow: 0.7,
      glowCols: [0x41f2ff, 0x22e6c8, 0xff6ad8, 0xffb020, 0xc850ff]
    }
  };

  const SKIN = [0xe8c8a8, 0xd8b090, 0xc09068, 0x9a6b48, 0x7a5238, 0xf0d8c0];

  TB.peds.make = function (era, r) {
    const wd = WARDROBE[era];
    const g = new THREE.Group();
    const skin = TB.mat(TB.pick(r, SKIN), { roughness: 0.8 });
    const topCol = TB.pick(r, wd.tops);
    const top = TB.mat(topCol, { roughness: 0.85 });
    const female = r() < 0.5;
    const useSkirt = female && r() < wd.skirt * 2;
    const scale = 0.92 + r() * 0.18;

    // legs (pivot at hip, so leg meshes hang from y=0 group at hip height)
    const hipY = 0.95;
    const legL = new THREE.Group(), legR = new THREE.Group();
    const botCol = useSkirt ? TB.pick(r, SKIN) : TB.pick(r, wd.bottoms);
    const legMat = useSkirt ? skin : TB.mat(botCol, { roughness: 0.85 });
    [legL, legR].forEach(function (leg, i) {
      const lm = TB.mesh(TB.geo.box, legMat, 0, -hipY / 2, 0, 0.16, hipY, 0.18);
      leg.add(lm);
      // shoe
      leg.add(TB.mesh(TB.geo.box, TB.mat(era >= 2055 ? 0x2a3444 : 0x241c14), 0, -hipY + 0.05, 0.05, 0.17, 0.1, 0.32));
      leg.position.set(i === 0 ? -0.11 : 0.11, hipY, 0);
      g.add(leg);
    });

    // torso
    const torsoH = 0.62;
    g.add(TB.mesh(TB.geo.box, top, 0, hipY + torsoH / 2, 0, 0.42, torsoH, 0.26));
    // skirt cone over hips
    if (useSkirt) {
      g.add(TB.mesh(TB.geo.cone, TB.mat(TB.pick(r, wd.skirts), { roughness: 0.9 }), 0, hipY - 0.18, 0, 0.55, 0.55, 0.45));
    }
    // coat tail for 1945 long coats
    if (era === 1945 && r() < 0.5) {
      g.add(TB.mesh(TB.geo.box, top, 0, hipY - 0.2, -0.02, 0.44, 0.5, 0.28));
    }

    // arms (swing at shoulder)
    const armL = new THREE.Group(), armR = new THREE.Group();
    const shoulderY = hipY + torsoH - 0.06;
    [armL, armR].forEach(function (arm, i) {
      arm.add(TB.mesh(TB.geo.box, top, 0, -0.26, 0, 0.11, 0.5, 0.13));
      arm.add(TB.mesh(TB.geo.box, skin, 0, -0.56, 0, 0.1, 0.14, 0.11));
      arm.position.set(i === 0 ? -0.27 : 0.27, shoulderY, 0);
      g.add(arm);
    });

    // head
    const headY = hipY + torsoH + 0.18;
    g.add(TB.mesh(TB.geo.sphere, skin, 0, headY, 0, 0.3, 0.34, 0.3));
    // hair
    const hairCol = TB.pick(r, [0x241a10, 0x3a2a18, 0x6b4a28, 0x8a8078, 0xd8c8a8, 0x141414]);
    g.add(TB.mesh(TB.geo.sphere, TB.mat(hairCol, { roughness: 0.95 }), 0, headY + 0.07, -0.03, 0.31, 0.3, 0.31));
    if (era === 1985 && r() < 0.4) {
      // big hair
      g.add(TB.mesh(TB.geo.sphere, TB.mat(hairCol), 0, headY + 0.12, -0.02, 0.42, 0.4, 0.4));
    }

    // hats
    if (r() < wd.hat) {
      const hatCol = TB.pick(r, [0x2a2622, 0x3e362c, 0x4a423a, 0x26282e]);
      if (wd.hatType === 'fedora' || wd.hatType === 'trilby') {
        g.add(TB.mesh(TB.geo.cyl, TB.mat(hatCol), 0, headY + 0.22, 0, 0.34, 0.18, 0.34));
        g.add(TB.mesh(TB.geo.cyl, TB.mat(hatCol), 0, headY + 0.15, 0, 0.52, 0.04, 0.52));
      } else if (wd.hatType === 'cap') {
        g.add(TB.mesh(TB.geo.sphere, TB.mat(TB.pick(r, [0xb02a20, 0x28527a, 0x2a2c30])), 0, headY + 0.16, 0, 0.32, 0.2, 0.32));
        g.add(TB.mesh(TB.geo.box, TB.mat(0x2a2c30), 0, headY + 0.12, 0.22, 0.3, 0.04, 0.2));
      } else if (wd.hatType === 'beanie') {
        g.add(TB.mesh(TB.geo.sphere, TB.mat(TB.pick(r, [0x8a4a3a, 0x3a4a3a, 0x44444c])), 0, headY + 0.17, 0, 0.32, 0.22, 0.32));
      } else if (wd.hatType === 'visor') {
        g.add(TB.mesh(TB.geo.box, new THREE.MeshStandardMaterial({
          color: 0x101820, emissive: TB.pick(r, WARDROBE[2055].glowCols), emissiveIntensity: 1.2,
          transparent: true, opacity: 0.85
        }), 0, headY + 0.02, 0.16, 0.34, 0.1, 0.16));
      }
    }

    // 2055 glow piping
    if (wd.glow && r() < wd.glow) {
      const gc = TB.pick(r, wd.glowCols);
      const glowMat = new THREE.MeshStandardMaterial({ color: gc, emissive: gc, emissiveIntensity: 1.6 });
      g.add(TB.mesh(TB.geo.box, glowMat, 0, hipY + 0.08, 0.14, 0.4, 0.03, 0.02));
      g.add(TB.mesh(TB.geo.box, glowMat, -0.21, hipY + torsoH / 2, 0.12, 0.02, torsoH * 0.8, 0.02));
      g.add(TB.mesh(TB.geo.box, glowMat, 0.21, hipY + torsoH / 2, 0.12, 0.02, torsoH * 0.8, 0.02));
    }

    // 2005/2025 phone-in-hand pose (right arm bent up, head tilted)
    let phonePose = false;
    if ((era === 2025 && r() < 0.5) || (era === 2005 && r() < 0.25)) {
      phonePose = true;
      armR.rotation.x = -1.9;
      armR.add(TB.mesh(TB.geo.box, new THREE.MeshStandardMaterial({
        color: 0x101418, emissive: 0xcfe8ff, emissiveIntensity: era === 2025 ? 0.9 : 0.4
      }), 0, -0.6, 0.08, 0.14, 0.02, 0.24));
    }

    g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    g.scale.setScalar(scale);
    g.userData = {
      legL: legL, legR: legR, armL: armL, armR: armR,
      phonePose: phonePose,
      phase: r() * Math.PI * 2,
      speed: 0.8 + r() * 0.7
    };
    if (era === 2025 && phonePose) g.userData.speed *= 0.6; // scrolling, not walking
    return g;
  };

  // Advance the walk cycle. dist = distance walked this frame.
  TB.peds.animate = function (ped, t, walking) {
    const u = ped.userData;
    const w = walking ? 1 : 0;
    const s = Math.sin(t * 7 * u.speed + u.phase) * 0.55 * w;
    u.legL.rotation.x = s;
    u.legR.rotation.x = -s;
    u.armL.rotation.x = -s * 0.7;
    if (!u.phonePose) u.armR.rotation.x = s * 0.7;
    ped.position.y = Math.abs(Math.sin(t * 14 * u.speed + u.phase)) * 0.03 * w;
  };

})();
