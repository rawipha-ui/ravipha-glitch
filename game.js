const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = 500;
canvas.height = 700;

let p = { x: 250, y: 600, hp: 100, energy: 100 };
let entities = { bullets: [], enemies: [], particles: [] };
let frame = 0;

function update() {
    frame++;
    // 1. จำกัดจำนวนอนุภาคไม่ให้เกิน 100 ตัวเพื่อความลื่น
    if (entities.particles.length > 100) entities.particles.splice(0, 10);
    
    // ... (ระบบ update อื่นๆ เหมือนเดิม)
}

function draw() {
    // 2. ใช้เทคนิค Motion Blur แบบประหยัด (ไม่ใช้ filter)
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. วาดผู้เล่น (ใช้ shadowBlur แค่จุดเดียว)
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#0ff";
    ctx.fillStyle = "#fff";
    ctx.fillRect(p.x, p.y, 30, 30);
    ctx.restore();

    // 4. วาดกระสุน (ไม่ใช้ shadowBlur แต่ใช้วาดซ้อนกัน 2 ชั้นแทน)
    entities.bullets.forEach(b => {
        ctx.fillStyle = "#0ff"; // ชั้นนอก
        ctx.fillRect(b.x-2, b.y, 8, 15);
        ctx.fillStyle = "#fff"; // แกนใน
        ctx.fillRect(b.x, b.y, 4, 15);
    });
    
    // 5. วาดพาร์ทิเคิลแบบง่าย
    ctx.globalCompositeOperation = "lighter";
    entities.particles.forEach(pt => {
        ctx.fillStyle = pt.c;
        ctx.fillRect(pt.x, pt.y, pt.s, pt.s);
    });
    ctx.globalCompositeOperation = "source-over";
}
