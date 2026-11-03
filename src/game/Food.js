// Robust Food Management with Safe Zone Constraints & Pixel Apple Graphics

export class FoodManager {
  constructor(gridCols, gridRows) {
    this.gridCols = gridCols;
    this.gridRows = gridRows;

    // Safe zone margins to avoid monitor curved corners and top HUD
    this.minX = 2;
    this.maxX = Math.max(3, gridCols - 3);
    this.minY = 4; // Below top HUD (Rows 0-3 reserved for SCORE and Hearts)
    this.maxY = Math.max(5, gridRows - 3);

    this.apple = { x: 10, y: 10 };
    this.golden = null; // { x, y, timeLeft, maxTime }
    this.applesEatenCount = 0;
  }

  // Generate coordinates strictly within the safe playable area
  getRandomSafePos() {
    const spanX = this.maxX - this.minX + 1;
    const spanY = this.maxY - this.minY + 1;
    return {
      x: this.minX + Math.floor(Math.random() * spanX),
      y: this.minY + Math.floor(Math.random() * spanY)
    };
  }

  // Spawn standard apple in an unoccupied safe cell
  spawnApple(occupiedCells = []) {
    let newPos;
    let attempts = 0;

    do {
      newPos = this.getRandomSafePos();
      attempts++;
    } while (
      attempts < 150 &&
      occupiedCells.some(cell => cell.x === newPos.x && cell.y === newPos.y)
    );

    this.apple = newPos;
    this.applesEatenCount++;

    // Spawn bonus golden apple every 5 apples
    if (this.applesEatenCount % 5 === 0 && !this.golden) {
      this.spawnGolden(occupiedCells);
    }

    return this.apple;
  }

  spawnGolden(occupiedCells = []) {
    let newPos;
    let attempts = 0;

    do {
      newPos = this.getRandomSafePos();
      attempts++;
    } while (
      attempts < 150 &&
      ((this.apple && this.apple.x === newPos.x && this.apple.y === newPos.y) ||
       occupiedCells.some(cell => cell.x === newPos.x && cell.y === newPos.y))
    );

    this.golden = {
      x: newPos.x,
      y: newPos.y,
      timeLeft: 9000, // 9 seconds lifespan
      maxTime: 9000
    };
  }

  update(deltaMs) {
    if (this.golden) {
      this.golden.timeLeft -= deltaMs;
      if (this.golden.timeLeft <= 0) {
        this.golden = null;
      }
    }

    // Safety fallback: ensure normal apple always exists in safe bounds
    if (!this.apple || 
        this.apple.x < this.minX || this.apple.x > this.maxX ||
        this.apple.y < this.minY || this.apple.y > this.maxY) {
      this.apple = this.getRandomSafePos();
    }
  }

  draw(ctx, cellSize, palette) {
    // 1. Draw Normal Apple (High-visibility Retro Pixel Apple)
    if (this.apple) {
      const ax = this.apple.x * cellSize;
      const ay = this.apple.y * cellSize;

      ctx.save();

      // Subtle pulse to ensure high visibility
      const pulse = Math.sin(Date.now() * 0.008) * 1.2;

      // Glow aura
      ctx.shadowColor = '#ff334b';
      ctx.shadowBlur = 10;

      // Red Apple Body
      ctx.fillStyle = '#ff2a44';
      ctx.fillRect(
        ax + 2 - pulse / 2,
        ay + 3 - pulse / 2,
        cellSize - 4 + pulse,
        cellSize - 5 + pulse
      );

      // Top Highlight
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff7888';
      ctx.fillRect(ax + 4, ay + 5, 4, 4);

      // Green Leaf on top
      ctx.fillStyle = '#39e75f';
      ctx.fillRect(ax + Math.floor(cellSize / 2) - 1, ay + 1, 3, 2);
      ctx.fillRect(ax + Math.floor(cellSize / 2) + 2, ay, 2, 2);

      ctx.restore();
    }

    // 2. Draw Golden Bonus Apple (Pulsing Amber Gold with Countdown)
    if (this.golden) {
      const gx = this.golden.x * cellSize;
      const gy = this.golden.y * cellSize;
      const progress = Math.max(0, this.golden.timeLeft / this.golden.maxTime);

      ctx.save();
      const goldPulse = Math.sin(Date.now() * 0.012) * 2;

      ctx.shadowColor = '#fda415';
      ctx.shadowBlur = 14;

      // Golden fruit body
      ctx.fillStyle = '#fda415';
      ctx.fillRect(
        gx + 2 - goldPulse / 2,
        gy + 2 - goldPulse / 2,
        cellSize - 4 + goldPulse,
        cellSize - 4 + goldPulse
      );

      // Bright shine
      ctx.fillStyle = '#fff5ea';
      ctx.fillRect(gx + 4, gy + 4, 4, 4);

      // Countdown timer bar directly underneath
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(gx + 2, gy + cellSize, cellSize - 4, 2);
      ctx.fillStyle = '#fda415';
      ctx.fillRect(gx + 2, gy + cellSize, (cellSize - 4) * progress, 2);

      ctx.restore();
    }
  }
}
