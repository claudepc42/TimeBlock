// TimeBlock — renderer, environment, camera, input, UI glue
'use strict';
(function () {
  let renderer, scene, camera, clock;
  let sun, hemi, sky, stars;
  const streetPointLights = [];
  let currentEra = 1985;
  let envLerp = null; // {from, to, t, dur}
  let started = false;
  let cinematic = false;
  let cineT = 0;

  // camera state
  const cam = {
    yaw: -0.4, pitch: -0.06,
    pos: new THREE.Vector3(-30, 3.2, 62),
    vel: new THREE.Vector3()
  };
  const keys = {};

  // ---------------- boot ----------------
  function boot() {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.localClippingEnabled = true;
    document.getElementById('scene').appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 600);
    clock = new THREE.Clock();

    // lights
    sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -95;
    sun.shadow.camera.right = 95;
    sun.shadow.camera.top = 95;
    sun.shadow.camera.bottom = -95;
    sun.shadow.camera.far = 400;
    sun.shadow.bias = -0.0006;
    scene.add(sun);
    scene.add(sun.target);
    hemi = new THREE.HemisphereLight(0xbfd8ef, 0x8a8070, 0.6);
    scene.add(hemi);

    // four unshadowed point lights for night eras (corner pools of light)
    [[-50, -30], [50, -30], [-50, 30], [50, 30]].forEach(function (p) {
      const pl = new THREE.PointLight(0xffd9a0, 0, 60, 2);
      pl.position.set(p[0], 9, p[1]);
      scene.add(pl);
      streetPointLights.push(pl);
    });

    // sky dome
    const skyGeo = new THREE.SphereGeometry(480, 24, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        cTop: { value: new THREE.Color(0x2f7fd4) },
        cHorizon: { value: new THREE.Color(0x9fd2ef) },
        cBottom: { value: new THREE.Color(0xbfe3f5) }
      },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: [
        'varying vec3 vP;',
        'uniform vec3 cTop; uniform vec3 cHorizon; uniform vec3 cBottom;',
        'void main(){',
        '  float h = normalize(vP).y;',
        '  vec3 col = h > 0.0 ? mix(cHorizon, cTop, pow(h, 0.62)) : mix(cHorizon, cBottom, pow(-h, 0.8));',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    });
    sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);

    // stars
    const starGeo = new THREE.BufferGeometry();
    const N = 700, sp = new Float32Array(N * 3);
    const sr = TB.rng(1234);
    for (let i = 0; i < N; i++) {
      const a = sr() * Math.PI * 2, e = sr() * Math.PI * 0.45 + 0.06;
      const R = 460;
      sp[i * 3] = Math.cos(a) * Math.cos(e) * R;
      sp[i * 3 + 1] = Math.sin(e) * R;
      sp[i * 3 + 2] = Math.sin(a) * Math.cos(e) * R;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xcfe0ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0
    }));
    scene.add(stars);

    scene.fog = new THREE.FogExp2(0xcfe6f2, 0.0035);

    TB.fx.init(scene);

    // build all six eras with a progress bar
    TB.city.buildAll(scene, function (p) {
      document.getElementById('load-bar').style.width = (p * 100).toFixed(0) + '%';
      document.getElementById('load-pct').textContent = 'assembling ' + TB.ERAS[Math.min(5, Math.floor(p * 6))] + '…';
    }, function () {
      const q = new URLSearchParams(location.search);
      const qe = +q.get('era');
      if (TB.ERAS.indexOf(qe) >= 0) currentEra = qe;
      TB.city.show(currentEra);
      applyEnv(TB.ERA_ENV[currentEra], TB.ERA_ENV[currentEra], 1);
      if (q.has('auto')) {
        try { startExperience(); } catch (e) { console.error(e); }
        updateSliderUI(currentEra);
        const gotoEra = +q.get('goto');
        if (TB.ERAS.indexOf(gotoEra) >= 0) {
          setTimeout(function () { setEra(gotoEra); }, +(q.get('delay') || 5000));
        }
        return;
      }
      document.getElementById('load-inner').innerHTML = '<button id="enter-btn">ENTER THE TIMESTREAM</button><div class="load-hint">headphones recommended</div>';
      document.getElementById('enter-btn').addEventListener('click', startExperience);
    });

    bindInput();
    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
  }

  function startExperience() {
    started = true;
    TB.audio.init();
    TB.audio.resume();
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    showEraCard(currentEra);
  }

  // ---------------- environment lerp ----------------
  const _c = {}; // scratch colors
  ['skyTop', 'skyBottom', 'horizon', 'fogColor', 'sunColor', 'hemiSky', 'hemiGround'].forEach(function (k) {
    _c[k + 'A'] = new THREE.Color(); _c[k + 'B'] = new THREE.Color();
  });

  function applyEnv(a, b, t) {
    const s = TB.smoothstep(TB.clamp(t, 0, 1));
    function col(k) {
      _c[k + 'A'].setHex(a[k]); _c[k + 'B'].setHex(b[k]);
      return _c[k + 'A'].lerp(_c[k + 'B'], s);
    }
    sky.material.uniforms.cTop.value.copy(col('skyTop'));
    sky.material.uniforms.cHorizon.value.copy(col('horizon'));
    sky.material.uniforms.cBottom.value.copy(col('skyBottom'));
    scene.fog.color.copy(col('fogColor'));
    scene.fog.density = TB.lerp(a.fogDensity, b.fogDensity, s);
    sun.color.copy(col('sunColor'));
    sun.intensity = TB.lerp(a.sunIntensity, b.sunIntensity, s);
    sun.position.set(
      TB.lerp(a.sunPos[0], b.sunPos[0], s),
      TB.lerp(a.sunPos[1], b.sunPos[1], s),
      TB.lerp(a.sunPos[2], b.sunPos[2], s));
    hemi.color.copy(col('hemiSky'));
    hemi.groundColor.copy(col('hemiGround'));
    hemi.intensity = TB.lerp(a.hemiIntensity, b.hemiIntensity, s);
    renderer.toneMappingExposure = TB.lerp(a.exposure, b.exposure, s);
    const lampA = a.streetlights ? 1 : 0, lampB = b.streetlights ? 1 : 0;
    const lamp = TB.lerp(lampA, lampB, s);
    streetPointLights.forEach(function (pl) { pl.intensity = lamp * 1.6; });
    const starA = a.streetlights && a.skyTop < 0x303060 ? 1 : (a === TB.ERA_ENV[1985] ? 0.4 : 0);
    const starB = b.streetlights && b.skyTop < 0x303060 ? 1 : (b === TB.ERA_ENV[1985] ? 0.4 : 0);
    stars.material.opacity = TB.lerp(starA, starB, s) * 0.9;
  }

  // ---------------- era switching ----------------
  function setEra(era) {
    if (era === currentEra && !TB.city.transition) return;
    const from = TB.ERA_ENV[currentEra];
    const to = TB.ERA_ENV[era];
    envLerp = { from: from, to: to, t: 0, dur: 2.4 };
    currentEra = era;
    TB.city.setEra(era);
    showEraCard(era);
    updateSliderUI(era);
  }
  window.TBsetEra = setEra;

  function showEraCard(era) {
    const env = TB.ERA_ENV[era];
    const card = document.getElementById('era-card');
    document.getElementById('era-year').textContent = env.title;
    document.getElementById('era-tag').textContent = env.tagline;
    document.getElementById('era-cap').textContent = env.caption;
    card.classList.remove('show');
    void card.offsetWidth; // restart animation
    card.classList.add('show');
  }

  // ---------------- input ----------------
  let dragging = false, lastX = 0, lastY = 0;

  function bindInput() {
    const el = document.getElementById('scene');
    el.addEventListener('mousedown', function (e) {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
    });
    window.addEventListener('mouseup', function () { dragging = false; });
    window.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      cam.yaw -= (e.clientX - lastX) * 0.0032;
      cam.pitch -= (e.clientY - lastY) * 0.0032;
      cam.pitch = TB.clamp(cam.pitch, -1.35, 1.35);
      lastX = e.clientX; lastY = e.clientY;
      cinematic = false;
    });
    el.addEventListener('wheel', function (e) {
      const fwd = forward();
      cam.pos.addScaledVector(fwd, -Math.sign(e.deltaY) * 3.2);
      clampCam();
      cinematic = false;
      e.preventDefault();
    }, { passive: false });
    // touch: one finger look, two finger move
    let touchMode = null, tX = 0, tY = 0;
    el.addEventListener('touchstart', function (e) {
      touchMode = e.touches.length;
      tX = e.touches[0].clientX; tY = e.touches[0].clientY;
    }, { passive: true });
    el.addEventListener('touchmove', function (e) {
      const dx = e.touches[0].clientX - tX, dy = e.touches[0].clientY - tY;
      if (touchMode === 1) {
        cam.yaw -= dx * 0.004; cam.pitch -= dy * 0.004;
        cam.pitch = TB.clamp(cam.pitch, -1.35, 1.35);
      } else {
        const fwd = forward();
        cam.pos.addScaledVector(fwd, -dy * 0.06);
        clampCam();
      }
      tX = e.touches[0].clientX; tY = e.touches[0].clientY;
      cinematic = false;
    }, { passive: true });

    window.addEventListener('keydown', function (e) {
      keys[e.code] = true;
      if (e.code >= 'Digit1' && e.code <= 'Digit6') {
        setEra(TB.ERAS[+e.code.slice(5) - 1]);
      }
      if (e.code === 'KeyC') { cinematic = !cinematic; }
      if (e.code === 'KeyM') { toggleMute(); }
      if (['ArrowUp', 'ArrowDown', 'Space'].indexOf(e.code) >= 0) e.preventDefault();
    });
    window.addEventListener('keyup', function (e) { keys[e.code] = false; });

    // UI buttons
    document.getElementById('btn-mute').addEventListener('click', toggleMute);
    document.getElementById('btn-cine').addEventListener('click', function () {
      cinematic = !cinematic;
      this.classList.toggle('on', cinematic);
    });
    buildSlider();
  }

  function toggleMute() {
    TB.audio.setMuted(!TB.audio.isMuted());
    document.getElementById('btn-mute').textContent = TB.audio.isMuted() ? '🔇' : '🔊';
  }

  function forward() {
    return new THREE.Vector3(
      Math.sin(cam.yaw) * Math.cos(cam.pitch) * -1,
      Math.sin(cam.pitch),
      Math.cos(cam.yaw) * Math.cos(cam.pitch) * -1
    );
  }

  function clampCam() {
    cam.pos.x = TB.clamp(cam.pos.x, -110, 110);
    cam.pos.z = TB.clamp(cam.pos.z, -95, 95);
    cam.pos.y = TB.clamp(cam.pos.y, 1.2, 80);
  }

  function updateCamera(dt) {
    if (cinematic) {
      cineT += dt;
      const a = cineT * 0.07;
      const R = 72 + Math.sin(cineT * 0.05) * 18;
      const tx = Math.cos(a) * R, tz = Math.sin(a) * R * 0.75;
      const ty = 8 + (Math.sin(cineT * 0.043) * 0.5 + 0.5) * 26;
      cam.pos.lerp(new THREE.Vector3(tx, ty, tz), Math.min(1, dt * 0.7));
      // look at block center-ish
      const look = new THREE.Vector3(0, 6, 0).sub(cam.pos);
      const targetYaw = Math.atan2(-look.x, -look.z);
      const targetPitch = Math.atan2(look.y, Math.hypot(look.x, look.z));
      cam.yaw += shortestAngle(cam.yaw, targetYaw) * Math.min(1, dt * 1.5);
      cam.pitch += (targetPitch - cam.pitch) * Math.min(1, dt * 1.5);
    } else {
      const speed = (keys.ShiftLeft || keys.ShiftRight) ? 26 : 10;
      const fwd = forward();
      const flat = new THREE.Vector3(fwd.x, 0, fwd.z).normalize();
      const right = new THREE.Vector3(-flat.z, 0, flat.x);
      const move = new THREE.Vector3();
      if (keys.KeyW || keys.ArrowUp) move.add(flat);
      if (keys.KeyS || keys.ArrowDown) move.sub(flat);
      if (keys.KeyA || keys.ArrowLeft) move.sub(right);
      if (keys.KeyD || keys.ArrowRight) move.add(right);
      if (keys.KeyE || keys.Space) move.y += 1;
      if (keys.KeyQ || keys.ControlLeft) move.y -= 1;
      if (move.lengthSq() > 0) {
        move.normalize();
        cam.vel.lerp(move.multiplyScalar(speed), Math.min(1, dt * 8));
      } else {
        cam.vel.lerp(new THREE.Vector3(), Math.min(1, dt * 6));
      }
      cam.pos.addScaledVector(cam.vel, dt);
      clampCam();
    }
    camera.position.copy(cam.pos);
    const look = forward();
    camera.lookAt(cam.pos.x + look.x, cam.pos.y + look.y, cam.pos.z + look.z);
  }

  function shortestAngle(a, b) {
    let d = (b - a) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  // ---------------- timeline slider ----------------
  let sliderDrag = false;

  function buildSlider() {
    const track = document.getElementById('tl-track');
    const rectFor = function () { return track.getBoundingClientRect(); };
    TB.ERAS.forEach(function (era, i) {
      const stop = document.createElement('div');
      stop.className = 'tl-stop';
      stop.style.left = (i / (TB.ERAS.length - 1) * 100) + '%';
      const lbl = document.createElement('div');
      lbl.className = 'tl-label';
      lbl.textContent = era;
      stop.appendChild(lbl);
      stop.addEventListener('click', function (e) {
        e.stopPropagation();
        if (started) { TB.audio.tick(); setEra(era); }
      });
      track.appendChild(stop);
    });
    const thumb = document.createElement('div');
    thumb.id = 'tl-thumb';
    track.appendChild(thumb);

    function posToEra(clientX) {
      const r = rectFor();
      const t = TB.clamp((clientX - r.left) / r.width, 0, 1);
      return TB.ERAS[Math.round(t * (TB.ERAS.length - 1))];
    }
    function onDown(e) {
      sliderDrag = true;
      onMove(e);
    }
    function onMove(e) {
      if (!sliderDrag || !started) return;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const r = rectFor();
      const t = TB.clamp((x - r.left) / r.width, 0, 1);
      thumb.style.left = (t * 100) + '%';
      const era = posToEra(x);
      if (era !== currentEra) { TB.audio.tick(); setEra(era); }
    }
    function onUp() {
      if (sliderDrag) updateSliderUI(currentEra);
      sliderDrag = false;
    }
    track.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    track.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    updateSliderUI(currentEra);
  }

  function updateSliderUI(era) {
    const i = TB.ERAS.indexOf(era);
    const thumb = document.getElementById('tl-thumb');
    if (thumb) thumb.style.left = (i / (TB.ERAS.length - 1) * 100) + '%';
    document.querySelectorAll('.tl-stop').forEach(function (s, j) {
      s.classList.toggle('active', j === i);
      s.classList.toggle('past', j < i);
    });
  }

  // ---------------- main loop ----------------
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;

    if (envLerp) {
      envLerp.t += dt;
      applyEnv(envLerp.from, envLerp.to, envLerp.t / envLerp.dur);
      if (envLerp.t >= envLerp.dur) envLerp = null;
    }

    TB.city.update(dt, t);
    TB.fx.update(dt);
    if (started) {
      updateCamera(dt);
      TB.audio.update(dt, currentEra);
    } else {
      // gentle drift behind the loading screen
      cam.yaw += dt * 0.02;
      camera.position.copy(cam.pos);
      const look = forward();
      camera.lookAt(cam.pos.x + look.x, cam.pos.y + look.y, cam.pos.z + look.z);
    }
    renderer.render(scene, camera);
  }

  window.addEventListener('DOMContentLoaded', boot);
})();
