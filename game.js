const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 500;

const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const GROOVE_THRESHOLD = 100;

let gameState = 'menu';
let currentWorld = 1;
let score = 0;
let lives = 3;
let groove = 0;
let unlockedWorlds = 1;

const worlds = [
  { id: 1, name: 'Attention 梦幻草坪', member: 'Minji', bgColor: '#87ceeb', groundColor: '#7bc47f', theme: 'grass' },
  { id: 2, name: 'Hype Boy 海滩派对', member: 'Hanni', bgColor: '#00bfff', groundColor: '#f4a460', theme: 'beach' },
  { id: 3, name: 'Ditto/OMG 迷雾学院', member: 'Danielle', bgColor: '#b0c4de', groundColor: '#8b7355', theme: 'mist' },
  { id: 4, name: 'Super Shy 闪耀广场', member: 'Haerin', bgColor: '#e066ff', groundColor: '#ffd700', theme: 'disco' },
  { id: 5, name: 'How Sweet 赛博公路', member: 'Hyein', bgColor: '#1a1a2e', groundColor: '#4a4a6a', theme: 'cyber' }
];

const powerUps = [
  { type: 'binkyBong', emoji: '💡', color: '#ffd700', effect: 'grow' },
  { type: 'y2kCd', emoji: '💿', color: '#00bfff', effect: 'shoot' },
  { type: 'dittoCam', emoji: '📹', color: '#ff6b9d', effect: 'invincible' }
];

const enemies = [
  { type: 'cassette', emoji: '📼', speed: 2, health: 1 },
  { type: 'headphone', emoji: '🎧', speed: 3, health: 1 },
  { type: 'jellyfish', emoji: '🎐', speed: 1.5, health: 1 },
  { type: 'shadow', emoji: '👻', speed: 2.5, health: 2 }
];

class Player {
  constructor() {
    this.x = 50;
    this.y = canvas.height - 100;
    this.width = 40;
    this.height = 50;
    this.velocityX = 0;
    this.velocityY = 0;
    this.isJumping = false;
    this.isBig = false;
    this.hasShoot = false;
    this.isInvincible = false;
    this.direction = 1;
    this.frame = 0;
    this.frameCount = 0;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.scale(this.direction, 1);
    
    const size = this.isBig ? 1.5 : 1;
    ctx.scale(size, size);
    
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(0, -15, 12, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffb6c1';
    ctx.beginPath();
    ctx.ellipse(0, -8, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(-15, -5, 30, 35, 10);
    ctx.fill();
    
    ctx.fillStyle = '#4a90d9';
    ctx.fillRect(-12, 0, 24, 25);
    
    ctx.fillStyle = '#ff6b9d';
    ctx.beginPath();
    ctx.arc(-5, 8, 4, 0, Math.PI * 2);
    ctx.arc(5, 8, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(-5, 6, 2, 0, Math.PI * 2);
    ctx.arc(5, 6, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffb6c1';
    ctx.beginPath();
    ctx.arc(0, 12, 3, 0, Math.PI);
    ctx.fill();
    
    ctx.restore();
  }

  update(keys) {
    this.frameCount++;
    if (this.frameCount > 10) {
      this.frame = (this.frame + 1) % 4;
      this.frameCount = 0;
    }

    if (keys['ArrowLeft'] || keys['KeyA']) {
      this.velocityX = -5;
      this.direction = -1;
    } else if (keys['ArrowRight'] || keys['KeyD']) {
      this.velocityX = 5;
      this.direction = 1;
    } else {
      this.velocityX = 0;
    }

    if ((keys['ArrowUp'] || keys['KeyW'] || keys['Space']) && !this.isJumping) {
      this.velocityY = JUMP_FORCE;
      this.isJumping = true;
    }

    this.velocityY += GRAVITY;
    this.x += this.velocityX;
    this.y += this.velocityY;

    if (this.x < 0) this.x = 0;
    if (this.x > canvas.width - this.width) this.x = canvas.width - this.width;
    if (this.y > canvas.height - this.height - 40) {
      this.y = canvas.height - this.height - 40;
      this.velocityY = 0;
      this.isJumping = false;
    }
  }

  shoot() {
    if (this.hasShoot) {
      const bullet = new Bullet(this.x + this.width, this.y + this.height / 2, this.direction);
      bullets.push(bullet);
    }
  }
}

class Bullet {
  constructor(x, y, direction) {
    this.x = x;
    this.y = y;
    this.width = 15;
    this.height = 8;
    this.velocityX = 10 * direction;
    this.color = '#ff6b9d';
  }

  update() {
    this.x += this.velocityX;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, this.width, this.height, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x + 5 * (this.velocityX > 0 ? 1 : -1), this.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Platform {
  constructor(x, y, width, height, color = '#4a90d9') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    ctx.fillStyle = '#6ab7ff';
    ctx.fillRect(this.x, this.y, this.width, 5);
  }
}

class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.type = type;
    this.powerUp = powerUps.find(p => p.type === type);
    this.velocityY = 0;
    this.bobOffset = 0;
  }

  update() {
    this.bobOffset = Math.sin(Date.now() / 200) * 3;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2 + this.bobOffset);
    
    ctx.fillStyle = this.powerUp.color;
    ctx.beginPath();
    ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 8);
    ctx.fill();
    
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.powerUp.emoji, 0, 0);
    
    ctx.restore();
  }
}

class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 35;
    this.height = 35;
    this.type = type;
    this.enemy = enemies.find(e => e.type === type);
    this.velocityX = this.enemy.speed * (Math.random() > 0.5 ? 1 : -1);
    this.velocityY = 0;
    this.health = this.enemy.health;
    this.patrolStart = x;
    this.patrolRange = 100;
  }

  update() {
    this.x += this.velocityX;
    
    if (Math.abs(this.x - this.patrolStart) > this.patrolRange) {
      this.velocityX *= -1;
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    
    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.enemy.emoji, 0, 0);
    
    ctx.restore();
  }
}

class Note {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.bobOffset = 0;
    this.collected = false;
  }

  update() {
    this.bobOffset = Math.sin(Date.now() / 150) * 5;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2 + this.bobOffset);
    
    ctx.fillStyle = '#ff6b9d';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♪', 0, 0);
    
    ctx.restore();
  }
}

class Goal {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 80;
    this.flagWave = 0;
  }

  update() {
    this.flagWave = Math.sin(Date.now() / 100) * 5;
  }

  draw() {
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    ctx.fillStyle = '#ff6b9d';
    ctx.beginPath();
    ctx.moveTo(this.x + this.width, this.y + 10);
    ctx.lineTo(this.x + this.width + this.flagWave, this.y + 35);
    ctx.lineTo(this.x + this.width, this.y + 40);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('N', this.x + this.width / 2, this.y + this.height / 2);
  }
}

let player;
let platforms = [];
let activePowerUps = [];
let activeEnemies = [];
let bullets = [];
let notes = [];
let goal;
let keys = {};
let animationId;

function initWorld(worldId) {
  const world = worlds[worldId - 1];
  player = new Player();
  platforms = [];
  activePowerUps = [];
  activeEnemies = [];
  bullets = [];
  notes = [];
  
  if (worldId === 1) {
    platforms = [
      new Platform(0, canvas.height - 40, canvas.width, 40, '#7bc47f'),
      new Platform(100, 400, 120, 15),
      new Platform(280, 350, 100, 15),
      new Platform(450, 300, 130, 15),
      new Platform(350, 220, 100, 15),
      new Platform(550, 180, 120, 15),
      new Platform(700, 130, 80, 15)
    ];
    
    activeEnemies = [
      new Enemy(200, canvas.height - 75, 'cassette'),
      new Enemy(480, canvas.height - 75, 'headphone'),
      new Enemy(380, 205, 'cassette')
    ];
    
    activePowerUps = [
      new PowerUp(300, 315, 'binkyBong'),
      new PowerUp(570, 145, 'y2kCd')
    ];
    
    notes = [
      new Note(150, 380), new Note(320, 330), new Note(490, 280),
      new Note(380, 200), new Note(590, 160), new Note(730, 110)
    ];
    
    goal = new Goal(760, 90);
  } else if (worldId === 2) {
    platforms = [
      new Platform(0, canvas.height - 40, canvas.width, 40, '#f4a460'),
      new Platform(80, 420, 100, 15),
      new Platform(250, 380, 120, 15),
      new Platform(450, 340, 100, 15),
      new Platform(350, 260, 130, 15),
      new Platform(550, 220, 100, 15),
      new Platform(700, 180, 80, 15),
      new Platform(150, 480, 100, 15),
      new Platform(350, 500, 120, 15),
      new Platform(550, 480, 100, 15)
    ];
    
    activeEnemies = [
      new Enemy(200, canvas.height - 75, 'cassette'),
      new Enemy(480, canvas.height - 75, 'headphone'),
      new Enemy(380, 465, 'jellyfish'),
      new Enemy(580, 465, 'jellyfish')
    ];
    
    activePowerUps = [
      new PowerUp(290, 345, 'binkyBong'),
      new PowerUp(390, 230, 'y2kCd'),
      new PowerUp(720, 145, 'dittoCam')
    ];
    
    notes = [
      new Note(120, 400), new Note(290, 360), new Note(480, 320),
      new Note(390, 240), new Note(580, 200), new Note(730, 160),
      new Note(180, 460), new Note(400, 480)
    ];
    
    goal = new Goal(760, 140);
  } else if (worldId === 3) {
    platforms = [
      new Platform(0, canvas.height - 40, canvas.width, 40, '#8b7355'),
      new Platform(100, 400, 100, 15),
      new Platform(280, 350, 120, 15),
      new Platform(450, 300, 100, 15),
      new Platform(350, 240, 130, 15),
      new Platform(550, 180, 120, 15),
      new Platform(700, 140, 80, 15)
    ];
    
    activeEnemies = [
      new Enemy(200, canvas.height - 75, 'shadow'),
      new Enemy(480, canvas.height - 75, 'shadow'),
      new Enemy(380, 220, 'cassette')
    ];
    
    activePowerUps = [
      new PowerUp(320, 315, 'dittoCam'),
      new PowerUp(570, 145, 'binkyBong')
    ];
    
    notes = [
      new Note(140, 380), new Note(320, 330), new Note(490, 280),
      new Note(390, 220), new Note(590, 160), new Note(730, 120)
    ];
    
    goal = new Goal(760, 100);
  } else if (worldId === 4) {
    platforms = [
      new Platform(0, canvas.height - 40, canvas.width, 40, '#ffd700'),
      new Platform(80, 420, 80, 15),
      new Platform(220, 380, 100, 15),
      new Platform(400, 340, 80, 15),
      new Platform(320, 280, 120, 15),
      new Platform(520, 240, 100, 15),
      new Platform(680, 200, 100, 15),
      new Platform(500, 160, 80, 15)
    ];
    
    activeEnemies = [
      new Enemy(180, canvas.height - 75, 'headphone'),
      new Enemy(450, canvas.height - 75, 'cassette'),
      new Enemy(350, 260, 'shadow'),
      new Enemy(550, 220, 'headphone')
    ];
    
    activePowerUps = [
      new PowerUp(260, 345, 'y2kCd'),
      new PowerUp(550, 205, 'dittoCam'),
      new PowerUp(710, 165, 'binkyBong')
    ];
    
    notes = [
      new Note(110, 400), new Note(260, 360), new Note(430, 320),
      new Note(360, 260), new Note(560, 220), new Note(710, 180),
      new Note(530, 140)
    ];
    
    goal = new Goal(760, 120);
  } else if (worldId === 5) {
    platforms = [
      new Platform(0, canvas.height - 40, canvas.width, 40, '#4a4a6a'),
      new Platform(100, 400, 120, 15),
      new Platform(280, 350, 100, 15),
      new Platform(450, 300, 130, 15),
      new Platform(350, 220, 100, 15),
      new Platform(550, 180, 120, 15),
      new Platform(700, 130, 80, 15)
    ];
    
    activeEnemies = [
      new Enemy(200, canvas.height - 75, 'shadow'),
      new Enemy(480, canvas.height - 75, 'shadow'),
      new Enemy(380, 200, 'headphone'),
      new Enemy(580, 160, 'cassette')
    ];
    
    activePowerUps = [
      new PowerUp(320, 315, 'binkyBong'),
      new PowerUp(570, 145, 'y2kCd'),
      new PowerUp(720, 95, 'dittoCam')
    ];
    
    notes = [
      new Note(150, 380), new Note(320, 330), new Note(490, 280),
      new Note(380, 200), new Note(590, 160), new Note(730, 110)
    ];
    
    goal = new Goal(760, 90);
  }
}

function checkCollision(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
}

function update() {
  if (gameState !== 'playing') return;

  player.update(keys);

  if (player.y < 0) {
    resetPlayer();
  }

  bullets.forEach(bullet => {
    bullet.update();
    if (bullet.x < -50 || bullet.x > canvas.width + 50) {
      bullets = bullets.filter(b => b !== bullet);
    }
  });

  powerUps.forEach(powerUp => powerUp.update());
  enemies.forEach(enemy => enemy.update());
  notes.forEach(note => note.update());
  if (goal) goal.update();

  platforms.forEach(platform => {
    if (player.velocityY > 0 &&
        player.x + player.width > platform.x &&
        player.x < platform.x + platform.width &&
        player.y + player.height >= platform.y &&
        player.y + player.height <= platform.y + platform.height + 10) {
      player.y = platform.y - player.height;
      player.velocityY = 0;
      player.isJumping = false;
    }
  });

  bullets.forEach(bullet => {
    activeEnemies.forEach(enemy => {
      if (checkCollision(bullet, enemy)) {
        enemy.health--;
        bullets = bullets.filter(b => b !== bullet);
        if (enemy.health <= 0) {
          activeEnemies = activeEnemies.filter(e => e !== enemy);
          score += 50;
          groove += 10;
          updateGroove();
        }
      }
    });
  });

  activeEnemies.forEach(enemy => {
    if (checkCollision(player, enemy)) {
      if (!player.isInvincible) {
        lives--;
        updateLives();
        groove = Math.max(0, groove - 20);
        updateGroove();
        
        if (lives <= 0) {
          gameOver();
        } else {
          resetPlayer();
        }
      }
    }
    
    if (player.isJumping && player.velocityY > 0 && 
        player.y + player.height >= enemy.y &&
        player.y + player.height <= enemy.y + enemy.height + 20) {
      player.velocityY = -8;
      player.isJumping = true;
      enemy.health--;
      score += 30;
      groove += 15;
      updateGroove();
      
      if (enemy.health <= 0) {
        activeEnemies = activeEnemies.filter(e => e !== enemy);
      }
    }
  });

  activePowerUps.forEach(powerUp => {
    if (checkCollision(player, powerUp)) {
      applyPowerUp(powerUp.type);
      activePowerUps = activePowerUps.filter(p => p !== powerUp);
    }
  });

  notes.forEach(note => {
    if (!note.collected && checkCollision(player, note)) {
      note.collected = true;
      score += 10;
      groove += 5;
      updateGroove();
      
      if (score % 100 === 0) {
        lives++;
        updateLives();
      }
    }
  });

  notes = notes.filter(n => !n.collected);

  if (goal && checkCollision(player, goal)) {
    levelComplete();
  }

  updateScore();
}

function applyPowerUp(type) {
  switch(type) {
    case 'binkyBong':
      player.isBig = true;
      setTimeout(() => { player.isBig = false; }, 10000);
      break;
    case 'y2kCd':
      player.hasShoot = true;
      setTimeout(() => { player.hasShoot = false; }, 15000);
      break;
    case 'dittoCam':
      player.isInvincible = true;
      setTimeout(() => { player.isInvincible = false; }, 8000);
      break;
  }
}

function resetPlayer() {
  player.x = 50;
  player.y = canvas.height - 100;
  player.velocityX = 0;
  player.velocityY = 0;
  player.isJumping = false;
}

function updateScore() {
  document.getElementById('score').textContent = score;
}

function updateLives() {
  document.getElementById('lives').textContent = lives;
}

function updateGroove() {
  const groovePercent = Math.min(100, groove);
  document.getElementById('groove-fill').style.width = `${groovePercent}%`;
  document.getElementById('groove-text').textContent = `Groove: ${groovePercent}%`;
  
  if (groove >= GROOVE_THRESHOLD) {
    document.getElementById('groove-text').textContent = 'Full Track! 🎵';
  }
}

function draw() {
  if (gameState !== 'playing') return;

  const world = worlds[currentWorld - 1];
  ctx.fillStyle = world.bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (world.theme === 'beach') {
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
    ctx.fillStyle = '#f4a460';
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
  } else if (world.theme === 'mist') {
    ctx.fillStyle = '#d3d3d3';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.1 + i * 0.05})`;
      ctx.fillRect(0, i * 100, canvas.width, 100);
    }
  } else if (world.theme === 'disco') {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 20; i++) {
      const x = (Date.now() / 500 + i * 100) % canvas.width;
      const y = (Date.now() / 700 + i * 80) % canvas.height;
      ctx.fillStyle = `hsl(${i * 18}, 100%, 60%)`;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (world.theme === 'cyber') {
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }
  }

  platforms.forEach(platform => platform.draw());
  activePowerUps.forEach(powerUp => powerUp.draw());
  activeEnemies.forEach(enemy => enemy.draw());
  notes.forEach(note => note.draw());
  bullets.forEach(bullet => bullet.draw());
  
  if (goal) goal.draw();
  
  player.draw();
}

function gameLoop() {
  update();
  draw();
  animationId = requestAnimationFrame(gameLoop);
}

function gameOver() {
  gameState = 'gameover';
  document.getElementById('final-score-value').textContent = score;
  document.getElementById('game-over-screen').classList.add('active');
  document.getElementById('game-screen').classList.remove('active');
}

function levelComplete() {
  gameState = 'levelcomplete';
  document.getElementById('level-score-value').textContent = score;
  
  if (currentWorld < worlds.length) {
    unlockedWorlds = Math.max(unlockedWorlds, currentWorld + 1);
    document.querySelector(`.world-card[data-world="${currentWorld + 1}"]`).classList.add('unlocked');
    document.getElementById('unlock-message').textContent = `🎉 解锁下一关: ${worlds[currentWorld].name}`;
  } else {
    document.getElementById('unlock-message').textContent = '🎊 恭喜通关！NewJeans 已全部救出！';
  }
  
  document.getElementById('level-complete-screen').classList.add('active');
  document.getElementById('game-screen').classList.remove('active');
}

function startGame(worldId = 1) {
  currentWorld = worldId;
  score = 0;
  lives = 3;
  groove = 0;
  
  updateScore();
  updateLives();
  updateGroove();
  
  initWorld(worldId);
  
  gameState = 'playing';
  document.getElementById('game-screen').classList.add('active');
  document.getElementById('start-screen').classList.remove('active');
  document.getElementById('world-select-screen').classList.remove('active');
  document.getElementById('pause-screen').classList.remove('active');
  document.getElementById('game-over-screen').classList.remove('active');
  document.getElementById('level-complete-screen').classList.remove('active');
}

document.getElementById('start-btn').addEventListener('click', () => {
  startGame(1);
});

document.getElementById('world-select-btn').addEventListener('click', () => {
  document.getElementById('world-select-screen').classList.add('active');
  document.getElementById('start-screen').classList.remove('active');
});

document.getElementById('back-btn').addEventListener('click', () => {
  document.getElementById('start-screen').classList.add('active');
  document.getElementById('world-select-screen').classList.remove('active');
});

document.querySelectorAll('.world-card.unlocked').forEach(card => {
  card.addEventListener('click', () => {
    const worldId = parseInt(card.dataset.world);
    startGame(worldId);
  });
});

document.getElementById('resume-btn').addEventListener('click', () => {
  gameState = 'playing';
  document.getElementById('pause-screen').classList.remove('active');
  document.getElementById('game-screen').classList.add('active');
});

document.getElementById('quit-btn').addEventListener('click', () => {
  document.getElementById('pause-screen').classList.remove('active');
  document.getElementById('start-screen').classList.add('active');
});

document.getElementById('restart-btn').addEventListener('click', () => {
  startGame(currentWorld);
});

document.getElementById('menu-btn').addEventListener('click', () => {
  document.getElementById('game-over-screen').classList.remove('active');
  document.getElementById('start-screen').classList.add('active');
});

document.getElementById('menu-btn2').addEventListener('click', () => {
  document.getElementById('level-complete-screen').classList.remove('active');
  document.getElementById('start-screen').classList.add('active');
});

document.getElementById('next-level-btn').addEventListener('click', () => {
  if (currentWorld < worlds.length) {
    startGame(currentWorld + 1);
  } else {
    document.getElementById('level-complete-screen').classList.remove('active');
    document.getElementById('start-screen').classList.add('active');
  }
});

document.getElementById('left-btn').addEventListener('touchstart', () => { keys['ArrowLeft'] = true; });
document.getElementById('left-btn').addEventListener('touchend', () => { keys['ArrowLeft'] = false; });
document.getElementById('right-btn').addEventListener('touchstart', () => { keys['ArrowRight'] = true; });
document.getElementById('right-btn').addEventListener('touchend', () => { keys['ArrowRight'] = false; });
document.getElementById('jump-btn').addEventListener('touchstart', () => { keys['Space'] = true; });
document.getElementById('jump-btn').addEventListener('touchend', () => { keys['Space'] = false; });

document.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyP' && gameState === 'playing') {
    gameState = 'paused';
    document.getElementById('pause-screen').classList.add('active');
    document.getElementById('game-screen').classList.remove('active');
  } else if (e.code === 'KeyP' && gameState === 'paused') {
    gameState = 'playing';
    document.getElementById('pause-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

gameLoop();
