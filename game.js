const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = 500;
canvas.height = 800;

// --- EXTREME STATE ---
let p = {
  x: 250, y: 700, w: 30, h: 30,
  hp: 100, energy: 100,
  combo: 0, comboTimer: 0,
  isLaser: false, afterimages: []
};

let entities = { bullets: [], enemies: [], particles: [], lasers: [] };
let keys = {};
let frame = 0;
let screenShake = 0;

// --- INPUTS ---
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

document.addEventListener("keydown", e => {
  if (e.code === "KeyR" && p.energy >= 50) {
    p.isLaser = true;
    p.energy -= 50;
    screenShake = 30;
    setTimeout(() => p.isLaser = false, 2000);
  }
});

// --- FX ENGINE ---
function createExplosion(x, y, color, size = 5) {
  for (let i = 0; i < 20; i++) {
    entities.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15,
      life: 1.0,
      c: color,
      s: Math.random() * size
    });
  }
}

// --- LOGIC ---
function update() {
  frame++;
  if (screenShake > 0) screenShake *= 0.9;
  
  // Smooth Move & Afterimage
  let prevX = p.x;
  if (keys["ArrowLeft"] && p.x > 0) p.x -= 8;
  if (keys["ArrowRight"] && p.x < canvas.width - p.w) p.x += 8;
  
  if (frame % 2 === 0) {
    p.afterimages.push({ x: p.x, y: p.y, life: 0.5 });
    if (p.afterimages.length > 5) p.afterimages.shift();
  }

  // Combat
  if (frame % 5 === 0 && !p.isLaser) {
    entities.bullets.push({ x: p.x + 12, y: p.y, dy: -15, c: "#ff00ff" });
    if (p.combo > 10) { // Double shot
      entities.bullets.push({ x: p.x - 5, y: p.y + 10, dy: -15, c: "#00ffff" });
      entities.bullets.push({ x: p.x + 30, y: p.y + 10, dy: -15, c: "#00ffff" });
    }
  }

  // Laser Logic
  if (p.isLaser) {
    screenShake = Math.max(screenShake, 5);
    entities.enemies.forEach(e => {
      if (Math.abs(e.x - (p.x + 15)) < 40) {
        e.hp -= 5;
        createExplosion(e.x, e.y, "white", 2);
      }
    });
  }

  // Enemies Spawn
  if (frame % 15 === 0) {
    let type = Math.random();
    entities.enemies.push({
      x: Math.random() * 470, y: -50,
      w: type > 0.8 ? 50 : 25,
      hp: type > 0.8 ? 20 : 3,
      speed: type > 0.8 ? 2 : 5,
      c: type > 0.8 ? "#ff5500" : "#ff0044"
    });
  }

  // Collision & Cleanup
  entities.bullets.forEach((b, bi) => {
    b.y += b.dy;
    entities.enemies.forEach((e, ei) => {
      if (b.x < e.x + e.w && b.x + 5 > e.x && b.y < e.y + e.w && b.y + 15 > e.y) {
        e.hp--;
        entities.bullets.splice(bi, 1);
        if (e.hp <= 0) {
          createExplosion(e.x + e.w/2, e.y + e.w/2, e.c, 8);
          entities.enemies.splice(ei, 1);
          p.combo++;
          p.comboTimer = 60;
          p.energy = Math.min(100, p.energy + 5);
        }
      }
    });
  });

  entities.enemies.forEach(e => {
    e.y += e.speed;
    if (rectIntersect(p.x, p.y, p.w, p.h, e.x, e.y, e.w, e.w)) {
      p.hp -= 1;
      screenShake = 10;
    }
  });

  entities.particles.forEach((pt, i) => {
    pt.x += pt.vx; pt.y += pt.vy; pt.life -= 0.02;
    if (pt.life <= 0) entities.particles.splice(i, 1);
  });

  if (p.comboTimer > 0) p.comboTimer--; else p.combo = 0;
  p.energy = Math.min(100, p.energy + 0.1);
  
  if (p.hp <= 0) location.reload();
}

// --- RENDER ---
function draw() {
  // Motion Blur effect
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  let sx = (Math.random() - 0.5) * screenShake;
  let sy = (Math.random() - 0.5) * screenShake;
  ctx.translate(sx, sy);

  // Draw Afterimages
  p.afterimages.forEach(a => {
    ctx.globalAlpha = a.life;
    ctx.fillStyle = "#0ff";
    ctx.fillRect(a.x, a.y, p.w, p.h);
  });
  ctx.globalAlpha = 1;

  // Laser Beam
  if (p.isLaser) {
    let grad = ctx.createLinearGradient(p.x + 15 - 25, 0, p.x + 15 + 25, 0);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(0.5, "white");
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.shadowBlur = 40;
    ctx.shadowColor = "cyan";
    ctx.fillRect(p.x + 15 - 30, 0, 60, p.y);
    
    ctx.fillStyle = "rgba(0, 255, 255, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Player
  ctx.shadowBlur = 15;
  ctx.shadowColor = p.combo > 10 ? "red" : "cyan";
  ctx.fillStyle = "white";
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = "cyan";
  ctx.strokeRect(p.x - 5, p.y - 5, p.w + 10, p.h + 10);

  // Entities
  entities.bullets.forEach(b => {
    ctx.fillStyle = b.c;
    ctx.fillRect(b.x, b.y, 6, 20);
  });

  entities.enemies.forEach(e => {
    ctx.shadowBlur = 10;
    ctx.shadowColor = e.c;
    ctx.fillStyle = e.c;
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.x + e.w, e.y);
    ctx.lineTo(e.x + e.w/2, e.y + e.w);
    ctx.fill();
  });

  entities.particles.forEach(pt => {
    ctx.globalAlpha = pt.life;
    ctx.fillStyle = pt.c;
    ctx.fillRect(pt.x, pt.y, pt.s, pt.s);
  });

  ctx.restore();

  // HUD
  ctx.shadowBlur = 0;
  ctx.font = "italic bold 30px Arial";
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.fillText("COMBO " + p.combo, 20, canvas.height - 50);

  // Bars
  ctx.fillStyle = "#222";
  ctx.fillRect(20, 20, 200, 10); // HP
  ctx.fillStyle = "red";
  ctx.fillRect(20, 20, p.hp * 2, 10);

  ctx.fillStyle = "#222";
  ctx.fillRect(20, 40, 200, 10); // Energy
  ctx.fillStyle = "#0ff";
  ctx.fillRect(20, 40, p.energy * 2, 10);
  
  if(p.energy >= 50) {
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText("READY [R] HYPER BEAM", 20, 70);
  }
}

function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
  return x2 < x1 + w1 && x2 + w2 > x1 && y2 < y1 + h1 && y2 + h2 > y1;
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
