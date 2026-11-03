// Main Arcade Game Controller matching reference design
import { Snake } from './Snake.js';
import { FoodManager } from './Food.js';
import { ParticleSystem } from './Particles.js';
import { PALETTES } from './Palettes.js';

export const GAME_STATES = {
  MENU: 'MENU',
  CONTROLS: 'CONTROLS',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER'
};

export class Game {
  constructor(canvas, synth, sfx, music) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.synth = synth;
    this.sfx = sfx;
    this.music = music;

    // 4:3 Arcade resolution: 560x420 (28 cols x 21 rows @ 20px)
    this.cols = 28;
    this.rows = 21;
    this.cellSize = 20;

    // Theme & State
    this.state = GAME_STATES.MENU;
    this.palette = PALETTES.arcadeRetro;

    // Entities
    this.snake = new Snake(this.cols, this.rows);
    this.food = new FoodManager(this.cols, this.rows);
    this.particles = new ParticleSystem();

    // Scoring & 5 Lives
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('pixel_snake_hiscore') || '123000', 10);
    this.lives = 5;
    this.maxLives = 5;

    // Timing
    this.lastTime = 0;
    this.tickAccumulator = 0;
    this.baseSpeedMs = 115;
    this.currentSpeedMs = this.baseSpeedMs;

    // Screen Shake
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;

    // Menu Selection: 'YES' | 'NO'
    this.selectedChoice = 'YES';

    this.setupInputs();
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      // Audio unlock on user interaction
      if (!this.synth.initialized) {
        this.synth.init();
        this.music.start('menu');
      }

      if (this.state === GAME_STATES.MENU) {
        if (e.code === 'KeyC') {
          this.sfx.menuConfirm();
          this.state = GAME_STATES.CONTROLS;
        } else {
          this.handleMenuInput(e);
        }
      } else if (this.state === GAME_STATES.CONTROLS) {
        if (e.code === 'Enter' || e.code === 'Escape' || e.code === 'Space' || e.code === 'KeyC') {
          this.sfx.menuConfirm();
          this.state = GAME_STATES.MENU;
        }
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
      }
    });

    // Touch & Click on canvas
    this.canvas.addEventListener('click', (e) => {
      if (!this.synth.initialized) {
        this.synth.init();
        this.music.start('menu');
      }

      if (this.state === GAME_STATES.MENU) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;

        // Click YES / NO region
        if (clickY >= 320 && clickY <= 380) {
          if (clickX < 290) {
            this.selectedChoice = 'YES';
            this.sfx.coinInsert();
            this.startGame();
          } else {
            this.selectedChoice = 'NO';
            this.sfx.menuMove();
          }
        } else {
          // Tap anywhere to start
          this.selectedChoice = 'YES';
          this.sfx.coinInsert();
          this.startGame();
        }
      } else if (this.state === GAME_STATES.GAME_OVER) {
        this.sfx.coinInsert();
        this.startGame();
      }
    });
  }

  handleMenuInput(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      e.preventDefault();
      if (this.selectedChoice !== 'YES') {
        this.selectedChoice = 'YES';
        this.sfx.menuMove();
      }
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      e.preventDefault();
      if (this.selectedChoice !== 'NO') {
        this.selectedChoice = 'NO';
        this.sfx.menuMove();
      }
    } else if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      if (this.selectedChoice === 'YES') {
        this.sfx.coinInsert();
        this.startGame();
      } else {
        this.sfx.menuConfirm();
        setTimeout(() => { this.selectedChoice = 'YES'; }, 400);
      }
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
    this.lives = this.maxLives;
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

  triggerScreenShake(amount = 7) {
    this.shakeIntensity = amount;
  }

  update(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const deltaMs = Math.min(timestamp - this.lastTime, 100);
    this.lastTime = timestamp;

    if (this.shakeIntensity > 0.05) {
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeIntensity = 0;
    }

    this.particles.update();

    if (this.state === GAME_STATES.PLAYING) {
      this.food.update(deltaMs);

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

    // Check Wall or Self Collision
    const hitWall = this.snake.checkWallCollision();
    const hitSelf = this.snake.checkSelfCollision();

    if (hitWall || hitSelf) {
      this.handlePlayerHit();
      return;
    }

    // Normal Apple
    if (this.food.apple && newHead.x === this.food.apple.x && newHead.y === this.food.apple.y) {
      this.snake.grow(1);
      this.score += 100;
      const px = this.food.apple.x * this.cellSize + this.cellSize / 2;
      const py = this.food.apple.y * this.cellSize + this.cellSize / 2;
      this.particles.burst(px, py, this.palette.snakeHead, 16);
      this.triggerScreenShake(4);
      this.sfx.eat();
      this.food.spawnApple(this.snake.body);

      this.currentSpeedMs = Math.max(65, this.baseSpeedMs - (this.snake.body.length * 1.5));
      this.music.setGameIntensity(this.score);

      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('pixel_snake_hiscore', this.highScore.toString());
      }
    }

    // Golden Bonus Apple
    if (this.food.golden && newHead.x === this.food.golden.x && newHead.y === this.food.golden.y) {
      this.snake.grow(2);
      this.score += 500;
      const gx = this.food.golden.x * this.cellSize + this.cellSize / 2;
      const gy = this.food.golden.y * this.cellSize + this.cellSize / 2;
      this.particles.burst(gx, gy, this.palette.goldenFood, 24, 6);
      this.triggerScreenShake(8);
      this.sfx.eatGolden();
      this.food.golden = null;
      this.music.setGameIntensity(this.score);

      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('pixel_snake_hiscore', this.highScore.toString());
      }
    }
  }

  handlePlayerHit() {
    this.lives--;
    this.triggerScreenShake(12);

    if (this.lives > 0) {
      this.sfx.gameOver();
      for (const seg of this.snake.body) {
        const sx = seg.x * this.cellSize + this.cellSize / 2;
        const sy = seg.y * this.cellSize + this.cellSize / 2;
        this.particles.burst(sx, sy, this.palette.snakeHead, 6, 3);
      }
      this.snake.reset();
      // Ensure apple does not spawn right under the respawned snake
      if (this.snake.body.some(seg => seg.x === this.food.apple.x && seg.y === this.food.apple.y)) {
        this.food.spawnApple(this.snake.body);
      }
    } else {
      this.state = GAME_STATES.GAME_OVER;
      this.sfx.gameOver();
      this.music.stop();

      for (const seg of this.snake.body) {
        const sx = seg.x * this.cellSize + this.cellSize / 2;
        const sy = seg.y * this.cellSize + this.cellSize / 2;
        this.particles.burst(sx, sy, this.palette.snakeHead, 10, 4);
      }

      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('pixel_snake_hiscore', this.highScore.toString());
      }
    }
  }

  render() {
    const { ctx, canvas } = this;
    ctx.save();

    // 1. Draw Arcade Plum Screen Background (#351d3d)
    ctx.fillStyle = this.palette.screenBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Screen Shake
    if (this.shakeIntensity > 0) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const sy = (Math.random() - 0.5) * this.shakeIntensity * 2;
      ctx.translate(sx, sy);
    }

    // 2. Subtle Grid Lines (Plum tint)
    this.drawGrid();

    // 3. Draw Game Entities
    if (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED) {
      this.food.draw(ctx, this.cellSize, this.palette);
      this.snake.draw(ctx, this.cellSize, this.palette);
    }

    // 4. Particles
    this.particles.draw(ctx);

    // 5. Menus and HUD
    if (this.state === GAME_STATES.MENU) {
      this.renderReferenceMenu();
    } else if (this.state === GAME_STATES.CONTROLS) {
      this.renderControls();
    } else if (this.state === GAME_STATES.PLAYING) {
      this.renderHUD();
    } else if (this.state === GAME_STATES.PAUSED) {
      this.renderHUD();
      this.renderPauseOverlay();
    } else if (this.state === GAME_STATES.GAME_OVER) {
      this.renderGameOver();
    }

    // 6. Specular curved glass reflections
    this.drawGlassReflections();

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

  // Draw 5 Pixel Hearts in warm amber/orange (#fda415 / #fc7814)
  drawPixelHearts(startX, startY, count) {
    const { ctx, palette } = this;
    const heartSpacing = 26;

    for (let i = 0; i < 5; i++) {
      const hx = startX + (i * heartSpacing);
      const isFilled = i < count;

      ctx.save();
      const px = 2.6;
      // Heart matrix:
      //  .XX.XX.
      //  XXXXXXX
      //  XXXXXXX
      //  .XXXXX.
      //  ..XXX..
      //  ...X...
      const rows = [
        [0,1,1,0,1,1,0],
        [1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1],
        [0,1,1,1,1,1,0],
        [0,0,1,1,1,0,0],
        [0,0,0,1,0,0,0]
      ];

      for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < rows[r].length; c++) {
          if (rows[r][c] === 1) {
            if (!isFilled) {
              ctx.fillStyle = '#482c52'; // Depleted heart
            } else {
              // Top half brighter amber, lower half warm orange
              ctx.fillStyle = r < 3 ? palette.heartOrangeTop : palette.heartOrangeBottom;
            }
            ctx.fillRect(hx + (c * px), startY + (r * px), px, px);
          }
        }
      }
      ctx.restore();
    }
  }

  // Exact reproduction of User's Image
  renderReferenceMenu() {
    const { ctx, palette, canvas } = this;
    ctx.save();

    // Top-Left: HI-SCORE
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillStyle = palette.textWhite;
    ctx.fillText('HI-SCORE', 34, 46);

    ctx.fillStyle = palette.textAmberTop;
    const formattedScore = this.highScore.toString().padStart(6, '0');
    ctx.fillText(formattedScore, 34, 72);

    // Top-Right: 5 Orange Pixel Hearts
    this.drawPixelHearts(380, 36, 5);

    // Center Big Orange Title: START (with top-to-bottom amber shading & dark outline)
    ctx.textAlign = 'center';

    const centerX = canvas.width / 2;
    const centerY = 210;

    // 1. Dark bottom outline / shadow
    ctx.font = '54px "Press Start 2P", monospace';
    ctx.fillStyle = palette.textAmberShadow;
    ctx.fillText('START', centerX, centerY + 4);

    // 2. Base warm orange body
    ctx.fillStyle = palette.textAmberBottom;
    ctx.fillText('START', centerX, centerY);

    // 3. Top golden highlight (clipped to upper half of letters)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, centerY - 60, canvas.width, 28);
    ctx.clip();
    ctx.fillStyle = palette.textAmberTop;
    ctx.fillText('START', centerX, centerY);
    ctx.restore();

    // Subtitle: ARE YOU READY? in white/cream
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillStyle = palette.textWhite;
    ctx.fillText('ARE YOU READY?', centerX, 295);

    // Options: YES ◀       NO
    ctx.font = '18px "Press Start 2P", monospace';

    // YES
    ctx.textAlign = 'right';
    ctx.fillStyle = palette.textWhite;
    ctx.fillText('YES', 230, 354);

    // Triangle Cursor ◀
    if (this.selectedChoice === 'YES') {
      ctx.fillStyle = palette.textAmberTop;
      ctx.beginPath();
      ctx.moveTo(244, 346);
      ctx.lineTo(258, 338);
      ctx.lineTo(258, 354);
      ctx.closePath();
      ctx.fill();
    }

    // NO
    ctx.textAlign = 'left';
    ctx.fillStyle = palette.textWhite;
    ctx.fillText('NO', 320, 354);

    if (this.selectedChoice === 'NO') {
      ctx.fillStyle = palette.textAmberTop;
      ctx.beginPath();
      ctx.moveTo(366, 346);
      ctx.lineTo(380, 338);
      ctx.lineTo(380, 354);
      ctx.closePath();
      ctx.fill();
    }

    // Controls prompt in menu
    ctx.textAlign = 'center';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#b39ebd';
    ctx.fillText('PRESS [C] FOR CONTROLS', centerX, 392);

    ctx.restore();
  }

  renderControls() {
    const { ctx, palette, canvas } = this;
    ctx.save();
    ctx.textAlign = 'center';

    const cx = canvas.width / 2;

    // Header
    ctx.font = '18px "Press Start 2P", monospace';
    ctx.fillStyle = palette.textAmberTop;
    ctx.fillText('★ CONTROLS ★', cx, 65);

    // Box
    ctx.fillStyle = 'rgba(25, 12, 30, 0.7)';
    ctx.fillRect(50, 95, canvas.width - 100, 230);
    ctx.strokeStyle = palette.textAmberTop;
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 95, canvas.width - 100, 230);

    ctx.font = '11px "Press Start 2P", monospace';
    const lines = [
      { k: 'ARROWS / WASD', d: 'MOVE SNAKE' },
      { k: 'ENTER / SPACE', d: 'CONFIRM / START' },
      { k: 'P / ESC', d: 'PAUSE GAME' },
      { k: 'APPLES', d: '+100 PTS & GROW' },
      { k: 'GOLDEN FRUIT', d: '+500 PTS (TIMED)' }
    ];

    let y = 140;
    lines.forEach(item => {
      ctx.textAlign = 'left';
      ctx.fillStyle = palette.textAmberTop;
      ctx.fillText(item.k, 80, y);

      ctx.textAlign = 'right';
      ctx.fillStyle = palette.textWhite;
      ctx.fillText(item.d, canvas.width - 80, y);
      y += 34;
    });

    // Return prompt
    ctx.textAlign = 'center';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = palette.textWhite;
    ctx.fillText('PRESS [ENTER] OR [ESC] TO RETURN', cx, 375);

    ctx.restore();
  }

  renderHUD() {
    const { ctx, palette } = this;
    ctx.save();

    // Top-Left: SCORE
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = palette.textWhite;
    ctx.fillText('SCORE', 34, 40);

    ctx.fillStyle = palette.textAmberTop;
    ctx.fillText(this.score.toString().padStart(6, '0'), 34, 62);

    // Top-Right: Remaining Lives
    this.drawPixelHearts(380, 32, this.lives);

    ctx.restore();
  }

  renderPauseOverlay() {
    const { ctx, canvas, palette } = this;
    ctx.save();
    ctx.fillStyle = 'rgba(40, 22, 46, 0.78)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.font = '24px "Press Start 2P", monospace';
    ctx.fillStyle = palette.textAmberTop;
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);

    ctx.font = '11px "Press Start 2P", monospace';
    ctx.fillStyle = palette.textWhite;
    ctx.fillText('PRESS [P] OR [ESC] TO RESUME', canvas.width / 2, canvas.height / 2 + 36);
    ctx.restore();
  }

  renderGameOver() {
    const { ctx, canvas, palette } = this;
    ctx.save();
    ctx.fillStyle = 'rgba(38, 20, 44, 0.88)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.font = '24px "Press Start 2P", monospace';
    ctx.fillStyle = '#ff334b';
    ctx.fillText('GAME OVER', canvas.width / 2, 170);

    ctx.font = '13px "Press Start 2P", monospace';
    ctx.fillStyle = palette.textWhite;
    ctx.fillText(`SCORE: ${this.score}`, canvas.width / 2, 220);

    ctx.fillStyle = palette.textAmberTop;
    ctx.fillText(`BEST: ${this.highScore}`, canvas.width / 2, 250);

    const blink = Math.floor(Date.now() / 400) % 2 === 0;
    if (blink) {
      ctx.fillStyle = palette.textWhite;
      ctx.fillText('PRESS [ENTER] TO RETRY', canvas.width / 2, 315);
    }
    ctx.restore();
  }

  // Curved glass shine reflection matching reference image
  drawGlassReflections() {
    const { ctx, canvas } = this;
    ctx.save();

    // Top-left curved highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(35, 140);
    ctx.quadraticCurveTo(38, 60, 120, 36);
    ctx.stroke();

    // Right-side reflection
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(canvas.width - 35, 150);
    ctx.quadraticCurveTo(canvas.width - 38, 70, canvas.width - 110, 42);
    ctx.stroke();

    ctx.restore();
  }
}
