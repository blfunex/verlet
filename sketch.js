function setup() {
  createCanvas(windowWidth, windowHeight);
  Object.assign(drawingContext.canvas.style, {
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: -1,
    width: "100%",
    height: "100%",
  });
  particles = [];
  springs = [];

  for (let i = 0; i < 100; i++) {
    particles.push(
      new Particle(
        random(width),
        random(height),
        random(-10, 10),
        random(-10, 10)
      )
    );
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(0);

  for (const particle of particles) {
    particle.update();
  }

  for (const particle of particles) {
    particle.draw();
  }
}

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(v) {
    return this.set(v.x, v.y);
  }
}

class Particle {
  static DEFAULT_BOUNCE = 0.9;
  static WORLD_GRAVITY = 0.5;
  static DEFAULT_FRICTION = 0.999;

  constructor(x, y, ivx, ivy) {
    this.position = new Vector(x, y);
    this.oldPosition = new Vector(x - ivx, y - ivy);
    this.bounce = Particle.DEFAULT_BOUNCE;
    this.friction = Particle.DEFAULT_FRICTION;
  }

  draw() {
    strokeWeight(2);
    stroke(255);
    point(this.position.x, this.position.y);
  }

  update() {
    const p = this.position;
    const op = this.oldPosition;
    const bounce = this.bounce;
    const friction = this.friction;
    const gravity = Particle.WORLD_GRAVITY;

    const vx = (p.x - op.x) * friction;
    const vy = (p.y - op.y) * friction;

    op.copy(p);
    p.x += vx;
    p.y += vy;
    p.y += gravity;

    if (p.x > width) {
      p.x = width;
      op.x = p.x + vx * bounce;
    } else if (p.x < 0) {
      p.x = 0;
      op.x = p.x + vx * bounce;
    }

    if (p.y > height) {
      p.y = height;
      op.y = p.y + vy * bounce;
    } else if (p.y < 0) {
      p.y = 0;
      op.y = p.y + vy * bounce;
    }
  }
}
