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
  constraints = [];

  particles.push(new Particle(200, 200, random(-20, 20), random(-20, 20)));
  particles.push(new Particle(100, 200, random(-20, 20), random(-20, 20)));
  particles.push(new Particle(100, 100, random(-20, 20), random(-20, 20)));
  particles.push(new Particle(200, 100, random(-20, 20), random(-20, 20)));

  const CHAIN_START = particles.length;
  for (let j = 0; j < 25; j++) {
    const particle = new Particle(100 + 1 * (j + 1), 100);
    particle.hidden = false;
    particles.push(particle);
  }

  constraints.push(new DistanceConstraint(particles[0], particles[2]));
  constraints.push(new DistanceConstraint(particles[1], particles[3]));
  constraints.push(new DistanceConstraint(particles[0], particles[1]));
  constraints.push(new DistanceConstraint(particles[1], particles[2]));
  constraints.push(new DistanceConstraint(particles[2], particles[3]));
  constraints.push(new DistanceConstraint(particles[3], particles[0]));

  constraints[0].hidden = true;
  constraints[1].hidden = true;

  for (let i = CHAIN_START; i < particles.length; i++) {
    const current = particles[i];
    const previous = particles[i - 1];

    if (!previous) continue;

    const constraint = new DistanceConstraint(current, previous, 10);

    constraints.push(constraint);
  }

  particles[particles.length - 1].pinned = true;

  frameRate(60);

  selected = null;
  hovered = null;
  frozen = new Set();
  square = [];
  index = 0;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mouseMoved() {
  let closest = null;
  let closestDistance = Infinity;
  for (const particle of particles) {
    const dx = mouseX - particle.position.x;
    const dy = mouseY - particle.position.y;

    const d = Math.hypot(dx, dy);

    if (d < 10) {
      hovered = particle;
      return;
    }

    if (d < closestDistance) {
      closest = particle;
      closestDistance = d;
    }
  }

  hovered = closest;
}

function mouseDragged() {
  if (selected && (mouseButton === LEFT || mouseButton === CENTER)) {
    selected.pinned = true;
    selected.position.x = mouseX;
    selected.position.y = mouseY;
    selected.oldPosition.copy(selected.position);
  }
}

function mouseReleased() {
  if (mouseButton === LEFT && selected) {
    selected.pinned = false;
    selected = null;
  }
}

function mousePressed() {
  if (hovered && (mouseButton === LEFT || mouseButton === CENTER)) {
    selected = hovered;
    for (const particle of frozen) particle.pinned = false;
    frozen.clear();
    square.length = 0;
    hovered = null;
    index = 0;
    return;
  }

  if (mouseButton === RIGHT) {
    const particle = new Particle(mouseX, mouseY);

    particle.hidden = false;
    particle.pinned = true;

    frozen.add(particle);
    particles.push(particle);

    selected = particle;
    hovered = null;

    if (square.size < 4) {
      square.push(particle);

      const current = square[index];
      const previous = square[index - 1];

      index++;

      if (previous) {
        const constraint = new DistanceConstraint(current, previous);

        constraints.push(constraint);
      }
    }

    if (square.size === 4) {
      constraints.push(new DistanceConstraint(square[0], square[3]));

      const a = new DistanceConstraint(square[0], square[2]);
      const b = new DistanceConstraint(square[1], square[3]);

      a.hidden = b.hidden = true;

      constraints.push(a);
      constraints.push(b);

      index = 0;
      selected = square[0];
    }

    if (frozen.size > 4) {
      constraints.push(new DistanceConstraint(square[index++], particle));
      if (index === square.length) index = 0;
      selected = square[index];
    }
  }
}

function draw() {
  background(0);

  for (const particle of particles) particle.update();
  for (let i = 0; i < 10; i++) {
    for (const constraint of constraints) constraint.constrain();
  }

  for (const constraint of constraints) {
    constraint.draw();
  }

  for (const particle of particles) {
    particle.draw();
  }

  strokeWeight(3);
  stroke(255);
  fill(0);
  textFont("monospace", 32);
  text("Verlet integration", 20, 30);

  noStroke();
  textSize(12);
  fill(255);
  text(
    "This demo uses verlet integration as well as a basic distance constraint.\n" +
      'Code was adapted from "Coding Math"\'s Episodes 36-39, on Youtube.',
    20,
    50
  );

  fill(255);
  text(JSON.stringify(square.length, null, 2), 20, 100);
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

  copy(vector) {
    return this.set(vector.x, vector.y);
  }

  distance(point) {
    const dx = this.x - point.x;
    const dy = this.y - point.y;
    return Math.hypot(dx, dy);
  }
}

class Particle {
  static DEFAULT_BOUNCE = 0.9;
  static WORLD_GRAVITY = 0.5;
  static DEFAULT_FRICTION = 0.999;

  constructor(x, y, ivx = 0, ivy = 0) {
    this.position = new Vector(x, y);
    this.oldPosition = new Vector(x - ivx, y - ivy);
    this.bounce = Particle.DEFAULT_BOUNCE;
    this.friction = Particle.DEFAULT_FRICTION;
    this.hidden = true;
    this.pinned = false;
  }

  draw() {
    if (hovered === this || selected === this) {
      const hue = selected === this ? 220 : 0;
      const light = selected === this ? 100 : 50;
      const alpha = selected === this ? 1 : 0.5;

      stroke(`hsla(${hue}, 100%, ${light}%, ${alpha})`);
      strokeWeight(10);
      point(this.position.x, this.position.y);
    }

    if (this.hidden && !this.pinned) return;
    stroke(this.pinned ? "red" : 255);
    strokeWeight(this.pinned ? 5 : 2);
    point(this.position.x, this.position.y);
  }

  update() {
    if (this.pinned) return;

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

class Constraint {
  constructor(a, b) {
    if (a === b) throw new Error("Cannot constrain a particle to itself");

    this.a = a;
    this.b = b;
  }

  constrain() {}

  draw() {}
}

class DistanceConstraint extends Constraint {
  constructor(a, b, length = a.position.distance(b.position)) {
    super(a, b);
    this.length = length;
    this.hidden = false;
  }

  constrain() {
    const { a, b, length } = this;

    if (a.pinned && b.pinned) return;

    const ap = a.position;
    const bp = b.position;

    const dx = bp.x - ap.x;
    const dy = bp.y - ap.y;

    const d = Math.hypot(dx, dy);
    const d2 = (length - d) / d / 2;

    const ox = dx * d2;
    const oy = dy * d2;

    if (!a.pinned) {
      const factor = b.pinned ? 2 : 1;
      ap.x -= ox * factor;
      ap.y -= oy * factor;
    }

    if (!b.pinned) {
      const factor = a.pinned ? 2 : 1;
      bp.x += ox * factor;
      bp.y += oy * factor;
    }
  }

  draw() {
    const { a, b } = this;
    stroke(255, this.hidden ? 32 : 255);
    strokeWeight(1);
    line(a.position.x, a.position.y, b.position.x, b.position.y);
  }
}
