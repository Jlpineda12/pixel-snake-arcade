// =============================================================================
// RetroShell — shared presentation layer for every JLP arcade cabinet.
//  • Synthwave room with twinkling star canvas
//  • BIOS / terminal boot sequence (skippable, once per session)
//  • Real-hardware control panel: 3/4 SVG joystick + Sanwa-style buttons
//    that react to the keyboard and work as a touch gamepad
//  • CRT power-off / power-on transitions
//  • 90s web-dev status bar: prompt, FPS, clock, hit counter, 88x31 badges
// Zero dependencies. Games keep listening to window keydown/keyup (e.code).
// =============================================================================

const DIR_KEYS = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down'
};

const DIR_TO_CODE = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' };

const reducedMotion = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const safeStorage = {
  get(store, k) { try { return window[store].getItem(k); } catch { return null; } },
  set(store, k, v) { try { window[store].setItem(k, v); } catch { /* private mode */ } }
};

const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
};

const JOYSTICK_SVG = (accent) => `
<svg viewBox="0 0 120 120" aria-hidden="true">
  <defs>
    <linearGradient id="jsPlate" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a3a46"/><stop offset="1" stop-color="#0d0d12"/>
    </linearGradient>
    <radialGradient id="jsWasher" cx="0.4" cy="0.3" r="0.8">
      <stop offset="0" stop-color="#55555f"/><stop offset="0.45" stop-color="#16161b"/><stop offset="1" stop-color="#000"/>
    </radialGradient>
    <linearGradient id="jsShaft" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#5b5b66"/><stop offset="0.35" stop-color="#f4f4f8"/>
      <stop offset="0.6" stop-color="#9a9aa6"/><stop offset="1" stop-color="#3b3b44"/>
    </linearGradient>
    <radialGradient id="jsBall" cx="0.36" cy="0.3" r="0.75">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="0.12" stop-color="${accent}" stop-opacity="1"/>
      <stop offset="0.62" stop-color="${accent}"/>
      <stop offset="1" stop-color="#1a0006"/>
    </radialGradient>
    <radialGradient id="jsBallRim" cx="0.5" cy="0.9" r="0.6">
      <stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- base plate -->
  <ellipse cx="60" cy="96" rx="50" ry="17" fill="#050507"/>
  <ellipse cx="60" cy="92" rx="50" ry="17" fill="url(#jsPlate)" stroke="#4a4a58" stroke-width="1"/>
  <g fill="#1a1a20" stroke="#6b6b7a" stroke-width="0.8">
    <circle cx="20" cy="92" r="2.6"/><circle cx="100" cy="92" r="2.6"/>
    <circle cx="60" cy="78.5" r="2.2"/><circle cx="60" cy="105.5" r="2.2"/>
  </g>
  <!-- dust washer + gate -->
  <ellipse cx="60" cy="91" rx="26" ry="9" fill="url(#jsWasher)"/>
  <ellipse cx="57" cy="88.5" rx="13" ry="2.2" fill="#fff" opacity="0.12"/>
  <ellipse class="js-shadow" cx="60" cy="92" rx="15" ry="4.5" fill="#000" opacity="0.55"/>
  <!-- stick -->
  <g class="js-stick">
    <rect x="55.5" y="44" width="9" height="47" rx="3" fill="url(#jsShaft)"/>
    <ellipse cx="60" cy="90" rx="7.5" ry="2.6" fill="#2a2a33"/>
    <circle cx="60" cy="34" r="23" fill="url(#jsBall)"/>
    <circle cx="60" cy="34" r="23" fill="url(#jsBallRim)"/>
    <ellipse cx="51" cy="24" rx="8" ry="5" fill="#fff" opacity="0.7" transform="rotate(-28 51 24)"/>
    <circle cx="68" cy="45" r="2" fill="#fff" opacity="0.25"/>
  </g>
</svg>`;

export class RetroShell {
  /**
   * @param {object} opts
   * @param {string} opts.id          short id used for the prompt / storage (e.g. 'snake')
   * @param {string} opts.title       marquee title
   * @param {string} opts.accent      main neon color
   * @param {string} [opts.accent2]   secondary neon color
   * @param {string} [opts.year]      cabinet year
   * @param {string} [opts.repo]      GitHub repo url
   * @param {string[]} [opts.ticker]  marquee ticker messages
   * @param {object} [opts.buttons]   { A:{code,label}, B:{code,label} }
   * @param {Function} [opts.onFirstInput] called on the first user gesture (audio unlock)
   */
  constructor(opts) {
    this.opts = Object.assign({
      id: 'arcade',
      title: 'ARCADE',
      accent: '#00f5d4',
      accent2: '#ff2e88',
      year: '1984',
      repo: 'https://github.com/Jlpineda12',
      ticker: [],
      buttons: { A: { code: 'Space', label: 'A' }, B: { code: 'KeyK', label: 'B' } },
      onFirstInput: null
    }, opts);

    this.buttons = this.opts.buttons;
    this.firstInputDone = false;
    this.booting = false;
    this.fps = 60;
  }

  init() {
    const root = document.documentElement;
    root.style.setProperty('--accent', this.opts.accent);
    root.style.setProperty('--accent-2', this.opts.accent2);

    this.buildRoom();
    this.buildMarquee();
    this.buildScreenLayers();
    this.buildDeck();
    this.buildStatusBar();
    this.bindKeyboard();
    this.bindFirstInput();
    this.startMeters();

    if (!reducedMotion() && !safeStorage.get('sessionStorage', 'jlp_boot_seen')) {
      this.runBoot();
    } else {
      this.powerOn();
    }
    return this;
  }

  // ---------------------------------------------------------------------------
  // Room
  // ---------------------------------------------------------------------------
  buildRoom() {
    document.querySelectorAll('.room-perspective-bg').forEach(n => n.remove());
    const room = el('div', 'sw-room');
    room.setAttribute('aria-hidden', 'true');
    room.innerHTML = '<canvas class="sw-stars"></canvas><div class="sw-sun"></div><div class="sw-floor"></div><div class="sw-horizon"></div>';
    document.body.prepend(room);

    const c = room.querySelector('canvas');
    const ctx = c.getContext('2d');
    let stars = [];
    const resize = () => {
      c.width = Math.floor(window.innerWidth / 2);
      c.height = Math.floor(window.innerHeight * 0.62 / 2);
      stars = Array.from({ length: 90 }, () => ({
        x: Math.random() * c.width,
        y: Math.random() * c.height,
        s: Math.random() < 0.15 ? 2 : 1,
        p: Math.random() * Math.PI * 2,
        v: 0.6 + Math.random() * 2
      }));
    };
    resize();
    window.addEventListener('resize', resize);
    const palette = ['#ffffff', '#ffd1f0', '#b5fff4', '#fff2a8'];
    let last = 0;
    const draw = (t) => {
      requestAnimationFrame(draw);
      if (document.hidden || t - last < 66) return; // ~15 fps is plenty for twinkles
      last = t;
      ctx.clearRect(0, 0, c.width, c.height);
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const a = 0.35 + 0.65 * Math.abs(Math.sin(s.p + t / 1000 * s.v));
        ctx.globalAlpha = a * (1 - s.y / c.height * 0.6);
        ctx.fillStyle = palette[i % palette.length];
        ctx.fillRect(s.x | 0, s.y | 0, s.s, s.s);
      }
    };
    requestAnimationFrame(draw);
  }

  // ---------------------------------------------------------------------------
  // Marquee
  // ---------------------------------------------------------------------------
  buildMarquee() {
    const host = document.querySelector('[data-marquee]');
    if (!host) return;
    const t = this.opts.title;
    const flickIdx = Math.max(0, t.length - 2);
    const titleHtml = [...t].map((ch, i) => i === flickIdx ? `<span class="flick">${ch}</span>` : ch).join('');
    const msgs = this.opts.ticker.length ? this.opts.ticker : ['INSERT COIN'];
    const loop = msgs.map(m => `<span>★ ${m}</span>`).join('');
    host.classList.add('marquee');
    host.innerHTML = `
      <div class="marquee-tag">&lt;<span class="tk">arcade-cabinet</span> <span class="at">game</span>=<span class="vl">"${this.opts.id}"</span> <span class="at">year</span>=<span class="vl">"${this.opts.year}"</span> /&gt;</div>
      <h1 class="marquee-title">${titleHtml}</h1>
      <div class="ticker"><div class="ticker-track">${loop}${loop}</div></div>`;
  }

  setTitle(title, accent) {
    if (accent) document.documentElement.style.setProperty('--accent', accent);
    const h = document.querySelector('.marquee-title');
    if (h && title) {
      const flickIdx = Math.max(0, title.length - 2);
      h.innerHTML = [...title].map((ch, i) => i === flickIdx ? `<span class="flick">${ch}</span>` : ch).join('');
    }
    if (accent) this.recolorJoystick(accent);
  }

  // ---------------------------------------------------------------------------
  // Screen layers (CRT overlay + glare + bezel)
  // ---------------------------------------------------------------------------
  buildScreenLayers() {
    const wrap = document.querySelector('.screen-wrapper');
    if (!wrap) return;
    this.screen = wrap;
    const old = wrap.querySelector('.lcd-dotmatrix-overlay');
    if (old) old.className = 'crt-overlay';
    else wrap.appendChild(el('div', 'crt-overlay'));
    wrap.appendChild(el('div', 'crt-glare'));
    if (!wrap.parentElement.classList.contains('screen-bezel')) {
      const bezel = el('div', 'screen-bezel');
      wrap.parentElement.insertBefore(bezel, wrap);
      bezel.appendChild(wrap);
    }
  }

  powerOn() {
    if (!this.screen || reducedMotion()) return;
    this.screen.classList.remove('crt-off');
    this.screen.classList.add('crt-on');
    setTimeout(() => this.screen.classList.remove('crt-on'), 650);
  }

  /** CRT off → callback → CRT on. Used by the hub when swapping cartridges. */
  powerCycle(cb) {
    if (!this.screen || reducedMotion()) { cb(); return; }
    this.screen.classList.remove('crt-on');
    this.screen.classList.add('crt-off');
    setTimeout(() => {
      cb();
      this.screen.classList.remove('crt-off');
      this.powerOn();
    }, 430);
  }

  // ---------------------------------------------------------------------------
  // Control panel
  // ---------------------------------------------------------------------------
  buildDeck() {
    const deck = document.querySelector('.arcade-control-deck');
    if (!deck) return;
    deck.removeAttribute('aria-hidden');
    deck.setAttribute('aria-label', 'Panel de control: joystick y botones');
    deck.innerHTML = `
      <span class="deck-player-tag">1P</span>
      <div class="joystick-assembly" role="group" aria-label="Joystick">${JOYSTICK_SVG(this.opts.joystickColor || '#ff2a44')}</div>
      <div class="deck-center">
        <div class="deck-meta">
          <button class="deck-mini select" type="button" tabindex="-1" data-code="KeyC"><span class="cap"></span>SELECT</button>
          <button class="deck-mini start" type="button" tabindex="-1" data-code="Enter"><span class="cap"></span>START</button>
        </div>
        <div class="deck-label">★ ${this.opts.title} ${this.opts.year} ★</div>
      </div>
      <div class="buttons-assembly">
        <div class="arcade-btn-socket" data-btn="A"><div class="abtn btn-a"><div class="plunger"></div></div><span class="btn-tag"></span></div>
        <div class="arcade-btn-socket" data-btn="B"><div class="abtn btn-b"><div class="plunger"></div></div><span class="btn-tag"></span></div>
      </div>
      <div class="deck-stripes"></div>`;

    this.joystick = deck.querySelector('.joystick-assembly');
    this.btnEls = {
      A: deck.querySelector('[data-btn="A"]'),
      B: deck.querySelector('[data-btn="B"]')
    };
    this.miniEls = [...deck.querySelectorAll('.deck-mini')];
    this.setButtons(this.buttons);
    this.bindTouchDeck(deck);
  }

  recolorJoystick(color) {
    const stop = document.querySelectorAll('#jsBall stop');
    if (stop.length >= 3) { stop[1].setAttribute('stop-color', color); stop[2].setAttribute('stop-color', color); }
  }

  /** Change what the A/B buttons send (the hub does this per cartridge). */
  setButtons(buttons) {
    this.buttons = buttons;
    ['A', 'B'].forEach(k => {
      const b = this.btnEls && this.btnEls[k];
      if (!b) return;
      const cfg = buttons[k] || { label: k };
      b.querySelector('.btn-tag').innerHTML = `${k}<em>${cfg.label && cfg.label !== k ? cfg.label : ''}</em>`;
    });
  }

  dispatchKey(type, code) {
    window.dispatchEvent(new KeyboardEvent(type, { code, key: code, bubbles: true }));
  }

  bindTouchDeck(deck) {
    // Joystick: drag direction → arrow keys
    let activeDir = null;
    const setDir = (dir) => {
      if (dir === activeDir) return;
      if (activeDir) this.dispatchKey('keyup', DIR_TO_CODE[activeDir]);
      activeDir = dir;
      if (dir) this.dispatchKey('keydown', DIR_TO_CODE[dir]);
    };
    const fromPointer = (e) => {
      const r = this.joystick.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height * 0.45);
      if (Math.hypot(dx, dy) < 10) return null;
      return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    };
    this.joystick.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.joystick.setPointerCapture(e.pointerId);
      this.handleFirstInput();
      setDir(fromPointer(e));
    });
    this.joystick.addEventListener('pointermove', (e) => {
      if (this.joystick.hasPointerCapture(e.pointerId)) setDir(fromPointer(e));
    });
    const release = () => setDir(null);
    this.joystick.addEventListener('pointerup', release);
    this.joystick.addEventListener('pointercancel', release);

    // Action buttons
    Object.entries(this.btnEls).forEach(([k, node]) => {
      node.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.handleFirstInput();
        const code = this.buttons[k] && this.buttons[k].code;
        if (code) this.dispatchKey('keydown', code);
      });
      const up = () => {
        const code = this.buttons[k] && this.buttons[k].code;
        if (code) this.dispatchKey('keyup', code);
      };
      node.addEventListener('pointerup', up);
      node.addEventListener('pointerleave', up);
    });

    this.miniEls.forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.handleFirstInput();
        this.dispatchKey('keydown', btn.dataset.code);
      });
      btn.addEventListener('pointerup', () => this.dispatchKey('keyup', btn.dataset.code));
    });
  }

  bindKeyboard() {
    const held = new Set();
    const refreshStick = () => {
      if (!this.joystick) return;
      const dirs = [...held].map(c => DIR_KEYS[c]).filter(Boolean);
      this.joystick.dataset.dir = dirs.length ? dirs[dirs.length - 1] : '';
    };
    const refreshButtons = () => {
      if (!this.btnEls) return;
      Object.entries(this.btnEls).forEach(([k, node]) => {
        const codes = this.altCodes(k);
        node.classList.toggle('is-pressed', codes.some(c => held.has(c)));
      });
      this.miniEls.forEach(b => {
        const codes = b.dataset.code === 'Enter' ? ['Enter'] : ['KeyC', 'Escape'];
        b.classList.toggle('is-pressed', codes.some(c => held.has(c)));
      });
    };
    window.addEventListener('keydown', (e) => {
      held.add(e.code);
      refreshStick();
      refreshButtons();
    }, true);
    window.addEventListener('keyup', (e) => {
      held.delete(e.code);
      refreshStick();
      refreshButtons();
    }, true);
    window.addEventListener('blur', () => { held.clear(); refreshStick(); refreshButtons(); });
  }

  altCodes(k) {
    const main = this.buttons[k] && this.buttons[k].code;
    const extra = (this.buttons[k] && this.buttons[k].alt) || [];
    return [main, ...extra].filter(Boolean);
  }

  // ---------------------------------------------------------------------------
  // First input (audio unlock) + boot sequence
  // ---------------------------------------------------------------------------
  bindFirstInput() {
    const handler = () => this.handleFirstInput();
    ['pointerdown', 'keydown', 'touchstart'].forEach(t =>
      window.addEventListener(t, handler, { capture: true, passive: true }));
  }

  handleFirstInput() {
    if (this.firstInputDone) return;
    this.firstInputDone = true;
    if (typeof this.opts.onFirstInput === 'function') this.opts.onFirstInput();
  }

  runBoot() {
    this.booting = true;
    const o = this.opts;
    const scr = el('div', 'boot-screen');
    scr.setAttribute('role', 'dialog');
    scr.setAttribute('aria-label', 'Secuencia de arranque');
scr.innerHTML = `<span class="boot-skip">[ESC] skip</span><div class="boot-logo">JLP<span>://</span>ARCADE<small>${o.title} · ${o.year}</small></div><div class="boot-lines"></div><div class="boot-press" hidden>PRESS ANY KEY TO INSERT COIN</div>`;
    document.body.appendChild(scr);

    const lines = [
      `<span class="dim">JLP-BIOS v${o.year}.2 (C) Jose Luis Pineda — Ingenieria en Multimedia</span>`,
      `CPU: <span class="acc">JS-V8 ES2022</span> @ 60 FPS ......... <span class="ok">OK</span>`,
      `GPU: Canvas2D 560x420 + CRT shader ........ <span class="ok">OK</span>`,
      `APU: Web Audio API (oscillators + noise) .. <span class="ok">OK</span>`,
      `MEM: 0 KB of mp3 / wav / png assets ....... <span class="warn">NONE NEEDED</span>`,
      `<span class="prompt">jlp@arcade</span>:<span class="path">~</span>$ npm run ${o.id}`,
      `<span class="dim">&gt; vanilla-js@es6 · zero dependencies · zero bundlers</span>`,
      `LOADING CARTRIDGE "${o.title}" <span class="boot-bar"><i></i></span>`,
      `<span class="ok">READY.</span>`
    ];
    const box = scr.querySelector('.boot-lines');
    let i = 0;
    let timer = null;
    const next = () => {
      if (i >= lines.length) { scr.querySelector('.boot-press').hidden = false; return; }
      const d = el('div', '', lines[i]);
      box.appendChild(d);
      const delay = lines[i].includes('boot-bar') ? 950 : 140 + Math.random() * 120;
      i++;
      timer = setTimeout(next, delay);
    };
    timer = setTimeout(next, 250);

    const finish = (e) => {
      if (!this.booting) return;
      if (e) { e.preventDefault(); e.stopImmediatePropagation(); }
      this.booting = false;
      clearTimeout(timer);
      safeStorage.set('sessionStorage', 'jlp_boot_seen', '1');
      this.handleFirstInput();
      scr.classList.add('is-leaving');
      setTimeout(() => { scr.remove(); this.powerOn(); }, 430);
      window.removeEventListener('keydown', finish, true);
    };
    window.addEventListener('keydown', finish, true);
    scr.addEventListener('pointerdown', finish);
  }

  // ---------------------------------------------------------------------------
  // Status bar (terminal prompt, FPS, clock, hit counter, 88x31 badges)
  // ---------------------------------------------------------------------------
  buildStatusBar() {
    const host = document.querySelector('[data-status]');
    if (!host) return;
    const key = 'jlp_plays_' + this.opts.id;
    const plays = (parseInt(safeStorage.get('localStorage', key) || '0', 10) || 0) + 1;
    safeStorage.set('localStorage', key, String(plays));
    const digits = String(plays).padStart(6, '0').split('').map(d => `<i>${d}</i>`).join('');

    host.classList.add('status-bar');
    host.innerHTML = `
      <div class="status-titlebar">▣ C:\\ARCADE\\${this.opts.id.toUpperCase()}.EXE<span class="dots"><i></i><i></i><i></i></span></div>
      <div class="status-body">
        <div class="status-line">
          <span><span class="prompt">jlp@arcade</span>:<span class="path">~/${this.opts.id}</span>$ <span class="cmd" data-cmd></span><span class="cursor"></span></span>
        </div>
        <div class="status-stats">
          <span>FPS <b data-fps>60</b></span>
          <span>CLK <b data-clock>--:--</b></span>
          <span>VISITAS <span class="hit-counter">${digits}</span></span>
        </div>
        <div class="badges">
          <a class="badge-88 b-js" href="${this.opts.repo}" target="_blank" rel="noopener"><strong>JS</strong><span>VANILLA ES6</span></a>
          <span class="badge-88 b-audio"><strong>♪ WEB</strong>AUDIO API</span>
          <span class="badge-88 b-nofw"><strong>0 DEPS</strong>NO FRAMEWORK</span>
          <a class="badge-88 b-src" href="${this.opts.repo}" target="_blank" rel="noopener"><strong>&lt;/&gt;</strong>VIEW SOURCE</a>
          <a class="badge-88 b-nets" href="https://github.com/Jlpineda12" target="_blank" rel="noopener"><strong>GITHUB</strong>@JLPINEDA12</a>
        </div>
      </div>`;
    this.cmdEl = host.querySelector('[data-cmd]');
    this.fpsEl = host.querySelector('[data-fps]');
    this.clockEl = host.querySelector('[data-clock]');
    this.typeCommand(`./play --cartridge=${this.opts.id} --crt --chiptune`);
  }

  /** Types a command in the status bar prompt (hub uses this on cartridge change). */
  typeCommand(cmd) {
    if (!this.cmdEl) return;
    clearInterval(this.typeTimer);
    if (reducedMotion()) { this.cmdEl.textContent = cmd; return; }
    let i = 0;
    this.cmdEl.textContent = '';
    this.typeTimer = setInterval(() => {
      this.cmdEl.textContent = cmd.slice(0, ++i);
      if (i >= cmd.length) clearInterval(this.typeTimer);
    }, 38);
  }

  startMeters() {
    let frames = 0;
    let last = performance.now();
    const tick = (t) => {
      frames++;
      if (t - last >= 1000) {
        this.fps = Math.round(frames * 1000 / (t - last));
        frames = 0;
        last = t;
        if (this.fpsEl) this.fpsEl.textContent = this.fps;
        if (this.clockEl) {
          const d = new Date();
          this.clockEl.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
