const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 500;
canvas.height = 700;

// --- CONFIG & STATE ---
let player = {
  x: 250, y: 600, size: 20, speed: 6, hp: 100, maxHp: 100,
  energy: 100, maxEnergy: 100, shake: 0
};

let bullets = [];
let enemies = [];
let particles = [];
let boss = null;
let keys = {};
let freeze = false;
let frame = 0;

// --- INPUTS ---
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

document.addEventListener("keydown", e => {
  if (e.code === "Space") {
    bullets.push({ x: player.x + 8, y: player.y, dy: -10, color: "#fff" });
  }
  // TIME FREEZE (F)
  if (e.code === "KeyF" && player.energy >= 40) {
    freeze = true;
    player.energy -= 40;
    setTimeout(() => freeze = false, 1500);
  }
  // ULTIMATE NOVA (Q)
  if (e.code === "KeyQ" && player.energy >= 80) {
    player.energy -= 80;
    createExplosion(player.x, player.y, "#0ff", 50);
    enemies = []; // Clear all enemies
    player.shake = 20;
  }
});

// --- SYSTEMS ---
function createParticle(x, y, color) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      life: 1.0,
      color
    });
  }
}

function createExplosion(x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    createParticle(x, y, color);
  }
}

function spawnEnemy() {
  if (frame % 30 === 0 && !boss) {
    enemies.push({
      x: Math.random() * (canvas.width - 20),
      y: -30,
      size: 20 + Math.random() * 20,
      speed: 2 + Math.random() * 3,
      hp: 2
    });
  }
}

function spawnBoss() {
  boss = { x: 200, y: -100, size: 80, hp: 500, maxHp: 500, phase: 0 };
}

// --- UPDATE ---
function update() {
  frame++;
  
  // Shake recovery
  if (player.shake > 0) player.shake *= 0.9;

  // Movement (Clamped)
  if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
  if (keys["ArrowRight"] && player.x < canvas.width - player.size) player.x += player.speed;
  if (keys["ArrowUp"] && player.y > 0) player.y -= player.speed;
  if (keys["ArrowDown"] && player.y < canvas.height - player.size) player.y += player.speed;

  player.energy = Math.min(player.maxEnergy, player.energy + 0.3);

  // Bullets update
  bullets.forEach((b, i) => {
    b.y += b.dy;
    if (b.y < 0) bullets.splice(i, 1);
  });

  // Enemies update
  if (!freeze) {
    enemies.forEach((e, i) => {
      e.y += e.speed;
      if (e.y > canvas.height) enemies.splice(i, 1);

      // Collision with player
      if (rectIntersect(player.x, player.y, player.size, player.size, e.x, e.y, e.size, e.size)) {
        player.hp -= 20;
        player.shake = 15;
        createExplosion(e.x, e.y, "red");
        enemies.splice(i, 1);
      }
    });
  }

  // Boss Logic
  if (!boss && frame > 1000) spawnBoss();
  if (boss) {
    if (boss.y < 80) boss.y += 2; // Entrance
    boss.x += Math.sin(frame * 0.05) * 5;
    
    if (frame % 40 === 0) {
       enemies.push({ x: boss.x + boss.size/2, y: boss.y + boss.size, size: 15, speed: 5, hp: 1 });
    }
  }

  // Bullet Collisions
  bullets.forEach((b, bi) => {
    enemies.forEach((e, ei) => {
      if (rectIntersect(b.x, b.y, 5, 10, e.x, e.y, e.size, e.size)) {
        e.hp--;
        bullets.splice(bi, 1);
        if (e.hp <= 0) {
          createExplosion(e.x, e.y, "orange");
          enemies.splice(ei, 1);
        }
      }
    });

    if (boss && rectIntersect(b.x, b.y, 5, 10, boss.x, boss.y, boss.size, boss.size)) {
      boss.hp -= 2;
      player.shake = 2;
      bullets.splice(bi, 1);
      createParticle(b.x, b.y, "purple");
    }
  });

  // Particles update
  particles.forEach((p, i) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.02;
    if (p.life <= 0) particles.splice(i, 1);
  });

  spawnEnemy();

  if (player.hp <= 0) location.reload();
  if (boss && boss.hp <= 0) {
     createExplosion(boss.x + 40, boss.y + 40, "white", 100);
     boss = null;
     alert("MISSION ACCOMPLISHED");
  }
}

// --- DRAW ---
function draw() {
  // Screen Shake Effect
  let sx = (Math.random() - 0.5) * player.shake;
  let sy = (Math.random() - 0.5) * player.shake;
  
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(sx, sy);

  // Background Grid (Cyberpunk style)
  ctx.strokeStyle = "#111";
  for(let i=0; i<canvas.width; i+=50) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
  }

  // Draw Player (Neon)
  ctx.shadowBlur = 15;
  ctx.shadowColor = "cyan";
  ctx.fillStyle = "cyan";
  ctx.fillRect(player.x, player.y, player.size, player.size);

  // Draw Bullets
  ctx.shadowColor = "yellow";
  ctx.fillStyle = "yellow";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, 5, 12));

  // Draw Enemies
  ctx.shadowColor = "red";
  ctx.fillStyle = "#ff4444";
  enemies.forEach(e => ctx.fillRect(e.x, e.y, e.size, e.size));

  // Draw Particles
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 3, 3);
  });
  ctx.globalAlpha = 1.0;

  // Draw Boss
  if (boss) {
    ctx.shadowColor = "magenta";
    ctx.fillStyle = "purple";
    ctx.fillRect(boss.x, boss.y, boss.size, boss.size);
    // Boss HP Bar
    ctx.fillStyle = "#333";
    ctx.fillRect(100, 20, 300, 10);
    ctx.fillStyle = "magenta";
    ctx.fillRect(100, 20, (boss.hp / boss.maxHp) * 300, 10);
  }

  ctx.restore();

  // UI
  ctx.shadowBlur = 0;
  ctx.fillStyle = "white";
  ctx.font = "bold 16px Arial";
  ctx.fillText(`HP: ${player.hp}`, 20, 30);
  
  // Energy Bar
  ctx.fillStyle = "#222";
  ctx.fillRect(20, 45, 100, 10);
  ctx.fillStyle = "#0ff";
  ctx.fillRect(20, 45, player.energy, 10);
  ctx.fillText(`[F] FREEZE [Q] NOVA`, 20, 75);

  if (freeze) {
    ctx.fillStyle = "rgba(0, 255, 255, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
