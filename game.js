const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = 600; // ขยายจอเล็กน้อย
canvas.height = 800;

// --- APOCALYPSE STATE ---
let p = {
  x: 300, y: 700, w: 35, h: 35,
  hp: 100, maxHp: 100,
  energy: 100, maxEnergy: 100,
  isLaser: false, isShooting: false,
  dreadRadius: 80, afterimages: []
};

let entities = { bullets: [], enemies: [], particles: [], textVFX: [] };
let keys = {};
let frame = 0;
let screenShake = 0;

// --- INPUTS ---
document.addEventListener("keydown", e => { keys[e.code] = true; if(e.code === "Space") p.isShooting = true; });
document.addEventListener("keyup", e => { keys[e.code] = false; if(e.code === "Space") p.isShooting = false; });

document.addEventListener("keydown", e => {
  // CATACLYSM LASER (Key R)
  if (e.code === "KeyR" && p.energy >= 70) {
    p.isLaser = true;
    p.energy -= 70;
    screenShake = 40; // สั่นหนักมาก
    createExplosion(p.x + p.w/2, p.y - 100, "white", 50, 20); // เอฟเฟกต์ต้นลำแสง
    setTimeout(() => p.isLaser = false, 2500);
  }
});

// --- FX ENGINE (EXTREME) ---
function createExplosion(x, y, color, count=20, speed=15) {
  for (let i = 0; i < count; i++) {
    entities.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      life: 1.0, decay: 0.01 + Math.random()*0.02,
      c: color, s: 2 + Math.random() * 6,
      blend: Math.random() > 0.5 ? "lighter" : "source-over"
    });
  }
}

function createTextVFX(x, y, text, color) {
    entities.textVFX.push({ x, y, text, color, life: 1.0, vy: -2 });
}

// --- LOGIC ---
function update() {
  frame++;
  if (screenShake > 0) screenShake *= 0.92;
  
  // Smooth Move
  if (keys["ArrowLeft"] && p.x > 0) p.x -= 9;
  if (keys["ArrowRight"] && p.x < canvas.width - p.w) p.x += 9;
  
  // Afterimage Trail
  if (frame % 3 === 0) {
    p.afterimages.push({ x: p.x, y: p.y, life: 0.6 });
    if (p.afterimages.length > 8) p.afterimages.shift();
  }

  // ABYSSAL SPLITTER (Shooting)
  if (p.isShooting && frame % 4 === 0 && !p.isLaser) {
    let bulletColor = "rgba(0, 255, 255, 0.8)";
    entities.bullets.push({ x: p.x + 5, y: p.y, dy: -20, c: bulletColor, w: 5, h: 30 }); // Left
    entities.bullets.push({ x: p.x + p.w - 10, y: p.y, dy: -20, c: bulletColor, w: 5, h: 30 }); // Right
    p.energy = Math.max(0, p.energy - 0.2); // ใช้พลังงานนิดหน่อยเวลายิง
  }

  // CATACLYSM LASER (Damage)
  if (p.isLaser) {
    entities.enemies.forEach(e => {
      if (e.x + e.w > p.x - 30 && e.x < p.x + p.w + 30) {
        e.hp -= 8;
        createExplosion(e.x + e.w/2, e.y + e.h/2, "white", 2, 5);
        if (frame % 5 === 0) createTextVFX(e.x, e.y, "BURN", "magenta");
      }
    });
  }

  // DREAD-AURA (Life Steal)
  entities.enemies.forEach(e => {
      let dx = (e.x + e.w/2) - (p.x + p.w/2);
      let dy = (e.y + e.h/2) - (p.y + p.h/2);
      let dist = Math.sqrt(dx*dx + dy*dy);
      if(dist < p.dreadRadius) {
          e.hp -= 0.5; // ดาเมจต่อเนื่อง
          if(frame % 10 === 0) {
              p.hp = Math.min(p.maxHp, p.hp + 0.1); // ดูดเลือด
              entities.particles.push({ // เอฟเฟกต์ดูดพลัง
                  x: e.x + e.w/2, y: e.y + e.h/2,
                  vx: -dx * 0.1, vy: -dy * 0.1, // วิ่งเข้าหาผู้เล่น
                  life: 1.0, decay: 0.05, c: "red", s: 4, blend: "lighter"
              });
          }
      }
  });

  // Enemy Spawn (Varied)
  if (frame % 15 === 0) {
    let r = Math.random();
    if(r > 0.92) { // TITAN CLASS
        entities.enemies.push({ x: Math.random() * (canvas.width-80), y: -100, w: 80, h: 80, hp: 150, speed: 1.5, c: "#220000", sC: "red", type: "titan" });
    } else if (r > 0.7) { // ARMORED
        entities.enemies.push({ x: Math.random() * (canvas.width-40), y: -50, w: 40, h: 40, hp: 20, speed: 3, c: "#444", sC: "#ffaa00", type: "armor" });
    } else { // SWARM
        entities.enemies.push({ x: Math.random() * (canvas.width-20), y: -30, w: 20, h: 20, hp: 3, speed: 6, c: "#111", sC: "#ff0044", type: "swarm" });
    }
  }

  // Move & Clean Entities
  updateEntities(entities.bullets);
  updateEntities(entities.enemies, true);
  updateEntities(entities.particles);
  updateEntities(entities.textVFX);

  // Collision: Bullet vs Enemy
  entities.bullets.forEach((b, bi) => {
    entities.enemies.forEach((e, ei) => {
      if (rectIntersect(b.x, b.y, b.w, b.h, e.x, e.y, e.w, e.h)) {
        e.hp -= 5;
        b.life = 0; // Destroy bullet
        createExplosion(b.x, b.y, "cyan", 5, 8);
        if (e.hp <= 0) {
          createExplosion(e.x + e.w/2, e.y + e.h/2, e.sC, e.type === "titan" ? 100 : 15, 12);
          entities.enemies.splice(ei, 1);
          p.energy = Math.min(p.maxEnergy, p.energy + (e.type === "titan" ? 30 : 2));
          if(e.type === "titan") { screenShake = 20; createTextVFX(e.x, e.y, "TITAN SLAIN", "red"); }
        }
      }
    });
  });

  // Collision: Enemy vs Player
  entities.enemies.forEach((e, ei) => {
    if (rectIntersect(p.x, p.y, p.w, p.h, e.x, e.y, e.w, e.h)) {
      p.hp -= (e.type === "titan" ? 2 : 0.5);
      screenShake = 5;
      if(frame % 5 === 0) createExplosion(p.x + p.w/2, p.y + p.h/2, "red", 3, 5);
    }
  });

  p.energy = Math.min(p.maxEnergy, p.energy + 0.15);
  if (p.hp <= 0) { createExplosion(p.x, p.y, "white", 200, 30); setTimeout(()=>location.reload(), 1000); p.hp = 0.0001; }
}

function updateEntities(arr, isEnemy=false) {
    arr.forEach((item, i) => {
        if(isEnemy) {
            item.y += item.speed;
            if(item.hp <= 0) item.life = 0;
            if(item.y > canvas.height + 100) arr.splice(i, 1);
        } else if(item.dy) { // Bullet
            item.y += item.dy;
            if(item.y < -50 || item.life === 0) arr.splice(i, 1);
        } else if(item.text) { // Text VFX
            item.y += item.vy; item.life -= 0.02;
            if(item.life <= 0) arr.splice(i, 1);
        } else { // Particle
            item.x += item.vx; item.y += item.vy;
            item.life -= item.decay;
            if(item.life <= 0) arr.splice(i, 1);
        }
    });
}

// --- RENDER (APOCALYPSE VFX) ---
function draw() {
  // Chromatic Aberration BG effect (สร้างภาพหลอนสีเหลื่อม)
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  if(frame % 2 === 0) { // สีเหลื่อมสีแดง
      ctx.fillStyle = "rgba(255, 0, 0, 0.01)";
      ctx.fillRect(Math.random()*5-2.5, Math.random()*5-2.5, canvas.width, canvas.height);
  }

  ctx.save();
  // Screen Shake & Distort
  let sx = (Math.random() - 0.5) * screenShake;
  let sy = (Math.random() - 0.5) * screenShake;
  ctx.translate(sx, sy);
  
  if(p.isLaser) { // ภาพบิดเบี้ยวตอนยิงเลเซอร์
      let distort = Math.sin(frame*0.5)*5;
      ctx.translate(distort, 0);
  }

  // Draw Afterimages (เงาตามตัว)
  p.afterimages.forEach(a => {
    ctx.globalAlpha = a.life * 0.5;
    ctx.fillStyle = "rgba(0, 255, 255, 0.5)";
    ctx.fillRect(a.x, a.y, p.w, p.h);
  });
  ctx.globalAlpha = 1;

  // DREAD-AURA (วงแหวนเวทย์)
  ctx.save();
  ctx.translate(p.x + p.w/2, p.y + p.h/2);
  ctx.rotate(frame * 0.05);
  ctx.strokeStyle = p.hp < 30 ? "red" : "rgba(255, 0, 0, 0.3)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, p.dreadRadius + Math.sin(frame*0.1)*5, 0, Math.PI*2);
  ctx.stroke();
  // ขีดๆรอบวง
  for(let i=0; i<8; i++) {
      ctx.rotate(Math.PI/4);
      ctx.fillStyle = "red";
      ctx.fillRect(p.dreadRadius - 10, -2, 20, 4);
  }
  ctx.restore();

  // CATACLYSM LASER (VFX)
  if (p.isLaser) {
    ctx.shadowBlur = 50;
    ctx.shadowColor = "magenta";
    
    // Core (White)
    ctx.fillStyle = "white";
    ctx.fillRect(p.x + p.w/2 - 20, 0, 40, p.y);
    
    // Outer (Magenta)
    ctx.globalCompositeOperation = "lighter"; // ทำให้เรืองแสงจ้า
    ctx.fillStyle = "magenta";
    ctx.fillRect(p.x + p.w/2 - 35, 0, 70, p.y);
    ctx.globalCompositeOperation = "source-over";
  }

  // Player
  ctx.shadowBlur = 20;
  ctx.shadowColor = p.isShooting ? "cyan" : "red";
  ctx.fillStyle = "#111";
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = p.isShooting ? "cyan" : "red";
  ctx.lineWidth = 2;
  ctx.strokeRect(p.x, p.y, p.w, p.h);
  // Eyes
  ctx.fillStyle = p.hp < 30 ? "red" : "white";
  ctx.fillRect(p.x+8, p.y+8, 6, 6);
  ctx.fillRect(p.x+p.w-14, p.y+8, 6, 6);

  // Entities
  ctx.save();
  ctx.globalCompositeOperation = "lighter"; // ทำให้กระสุนและพาร์ทิเคิลเรืองแสง
  entities.bullets.forEach(b => {
    ctx.shadowBlur = 15; ctx.shadowColor = b.c;
    ctx.fillStyle = b.c;
    ctx.fillRect(b.x, b.y, b.w, b.h);
  });
  
  entities.particles.forEach(pt => {
    ctx.globalAlpha = pt.life;
    ctx.globalCompositeOperation = pt.blend;
    ctx.fillStyle = pt.c;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.s, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.restore();

  entities.enemies.forEach(e => {
    ctx.shadowBlur = 15; ctx.shadowColor = e.sC;
    ctx.fillStyle = e.c;
    ctx.strokeStyle = e.sC;
    ctx.lineWidth = 2;
    // ทรงสามเหลี่ยมคว่ำแบบดิบๆ
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.x + e.w, e.y);
    ctx.lineTo(e.x + e.w/2, e.y + e.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // แถบเลือดศัตรู (ถ้าเลือดลด)
    if(e.hp < 150) {
        ctx.fillStyle = "#333"; ctx.fillRect(e.x, e.y - 10, e.w, 4);
        ctx.fillStyle = "red"; ctx.fillRect(e.x, e.y - 10, (e.hp / (e.type==="titan"?150:e.type==="armor"?20:3)) * e.w, 4);
    }
  });

  // Text VFX
  entities.textVFX.forEach(tf => {
      ctx.globalAlpha = tf.life;
      ctx.fillStyle = tf.color;
      ctx.font = "bold 20px Courier New";
      ctx.fillText(tf.text, tf.x, tf.y);
  });

  ctx.restore(); // End Shake

  // HUD (Minimal & Apocalypse Style)
  ctx.shadowBlur = 0;
  ctx.font = "bold 20px Courier New";
  
  // HP Bar (Red)
  ctx.fillStyle = "white"; ctx.fillText("HULL", 20, 30);
  ctx.fillStyle = "#220000"; ctx.fillRect(20, 35, 200, 15);
  ctx.fillStyle = "red"; ctx.fillRect(20, 35, (p.hp/p.maxHp) * 200, 15);

  // Energy Bar (Cyan)
  ctx.fillStyle = "white"; ctx.fillText("POWER", 20, 70);
  ctx.fillStyle = "#002222"; ctx.fillRect(20, 75, 200, 15);
  ctx.fillStyle = "cyan"; ctx.fillRect(20, 75, (p.energy/p.maxEnergy) * 200, 15);
  
  if(p.energy >= 70) {
    ctx.fillStyle = "magenta";
    ctx.font = "bold 16px Courier New";
    ctx.fillText("[R] CATACLYSM READY", 20, 110);
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
