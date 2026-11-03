// Snake Grid Entity with Green Pixel Styling & Direction Buffer

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

    this.body.unshift(newHead);

    if (this.growPending > 0) {
      this.growPending--;
    } else {
      this.body.pop();
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
    for (let i = this.body.length - 1; i >= 0; i--) {
      const seg = this.body[i];
      const sx = seg.x * cellSize;
      const sy = seg.y * cellSize;

      if (i === 0) {
        // Snake Head: Vibrant Green Pixel Box
        ctx.save();
        ctx.fillStyle = palette.snakeHead;
        ctx.fillRect(sx + 1, sy + 1, cellSize - 2, cellSize - 2);

        // Top-left pixel highlight on head
        ctx.fillStyle = palette.snakeHeadShine;
        ctx.fillRect(sx + 2, sy + 2, 4, 4);

        // Eyes with pupils facing the direction
        ctx.fillStyle = palette.snakeEye;
        const eyeW = 4;
        const eyeH = 4;
        let e1x, e1y, e2x, e2y;
        let p1x, p1y, p2x, p2y;

        if (this.dir.x === 1) { // Facing Right
          e1x = sx + cellSize - 6; e1y = sy + 3;
          e2x = sx + cellSize - 6; e2y = sy + cellSize - 7;
          p1x = e1x + 2; p1y = e1y + 1;
          p2x = e2x + 2; p2y = e2y + 1;
        } else if (this.dir.x === -1) { // Facing Left
          e1x = sx + 2; e1y = sy + 3;
          e2x = sx + 2; e2y = sy + cellSize - 7;
          p1x = e1x; p1y = e1y + 1;
          p2x = e2x; p2y = e2y + 1;
        } else if (this.dir.y === 1) { // Facing Down
          e1x = sx + 3; e1y = sy + cellSize - 6;
          e2x = sx + cellSize - 7; e2y = sy + cellSize - 6;
          p1x = e1x + 1; p1y = e1y + 2;
          p2x = e2x + 1; p2y = e2y + 2;
        } else { // Facing Up
          e1x = sx + 3; e1y = sy + 2;
          e2x = sx + cellSize - 7; e2y = sy + 2;
          p1x = e1x + 1; p1y = e1y;
          p2x = e2x + 1; p2y = e2y;
        }

        ctx.fillRect(e1x, e1y, eyeW, eyeH);
        ctx.fillRect(e2x, e2y, eyeW, eyeH);

        // Pupils
        ctx.fillStyle = palette.snakePupil;
        ctx.fillRect(p1x, p1y, 2, 2);
        ctx.fillRect(p2x, p2y, 2, 2);

        ctx.restore();
      } else {
        // Snake Body Segment: Rich Green with darker pixel border
        ctx.save();
        ctx.fillStyle = palette.snakeBodyBorder;
        ctx.fillRect(sx + 1, sy + 1, cellSize - 2, cellSize - 2);

        ctx.fillStyle = palette.snakeBody;
        ctx.fillRect(sx + 2, sy + 2, cellSize - 4, cellSize - 4);

        // Subtle lighter scale in the center
        if (cellSize >= 16) {
          ctx.fillStyle = palette.snakeHead;
          ctx.fillRect(sx + 5, sy + 5, cellSize - 10, cellSize - 10);
        }
        ctx.restore();
      }
    }
  }
}
