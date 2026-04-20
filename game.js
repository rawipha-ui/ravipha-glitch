const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = 600;
canvas.height = 800;

// --- SINGULARITY STATE ---
let p = {
  x: 300, y: 700, size: 40,
  hp: 100, maxHp: 100,
  energy: 100, maxEnergy: 100,
  isLaser: false, isShooting: false,
  dreadRadius: 100, afterimages: [],
  angle: 0
};

let entities = { bullets: [], enemies: [], particles: [], textVFX: [], damageNumbers: [] };
let keys = {};
let frame = 0;
let screenShake = 0;
let singularityPower = 0; // Combo power

// --- INPUTS ---
document.addEventListener("keydown", e => { keys[e.code] = true; if(e.code === "Space") p.isShooting = true; });
document.addEventListener("keyup", e => { keys[e.code] = false; if(e.code === "Space") p.isShooting = false; });

document.addEventListener("keydown", e => {
  // QUASAR BEAM (Key R)
  if (e.code === "KeyR" && p.energy >= 80) {
    p.isLaser = true;
    p.energy -= 80;
    screenShake = 60; // สั่นรุนแรง
    createExplosion(p.x, p.y - p.size, "white", 80, 25);
    setTimeout(() => p.isLaser = false, 3000);
  }
});

// --- FX ENGINE (EXTREME) ---
function createExplosion(x, y, color, count=20, speed=15, decay=0.02) {
  for (let i = 0; i < count; i++) {
    entities.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      life: 1.0, decay: decay + Math.random()*0.02,
      c: color, s: 2 + Math.random() * 8,
      blend: Math.random() > 0.3 ? "lighter" : "source-over",
      angle: Math.random() * Math.PI * 2,
      vA: (Math.random() - 0.5) * 0.2
    });
  }
}

function createTextVFX(x, y, text, color, font="bold 20px Courier New") {
    entities.textVFX.push({ x, y, text, color, font, life: 1.0, vy: -2 });
}

function createDamageNumber(x, y, damage, color) {
    entities.damageNumbers.push({ x, y, damage, color, life: 1.0, vy: -3, vx: (Math.random()-0.5)*2 });
}

// --- LOGIC ---
function update() {
  frame++;
  p.angle += 0.1; // ผู้เล่นหมุน
  if (screenShake > 0) screenShake *= 0.90;
  
  // Smooth Move
  if (keys["ArrowLeft"] && p.x > p.size) p.x -= 10;
  if (keys["ArrowRight"] && p.x < canvas.width - p.size) p.x += 10;
  
  // BLACK HOLE TRAIL
  if (frame % 2 === 0) {
    p.afterimages.push({ x: p.x, y: p.y, life: 0.7 });
    if (p.afterimages.length > 10) p.afterimages.shift();
  }

  // EVENT HORIZON GUN (Shooting)
  if (p.isShooting && frame % 3 === 0 && !p.isLaser) {
    let bulletColor = "rgba(100, 255, 255, 0.9)";
    entities.bullets.push({ x: p.x - 15, y: p.y - 15, dy: -25, c: bulletColor, w: 8, h: 40 }); // Left
    entities.bullets.push({ x: p.x + 15, y: p.y - 15, dy: -25, c: bulletColor, w: 8, h: 40 }); // Right
    p.energy = Math.max(0, p.energy - 0.3);
  }

  // QUASAR BEAM (Damage)
  if (p.isLaser) {
    entities.enemies.forEach(e => {
      if (Math.abs(e.x - p.x) < 50) {
        e.hp -= 12;
        createExplosion(e.x, e.y, "white", 3, 6);
        if (frame % 4 === 0) {
            createDamageNumber(e.x, e.y, 12, "magenta");
            if(Math.random()<0.3) createTextVFX(e.x, e.y, "DISINTEGRATE", "magenta", "bold 14px Courier New");
        }
      }
    });
  }

  // DREAD-AURA (Life Steal & Distortion)
  entities.enemies.forEach(e => {
      let dx = e.x - p.x;
      let dy = e.y - p.y;
      let dist = Math.sqrt(dx*dx + dy*dy);
      if(dist < p.dreadRadius) {
          e.hp -= 0.8;
          if(frame % 8 === 0) {
              p.hp = Math.min(p.maxHp, p.hp + 0.15);
              createExplosion(e.x, e.y, "red", 1, 2, 0.1);
          }
      }
  });

  // Enemy Spawn (Varied)
  if (frame % 12 === 0) {
    let r = Math.random();
    if(r > 0.90) { // TITAN DREADNOUGHT
        entities.enemies.push({ x: Math.random() * (canvas.width-120), y: -150, w: 120, h: 120, hp: 200, maxHp: 200, speed: 1.2, c: "#110000", sC: "#FFD700", type: "titan" });
    } else if (r > 0.6) { // PLASMA DRONE
        entities.enemies.push({ x: Math.random() * (canvas.width-60), y: -80, w: 60, h: 60, hp: 30, maxHp: 30, speed: 3.5, c: "#001122", sC: "#00FFFF", type: "plasma" });
    } else { // SWARM
        entities.enemies.push({ x: Math.random() * (canvas.width-30), y: -50, w: 30, h: 30, hp: 5, maxHp: 5, speed: 7, c: "#050505", sC: "#FF0044", type: "swarm" });
    }
  }

  // Move & Clean Entities
  updateEntities(entities.bullets);
  updateEntities(entities.enemies, true);
  updateEntities(entities.particles);
  updateEntities(entities.textVFX);
  updateEntities(entities.damageNumbers);

  // Collision: Bullet vs Enemy
  entities.bullets.forEach((b, bi) => {
    entities.enemies.forEach((e, ei) => {
      if (rectIntersect(b.x - b.w/2, b.y, b.w, b.h, e.x - e.w/2, e.y - e.h/2, e.w, e.h)) {
        e.hp -= 6;
        b.life = 0;
        createExplosion(b.x, b.y, "cyan", 6, 9);
        createDamageNumber(e.x, e.y, 6, "cyan");
        if (e.hp <= 0) {
          createExplosion(e.x, e.y, e.sC, e.type === "titan" ? 150 : 25, 14);
          entities.enemies.splice(ei, 1);
          p.energy = Math.min(p.maxEnergy, p.energy + (e.type === "titan" ? 40 : 3));
          singularityPower++;
          if(e.type === "titan") { screenShake = 30; createTextVFX(e.x, e.y, "TITAN ANNIHILATED", "#FFD700", "bold 24px Courier New"); }
        }
      }
    });
  });

  // Collision: Enemy vs Player
  entities.enemies.forEach((e, ei) => {
    if (rectIntersect(p.x - p.size/2, p.y - p.size/2, p.size, p.size, e.x - e.w/2, e.y - e.h/2, e.w, e.h)) {
      p.hp -= (e.type === "titan" ? 3 : 0.8);
      screenShake = 8;
      if(frame % 4 === 0) createExplosion(p.x, p.y, "red", 5, 7);
    }
  });

  p.energy = Math.min(p.maxEnergy, p.energy + 0.2);
  if (p.hp <= 0) { createExplosion(p.x, p.y, "white", 300, 40); setTimeout(()=>location.reload(), 1500); p.hp = 0.0001; }
}

function updateEntities(arr, isEnemy=false) {
    arr.forEach((item, i) => {
        if(isEnemy) {
            item.y += item.speed;
            if(item.hp <= 0) item.life = 0;
            if(item.y > canvas.height + 150) arr.splice(i, 1);
        } else if(item.dy) { // Bullet
            item.y += item.dy;
            if(item.y < -100 || item.life === 0) arr.splice(i, 1);
        } else if(item.damage) { // Damage Number
            item.y += item.vy; item.x += item.vx; item.life -= 0.02;
            if(item.life <= 0) arr.splice(i, 1);
        } else if(item.text) { // Text VFX
            item.y += item.vy; item.life -= 0.02;
            if(item.life <= 0) arr.splice(i, 1);
        } else { // Particle
            item.x += item.vx; item.y += item.vy;
            item.life -= item.decay;
            item.angle += item.vA;
            if(item.life <= 0) arr.splice(i, 1);
        }
    });
}

// --- RENDER (SINGULARITY VFX) ---
function draw() {
  // BG effect (Motion Blur & Aberration)
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Chromatic Aberration (ภาพเหลื่อมสี)
  if(frame % 3 === 0) {
      ctx.fillStyle = "rgba(255, 0, 0, 0.015)";
      ctx.fillRect(Math.random()*6-3, Math.random()*6-3, canvas.width, canvas.height);
  }

  ctx.save();
  // Screen Shake & Distort
  let sx = (Math.random() - 0.5) * screenShake;
  let sy = (Math.random() - 0.5) * screenShake;
  ctx.translate(sx, sy);
  
  if(p.isLaser) { // ภาพบิดเบี้ยว
      ctx.filter = "blur(1px)";
      let distort = Math.sin(frame*0.8)*8;
      ctx.translate(distort, distort/2);
  }

  // BLACK HOLE TRAIL
  p.afterimages.forEach(a => {
    ctx.globalAlpha = a.life * 0.4;
    ctx.fillStyle = "rgba(50, 255, 255, 0.5)";
    ctx.beginPath();
    ctx.arc(a.x, a.y, p.size/2, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.filter = "none";
  ctx.globalAlpha = 1;

  // DREAD-AURA (Event Horizon)
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(frame * 0.06);
  ctx.strokeStyle = p.hp < 30 ? "red" : "rgba(255, 0, 0, 0.4)";
  ctx.lineWidth = 4;
  ctx.shadowBlur = 20; ctx.shadowColor = "red";
  ctx.beginPath();
  ctx.arc(0, 0, p.dreadRadius + Math.sin(frame*0.15)*8, 0, Math.PI*2);
  ctx.stroke();
  // ขีดๆรอบวง
  for(let i=0; i<12; i++) {
      ctx.rotate(Math.PI/6);
      ctx.fillStyle = p.hp < 30 ? "red" : "rgba(255, 0, 0, 0.6)";
      ctx.fillRect(p.dreadRadius - 15, -3, 30, 6);
  }
  ctx.restore();

  // QUASAR BEAM (Extreme VFX)
  if (p.isLaser) {
    ctx.shadowBlur = 60; ctx.shadowColor = "magenta";
    ctx.globalCompositeOperation = "lighter";
    
    // Outer Beam
    ctx.fillStyle = "magenta";
    ctx.fillRect(p.x - 45, 0, 90, p.y - p.size/2);
    
    // Core Beam
    ctx.fillStyle = "white";
    ctx.fillRect(p.x - 25, 0, 50, p.y - p.size/2);
    
    // Core (Source)
    ctx.beginPath();
    ctx.arc(p.x, p.y - p.size/2, 50, 0, Math.PI*2);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
  }

  // Player (Black Hole Singularity)
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  
  ctx.shadowBlur = 30; ctx.shadowColor = "cyan";
  ctx.lineWidth = 3; ctx.strokeStyle = "cyan";
  ctx.beginPath(); ctx.arc(0, 0, p.size/2 + 5, 0, Math.PI*2); ctx.stroke(); // Outer ring
  
  ctx.rotate(-p.angle * 2);
  ctx.strokeStyle = p.isShooting ? "cyan" : "red";
  ctx.beginPath(); ctx.arc(0, 0, p.size/2 - 5, 0, Math.PI*2); ctx.stroke(); // Inner ring

  // BLACK HOLE (The Core)
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(0, 0, p.size/2 - 10, 0, Math.PI*2);
  ctx.fill();
  
  // ดวงตา (Glow)
  ctx.fillStyle = p.hp < 30 ? "red" : "white";
  ctx.beginPath(); ctx.arc(-10, -5, 6, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(10, -5, 6, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // Entities
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  entities.bullets.forEach(b => {
    ctx.shadowBlur = 20; ctx.shadowColor = b.c;
    ctx.fillStyle = b.c;
    ctx.fillRect(b.x - b.w/2, b.y, b.w, b.h);
  });
  
  entities.particles.forEach(pt => {
    ctx.globalAlpha = pt.life;
    ctx.globalCompositeOperation = pt.blend;
    ctx.fillStyle = pt.c;
    ctx.beginPath();
    // อนุภาคหมุน
    ctx.arc(pt.x, pt.y, pt.s, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.restore();

  entities.enemies.forEach(e => {
    ctx.shadowBlur = 20; ctx.shadowColor = e.sC;
    ctx.fillStyle = e.c;
    ctx.strokeStyle = e.sC;
    ctx.lineWidth = 3;
    // ทรงดิบๆ
    ctx.save();
    ctx.translate(e.x, e.y);
    if(e.type === "titan") {
        ctx.rotate(Math.PI);
        // Dreadnought shape
        ctx.beginPath(); ctx.moveTo(-e.w/2, -e.h/2); ctx.lineTo(e.w/2, -e.h/2); ctx.lineTo(e.w/2+20, e.h/2); ctx.lineTo(-e.w/2-20, e.h/2); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
        // Star shape/Polygon
        ctx.beginPath();
        for(let i=0; i<6; i++) {
            let angle = (i * Math.PI * 2) / 6;
            let r = i % 2 === 0 ? e.w/2 : e.w/4;
            ctx.lineTo(Math.cos(angle)*r, Math.sin(angle)*r);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // ออร่าพลาสม่า
    if(e.type === "plasma") {
        ctx.strokeStyle = "rgba(0, 255, 255, 0.3)";
        ctx.lineWidth = 10;
        ctx.stroke();
    }
    ctx.restore();
    
    // แถบเลือดศัตรู
    if(e.hp < e.maxHp) {
        ctx.fillStyle = "#333"; ctx.fillRect(e.x - e.w/2, e.y - e.h/2 - 15, e.w, 6);
        ctx.fillStyle = "red"; ctx.fillRect(e.x - e.w/2, e.y - e.h/2 - 15, (e.hp / e.maxHp) * e.w, 6);
    }
  });

  // Floating Damage Numbers
  entities.damageNumbers.forEach(dn => {
      ctx.globalAlpha = dn.life;
      ctx.fillStyle = dn.color;
      ctx.font = "italic bold 18px Courier New";
      ctx.fillText(dn.damage, dn.x, dn.y);
  });

  // Text VFX
  entities.textVFX.forEach(tf => {
      ctx.globalAlpha = tf.life;
      ctx.fillStyle = tf.color;
      ctx.font = tf.font;
      ctx.fillText(tf.text, tf.x - ctx.measureText(tf.text).width/2, tf.y);
  });

  ctx.restore(); // End Shake

  // HUD (Singularity Style)
  ctx.shadowBlur = 0;
  ctx.font = "bold 22px Courier New";
  
  // HP Bar (Red)
  ctx.fillStyle = "white"; ctx.fillText("HULL INTEGRITY", 20, 35);
  ctx.fillStyle = "#220000"; ctx.fillRect(20, 45, 250, 18);
  ctx.fillStyle = "red"; ctx.fillRect(20, 45, (p.hp/p.maxHp) * 250, 18);
  ctx.strokeStyle = "white"; ctx.lineWidth=1; ctx.strokeRect(20, 45, 250, 18);

  // Energy Bar (Cyan)
  ctx.fillStyle = "white"; ctx.fillText("POWER CORE", 20, 90);
  ctx.fillStyle = "#002222"; ctx.fillRect(20, 100, 250, 18);
  ctx.fillStyle = "cyan"; ctx.fillRect(20, 100, (p.energy/p.maxEnergy) * 250, 18);
  ctx.strokeRect(20, 100, 250, 18);
  
  if(p.energy >= 80) {
    ctx.fillStyle = "magenta";
    ctx.font = "bold 18px Courier New";
    ctx.fillText("[R] QUASAR BEAM READY", 20, 140);
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
