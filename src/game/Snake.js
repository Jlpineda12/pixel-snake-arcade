// Snake Grid Entity with Input Buffer & Pixel Rendering

export class Snake {
  constructor(gridCols, gridRows) {
    this.gridCols = gridCols;
    this.gridRows = gridRows;
    this.reset();
  }

  reset() {
    const midX = Math.floor(this.gridCols / 2);
    const midY = Math.floor(this.gridRows / 2);

    this.body = [
      { x: midX, y: midY },
      { x: midX - 1, y: midY },
      { x: midX - 2, y: midY }
    ];

    this.dir = { x: 1, y: 0 }; // Moving right
    this.nextDir = { x: 1, y: 0 };
    this.inputQueue = [];
    this.growPending = 0;
  }

  queueDirection(x, y) {
    // Avoid queuing duplicate commands
    const lastDir = this.inputQueue.length > 0 
      ? this.inputQueue[this.inputQueue.length - 1] 
      : this.dir;

    // Disallow 180-degree instant reversal
    if (x !== 0 && lastDir.x === -x) return;
    if (y !== 0 && lastDir.y === -y) return;

    if (this.inputQueue.length < 3) {
      this.inputQueue.push({ x, y });
    }
  }

  update() {
    if (this.inputQueue.length > 0) {
      this.dir = this.inputQueue.shift();
    }

    const head = this.body[0];
    const newHead = {
      x: head.x + this.dir.x,
      y: head.y + this.dir.y
    };

    // Insert new head
    this.body.unshift(newHead);

    if (this.growPending > 0) {
      this.growPending--;
    } else {
      this.body.pop(); // Remove tail if not growing
    }

    return newHead;
  }

  grow(amount = 1) {
    this.growPending += amount;
  }

  checkSelfCollision() {
    const head = this.body[0];
    for (let i = 1; i < this.body.length; i++) {
      if (this.body[i].x === head.x && this.body[i].y === head.y) {
        return true;
      }
    }
    return false;
  }

  checkWallCollision() {
    const head = this.body[0];
    return (
      head.x < 0 ||
      head.x >= this.gridCols ||
      head.y < 0 ||
      head.y >= this.gridRows
    );
  }

  draw(ctx, cellSize, palette) {
    // Draw body segments
    for (let i = this.body.length - 1; i >= 0; i--) {
      const seg = this.body[i];
      const sx = seg.x * cellSize;
      const sy = seg.y * cellSize;

      if (i === 0) {
        // Snake Head
        ctx.save();
        ctx.fillStyle = palette.snakeHead;
        ctx.fillRect(sx + 1, sy + 1, cellSize - 2, cellSize - 2);

        // Eyes facing current direction
        ctx.fillStyle = palette.snakeEye;
        const eyeSize = 3;
        let eye1X, eye1Y, eye2X, eye2Y;

        if (this.dir.x === 1) { // Right
          eye1X = sx + cellSize - 5; eye1Y = sy + 3;
          eye2X = sx + cellSize - 5; eye2Y = sy + cellSize - 6;
        } else if (this.dir.x === -1) { // Left
          eye1X = sx + 2; eye1Y = sy + 3;
          eye2X = sx + 2; eye2Y = sy + cellSize - 6;
        } else if (this.dir.y === 1) { // Down
          eye1X = sx + 3; eye1Y = sy + cellSize - 5;
          eye2X = sx + cellSize - 6; eye2Y = sy + cellSize - 5;
        } else { // Up
          eye1X = sx + 3; eye1Y = sy + 2;
          eye2X = sx + cellSize - 6; eye2Y = sy + 2;
        }

        ctx.fillRect(eye1X, eye1Y, eyeSize, eyeSize);
        ctx.fillRect(eye2X, eye2Y, eyeSize, eyeSize);
        ctx.restore();
      } else {
        // Body segment (slightly smaller for pixel segment look)
        ctx.save();
        // Subtle color gradient down the tail
        const alpha = Math.max(0.65, 1 - (i / this.body.length) * 0.35);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = palette.snakeBody;
        ctx.fillRect(sx + 2, sy + 2, cellSize - 4, cellSize - 4);
        ctx.restore();
      }
    }
  }
}
