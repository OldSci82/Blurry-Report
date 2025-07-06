const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const gameOverDisplay = document.getElementById("gameOver");
const startMessage = document.getElementById("startMessage");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const shootBtn = document.getElementById("shootBtn");
const waveMessage = document.createElement("div");
waveMessage.id = "waveMessage";
document.getElementById("gameContainer").appendChild(waveMessage);

// Load images
const fighterImages = {};
for (let i = 1; i <= 5; i++) {
  fighterImages[`space-fighter${i}.png`] = new Image();
  fighterImages[
    `space-fighter${i}.png`
  ].src = `../images/space-fighter${i}.png`;
}
const ufoImages = {};
for (let i = 1; i <= 9; i++) {
  ufoImages[`UFOs-${i}.png`] = new Image();
  ufoImages[`UFOs-${i}.png`].src = `../images/UFOs-${i}.png`;
}
const bossImages = {};
for (let i = 1; i <= 2; i++) {
  bossImages[`UFOs-boss${i}.png`] = new Image();
  bossImages[`UFOs-boss${i}.png`].src = `../images/UFOs-boss${i}.png`;
}

// Game state
let score = 0;
let gameOver = false;
let gameStarted = false;
let player = {
  x: 200,
  y: 560, // Adjusted from 550 to avoid early bullet hits
  width: 78,
  height: 38,
  hitWidth: 62,
  hitHeight: 30,
  speed: 4,
  image:
    fighterImages[
      localStorage.getItem("selectedFighter") || "space-fighter1.png"
    ],
  invincible: false,
  invincibleStart: 0,
};
let bullets = [];
let enemyBullets = [];
let enemies = [];
let touchState = { left: false, right: false, shoot: false };
let keys = {};
let wave = 1;
let waveCycle = 0;
let baseEnemySpeed = 1.5;
let isBossWave = false;
let waveTransition = false;
let waveTransitionStart = 0;

// Input handling: Touch controls
leftBtn.addEventListener("touchstart", () => {
  touchState.left = true;
});
leftBtn.addEventListener("touchend", () => {
  touchState.left = false;
});
rightBtn.addEventListener("touchstart", () => {
  touchState.right = true;
});
rightBtn.addEventListener("touchend", () => {
  touchState.right = false;
});
shootBtn.addEventListener("touchstart", () => {
  touchState.shoot = true;
});
shootBtn.addEventListener("touchend", () => {
  touchState.shoot = false;
});

// Input handling: Keyboard controls
document.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "Space" && !gameStarted && !gameOver) {
    gameStarted = true;
    startMessage.style.display = "none";
    player.invincible = true;
    player.invincibleStart = Date.now();
    spawnEnemies();
  }
  if (e.code === "KeyR" && gameOver) {
    resetGame();
  }
});
document.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

// Input handling: Canvas tap for start/restart
canvas.addEventListener("touchstart", () => {
  if (!gameStarted && !gameOver) {
    gameStarted = true;
    startMessage.style.display = "none";
    player.invincible = true;
    player.invincibleStart = Date.now();
    spawnEnemies();
  }
  if (gameOver) {
    resetGame();
  }
});

// Player movement and shooting
function updatePlayer() {
  if (player.invincible && Date.now() - player.invincibleStart > 2000) {
    player.invincible = false;
  }
  if (touchState.left && player.x > 0) player.x -= player.speed;
  if (touchState.right && player.x < canvas.width - player.width)
    player.x += player.speed;
  if (touchState.shoot && gameStarted && !gameOver && !waveTransition) {
    if (!player.lastShot || Date.now() - player.lastShot > 300) {
      bullets.push({
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 8,
        speed: -6,
      });
      player.lastShot = Date.now();
    }
  }
  if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
  if (keys["ArrowRight"] && player.x < canvas.width - player.width)
    player.x += player.speed;
  if (keys["Space"] && gameStarted && !gameOver && !waveTransition) {
    if (!player.lastShot || Date.now() - player.lastShot > 300) {
      bullets.push({
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 8,
        speed: -6,
      });
      player.lastShot = Date.now();
    }
  }
}

// Bullet movement
function updateBullets() {
  bullets = bullets.filter((bullet) => bullet.y > 0);
  bullets.forEach((bullet) => {
    bullet.y += bullet.speed;
  });
  enemyBullets = enemyBullets.filter((bullet) => bullet.y < canvas.height);
  enemyBullets.forEach((bullet) => {
    bullet.y += bullet.speed;
  });
}

// Enemy spawning
function spawnEnemies() {
  enemies = [];
  const currentSpeed = baseEnemySpeed * (1 + waveCycle * 0.1);
  const shooterCount = waveCycle > 0 ? Math.min(waveCycle, 3) : 0;
  if (isBossWave) {
    const bossImage =
      bossImages[`UFOs-boss${Math.floor(Math.random() * 2) + 1}.png`];
    enemies.push({
      x: canvas.width / 2 - 61,
      y: 50,
      width: 122,
      height: 78,
      hitWidth: 97,
      hitHeight: 62,
      speed: 0.8,
      direction: 1,
      hits: 10 + waveCycle * 5,
      image: bossImage,
      isShooter: true,
      lastShot: 0,
      shootInterval: 2000 - waveCycle * 200,
    });
  } else {
    const nonShooterImage =
      ufoImages[`UFOs-${Math.floor(Math.random() * 8) + 1}.png`];
    const shooterImage = ufoImages["UFOs-9.png"];
    let shootersPlaced = 0;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 2; j++) {
        const isShooter = shootersPlaced < shooterCount && Math.random() < 0.5;
        enemies.push({
          x: 50 + i * 90, // Adjusted from 110 to keep within 400px
          y: 50 + j * 60,
          width: 61,
          height: 35,
          hitWidth: 48,
          hitHeight: 28,
          speed: currentSpeed,
          direction: 1,
          hits: 1,
          image: isShooter ? shooterImage : nonShooterImage,
          isShooter: isShooter,
          lastShot: 0,
          shootInterval: 3000,
        });
        if (isShooter) shootersPlaced++;
      }
    }
    while (shootersPlaced < shooterCount) {
      const index = Math.floor(Math.random() * enemies.length);
      if (!enemies[index].isShooter) {
        enemies[index].isShooter = true;
        enemies[index].image = shooterImage;
        enemies[index].lastShot = 0;
        enemies[index].shootInterval = 3000;
        shootersPlaced++;
      }
    }
  }
}

function updateEnemies() {
  if (waveTransition) {
    if (Date.now() - waveTransitionStart > 3000) {
      waveTransition = false;
      waveMessage.style.display = "none";
      spawnEnemies();
    }
    return;
  }
  enemies.forEach((enemy) => {
    enemy.x += enemy.speed * enemy.direction;
    if (enemy.x <= 0 || enemy.x >= canvas.width - enemy.width) {
      enemy.direction *= -1;
      enemy.y += 40;
    }
    if (enemy.y >= canvas.height - 50) {
      gameOver = true;
      gameOverDisplay.textContent =
        "Game Over!\nEnemies Reached Base!\nTap or Press R to Restart";
      gameOverDisplay.style.display = "block";
    }
    if (enemy.isShooter && gameStarted && !gameOver && !waveTransition) {
      if (
        !enemy.lastShot ||
        Date.now() - enemy.lastShot > enemy.shootInterval
      ) {
        enemyBullets.push({
          x: enemy.x + enemy.width / 2 - 2.5,
          y: enemy.y + enemy.height,
          width: 5,
          height: 10,
          speed: 5,
        });
        enemy.lastShot = Date.now();
      }
    }
  });
  if (enemies.length === 0 && !gameOver) {
    wave++;
    waveMessage.textContent =
      wave > 3 ? "That's a BIG ship!" : "Warning: Incoming Wave of UAPs!";
    if (wave > 3) {
      isBossWave = true;
      wave = 1;
      waveCycle++;
      baseEnemySpeed *= 1.1;
    } else {
      isBossWave = false;
    }
    waveTransition = true;
    waveTransitionStart = Date.now();
    waveMessage.style.display = "block";
  }
}

// Collision detection
function checkCollisions() {
  bullets.forEach((bullet, bulletIndex) => {
    enemies.forEach((enemy, enemyIndex) => {
      if (
        bullet.x < enemy.x + enemy.hitWidth &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.hitHeight &&
        bullet.y + bullet.height > enemy.y
      ) {
        enemy.hits--;
        bullets.splice(bulletIndex, 1);
        if (enemy.hits <= 0) {
          enemies.splice(enemyIndex, 1);
          score += isBossWave ? 100 : 10;
          scoreDisplay.textContent = `Score: ${score}`;
        }
      }
    });
  });
  if (!player.invincible) {
    enemyBullets.forEach((bullet, bulletIndex) => {
      if (
        bullet.x < player.x + player.hitWidth &&
        bullet.x + bullet.width > player.x &&
        bullet.y < player.y + player.hitHeight &&
        bullet.y + bullet.height > player.y
      ) {
        gameOver = true;
        gameOverDisplay.textContent =
          "Game Over!\nHit by UAP Fire!\nTap or Press R to Restart";
        gameOverDisplay.style.display = "block";
        enemyBullets.splice(bulletIndex, 1);
      }
    });
  }
}

// Reset game
function resetGame() {
  score = 0;
  gameOver = false;
  gameStarted = false;
  wave = 1;
  waveCycle = 0;
  baseEnemySpeed = 1.5;
  isBossWave = false;
  waveTransition = false;
  player.x = 200;
  player.invincible = false;
  player.image =
    fighterImages[
      localStorage.getItem("selectedFighter") || "space-fighter1.png"
    ];
  bullets = [];
  enemyBullets = [];
  enemies = [];
  scoreDisplay.textContent = `Score: ${score}`;
  gameOverDisplay.style.display = "none";
  startMessage.style.display = "block";
  waveMessage.style.display = "none";
}

// Draw game elements
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw player hitbox (green, semi-transparent)
  ctx.strokeStyle = "rgba(0, 255, 0, 0.5)";
  ctx.lineWidth = 2;
  ctx.strokeRect(player.x, player.y, player.hitWidth, player.hitHeight);
  // Draw player
  ctx.drawImage(player.image, player.x, player.y, player.width, player.height);

  // Draw player bullets
  ctx.fillStyle = "#f00";
  bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  // Draw enemy bullets
  ctx.fillStyle = "#f0f";
  enemyBullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  // Draw enemies with hitboxes (red, semi-transparent)
  enemies.forEach((enemy) => {
    ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(enemy.x, enemy.y, enemy.hitWidth, enemy.hitHeight);
    ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);
  });
}

// Game loop
function gameLoop() {
  if (!gameOver && gameStarted) {
    updatePlayer();
    updateBullets();
    updateEnemies();
    checkCollisions();
  }
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
