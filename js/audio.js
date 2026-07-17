// TimeBlock — fully procedural WebAudio ambience + SFX (no audio files)
'use strict';
window.TB = window.TB || {};

TB.audio = (function () {
  let ctx = null, master = null, muted = false;
  const layers = {}; // name -> {gain, target}
  let honkTimer = 0, chirpTimer = 0, bellTimer = 0, ringTimer = 0;
  let currentEra = 1985;

  function noiseBuffer(seconds, brown) {
    const sr = ctx.sampleRate;
    const buf = ctx.createBuffer(1, sr * seconds, sr);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      } else {
        d[i] = w;
      }
    }
    return buf;
  }

  function makeLayer(name, build) {
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(master);
    build(gain);
    layers[name] = { gain: gain, target: 0 };
  }

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.6;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(ctx.destination);

    // --- city rumble: brown noise through lowpass
    makeLayer('rumble', function (out) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(4, true);
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 120;
      src.connect(lp); lp.connect(out);
      src.start();
    });

    // --- traffic bed: low, smooth filtered noise (a steady 'shhh', no wobble)
    makeLayer('traffic', function (out) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(6, true);
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 0.3;
      // very slow, very shallow drift so it feels alive but never pulses
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05;
      const lfoG = ctx.createGain(); lfoG.gain.value = 60;
      lfo.connect(lfoG); lfoG.connect(lp.frequency);
      lfo.start();
      src.connect(lp); lp.connect(out);
      src.start();
    });

    // --- crowd murmur: soft voice-band noise, only a hint of movement
    makeLayer('crowd', function (out) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(6, false);
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 620; bp.Q.value = 0.9;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 1400;
      // gentle, irregular swell — slow and shallow so it reads as a room, not a pulse
      const trem = ctx.createGain(); trem.gain.value = 0.85;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.22;
      const lfoG = ctx.createGain(); lfoG.gain.value = 0.12;
      lfo.connect(lfoG); lfoG.connect(trem.gain); lfo.start();
      src.connect(bp); bp.connect(lp); lp.connect(trem);
      trem.connect(out);
      src.start();
    });

    // --- neon buzz: 120Hz sawtooth, very quiet, crackly
    makeLayer('neonBuzz', function (out) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth'; osc.frequency.value = 120;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 800;
      const g = ctx.createGain(); g.gain.value = 0.06;
      osc.connect(hp); hp.connect(g); g.connect(out);
      osc.start();
    });

    // --- hover hum (2055): detuned low sines + shimmer
    makeLayer('hover', function (out) {
      [55, 55.7, 110.3].forEach(function (f, i) {
        const osc = ctx.createOscillator();
        osc.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = i === 2 ? 0.05 : 0.12;
        osc.connect(g); g.connect(out);
        osc.start();
      });
      const shimmer = ctx.createOscillator();
      shimmer.frequency.value = 1200;
      const sg = ctx.createGain(); sg.gain.value = 0.008;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.4;
      const lg = ctx.createGain(); lg.gain.value = 400;
      lfo.connect(lg); lg.connect(shimmer.frequency); lfo.start();
      shimmer.connect(sg); sg.connect(out);
      shimmer.start();
    });

    // --- wind (subtle, always a little)
    makeLayer('wind', function (out) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(4, false);
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 500;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
      const lg = ctx.createGain(); lg.gain.value = 260;
      lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
      src.connect(lp); lp.connect(out);
      src.start();
    });
    layers.wind.target = 0.05;
  }

  // ---------- one-shots ----------
  function env(g, t0, a, peak, d) {
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + a + d);
  }

  function honk(style) {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    const g = ctx.createGain();
    g.connect(master);
    if (style === 'oldtimey') {
      // two-tone aooga-ish
      [349, 262].forEach(function (f, i) {
        const o = ctx.createOscillator();
        o.type = 'square'; o.frequency.value = f;
        const og = ctx.createGain();
        env(og, t + i * 0.16, 0.02, 0.05, 0.22);
        o.connect(og); og.connect(g);
        o.start(t + i * 0.16); o.stop(t + i * 0.16 + 0.3);
      });
    } else if (style === 'classic') {
      const o = ctx.createOscillator();
      o.type = 'square'; o.frequency.value = 330 + Math.random() * 60;
      const og = ctx.createGain();
      env(og, t, 0.01, 0.06, 0.25 + Math.random() * 0.3);
      o.connect(og); og.connect(g);
      o.start(t); o.stop(t + 0.7);
    } else if (style === 'modern') {
      [440, 554].forEach(function (f) {
        const o = ctx.createOscillator();
        o.type = 'triangle'; o.frequency.value = f + Math.random() * 20;
        const og = ctx.createGain();
        env(og, t, 0.01, 0.04, 0.18);
        o.connect(og); og.connect(g);
        o.start(t); o.stop(t + 0.3);
      });
    } else {
      // future: soft descending chime
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(880, t);
      o.frequency.exponentialRampToValueAtTime(440, t + 0.3);
      const og = ctx.createGain();
      env(og, t, 0.02, 0.05, 0.35);
      o.connect(og); og.connect(g);
      o.start(t); o.stop(t + 0.5);
    }
  }

  function chirp() {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const o = ctx.createOscillator();
      const f = 2400 + Math.random() * 1600;
      o.frequency.setValueAtTime(f, t + i * 0.09);
      o.frequency.exponentialRampToValueAtTime(f * 1.4, t + i * 0.09 + 0.05);
      const og = ctx.createGain();
      env(og, t + i * 0.09, 0.01, 0.025, 0.07);
      o.connect(og); og.connect(master);
      o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.1);
    }
  }

  function trolleyBell() {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const o = ctx.createOscillator();
      o.frequency.value = 1180;
      const o2 = ctx.createOscillator();
      o2.frequency.value = 1770;
      const og = ctx.createGain();
      env(og, t + i * 0.28, 0.005, 0.05, 0.5);
      o.connect(og); o2.connect(og); og.connect(master);
      o.start(t + i * 0.28); o.stop(t + i * 0.28 + 0.6);
      o2.start(t + i * 0.28); o2.stop(t + i * 0.28 + 0.6);
    }
  }

  function ringtone() {
    if (!ctx || muted) return;
    // polyphonic ringtone arpeggio, unmistakably 2005
    const t = ctx.currentTime;
    const notes = [659, 587, 370, 415, 554, 494, 294, 330, 494, 440, 277, 330, 440];
    notes.forEach(function (f, i) {
      const o = ctx.createOscillator();
      o.type = 'square'; o.frequency.value = f;
      const og = ctx.createGain();
      env(og, t + i * 0.11, 0.005, 0.018, 0.09);
      o.connect(og); og.connect(master);
      o.start(t + i * 0.11); o.stop(t + i * 0.11 + 0.12);
    });
  }

  function whoosh(durUp) {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    // rising filtered noise
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(2, false);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(120, t);
    bp.frequency.exponentialRampToValueAtTime(3200, t + durUp);
    bp.frequency.exponentialRampToValueAtTime(200, t + durUp + 1.2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.35, t + durUp * 0.7);
    g.gain.exponentialRampToValueAtTime(0.001, t + durUp + 1.4);
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start(t); src.stop(t + durUp + 1.5);
    // deep thump at the moment of arrival
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(120, t + durUp);
    o.frequency.exponentialRampToValueAtTime(38, t + durUp + 0.5);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0, t);
    og.gain.setValueAtTime(0.5, t + durUp);
    og.gain.exponentialRampToValueAtTime(0.001, t + durUp + 0.9);
    o.connect(og); og.connect(master);
    o.start(t); o.stop(t + durUp + 1);
    // arrival chime
    [880, 1108, 1318].forEach(function (f, i) {
      const co = ctx.createOscillator();
      co.frequency.value = f;
      const cg = ctx.createGain();
      env(cg, t + durUp + 0.05 + i * 0.06, 0.01, 0.06, 0.8);
      co.connect(cg); cg.connect(master);
      co.start(t + durUp + 0.05 + i * 0.06); co.stop(t + durUp + 1.2);
    });
  }

  function tick() {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'square'; o.frequency.value = 2000;
    const g = ctx.createGain();
    env(g, t, 0.001, 0.02, 0.03);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.05);
  }

  function demolishThud() {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(1, true);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 200;
    const g = ctx.createGain();
    env(g, t, 0.005, 0.3, 0.5);
    src.connect(lp); lp.connect(g); g.connect(master);
    src.start(t); src.stop(t + 0.6);
  }

  // ---------- per-frame ----------
  function update(dt, era) {
    if (!ctx) return;
    currentEra = era;
    const mix = TB.ERA_AUDIO[era];
    layers.rumble.target = mix.rumble * 0.34;
    layers.traffic.target = mix.traffic * 0.26;
    layers.crowd.target = mix.crowd * 0.30;
    layers.neonBuzz.target = mix.neonBuzz * 0.4;
    layers.hover.target = mix.hover * 0.5;
    for (const k in layers) {
      const L = layers[k];
      const cur = L.gain.gain.value;
      L.gain.gain.value = cur + (L.target - cur) * Math.min(1, dt * 1.5);
    }
    // random one-shots
    honkTimer -= dt;
    if (honkTimer <= 0) {
      honkTimer = 4 + Math.random() * 30 * (1 - mix.honkRate * 5);
      if (Math.random() < mix.honkRate * 6) honk(mix.honkStyle);
    }
    if (mix.birds > 0) {
      chirpTimer -= dt;
      if (chirpTimer <= 0) {
        chirpTimer = 2 + Math.random() * 9;
        if (Math.random() < mix.birds) chirp();
      }
    }
    if (mix.bells > 0) {
      bellTimer -= dt;
      if (bellTimer <= 0) {
        bellTimer = 14 + Math.random() * 25;
        trolleyBell();
      }
    }
    if (mix.ringtone) {
      ringTimer -= dt;
      if (ringTimer <= 0) {
        ringTimer = 20 + Math.random() * 40;
        ringtone();
      }
    }
  }

  return {
    init: init,
    update: update,
    whoosh: whoosh,
    tick: tick,
    demolishThud: demolishThud,
    honk: honk,
    setMuted: function (m) {
      muted = m;
      if (master) master.gain.value = m ? 0 : 0.6;
    },
    isMuted: function () { return muted; },
    resume: function () { if (ctx && ctx.state === 'suspended') ctx.resume(); }
  };
})();
