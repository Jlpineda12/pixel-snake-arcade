// =============================================================================
// MenuFX — themed, animated title screens for the JLP pixel arcade games.
// Each game keeps its own state machine; it just calls renderThemedMenu()
// from renderMenu() and drawThemedBackdrop() behind its controls screen.
// =============================================================================

const FONT = (px) => `${px}px "Press Start 2P", monospace`;

export const THEMES = {
  snake: {
    title: 'SNAKE', subtitle: 'RETRO SLITHER · 1976',
    accent: '#00f5d4', accent2: '#ff2e88', top: '#fffbe0', body: '#00f5d4', shade: '#035e52',
    sky: ['#03130f', '#062520', '#020807']
  },
  combat: {
    title: 'COMBAT', subtitle: 'CYBER-RYU VS SHADOW-KEN',
    accent: '#ff334b', accent2: '#fda415', top: '#fff2a8', body: '#ff5a3c', shade: '#5a0010',
    sky: ['#1b0420', '#5a0f3a', '#ff6b3d']
  },
  space: {
    title: 'SPACE', subtitle: 'RETRO INVADERS · 1984',
    accent: '#fda415', accent2: '#00f5d4', top: '#ffffff', body: '#fda415', shade: '#5a2a00',
    sky: ['#02010a', '#0b0630', '#1a0b3d']
  },
  breaker: {
    title: 'BREAKER', subtitle: 'RETRO ARKANOID · 1986',
    accent: '#ff758f', accent2: '#00f5d4', top: '#ffe3ea', body: '#ff758f', shade: '#5c0a22',
    sky: ['#12041c', '#2d0b3d', '#0b0312']
  },
  maze: {
    title: 'MAZE', subtitle: 'PAC-CHASER · 1980',
    accent: '#fee440', accent2: '#3c4bd6', top: '#ffffff', body: '#fee440', shade: '#5a4a00',
    sky: ['#02031a', '#070b33', '#010210']
  }
};

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

function pixelHeart(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y, 4, 3);
  ctx.fillRect(x + 8, y, 4, 3);
  ctx.fillRect(x, y + 3, 14, 5);
  ctx.fillRect(x + 2, y + 8, 10, 3);
  ctx.fillRect(x + 4, y + 11, 6, 2);
  ctx.fillRect(x + 6, y + 13, 2, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 3, y + 2, 2, 2);
}

// -----------------------------------------------------------------------------
// Backdrops
// -----------------------------------------------------------------------------
export function drawThemedBackdrop(ctx, id, w, h, t = now()) {
  const th = THEMES[id];
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, th.sky[0]);
  g.addColorStop(0.6, th.sky[1]);
  g.addColorStop(1, th.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  if (id === 'snake') {
    // drifting circuit grid
    ctx.strokeStyle = 'rgba(0,245,212,0.09)';
    ctx.lineWidth = 1;
    const off = (t * 12) % 20;
    for (let x = -20; x < w + 20; x += 20) { ctx.beginPath(); ctx.moveTo(x + off, 0); ctx.lineTo(x + off, h); ctx.stroke(); }
    for (let y = -20; y < h + 20; y += 20) { ctx.beginPath(); ctx.moveTo(0, y + off); ctx.lineTo(w, y + off); ctx.stroke(); }
    for (let i = 0; i < 14; i++) {
      const x = (i * 83 + t * (10 + i)) % w;
      const y = (i * 47 + Math.sin(t + i) * 20 + 400) % h;
      ctx.fillStyle = `rgba(0,245,212,${0.15 + (i % 3) * 0.1})`;
      ctx.fillRect(x | 0, y | 0, 6, 6);
    }
  } else if (id === 'combat') {
    // sunset dojo: sun, skyline, lanterns
    ctx.fillStyle = 'rgba(255,190,90,0.9)';
    ctx.beginPath(); ctx.arc(w / 2, h * 0.72, 120, Math.PI, 0); ctx.fill();
    ctx.fillStyle = th.sky[1];
    for (let i = 0; i < 6; i++) ctx.fillRect(w / 2 - 130, h * 0.72 - 100 + i * 18 + 10, 260, 3 + i);
    ctx.fillStyle = '#16020f';
    const skyline = [[0, 60, 70], [60, 90, 50], [130, 40, 80], [390, 50, 70], [450, 80, 60], [500, 60, 60]];
    skyline.forEach(([x, bw, bh]) => ctx.fillRect(x, h * 0.72 - bh, bw, bh));
    ctx.beginPath(); ctx.moveTo(200, h * 0.72 - 40); ctx.lineTo(280, h * 0.72 - 92); ctx.lineTo(360, h * 0.72 - 40); ctx.fill();
    ctx.fillRect(220, h * 0.72 - 40, 120, 40);
    ctx.fillRect(0, h * 0.72, w, h);
    [[70, 40], [w - 70, 40]].forEach(([x, y], i) => {
      const sw = Math.sin(t * 2 + i) * 4;
      ctx.fillStyle = 'rgba(255,51,75,0.25)';
      ctx.beginPath(); ctx.arc(x + sw, y + 30, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff334b';
      ctx.fillRect(x - 9 + sw, y + 18, 18, 24);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(x - 9 + sw, y + 26, 18, 3);
    });
  } else if (id === 'space') {
    for (let layer = 1; layer <= 3; layer++) {
      for (let i = 0; i < 40; i++) {
        const x = (i * 131 * layer) % w;
        const y = (i * 71 * layer + t * 18 * layer) % h;
        ctx.fillStyle = `rgba(255,255,255,${0.2 * layer})`;
        ctx.fillRect(x, y, layer === 3 ? 2 : 1, layer === 3 ? 2 : 1);
      }
    }
    // ringed planet
    const px = w - 90;
    const py = 110;
    const pg = ctx.createRadialGradient(px - 12, py - 12, 4, px, py, 36);
    pg.addColorStop(0, '#ffb3d1');
    pg.addColorStop(1, '#6a1b9a');
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.arc(px, py, 34, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(253,164,21,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(px, py, 58, 12, -0.3, 0, Math.PI * 2); ctx.stroke();
  } else if (id === 'breaker') {
    const bw = 40;
    const bh = 16;
    const off = (t * 10) % (bw * 2);
    for (let y = 0; y < h; y += bh + 4) {
      for (let x = -bw * 2; x < w + bw; x += bw + 4) {
        const sx = x + ((y / (bh + 4)) % 2 ? bw / 2 : 0) + off;
        const pulse = 0.04 + 0.04 * Math.sin(t * 2 + x * 0.05 + y * 0.03);
        ctx.fillStyle = `rgba(255,117,143,${pulse})`;
        ctx.fillRect(sx, y, bw, bh);
      }
    }
  } else if (id === 'maze') {
    ctx.strokeStyle = 'rgba(60,75,214,0.35)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      ctx.strokeRect(14 + i * 18, 14 + i * 18, w - 28 - i * 36, h - 28 - i * 36);
    }
    for (let i = 0; i < 26; i++) {
      const x = 30 + (i * 21) % (w - 60);
      const blink = (Math.floor(t * 3) + i) % 6 === 0;
      ctx.fillStyle = blink ? 'rgba(254,228,64,0.15)' : 'rgba(254,228,64,0.45)';
      ctx.fillRect(x, h - 22, 3, 3);
      ctx.fillRect(x, 20, 3, 3);
    }
  }
  ctx.restore();

  // soft vignette
  const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.85);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

// -----------------------------------------------------------------------------
// Title
// -----------------------------------------------------------------------------
export function drawWaveTitle(ctx, text, cx, y, size, th, t) {
  ctx.save();
  ctx.font = FONT(size);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const total = ctx.measureText(text).width;
  let x = cx - total / 2;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const cw = ctx.measureText(ch).width;
    const dy = Math.round(Math.sin(t * 3.2 + i * 0.6) * 4);
    // glow
    ctx.shadowColor = th.accent;
    ctx.shadowBlur = 18;
    ctx.fillStyle = th.shade;
    ctx.fillText(ch, x + 4, y + dy + 5);
    ctx.shadowBlur = 0;
    // gradient body
    const g = ctx.createLinearGradient(0, y + dy - size, 0, y + dy);
    g.addColorStop(0, th.top);
    g.addColorStop(0.45, th.body);
    g.addColorStop(1, th.shade);
    ctx.fillStyle = g;
    ctx.fillText(ch, x, y + dy);
    x += cw;
  }
  // light sweep
  const sweep = ((t * 0.5) % 1.6) - 0.3;
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = 'rgba(255,255,255,0.0)';
  ctx.restore();
  return sweep;
}

// -----------------------------------------------------------------------------
// Attract-mode scenes (drawn in a band under the title)
// -----------------------------------------------------------------------------
function attract(ctx, id, w, y0, bandH, t, th) {
  const P = 4;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y0, w, bandH);
  ctx.clip();
  if (id === 'snake') {
    const cycle = (t * 90) % (w + 260);
    const headX = cycle - 60;
    const yMid = y0 + bandH / 2;
    for (let i = 0; i < 16; i++) {
      const x = headX - i * (P * 3);
      const y = yMid + Math.round(Math.sin((x * 0.04) + t * 2) * 10 / P) * P;
      ctx.fillStyle = i === 0 ? th.top : (i % 2 ? th.accent : '#00b89f');
      ctx.fillRect(x, y, P * 3 - 1, P * 3 - 1);
      if (i === 0) { ctx.fillStyle = '#000'; ctx.fillRect(x + P * 2, y + P / 2, P / 2 + 1, P / 2 + 1); }
    }
    const appleX = (Math.floor((headX + 200) / 160) * 160 + 120) % (w - 40) + 20;
    ctx.fillStyle = '#ff334b'; ctx.fillRect(appleX, yMid - 2, P * 3, P * 3);
    ctx.fillStyle = '#39ff14'; ctx.fillRect(appleX + P, yMid - 2 - P, P, P);
  } else if (id === 'combat') {
    const ground = y0 + bandH - 6;
    const bob = Math.round(Math.sin(t * 7) * 1.5);
    const punch = Math.sin(t * 3) > 0.7;
    const fighter = (x, dir, gi, band, attack) => {
      const fy = ground - P * 14 + bob;
      ctx.fillStyle = '#1e293b'; ctx.fillRect(x, fy, P * 3, P);
      ctx.fillStyle = '#fed7aa'; ctx.fillRect(x, fy + P, P * 3, P * 2);
      ctx.fillStyle = band; ctx.fillRect(x - P, fy + P, P * 5, P);
      ctx.fillStyle = gi; ctx.fillRect(x - P, fy + P * 3, P * 5, P * 5);
      ctx.fillStyle = '#111827'; ctx.fillRect(x - P, fy + P * 6, P * 5, P);
      ctx.fillStyle = gi;
      const armX = dir > 0 ? x + P * 4 : x - P * (attack ? 5 : 3);
      ctx.fillRect(armX, fy + P * 4, P * (attack ? 4 : 2), P * 1.5);
      ctx.fillStyle = '#fed7aa'; ctx.fillRect(dir > 0 ? armX + P * (attack ? 4 : 2) : armX - P, fy + P * 4, P, P * 1.5);
      ctx.fillStyle = gi;
      ctx.fillRect(x - P, fy + P * 8, P * 2, P * 6);
      ctx.fillRect(x + P * 2, fy + P * 8, P * 2, P * 6);
    };
    fighter(w * 0.3, 1, '#00bbf9', '#ff334b', punch);
    fighter(w * 0.66, -1, '#ff2a44', '#fee440', !punch && Math.sin(t * 3) < -0.7);
    const fb = (t * 0.8) % 1;
    const fx = w * 0.36 + fb * w * 0.26;
    ctx.fillStyle = 'rgba(125,249,255,0.35)'; ctx.fillRect(fx - P * 3, ground - P * 10, P * 6, P * 3);
    ctx.fillStyle = '#7df9ff'; ctx.fillRect(fx - P, ground - P * 10, P * 4, P * 3);
    ctx.fillStyle = '#fff'; ctx.fillRect(fx + P, ground - P * 9.5, P * 2, P * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(0, ground, w, 2);
  } else if (id === 'space') {
    const frame = Math.floor(t * 2) % 2;
    const off = Math.round(Math.sin(t * 0.9) * 60 / P) * P;
    const cols = ['#ff334b', '#fda415', '#00f5d4'];
    for (let c = 0; c < 9; c++) {
      const ax = w / 2 - 4 * 44 + c * 44 + off;
      const ay = y0 + 10;
      ctx.fillStyle = cols[c % 3];
      ctx.fillRect(ax + P, ay, P * 5, P);
      ctx.fillRect(ax, ay + P, P * 7, P * 2);
      ctx.fillStyle = '#000'; ctx.fillRect(ax + P * 2, ay + P, P, P); ctx.fillRect(ax + P * 4, ay + P, P, P);
      ctx.fillStyle = cols[c % 3];
      ctx.fillRect(ax + (frame ? 0 : P), ay + P * 3, P, P);
      ctx.fillRect(ax + P * (frame ? 6 : 5), ay + P * 3, P, P);
    }
    const shipX = w / 2 + Math.sin(t * 1.7) * 150;
    const shipY = y0 + bandH - P * 5;
    ctx.fillStyle = '#e0fbfc';
    ctx.fillRect(shipX - P * 4, shipY + P * 2, P * 9, P * 2);
    ctx.fillRect(shipX - P, shipY, P * 3, P * 2);
    ctx.fillStyle = '#00f5d4'; ctx.fillRect(shipX, shipY - P, P, P);
    const s = (t * 3) % 1;
    ctx.fillStyle = '#fee440';
    ctx.fillRect(shipX, shipY - P - s * (bandH - 30), P / 2 + 1, P * 3);
  } else if (id === 'breaker') {
    const colors = ['#fda415', '#ff334b', '#ff758f', '#00f5d4'];
    const bw = 44;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 11; c++) {
        if ((c + r * 3 + Math.floor(t * 1.5)) % 7 === 0) continue;
        ctx.fillStyle = colors[(c + r) % 4];
        ctx.fillRect(18 + c * (bw + 4), y0 + 6 + r * 14, bw, 10);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(18 + c * (bw + 4), y0 + 6 + r * 14, bw, 2);
      }
    }
    const tri = (v) => 1 - Math.abs((v % 2) - 1);
    const bx = 20 + tri(t * 0.55) * (w - 40);
    const by = y0 + 36 + tri(t * 1.1) * (bandH - 52);
    for (let k = 1; k <= 4; k++) {
      ctx.fillStyle = `rgba(255,255,255,${0.12 * (5 - k)})`;
      ctx.fillRect(bx - k * 3, by + k * 2, 6, 6);
    }
    ctx.fillStyle = '#fff'; ctx.fillRect(bx, by, 7, 7);
    const padX = Math.max(10, Math.min(w - 90, bx - 40));
    ctx.fillStyle = th.accent; ctx.fillRect(padX, y0 + bandH - 8, 80, 6);
    ctx.fillStyle = '#fff'; ctx.fillRect(padX, y0 + bandH - 8, 80, 2);
  } else if (id === 'maze') {
    const lane = y0 + bandH / 2;
    const cycle = (t * 0.22) % 2;
    const chase = cycle < 1;
    const p = chase ? cycle : cycle - 1;
    const pacX = chase ? -30 + p * (w + 120) : w + 30 - p * (w + 120);
    for (let x = 20; x < w; x += 24) {
      const eaten = chase ? x < pacX : x > pacX;
      if (!eaten || !chase) { ctx.fillStyle = '#ffd7a8'; ctx.fillRect(x, lane - 2, 4, 4); }
    }
    const mouth = Math.abs(Math.sin(t * 14)) * 0.75;
    const dir = chase ? 0 : Math.PI;
    ctx.fillStyle = '#fee440';
    ctx.beginPath();
    ctx.moveTo(pacX, lane);
    ctx.arc(pacX, lane, 14, dir + mouth, dir + Math.PI * 2 - mouth);
    ctx.closePath();
    ctx.fill();
    const ghosts = ['#ff334b', '#ff9ff3', '#00f5d4', '#ffb142'];
    ghosts.forEach((gc, i) => {
      const gx = chase ? pacX - 54 - i * 34 : pacX + 54 + i * 34;
      const frightened = !chase;
      ctx.fillStyle = frightened ? (Math.floor(t * 6) % 2 ? '#2e3cff' : '#ffffff') : gc;
      ctx.beginPath();
      ctx.arc(gx, lane - 2, 12, Math.PI, 0);
      ctx.lineTo(gx + 12, lane + 12);
      for (let k = 0; k < 4; k++) ctx.lineTo(gx + 12 - (k + 0.5) * 6, lane + (k % 2 ? 12 : 7));
      ctx.lineTo(gx - 12, lane + 12);
      ctx.closePath();
      ctx.fill();
      if (!frightened) {
        ctx.fillStyle = '#fff'; ctx.fillRect(gx - 7, lane - 6, 5, 6); ctx.fillRect(gx + 2, lane - 6, 5, 6);
        ctx.fillStyle = '#1a1aff'; ctx.fillRect(gx - 5 + (chase ? 2 : 0), lane - 4, 3, 3); ctx.fillRect(gx + 4 + (chase ? 2 : 0), lane - 4, 3, 3);
      }
    });
  }
  ctx.restore();
}

// -----------------------------------------------------------------------------
// Full menu
// -----------------------------------------------------------------------------
/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} o { id, width, height, highScore, choice }
 */
export function renderThemedMenu(ctx, o) {
  const th = THEMES[o.id];
  const w = o.width;
  const h = o.height;
  const t = now();
  const cx = w / 2;

  ctx.save();
  ctx.textBaseline = 'alphabetic';
  drawThemedBackdrop(ctx, o.id, w, h, t);

  // HUD
  ctx.textAlign = 'left';
  ctx.font = FONT(10);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('HI-SCORE', 26, 34);
  ctx.fillStyle = th.accent;
  ctx.fillText(String(o.highScore).padStart(6, '0'), 26, 52);
  for (let i = 0; i < 5; i++) pixelHeart(ctx, w - 26 - 14 - i * 22, 22, th.accent);
  if (Math.floor(t * 2) % 2 === 0) {
    ctx.textAlign = 'right';
    ctx.font = FONT(7);
    ctx.fillStyle = '#d6c6e0';
    ctx.fillText('1UP · CREDIT 01', w - 26, 54);
  }

  // Title
  const size = th.title.length > 6 ? 40 : 48;
  drawWaveTitle(ctx, th.title, cx, 142, size, th, t);

  ctx.textAlign = 'center';
  ctx.font = FONT(9);
  ctx.fillStyle = th.accent2;
  ctx.fillText(`★ ${th.subtitle} ★`, cx, 176);

  // Attract band
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 194, w, 86);
  ctx.fillStyle = th.accent;
  ctx.globalAlpha = 0.6;
  ctx.fillRect(0, 194, w, 2);
  ctx.fillRect(0, 278, w, 2);
  ctx.globalAlpha = 1;
  attract(ctx, o.id, w, 196, 82, t, th);

  // Prompt
  ctx.textAlign = 'center';
  ctx.font = FONT(12);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('ARE YOU READY?', cx, 312);

  ctx.font = FONT(16);
  const yesX = cx - 70;
  const noX = cx + 70;
  const pulse = Math.round(Math.sin(t * 8) * 3);
  ['YES', 'NO'].forEach((label, i) => {
    const x = i === 0 ? yesX : noX;
    const sel = o.choice === label;
    ctx.fillStyle = sel ? th.accent : 'rgba(255,255,255,0.55)';
    ctx.fillText(label, x, 352);
    if (sel) {
      const half = ctx.measureText(label).width / 2;
      ctx.beginPath();
      ctx.moveTo(x - half - 22 + pulse, 338);
      ctx.lineTo(x - half - 10 + pulse, 345);
      ctx.lineTo(x - half - 22 + pulse, 352);
      ctx.closePath();
      ctx.fill();
    }
  });

  ctx.font = FONT(8);
  ctx.fillStyle = '#b39ebd';
  ctx.fillText('[ENTER] START  ·  [C] CONTROLES', cx, 390);
  ctx.restore();
}
