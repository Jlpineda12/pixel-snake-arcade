// 2D Pixel Particle System for Arcade Juice

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // Spawn explosion of pixel particles
  burst(x, y, color, count = 16, speed = 4) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const velocity = (Math.random() * 0.7 + 0.3) * speed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        size: Math.random() < 0.5 ? 4 : 6,
        color,
        alpha: 1.0,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95; // friction
      p.vy *= 0.95;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      // Draw crisp pixel squares
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
      ctx.restore();
    }
  }

  clear() {
    this.particles = [];
  }
}
