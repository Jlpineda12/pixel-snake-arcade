// Food Management (Normal Apples & Golden Bonus Fruits)

export class FoodManager {
  constructor(gridCols, gridRows) {
    this.gridCols = gridCols;
    this.gridRows = gridRows;
    this.apple = { x: 5, y: 5 };
    this.golden = null; // { x, y, timeLeft, maxTime }
    this.applesEatenCount = 0;
  }

  // Spawn standard apple in an unoccupied cell
  spawnApple(occupiedCells) {
    let newPos;
    let attempts = 0;
    do {
      newPos = {
        x: Math.floor(Math.random() * this.gridCols),
        y: Math.floor(Math.random() * this.gridRows)
      };
      attempts++;
    } while (
      attempts < 200 &&
      occupiedCells.some(cell => cell.x === newPos.x && cell.y === newPos.y)
    );

    this.apple = newPos;
    this.applesEatenCount++;

    // Spawn golden fruit every 5 apples if not already active
    if (this.applesEatenCount % 5 === 0 && !this.golden) {
      this.spawnGolden(occupiedCells);
    }
  }

  spawnGolden(occupiedCells) {
    let newPos;
    let attempts = 0;
    do {
      newPos = {
        x: Math.floor(Math.random() * this.gridCols),
        y: Math.floor(Math.random() * this.gridRows)
      };
      attempts++;
    } while (
      attempts < 200 &&
      (this.apple.x === newPos.x && this.apple.y === newPos.y ||
       occupiedCells.some(cell => cell.x === newPos.x && cell.y === newPos.y))
    );

    this.golden = {
      x: newPos.x,
      y: newPos.y,
      timeLeft: 10000, // 10 seconds lifespan
      maxTime: 10000
    };
  }

  update(deltaMs) {
    if (this.golden) {
      this.golden.timeLeft -= deltaMs;
      if (this.golden.timeLeft <= 0) {
        this.golden = null; // expired
      }
    }
  }

  draw(ctx, cellSize, palette) {
    // 1. Draw Normal Apple (Pixel shape)
    const ax = this.apple.x * cellSize;
    const ay = this.apple.y * cellSize;

    ctx.save();
    ctx.fillStyle = palette.food;
    ctx.shadowColor = palette.foodGlow;
    ctx.shadowBlur = 8;
    // Draw 8-bit rounded pixel square
    ctx.fillRect(ax + 2, ay + 2, cellSize - 4, cellSize - 4);

    // Pixel highlight shine
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ax + 4, ay + 4, 3, 3);
    ctx.restore();

    // 2. Draw Golden Bonus Apple (Pulsing + circular countdown ring)
    if (this.golden) {
      const gx = this.golden.x * cellSize;
      const gy = this.golden.y * cellSize;
      const progress = this.golden.timeLeft / this.golden.maxTime;

      ctx.save();
      ctx.fillStyle = palette.goldenFood;
      ctx.shadowColor = palette.goldenGlow;
      ctx.shadowBlur = 12;

      // Pulse size slightly
      const pulse = Math.sin(Date.now() * 0.01) * 1.5;
      ctx.fillRect(
        gx + 2 - pulse / 2,
        gy + 2 - pulse / 2,
        cellSize - 4 + pulse,
        cellSize - 4 + pulse
      );

      // Countdown timer bar underneath
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(gx + 2, gy + cellSize - 2, cellSize - 4, 2);
      ctx.fillStyle = palette.goldenFood;
      ctx.fillRect(gx + 2, gy + cellSize - 2, (cellSize - 4) * progress, 2);

      ctx.restore();
    }
  }
}
