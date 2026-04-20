const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 500;
canvas.height = 700;

// PLAYER
let player = {
  x: 230,
  y: 600,
  size: 20,
  speed: 5,
  hp: 100,
  energy: 100
};

// SYSTEM
let bullets = [];
let enemies = [];
let boss = null;
let keys = {};
let freeze = false;
let glitch = 0;

document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// SHOOT
document.addEventListener("keydown", e => {
  if (e.code === "Space") {
    bullets.push({ x: player.x+8, y: player.y, dy: -7 });
  }

  // FREEZE TIME
  if (e.code === "KeyF" && player.energy > 30) {
    freeze = true;
    player.energy -= 30;
    setTimeout(()=>freeze=false,2000);
  }

  // DASH
  if (e.code === "ShiftLeft" && player.energy > 10) {
    player.x += 40;
    player.energy -= 10;
  }
});

// ENEMY
function spawnEnemy(){
  enemies.push({
    x: Math.random()*480,
    y: -20,
    size: 20,
    speed: 2 + Math.random()*2
  });
}

// BOSS
function spawnBoss(){
  boss = {
    x: 200,
    y: 50,
    size: 60,
    hp: 200
  };
}

function bossAttack(){
  for(let i=0;i<6;i++){
    enemies.push({
      x: boss.x + Math.random()*60,
      y: boss.y,
      size: 10,
      speed: 4
    });
  }
}

// UPDATE
function update(){

  // MOVE
  if(keys["ArrowLeft"]) player.x -= player.speed;
  if(keys["ArrowRight"]) player.x += player.speed;

  // ENERGY REGEN
  player.energy = Math.min(100, player.energy+0.2);

  // BULLETS
  bullets.forEach(b => b.y += b.dy);

  // ENEMIES
  enemies.forEach(e=>{
    if(!freeze) e.y += e.speed;
  });

  // BOSS LOGIC
  if(boss){
    boss.x += Math.sin(Date.now()/300)*2;
    if(Math.random()<0.03) bossAttack();
  }

  // COLLISION ยิงโดน
  bullets.forEach((b,bi)=>{
    enemies.forEach((e,ei)=>{
      if(b.x < e.x+e.size && b.x+5 > e.x &&
         b.y < e.y+e.size && b.y+10 > e.y){
        enemies.splice(ei,1);
        bullets.splice(bi,1);
      }
    });

    if(boss){
      if(b.x < boss.x+boss.size && b.x+5 > boss.x &&
         b.y < boss.y+boss.size && b.y+10 > boss.y){
        boss.hp -= 2;
        bullets.splice(bi,1);
      }
    }
  });

  // ชนผู้เล่น
  enemies.forEach((e,ei)=>{
    if(player.x < e.x+e.size &&
       player.x+player.size > e.x &&
       player.y < e.y+e.size &&
       player.y+player.size > e.y){
        player.hp -= 10;
        enemies.splice(ei,1);
    }
  });

  // GAME OVER
  if(player.hp <= 0){
    alert("💀 GAME OVER");
    location.reload();
  }

  // BOSS SPAWN
  if(!boss && Math.random()<0.002){
    spawnBoss();
  }

  // BOSS DEAD
  if(boss && boss.hp <= 0){
    boss = null;
    alert("🔥 BOSS DEFEATED!");
  }

  // CLEAN
  bullets = bullets.filter(b=>b.y>0);
  enemies = enemies.filter(e=>e.y<canvas.height);
}

// DRAW
function draw(){
  ctx.fillStyle = "black";
  ctx.fillRect(0,0,500,700);

  // GLITCH
  if(Math.random()<0.05) glitch = 10;
  if(glitch>0){
    ctx.fillStyle="rgba(255,0,255,0.2)";
    ctx.fillRect(Math.random()*500,Math.random()*700,100,10);
    glitch--;
  }

  // PLAYER
  ctx.fillStyle = "cyan";
  ctx.fillRect(player.x, player.y, player.size, player.size);

  // BULLETS
  ctx.fillStyle = "yellow";
  bullets.forEach(b=>ctx.fillRect(b.x,b.y,5,10));

  // ENEMIES
  ctx.fillStyle = "red";
  enemies.forEach(e=>ctx.fillRect(e.x,e.y,e.size,e.size));

  // BOSS
  if(boss){
    ctx.fillStyle = "purple";
    ctx.fillRect(boss.x,boss.y,boss.size,boss.size);

    ctx.fillStyle = "white";
    ctx.fillText("BOSS HP: "+boss.hp,10,60);
  }

  // UI
  ctx.fillStyle = "#0ff";
  ctx.fillText("HP: "+player.hp,10,20);
  ctx.fillText("Energy: "+Math.floor(player.energy),10,40);
}

// LOOP
function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
