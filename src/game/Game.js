// Main Arcade Game State Machine & Controller
import { Snake } from './Snake.js';
import { FoodManager } from './Food.js';
import { ParticleSystem } from './Particles.js';
import { PALETTES } from './Palettes.js';

export const GAME_STATES = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  HIGH_SCORES: 'HIGH_SCORES'
};

export class Game {
  constructor(canvas, synth, sfx, music) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.synth = synth;
    this.sfx = sfx;
    this.music = music;

    // Grid configuration (24x24 grid at 20px cell size = 480x480 native resolution)
    this.cols = 24;
    this.rows = 24;
    this.cellSize = 20;

    // Game state
    this.state = GAME_STATES.MENU;
    this.currentPaletteKey = 'cyber';
    this.palette = PALETTES[this.currentPaletteKey];
    this.crtEnabled = true;

    // Game objects
    this.snake = new Snake(this.cols, this.rows);
    this.food = new FoodManager(this.cols, this.rows);
    this.particles = new ParticleSystem();

    // Scoring & Progression
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('pixel_snake_hiscore') || '0', 10);
    this.combo = 0;
    this.comboTimer = 0;

    // Game Loop Timing (Grid tick vs Render loop)
    this.lastTime = 0;
    this.tickAccumulator = 0;
    this.baseSpeedMs = 120; // 120ms per grid movement
    this.currentSpeedMs = this.baseSpeedMs;

    // Screen Shake effect
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;

    // Retro Arcade Menu
    this.menuSelectedIndex = 0;
    this.menuOptions = [
      { id: 'start', label: 'INSERT COIN / START GAME' },
      { id: 'palette', label: 'COLOR PALETTE: ' },
      { id: 'crt', label: 'CRT FILTER: ' },
      { id: 'hiscores', label: 'HALL OF FAME (SCORES)' },
      { id: 'audio', label: 'PROCEDURAL AUDIO: ' }
    ];

    // High Scores list
    this.highScores = this.loadHighScores();

    // Setup input listeners
    this.setupInputs();
  }

  loadHighScores() {
    const raw = localStorage.getItem('pixel_snake_leaderboard');
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return [
      { tag: 'JLP', score: 1500 },
      { tag: 'NEO', score: 1000 },
      { tag: 'CYB', score: 750 },
      { tag: 'SNK', score: 500 },
      { tag: 'ARC', score: 250 }
    ];
  }

  saveHighScore(score) {
    if (score <= 0) return;
    this.highScores.push({ tag: 'YOU', score });
    this.highScores.sort((a, b) => b.score - a.score);
    this.highScores = this.highScores.slice(0, 5);
    localStorage.setItem('pixel_snake_leaderboard', JSON.stringify(this.highScores));
    if (score > this.highScore) {
      this.highScore = score;
      localStorage.setItem('pixel_snake_hiscore', this.highScore.toString());
    }
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      // Audio unlock on first key
      if (!this.synth.initialized) {
        this.synth.init();
        this.music.start('menu');
      }

      if (this.state === GAME_STATES.MENU) {
        this.handleMenuInput(e);
      } else if (this.state === GAME_STATES.PLAYING) {
        this.handlePlayingInput(e);
      } else if (this.state === GAME_STATES.PAUSED) {
        if (e.code === 'KeyP' || e.code === 'Escape') {
          this.togglePause();
        }
      } else if (this.state === GAME_STATES.GAME_OVER) {
        if (e.code === 'Enter' || e.code === 'Space') {
          this.sfx.coinInsert();
          this.startGame();
        } else if (e.code === 'Escape') {
          this.state = GAME_STATES.MENU;
          this.music.setMode('menu');
        }
      } else if (this.state === GAME_STATES.HIGH_SCORES) {
        if (e.code === 'Enter' || e.code === 'Escape' || e.code === 'Space') {
          this.sfx.menuConfirm();
          this.state = GAME_STATES.MENU;
        }
      }
    });

    // Mouse / Touch tap on canvas for instant arcade interaction
    this.canvas.addEventListener('click', (e) => {
      if (!this.synth.initialized) {
        this.synth.init();
        this.music.start('menu');
      }

      if (this.state === GAME_STATES.MENU) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleY = this.canvas.height / rect.height;
        const clickY = (e.clientY - rect.top) * scaleY;

        // Check if clicked in the menu options region (Y: 190 to 360)
        const startY = 210;
        const lineHeight = 32;
        let clickedOption = false;

        this.menuOptions.forEach((opt, idx) => {
          const itemY = startY + (idx * lineHeight);
          if (clickY >= itemY - 18 && clickY <= itemY + 12) {
            this.menuSelectedIndex = idx;
            this.executeMenuSelection();
            clickedOption = true;
          }
        });

        if (!clickedOption) {
          // If clicked anywhere else, start the game like INSERT COIN
          this.sfx.coinInsert();
          this.startGame();
        }
      } else if (this.state === GAME_STATES.GAME_OVER) {
        this.sfx.coinInsert();
        this.startGame();
      } else if (this.state === GAME_STATES.HIGH_SCORES) {
        this.sfx.menuConfirm();
        this.state = GAME_STATES.MENU;
      }
    });
  }

  handleMenuInput(e) {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      this.menuSelectedIndex = (this.menuSelectedIndex - 1 + this.menuOptions.length) % this.menuOptions.length;
      this.sfx.menuMove();
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault();
      this.menuSelectedIndex = (this.menuSelectedIndex + 1) % this.menuOptions.length;
      this.sfx.menuMove();
    } else if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      this.executeMenuSelection();
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      e.preventDefault();
      if (this.menuOptions[this.menuSelectedIndex].id !== 'start' && this.menuOptions[this.menuSelectedIndex].id !== 'hiscores') {
        this.executeMenuSelection(false);
      } else {
        this.executeMenuSelection();
      }
    } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      e.preventDefault();
      if (this.menuOptions[this.menuSelectedIndex].id !== 'start' && this.menuOptions[this.menuSelectedIndex].id !== 'hiscores') {
        this.executeMenuSelection(true);
      }
    }
  }

  executeMenuSelection(reverse = false) {
    const selected = this.menuOptions[this.menuSelectedIndex];
    if (selected.id === 'start') {
      this.sfx.coinInsert();
      this.startGame();
    } else if (selected.id === 'palette') {
      const keys = Object.keys(PALETTES);
      const currIdx = keys.indexOf(this.currentPaletteKey);
      const nextIdx = reverse 
        ? (currIdx - 1 + keys.length) % keys.length 
        : (currIdx + 1) % keys.length;
      this.currentPaletteKey = keys[nextIdx];
      this.palette = PALETTES[this.currentPaletteKey];
      this.sfx.menuConfirm();
    } else if (selected.id === 'crt') {
      this.crtEnabled = !this.crtEnabled;
      const crtEl = document.getElementById('crt-overlay');
      if (crtEl) crtEl.style.display = this.crtEnabled ? 'block' : 'none';
      this.sfx.menuConfirm();
    } else if (selected.id === 'hiscores') {
      this.sfx.menuConfirm();
      this.state = GAME_STATES.HIGH_SCORES;
    } else if (selected.id === 'audio') {
      this.synth.toggleMute();
      this.sfx.menuConfirm();
    }
  }

  handlePlayingInput(e) {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      this.snake.queueDirection(0, -1);
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault();
      this.snake.queueDirection(0, 1);
    } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      e.preventDefault();
      this.snake.queueDirection(-1, 0);
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      e.preventDefault();
      this.snake.queueDirection(1, 0);
    } else if (e.code === 'KeyP' || e.code === 'Escape') {
      this.togglePause();
    }
  }

  startGame() {
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.currentSpeedMs = this.baseSpeedMs;
    this.snake.reset();
    this.food.applesEatenCount = 0;
    this.food.golden = null;
    this.food.spawnApple(this.snake.body);
    this.particles.clear();
    this.state = GAME_STATES.PLAYING;
    this.music.setMode('game');
    this.music.setGameIntensity(0);
  }

  togglePause() {
    if (this.state === GAME_STATES.PLAYING) {
      this.state = GAME_STATES.PAUSED;
      this.sfx.pause();
      this.music.stop();
    } else if (this.state === GAME_STATES.PAUSED) {
      this.state = GAME_STATES.PLAYING;
      this.sfx.menuConfirm();
      this.music.start('game');
    }
  }

  triggerScreenShake(amount = 6) {
    this.shakeIntensity = amount;
  }

  // Called at 60fps
  update(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const deltaMs = Math.min(timestamp - this.lastTime, 100);
    this.lastTime = timestamp;

    // Decay screen shake
    if (this.shakeIntensity > 0.05) {
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeIntensity = 0;
    }

    this.particles.update();

    if (this.state === GAME_STATES.PLAYING) {
      this.food.update(deltaMs);

      // Combo timer decay
      if (this.combo > 0) {
        this.comboTimer -= deltaMs;
        if (this.comboTimer <= 0) {
          this.combo = 0;
        }
      }

      // Grid logic tick
      this.tickAccumulator += deltaMs;
      while (this.tickAccumulator >= this.currentSpeedMs) {
        this.stepGame();
        this.tickAccumulator -= this.currentSpeedMs;
      }
    }
  }

  stepGame() {
    const newHead = this.snake.update();
    this.sfx.step();

    // 1. Check Wall Collision
    if (this.snake.checkWallCollision()) {
      this.triggerGameOver();
      return;
    }

    // 2. Check Self Collision
    if (this.snake.checkSelfCollision()) {
      this.triggerGameOver();
      return;
    }

    // 3. Check Normal Apple Collision
    if (newHead.x === this.food.apple.x && newHead.y === this.food.apple.y) {
      this.snake.grow(1);
      this.combo++;
      this.comboTimer = 4000; // 4 seconds combo window
      const points = 10 * Math.min(this.combo, 5);
      this.score += points;

      // Particle explosion + screen shake
      const px = this.food.apple.x * this.cellSize + this.cellSize / 2;
      const py = this.food.apple.y * this.cellSize + this.cellSize / 2;
      this.particles.burst(px, py, this.palette.food, 16);
      this.triggerScreenShake(3);

      this.sfx.eat();
      this.food.spawnApple(this.snake.body);

      // Accelerate speed slightly
      this.currentSpeedMs = Math.max(65, this.baseSpeedMs - (this.snake.body.length * 1.5));
      this.music.setGameIntensity(this.score);
    }

    // 4. Check Golden Apple Collision
    if (this.food.golden && newHead.x === this.food.golden.x && newHead.y === this.food.golden.y) {
      this.snake.grow(2);
      this.score += 50 * (this.combo > 0 ? this.combo : 1);
      const gx = this.food.golden.x * this.cellSize + this.cellSize / 2;
      const gy = this.food.golden.y * this.cellSize + this.cellSize / 2;
      this.particles.burst(gx, gy, this.palette.goldenFood, 24, 6);
      this.triggerScreenShake(7);
      this.sfx.eatGolden();
      this.food.golden = null;
      this.music.setGameIntensity(this.score);
    }
  }

  triggerGameOver() {
    this.state = GAME_STATES.GAME_OVER;
    this.sfx.gameOver();
    this.music.stop();
    this.triggerScreenShake(12);

    // Explode snake body into particles
    for (const seg of this.snake.body) {
      const sx = seg.x * this.cellSize + this.cellSize / 2;
      const sy = seg.y * this.cellSize + this.cellSize / 2;
      this.particles.burst(sx, sy, this.palette.snakeHead, 6, 3);
    }

    this.saveHighScore(this.score);
  }

  render() {
    const { ctx, canvas } = this;
    ctx.save();

    // Clear background
    ctx.fillStyle = this.palette.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply Screen Shake
    if (this.shakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      ctx.translate(shakeX, shakeY);
    }

    // Draw Subtle Grid
    this.drawGrid();

    // Draw Game Entities
    if (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED) {
      this.food.draw(ctx, this.cellSize, this.palette);
      this.snake.draw(ctx, this.cellSize, this.palette);
    }

    // Particles render in all states
    this.particles.draw(ctx);

    // Draw HUD / Overlays according to State
    if (this.state === GAME_STATES.MENU) {
      this.renderArcadeMenu();
    } else if (this.state === GAME_STATES.PLAYING) {
      this.renderHUD();
    } else if (this.state === GAME_STATES.PAUSED) {
      this.renderHUD();
      this.renderPauseOverlay();
    } else if (this.state === GAME_STATES.GAME_OVER) {
      this.renderGameOver();
    } else if (this.state === GAME_STATES.HIGH_SCORES) {
      this.renderHighScores();
    }

    ctx.restore();
  }

  drawGrid() {
    const { ctx, canvas, palette, cellSize } = this;
    ctx.save();
    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;

    for (let x = 0; x <= canvas.width; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderHUD() {
    const { ctx, palette } = this;
    ctx.save();
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = palette.textAccent;

    // Score left
    ctx.fillText(`SCORE: ${this.score}`, 16, 24);

    // HiScore right
    const hiText = `HI: ${Math.max(this.score, this.highScore)}`;
    ctx.fillText(hiText, 480 - 16 - ctx.measureText(hiText).width, 24);

    // Combo multiplier
    if (this.combo > 1) {
      ctx.fillStyle = palette.goldenFood;
      ctx.fillText(`${this.combo}X COMBO!`, 16, 44);
    }

    ctx.restore();
  }

  renderArcadeMenu() {
    const { ctx, palette, canvas } = this;
    ctx.save();

    // Arcade Title Logo
    ctx.textAlign = 'center';
    ctx.font = '22px "Press Start 2P", monospace';
    ctx.fillStyle = palette.textAccent;
    ctx.shadowColor = palette.textAccent;
    ctx.shadowBlur = 12;
    ctx.fillText('PIXEL SNAKE', canvas.width / 2, 85);

    ctx.font = '11px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.fillText('ARCADE EDITION // 1984', canvas.width / 2, 115);

    // Blinking INSERT COIN marquee
    const blink = Math.floor(Date.now() / 450) % 2 === 0;
    if (blink) {
      ctx.font = '11px "Press Start 2P", monospace';
      ctx.fillStyle = palette.goldenFood;
      ctx.shadowColor = palette.goldenGlow;
      ctx.shadowBlur = 8;
      ctx.fillText('★ INSERT COIN TO PLAY ★', canvas.width / 2, 160);
    }

    // Menu selections list
    ctx.shadowBlur = 0;
    ctx.font = '10px "Press Start 2P", monospace';
    const startY = 210;
    const lineHeight = 32;

    this.menuOptions.forEach((opt, idx) => {
      const isSelected = idx === this.menuSelectedIndex;
      let label = opt.label;

      if (opt.id === 'palette') {
        label += this.palette.name.toUpperCase();
      } else if (opt.id === 'crt') {
        label += this.crtEnabled ? 'ON' : 'OFF';
      } else if (opt.id === 'audio') {
        label += this.synth.isMuted ? 'MUTED' : 'ACTIVE';
      }

      if (isSelected) {
        ctx.fillStyle = palette.goldenFood;
        const pointer = (Math.floor(Date.now() / 250) % 2 === 0) ? '► ' : '  ';
        ctx.fillText(`${pointer}${label}`, canvas.width / 2, startY + (idx * lineHeight));
      } else {
        ctx.fillStyle = '#8899aa';
        ctx.fillText(label, canvas.width / 2, startY + (idx * lineHeight));
      }
    });

    // Arcade Footer Details
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#445566';
    ctx.fillText('USE ARROWS / WASD TO NAVIGATE • ENTER TO SELECT', canvas.width / 2, 430);
    ctx.fillText('CREDIT 01  •  UMNG MULTIMEDIA ENGINEERING', canvas.width / 2, 455);

    ctx.restore();
  }

  renderPauseOverlay() {
    const { ctx, canvas } = this;
    ctx.save();
    ctx.fillStyle = 'rgba(10, 13, 20, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.font = '18px "Press Start 2P", monospace';
    ctx.fillStyle = '#fee440';
    ctx.fillText('GAME PAUSED', canvas.width / 2, canvas.height / 2 - 10);

    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('PRESS [P] OR [ESC] TO RESUME', canvas.width / 2, canvas.height / 2 + 25);
    ctx.restore();
  }

  renderGameOver() {
    const { ctx, canvas, palette } = this;
    ctx.save();
    ctx.fillStyle = 'rgba(10, 13, 20, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.fillStyle = '#ff0055';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 14;
    ctx.fillText('GAME OVER', canvas.width / 2, 130);

    ctx.shadowBlur = 0;
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`FINAL SCORE: ${this.score}`, canvas.width / 2, 185);

    if (this.score >= this.highScore && this.score > 0) {
      ctx.fillStyle = palette.goldenFood;
      ctx.fillText('★ NEW HIGH SCORE! ★', canvas.width / 2, 220);
    } else {
      ctx.fillStyle = '#8899aa';
      ctx.fillText(`BEST: ${this.highScore}`, canvas.width / 2, 220);
    }

    const blink = Math.floor(Date.now() / 400) % 2 === 0;
    if (blink) {
      ctx.fillStyle = palette.textAccent;
      ctx.fillText('PRESS [ENTER] TO RETRY', canvas.width / 2, 310);
    }

    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillStyle = '#667788';
    ctx.fillText('PRESS [ESC] FOR MAIN MENU', canvas.width / 2, 350);

    ctx.restore();
  }

  renderHighScores() {
    const { ctx, canvas, palette } = this;
    ctx.save();
    ctx.textAlign = 'center';

    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillStyle = palette.goldenFood;
    ctx.shadowColor = palette.goldenGlow;
    ctx.shadowBlur = 10;
    ctx.fillText('★ HALL OF FAME ★', canvas.width / 2, 90);

    ctx.shadowBlur = 0;
    ctx.font = '11px "Press Start 2P", monospace';
    const startY = 160;
    const lineHeight = 36;

    this.highScores.forEach((item, idx) => {
      const rank = `${idx + 1}ST`;
      const color = idx === 0 ? palette.goldenFood : (idx === 1 ? '#00f5d4' : '#ffffff');
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      ctx.fillText(`${rank}  ${item.tag}`, 110, startY + (idx * lineHeight));
      ctx.textAlign = 'right';
      ctx.fillText(`${item.score.toString().padStart(5, '0')} PTS`, 370, startY + (idx * lineHeight));
    });

    ctx.textAlign = 'center';
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillStyle = '#8899aa';
    ctx.fillText('PRESS [ENTER] OR [ESC] TO RETURN', canvas.width / 2, 410);

    ctx.restore();
  }
}
