// Main Arcade Game Controller matching reference design
import { Snake } from './Snake.js';
import { FoodManager } from './Food.js';
import { ParticleSystem } from './Particles.js';
import { PALETTES } from './Palettes.js';

export const GAME_STATES = {
  MENU: 'MENU',
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

    // Grid configuration: 24x24 grid at 20px = 480x480
    this.cols = 24;
    this.rows = 24;
    this.cellSize = 20;

    // Game state & Theme
    this.state = GAME_STATES.MENU;
    this.palette = PALETTES.arcadeRetro;

    // Game entities
    this.snake = new Snake(this.cols, this.rows);
    this.food = new FoodManager(this.cols, this.rows);
    this.particles = new ParticleSystem();

    // Scoring & Lives (5 hearts matching reference image)
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('pixel_snake_hiscore') || '123000', 10);
    this.lives = 5;
    this.maxLives = 5;

    // Game Timing
    this.lastTime = 0;
    this.tickAccumulator = 0;
    this.baseSpeedMs = 115;
    this.currentSpeedMs = this.baseSpeedMs;

    // Screen Shake
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;

    // Reference Menu State: "ARE YOU READY? YES ◀   NO"
    // selectedChoice: 'YES' | 'NO'
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
      }
    });

    // Touch & Click support on canvas
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

        // Click near YES / NO region
        if (clickY >= 330 && clickY <= 400) {
          if (clickX < 260) {
            this.selectedChoice = 'YES';
            this.sfx.coinInsert();
            this.startGame();
          } else {
            this.selectedChoice = 'NO';
            this.sfx.menuMove();
          }
        } else {
          // Click anywhere else on screen starts game
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
        // Toggle back to YES after playful beep
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
    if (newHead.x === this.food.apple.x && newHead.y === this.food.apple.y) {
      this.snake.grow(1);
      this.score += 100;
      const px = this.food.apple.x * this.cellSize + this.cellSize / 2;
      const py = this.food.apple.y * this.cellSize + this.cellSize / 2;
      this.particles.burst(px, py, this.palette.snakeHead, 16);
      this.triggerScreenShake(4);
      this.sfx.eat();
      this.food.spawnApple(this.snake.body);

      // Accelerate slightly
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
      // Lose life and respawn at center
      this.sfx.gameOver();
      for (const seg of this.snake.body) {
        const sx = seg.x * this.cellSize + this.cellSize / 2;
        const sy = seg.y * this.cellSize + this.cellSize / 2;
        this.particles.burst(sx, sy, this.palette.snakeHead, 6, 3);
      }
      this.snake.reset();
    } else {
      // Game Over
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

    // 1. Draw Arcade Purple Screen Background
    ctx.fillStyle = this.palette.screenBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Screen Shake offset
    if (this.shakeIntensity > 0) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const sy = (Math.random() - 0.5) * this.shakeIntensity * 2;
      ctx.translate(sx, sy);
    }

    // 2. Subtle Grid Lines (Purple tint)
    this.drawGrid();

    // 3. Draw Game Objects if Playing
    if (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED) {
      this.food.draw(ctx, this.cellSize, this.palette);
      this.snake.draw(ctx, this.cellSize, this.palette);
    }

    // 4. Particles
    this.particles.draw(ctx);

    // 5. Draw UI & Menus
    if (this.state === GAME_STATES.MENU) {
      this.renderReferenceMenu();
    } else if (this.state === GAME_STATES.PLAYING) {
      this.renderHUD();
    } else if (this.state === GAME_STATES.PAUSED) {
      this.renderHUD();
      this.renderPauseOverlay();
    } else if (this.state === GAME_STATES.GAME_OVER) {
      this.renderGameOver();
    }

    // 6. Draw Specular Curved Glass Highlight Reflections (like reference image)
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

  // Draw 5 Pixel Hearts at top right
  drawPixelHearts(startX, startY, count) {
    const { ctx, palette } = this;
    const heartSpacing = 24;

    for (let i = 0; i < 5; i++) {
      const hx = startX + (i * heartSpacing);
      const isFilled = i < count;

      ctx.save();
      ctx.fillStyle = isFilled ? palette.heartOrange : '#3f2d59';

      // Pixel Art Heart Matrix (7 columns x 6 rows)
      //  .XX.XX.
      //  XXXXXXX
      //  XXXXXXX
      //  .XXXXX.
      //  ..XXX..
      //  ...X...
      const px = 2.4;
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
            ctx.fillRect(hx + (c * px), startY + (r * px), px, px);
          }
        }
      }

      ctx.restore();
    }
  }

  // The Exact Menu from the User's Image
  renderReferenceMenu() {
    const { ctx, palette, canvas } = this;
    ctx.save();

    // Top-Left: HI-SCORE
    ctx.font = '13px "Press Start 2P", monospace';
    ctx.fillStyle = palette.textWhite;
    ctx.fillText('HI-SCORE', 26, 42);

    ctx.fillStyle = palette.textOrange;
    const formattedScore = this.highScore.toString().padStart(6, '0');
    ctx.fillText(formattedScore, 26, 68);

    // Top-Right: 5 Orange Pixel Hearts
    this.drawPixelHearts(335, 36, 5);

    // Center Big Orange Title: START
    ctx.textAlign = 'center';

    // 3D Drop Shadow for START
    ctx.font = '54px "Press Start 2P", monospace';
    ctx.fillStyle = palette.textOrangeDark;
    ctx.fillText('START', canvas.width / 2, 224);

    // Front Orange Body
    ctx.fillStyle = palette.textOrange;
    ctx.fillText('START', canvas.width / 2, 220);

    // Golden Top Highlight
    ctx.fillStyle = '#ffcf70';
    ctx.font = '54px "Press Start 2P", monospace';
    // Draw top highlight with clip or thin overlay
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 165, canvas.width, 24);
    ctx.clip();
    ctx.fillText('START', canvas.width / 2, 220);
    ctx.restore();

    // Subtitle: ARE YOU READY?
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillStyle = palette.textWhite;
    ctx.fillText('ARE YOU READY?', canvas.width / 2, 310);

    // Options: YES ◀       NO
    ctx.font = '18px "Press Start 2P", monospace';

    // YES
    ctx.textAlign = 'right';
    ctx.fillStyle = palette.textWhite;
    ctx.fillText('YES', 210, 368);

    // Triangle Cursor pointing to left
    if (this.selectedChoice === 'YES') {
      ctx.fillStyle = palette.textOrange;
      ctx.beginPath();
      // Triangle ◀
      ctx.moveTo(226, 358);
      ctx.lineTo(240, 350);
      ctx.lineTo(240, 366);
      ctx.closePath();
      ctx.fill();
    }

    // NO
    ctx.textAlign = 'left';
    ctx.fillStyle = palette.textWhite;
    ctx.fillText('NO', 290, 368);

    if (this.selectedChoice === 'NO') {
      ctx.fillStyle = palette.textOrange;
      ctx.beginPath();
      // Triangle ◀
      ctx.moveTo(336, 358);
      ctx.lineTo(350, 350);
      ctx.lineTo(350, 366);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  renderHUD() {
    const { ctx, palette } = this;
    ctx.save();

    // Top-Left: SCORE & HI-SCORE
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = palette.textWhite;
    ctx.fillText('SCORE', 26, 36);

    ctx.fillStyle = palette.textOrange;
    ctx.fillText(this.score.toString().padStart(6, '0'), 26, 58);

    // Top-Right: Remaining Lives / Hearts
    this.drawPixelHearts(335, 30, this.lives);

    ctx.restore();
  }

  renderPauseOverlay() {
    const { ctx, canvas } = this;
    ctx.save();
    ctx.fillStyle = 'rgba(26, 18, 45, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.font = '22px "Press Start 2P", monospace';
    ctx.fillStyle = '#ff9e1f';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);

    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('PRESS [P] OR [ESC] TO RESUME', canvas.width / 2, canvas.height / 2 + 35);
    ctx.restore();
  }

  renderGameOver() {
    const { ctx, canvas, palette } = this;
    ctx.save();
    ctx.fillStyle = 'rgba(24, 16, 42, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.font = '24px "Press Start 2P", monospace';
    ctx.fillStyle = '#ff3b30';
    ctx.fillText('GAME OVER', canvas.width / 2, 180);

    ctx.font = '13px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`SCORE: ${this.score}`, canvas.width / 2, 230);

    ctx.fillStyle = palette.textOrange;
    ctx.fillText(`BEST: ${this.highScore}`, canvas.width / 2, 260);

    const blink = Math.floor(Date.now() / 400) % 2 === 0;
    if (blink) {
      ctx.fillStyle = palette.textWhite;
      ctx.fillText('PRESS [ENTER] TO RETRY', canvas.width / 2, 330);
    }
    ctx.restore();
  }

  // Draw the glossy curved reflection lines on the monitor glass (as in reference)
  drawGlassReflections() {
    const { ctx, canvas } = this;
    ctx.save();

    // Left curved glossy reflection
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(35, 160);
    ctx.quadraticCurveTo(38, 70, 110, 40);
    ctx.stroke();

    // Right subtle reflection
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(canvas.width - 35, 170);
    ctx.quadraticCurveTo(canvas.width - 38, 80, canvas.width - 100, 45);
    ctx.stroke();

    ctx.restore();
  }
}
