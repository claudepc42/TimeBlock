// TimeBlock — procedural canvas textures: facades, signs, roads, ads
'use strict';
window.TB = window.TB || {};
TB.tex = {};

(function () {

  // ---------- generic noise/grime ----------
  function grime(x, w, h, amount, r) {
    if (amount <= 0) return;
    x.save();
    x.globalAlpha = Math.min(0.5, amount * 0.5);
    for (let i = 0; i < 130 * amount; i++) {
      const gx = r() * w, gy = r() * h, gr = 4 + r() * 26;
      const g = x.createRadialGradient(gx, gy, 0, gx, gy, gr);
      g.addColorStop(0, 'rgba(20,16,12,0.35)');
      g.addColorStop(1, 'rgba(20,16,12,0)');
      x.fillStyle = g;
      x.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
    }
    // streaks under "windowsills"
    x.globalAlpha = Math.min(0.4, amount * 0.4);
    for (let i = 0; i < 40 * amount; i++) {
      const gx = r() * w, gy = r() * h;
      x.fillStyle = 'rgba(15,12,10,0.25)';
      x.fillRect(gx, gy, 1 + r() * 2, 8 + r() * 30);
    }
    x.restore();
  }

  function speckle(x, w, h, color, n, r) {
    x.fillStyle = color;
    for (let i = 0; i < n; i++) {
      x.globalAlpha = 0.05 + r() * 0.12;
      x.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
    }
    x.globalAlpha = 1;
  }

  // ---------- brick facade with windows ----------
  // opts: {base,mortar,floors,cols,windowLit(0..1),grime,seed,sills,arched}
  TB.tex.brickFacade = function (opts) {
    const W = 512, H = 512;
    const { c, x } = TB.canvas(W, H);
    const r = TB.rng(opts.seed || 1);
    x.fillStyle = opts.base || '#8a4a35';
    x.fillRect(0, 0, W, H);
    // bricks
    const bh = 8, bw = 22;
    for (let row = 0; row < H / bh; row++) {
      for (let col = -1; col < W / bw; col++) {
        const off = (row % 2) * bw * 0.5;
        const shade = 0.85 + r() * 0.3;
        x.fillStyle = shadeColor(opts.base || '#8a4a35', shade);
        x.fillRect(col * bw + off + 1, row * bh + 1, bw - 2, bh - 2);
      }
    }
    speckle(x, W, H, '#000000', 300, r);
    drawWindowGrid(x, W, H, opts, r, 'brick');
    grime(x, W, H, opts.grime || 0, r);
    return TB.texFromCanvas(c);
  };

  // ---------- stone / masonry facade ----------
  TB.tex.stoneFacade = function (opts) {
    const W = 512, H = 512;
    const { c, x } = TB.canvas(W, H);
    const r = TB.rng(opts.seed || 2);
    x.fillStyle = opts.base || '#a89c88';
    x.fillRect(0, 0, W, H);
    const bh = 26;
    for (let row = 0; row < H / bh; row++) {
      x.fillStyle = shadeColor(opts.base || '#a89c88', 0.9 + r() * 0.2);
      x.fillRect(0, row * bh + 1, W, bh - 2);
      // block joints
      const bw = 60 + r() * 40;
      for (let cx = ((row % 2) * bw * 0.5); cx < W; cx += bw) {
        x.fillStyle = 'rgba(0,0,0,0.15)';
        x.fillRect(cx, row * bh, 2, bh);
      }
    }
    speckle(x, W, H, '#ffffff', 150, r);
    drawWindowGrid(x, W, H, opts, r, 'stone');
    grime(x, W, H, opts.grime || 0, r);
    return TB.texFromCanvas(c);
  };

  // ---------- concrete (brutalist / warehouse) ----------
  TB.tex.concreteFacade = function (opts) {
    const W = 512, H = 512;
    const { c, x } = TB.canvas(W, H);
    const r = TB.rng(opts.seed || 3);
    x.fillStyle = opts.base || '#9a968e';
    x.fillRect(0, 0, W, H);
    speckle(x, W, H, '#000000', 500, r);
    speckle(x, W, H, '#ffffff', 250, r);
    // formwork lines
    x.strokeStyle = 'rgba(0,0,0,0.18)';
    for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(0, i * 90); x.lineTo(W, i * 90); x.stroke(); }
    for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(i * 72, 0); x.lineTo(i * 72, H); x.stroke(); }
    drawWindowGrid(x, W, H, opts, r, 'concrete');
    grime(x, W, H, opts.grime || 0, r);
    return TB.texFromCanvas(c);
  };

  // ---------- glass curtain wall ----------
  TB.tex.glassFacade = function (opts) {
    const W = 512, H = 512;
    const { c, x } = TB.canvas(W, H);
    const r = TB.rng(opts.seed || 4);
    const skyA = opts.tintA || '#7fa8c9', skyB = opts.tintB || '#33506e';
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, skyA); g.addColorStop(1, skyB);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const cols = opts.cols || 10, floors = opts.floors || 12;
    const cw = W / cols, fh = H / floors;
    for (let f = 0; f < floors; f++) {
      for (let col = 0; col < cols; col++) {
        const lit = r() < (opts.windowLit || 0);
        const v = 0.85 + r() * 0.3;
        x.fillStyle = lit ? litColor(r) : shadeGlass(skyA, skyB, f / floors, v);
        x.fillRect(col * cw + 2, f * fh + 2, cw - 4, fh - 4);
        // mullion highlight
        x.fillStyle = 'rgba(255,255,255,0.12)';
        x.fillRect(col * cw + 2, f * fh + 2, cw - 4, 2);
      }
    }
    // frame grid
    x.strokeStyle = opts.frame || 'rgba(30,34,40,0.9)';
    x.lineWidth = 3;
    for (let f = 0; f <= floors; f++) { x.beginPath(); x.moveTo(0, f * fh); x.lineTo(W, f * fh); x.stroke(); }
    for (let col = 0; col <= cols; col++) { x.beginPath(); x.moveTo(col * cw, 0); x.lineTo(col * cw, H); x.stroke(); }
    return TB.texFromCanvas(c);
  };

  // ---------- future tower skin: dark panels + light bands ----------
  TB.tex.futureFacade = function (opts) {
    const W = 512, H = 1024;
    const { c, x } = TB.canvas(W, H);
    const r = TB.rng(opts.seed || 5);
    x.fillStyle = '#0c1420'; x.fillRect(0, 0, W, H);
    const floors = opts.floors || 30, fh = H / floors;
    for (let f = 0; f < floors; f++) {
      // panel row
      x.fillStyle = f % 5 === 0 ? '#101c2c' : '#0e1826';
      x.fillRect(0, f * fh, W, fh - 2);
      // window slits
      for (let col = 0; col < 16; col++) {
        const lit = r() < (opts.windowLit || 0.6);
        x.fillStyle = lit ? TB.pick(r, ['#9fdcff', '#ffd9a0', '#c2fff2', '#e8f4ff']) : '#16283c';
        x.globalAlpha = lit ? 0.65 + r() * 0.35 : 1;
        x.fillRect(col * 32 + 5, f * fh + fh * 0.25, 22, fh * 0.4);
        x.globalAlpha = 1;
      }
      // accent light band every few floors
      if (f % 6 === 3) {
        x.fillStyle = opts.accent || '#22e6c8';
        x.globalAlpha = 0.85;
        x.fillRect(0, f * fh + fh - 5, W, 3);
        x.globalAlpha = 1;
      }
    }
    return TB.texFromCanvas(c);
  };

  // ---------- shared window grid painter for masonry facades ----------
  function drawWindowGrid(x, W, H, opts, r, style) {
    const floors = opts.floors || 4, cols = opts.cols || 5;
    const fh = H / floors, cw = W / cols;
    const winW = cw * 0.5, winH = fh * 0.58;
    for (let f = 0; f < floors; f++) {
      for (let col = 0; col < cols; col++) {
        const wx = col * cw + (cw - winW) / 2;
        const wy = f * fh + fh * 0.2;
        // frame
        x.fillStyle = opts.frame || (style === 'brick' ? '#3a2c22' : '#4a4438');
        x.fillRect(wx - 3, wy - 3, winW + 6, winH + 6);
        // glass
        const lit = r() < (opts.windowLit || 0);
        if (lit) {
          x.fillStyle = litColor(r);
        } else {
          const g = x.createLinearGradient(0, wy, 0, wy + winH);
          g.addColorStop(0, '#2c3a44'); g.addColorStop(1, '#141c22');
          x.fillStyle = g;
        }
        x.fillRect(wx, wy, winW, winH);
        // sash cross
        x.fillStyle = 'rgba(20,16,12,0.7)';
        x.fillRect(wx, wy + winH / 2 - 1, winW, 2);
        x.fillRect(wx + winW / 2 - 1, wy, 2, winH);
        // sill
        x.fillStyle = 'rgba(255,255,255,0.18)';
        x.fillRect(wx - 5, wy + winH + 3, winW + 10, 4);
        // occasional curtain / blind
        if (r() < 0.3 && !lit) {
          x.fillStyle = TB.pick(r, ['rgba(180,160,120,0.5)', 'rgba(150,120,110,0.5)', 'rgba(120,140,150,0.5)']);
          x.fillRect(wx, wy, winW, winH * (0.3 + r() * 0.5));
        }
        // occasional window AC unit (drawn, cheap detail)
        if (opts.acUnits && r() < 0.18) {
          x.fillStyle = '#7d7d78';
          x.fillRect(wx + winW * 0.2, wy + winH - 8, winW * 0.6, 10);
          x.fillStyle = '#55554f';
          x.fillRect(wx + winW * 0.25, wy + winH - 5, winW * 0.5, 4);
        }
      }
    }
  }

  function litColor(r) {
    return TB.pick(r, ['#ffd98a', '#ffe9b8', '#fff3d0', '#ffca6e']);
  }

  function shadeColor(hex, mul) {
    const n = parseInt(hex.slice(1), 16);
    let R = (n >> 16) & 255, G = (n >> 8) & 255, B = n & 255;
    R = Math.min(255, R * mul) | 0; G = Math.min(255, G * mul) | 0; B = Math.min(255, B * mul) | 0;
    return 'rgb(' + R + ',' + G + ',' + B + ')';
  }
  TB.tex.shadeColor = shadeColor;

  function shadeGlass(a, b, t, v) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const R = (((pa >> 16 & 255) * (1 - t) + (pb >> 16 & 255) * t) * v) | 0;
    const G = (((pa >> 8 & 255) * (1 - t) + (pb >> 8 & 255) * t) * v) | 0;
    const B = (((pa & 255) * (1 - t) + (pb & 255) * t) * v) | 0;
    return 'rgb(' + Math.min(255, R) + ',' + Math.min(255, G) + ',' + Math.min(255, B) + ')';
  }

  // ---------- storefront sign ----------
  // style: painted | enamel | neon | plastic | backlit | led | holo
  TB.tex.sign = function (text, style, opts) {
    opts = opts || {};
    const W = 512, H = 128;
    const { c, x } = TB.canvas(W, H);
    const r = TB.rng((opts.seed || 7) + text.length * 13);

    if (style === 'painted') {
      x.fillStyle = opts.bg || '#3a4a3a'; x.fillRect(0, 0, W, H);
      x.strokeStyle = 'rgba(255,255,255,0.25)'; x.lineWidth = 4; x.strokeRect(8, 8, W - 16, H - 16);
      x.fillStyle = opts.fg || '#e8dcae';
      x.font = 'bold 58px Georgia, serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(text, W / 2, H / 2 + 2, W - 50);
      grime(x, W, H, 0.5, r);
    } else if (style === 'enamel') {
      x.fillStyle = opts.bg || '#b03a2e'; x.fillRect(0, 0, W, H);
      x.strokeStyle = '#ffffff'; x.lineWidth = 5; x.strokeRect(6, 6, W - 12, H - 12);
      x.fillStyle = opts.fg || '#ffffff';
      x.font = 'bold 56px "Arial Black", Arial, sans-serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(text, W / 2, H / 2 + 2, W - 50);
      grime(x, W, H, 0.25, r);
    } else if (style === 'neon') {
      x.fillStyle = '#0c0c12'; x.fillRect(0, 0, W, H);
      const col = opts.fg || '#ff4fd8';
      x.shadowColor = col; x.shadowBlur = 26;
      x.strokeStyle = col; x.lineWidth = 3;
      x.font = 'italic bold 60px "Brush Script MT", "Segoe Script", cursive';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.strokeText(text, W / 2, H / 2 + 2, W - 50);
      x.shadowBlur = 12;
      x.fillStyle = '#ffffff';
      x.font = 'italic bold 58px "Brush Script MT", "Segoe Script", cursive';
      x.fillText(text, W / 2, H / 2 + 2, W - 50);
      x.shadowBlur = 0;
      // tube mounting dots
      x.fillStyle = 'rgba(120,120,130,0.6)';
      for (let i = 0; i < 8; i++) x.fillRect(30 + i * 60, H - 14, 4, 8);
    } else if (style === 'plastic') {
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, opts.bg || '#e8e4d8'); g.addColorStop(1, shadeColor(opts.bg2 || '#c9c4b4', 1));
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.strokeStyle = '#5a5850'; x.lineWidth = 6; x.strokeRect(4, 4, W - 8, H - 8);
      x.fillStyle = opts.fg || '#c0392b';
      x.font = 'bold 60px "Arial Black", Arial, sans-serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(text, W / 2, H / 2 + 2, W - 50);
    } else if (style === 'backlit') {
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, opts.bg || '#f5f5f0'); g.addColorStop(1, '#d8d8d0');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.fillStyle = opts.fg || '#1a6b3c';
      x.font = '600 54px "Segoe UI", Helvetica, sans-serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(text, W / 2, H / 2 + 2, W - 50);
    } else if (style === 'led') {
      x.fillStyle = '#08090c'; x.fillRect(0, 0, W, H);
      x.fillStyle = opts.fg || '#3ad6ff';
      x.font = '300 52px "Segoe UI Light", "Segoe UI", Helvetica, sans-serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.shadowColor = opts.fg || '#3ad6ff'; x.shadowBlur = 14;
      x.fillText(text, W / 2, H / 2 + 2, W - 50);
      x.shadowBlur = 0;
    } else if (style === 'holo') {
      x.clearRect(0, 0, W, H);
      const col = opts.fg || '#41f2ff';
      x.shadowColor = col; x.shadowBlur = 22;
      x.fillStyle = col;
      x.font = '200 62px "Segoe UI Light", "Segoe UI", Helvetica, sans-serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(text, W / 2, H / 2 + 2, W - 50);
      // scanlines
      x.globalCompositeOperation = 'destination-out';
      for (let sy = 0; sy < H; sy += 5) x.fillRect(0, sy, W, 1.6);
      x.globalCompositeOperation = 'source-over';
    }
    return TB.texFromCanvas(c);
  };

  // ---------- theater marquee (title lines on white) ----------
  TB.tex.marquee = function (lines, opts) {
    opts = opts || {};
    const W = 512, H = 256;
    const { c, x } = TB.canvas(W, H);
    x.fillStyle = opts.bg || '#f2ecd8'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#222'; x.lineWidth = 6; x.strokeRect(4, 4, W - 8, H - 8);
    x.fillStyle = opts.fg || '#181818';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const n = lines.length;
    for (let i = 0; i < n; i++) {
      x.font = (i === 0 ? 'bold 52px' : 'bold 36px') + ' "Arial Narrow", Arial, sans-serif';
      x.fillText(lines[i].toUpperCase(), W / 2, H * (i + 0.55) / (n + 0.1), W - 40);
    }
    if (opts.grimy) grime(x, W, H, 0.6, TB.rng(99));
    return TB.texFromCanvas(c);
  };

  // ---------- billboard ad per era ----------
  TB.tex.billboard = function (era, seed) {
    const W = 1024, H = 512;
    const { c, x } = TB.canvas(W, H);
    const r = TB.rng(seed || era);
    x.textAlign = 'center'; x.textBaseline = 'middle';

    if (era === 1945) {
      x.fillStyle = '#e8ddb8'; x.fillRect(0, 0, W, H);
      x.fillStyle = '#1c3a6b'; x.fillRect(0, 0, W, 90);
      x.fillStyle = '#e8ddb8'; x.font = 'bold 62px Georgia, serif';
      x.fillText('BUY VICTORY BONDS', W / 2, 48);
      x.fillStyle = '#8f2b1f'; x.font = 'bold 130px Georgia, serif';
      x.fillText('“KEEP ’EM FLYING!”', W / 2, H / 2 + 30, W - 80);
      x.fillStyle = '#4a4a42'; x.font = 'italic 40px Georgia, serif';
      x.fillText('— U.S. TREASURY DEPT. —', W / 2, H - 60);
      grime(x, W, H, 0.8, r);
    } else if (era === 1965) {
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#ffd94f'); g.addColorStop(1, '#ff8f2e');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.fillStyle = '#b8231c';
      x.beginPath(); x.arc(200, H / 2, 130, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#fff'; x.font = 'italic bold 66px Georgia, serif';
      x.fillText('POP!', 200, H / 2 + 5);
      x.fillStyle = '#2a2a2a'; x.font = 'italic bold 92px Georgia, serif';
      x.fillText('COLA-RAMA', W / 2 + 110, H / 2 - 55);
      x.font = 'italic 48px Georgia, serif';
      x.fillText('the taste of tomorrow… today!', W / 2 + 90, H / 2 + 60);
    } else if (era === 1985) {
      x.fillStyle = '#12081e'; x.fillRect(0, 0, W, H);
      // grid horizon
      x.strokeStyle = '#ff41c8'; x.lineWidth = 2;
      for (let i = 0; i < 12; i++) { x.beginPath(); x.moveTo(0, H * 0.55 + i * i * 3); x.lineTo(W, H * 0.55 + i * i * 3); x.stroke(); }
      x.shadowColor = '#41e8ff'; x.shadowBlur = 30;
      x.fillStyle = '#41e8ff'; x.font = 'bold 120px "Arial Black", Arial, sans-serif';
      x.fillText('SONIKA', W / 2, H * 0.3);
      x.shadowColor = '#ff41c8';
      x.fillStyle = '#ff41c8'; x.font = 'bold 56px "Arial Black", Arial, sans-serif';
      x.fillText('PERSONAL CASSETTE SYSTEM', W / 2, H * 0.5);
      x.shadowBlur = 0;
      x.fillStyle = '#e8e8ff'; x.font = '36px Arial, sans-serif';
      x.fillText('take the beat to the street', W / 2, H * 0.88);
    } else if (era === 2005) {
      const g = x.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#e9eef4'); g.addColorStop(1, '#c4d2e0');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      // flip phone silhouette
      x.fillStyle = '#3a3f47';
      x.fillRect(150, 120, 120, 260); x.fillRect(150, 90, 120, 40);
      x.fillStyle = '#9fd0ff'; x.fillRect(165, 135, 90, 90);
      x.fillStyle = '#2b6cb0'; x.font = 'bold 88px Helvetica, Arial, sans-serif';
      x.fillText('RAZR-THIN.', W / 2 + 90, H / 2 - 60);
      x.fillStyle = '#444'; x.font = '46px Helvetica, Arial, sans-serif';
      x.fillText('The new VOLTA V3 flip — now with camera.', W / 2 + 60, H / 2 + 40);
      x.font = 'bold 38px Helvetica, Arial, sans-serif';
      x.fillStyle = '#777';
      x.fillText('only $199 w/ 2-yr contract', W / 2 + 60, H / 2 + 120);
    } else if (era === 2025) {
      x.fillStyle = '#0f1115'; x.fillRect(0, 0, W, H);
      x.fillStyle = '#ffffff'; x.font = '600 96px "Segoe UI", Helvetica, sans-serif';
      x.fillText('volt.', W / 2 - 160, H / 2 - 40);
      x.fillStyle = '#39d98a'; x.font = '300 54px "Segoe UI", Helvetica, sans-serif';
      x.fillText('the EV that charges in 8 minutes', W / 2, H / 2 + 60);
      x.fillStyle = '#666'; x.font = '32px "Segoe UI", Helvetica, sans-serif';
      x.fillText('order from your phone. obviously.', W / 2, H - 60);
    } else {
      // 2055
      x.fillStyle = 'rgba(4,10,26,0.92)'; x.fillRect(0, 0, W, H);
      x.shadowColor = '#41f2ff'; x.shadowBlur = 34;
      x.fillStyle = '#41f2ff'; x.font = '200 110px "Segoe UI Light", "Segoe UI", sans-serif';
      x.fillText('MARS SHUTTLE', W / 2, H / 2 - 60);
      x.shadowColor = '#ff9d41';
      x.fillStyle = '#ff9d41'; x.font = '300 58px "Segoe UI Light", "Segoe UI", sans-serif';
      x.fillText('DAILY DEPARTURES  ·  GATE 7  ·  14 MIN', W / 2, H / 2 + 60);
      x.shadowBlur = 0;
      for (let sy = 0; sy < H; sy += 6) { x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(0, sy, W, 2); }
    }
    return TB.texFromCanvas(c);
  };

  // ---------- road / sidewalk ----------
  TB.tex.asphalt = function (era) {
    const W = 512, H = 512;
    const { c, x } = TB.canvas(W, H);
    const r = TB.rng(era);
    const worn = era <= 1985;
    x.fillStyle = era === 1945 ? '#4a453e' : (era >= 2055 ? '#20242e' : '#3c3d40');
    x.fillRect(0, 0, W, H);
    speckle(x, W, H, '#000', 700, r);
    speckle(x, W, H, '#888', 400, r);
    if (era === 1945) {
      // cobble hint + trolley track pair
      x.strokeStyle = 'rgba(0,0,0,0.25)';
      for (let i = 0; i < 24; i++) { x.beginPath(); x.moveTo(0, i * 22); x.lineTo(W, i * 22); x.stroke(); }
      x.fillStyle = '#6b6862';
      x.fillRect(W * 0.36, 0, 7, H); x.fillRect(W * 0.60, 0, 7, H);
    }
    if (worn) {
      // cracks
      x.strokeStyle = 'rgba(10,10,10,0.5)'; x.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        x.beginPath();
        let px = r() * W, py = r() * H;
        x.moveTo(px, py);
        for (let s = 0; s < 5; s++) { px += (r() - 0.5) * 90; py += (r() - 0.5) * 90; x.lineTo(px, py); }
        x.stroke();
      }
    }
    if (era >= 2025) {
      // fresh, with faint lane sheen
      x.fillStyle = 'rgba(255,255,255,0.03)';
      x.fillRect(0, 0, W, H);
    }
    const t = TB.texFromCanvas(c, 6, 6);
    return t;
  };

  TB.tex.sidewalk = function (era) {
    const W = 256, H = 256;
    const { c, x } = TB.canvas(W, H);
    const r = TB.rng(era + 50);
    x.fillStyle = era >= 2055 ? '#3a4250' : (era >= 2025 ? '#b8b4ac' : '#a09c92');
    x.fillRect(0, 0, W, H);
    speckle(x, W, H, '#000', 250, r);
    speckle(x, W, H, '#fff', 150, r);
    x.strokeStyle = 'rgba(0,0,0,0.3)'; x.lineWidth = 3;
    x.strokeRect(0, 0, W, H);
    x.beginPath(); x.moveTo(W / 2, 0); x.lineTo(W / 2, H); x.stroke();
    if (era <= 1985) {
      x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        x.beginPath();
        let px = r() * W, py = r() * H;
        x.moveTo(px, py);
        for (let s = 0; s < 4; s++) { px += (r() - 0.5) * 60; py += (r() - 0.5) * 60; x.lineTo(px, py); }
        x.stroke();
      }
    }
    if (era >= 2055) {
      // embedded guide light strip
      x.fillStyle = '#1eb8c8'; x.globalAlpha = 0.8;
      x.fillRect(0, H - 8, W, 4); x.globalAlpha = 1;
    }
    return TB.texFromCanvas(c, 8, 8);
  };

  // ---------- awning stripes ----------
  TB.tex.awning = function (colA, colB) {
    const { c, x } = TB.canvas(128, 64);
    for (let i = 0; i < 8; i++) {
      x.fillStyle = i % 2 ? colA : colB;
      x.fillRect(i * 16, 0, 16, 64);
    }
    x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, 48, 128, 16);
    return TB.texFromCanvas(c, 2, 1);
  };

  // ---------- poster / small ad strip for walls ----------
  TB.tex.posterWall = function (era, seed) {
    const W = 256, H = 256;
    const { c, x } = TB.canvas(W, H);
    const r = TB.rng(seed || era + 3);
    x.fillStyle = '#5a5248'; x.fillRect(0, 0, W, H);
    const msgs = {
      1945: ['WAR BONDS', 'LOOSE LIPS', 'SCRAP DRIVE', 'VOTE YES', 'CIRCUS SAT.'],
      1965: ['GO-GO NITE', 'ELECT NIXON?', 'JAZZ FEST', 'MOD SALE', 'DRIVE-IN'],
      1985: ['ROCK TOUR', 'AEROBICS', 'VHS SALE', 'ARCADE', 'NO WAVE'],
      2005: ['DJ NIGHT', 'GARAGE SALE', 'LOST CAT', 'BAND WANTED', 'Y2K OK'],
      2025: ['POP-UP MKT', 'YOGA IN PARK', 'QR ONLY', 'VINYL FAIR', 'NO DRONES'],
      2055: ['MIND SPA', 'GRAV-BALL', 'OXY BAR', 'RETRO 2020s', 'HOLO-OPERA']
    }[era] || ['POST NO BILLS'];
    for (let i = 0; i < 7; i++) {
      const pw = 60 + r() * 50, ph = 70 + r() * 60;
      const px = r() * (W - pw), py = r() * (H - ph);
      const hue = r() * 360;
      x.save();
      x.translate(px + pw / 2, py + ph / 2);
      x.rotate((r() - 0.5) * 0.15);
      x.fillStyle = 'hsl(' + hue + ',' + (era >= 1985 ? 70 : 35) + '%,' + (era === 2055 ? 20 : 75) + '%)';
      x.fillRect(-pw / 2, -ph / 2, pw, ph);
      x.fillStyle = era === 2055 ? '#41f2ff' : '#222';
      x.font = 'bold ' + (11 + r() * 5) + 'px Arial';
      x.textAlign = 'center';
      x.fillText(TB.pick(r, msgs), 0, 0, pw - 8);
      x.restore();
    }
    grime(x, W, H, era <= 1985 ? 0.7 : 0.3, r);
    return TB.texFromCanvas(c);
  };

  TB.tex.grime = grime;
})();
