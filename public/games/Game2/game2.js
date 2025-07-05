const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const gameOverDisplay = document.getElementById("gameOver");
const startMessage = document.getElementById("startMessage");

// Game state
let score = 0;
let gameOver = false;
let gameStarted = false;
let player = { x: 400, y: 550, width: 40, height: 20, speed: 5 };
let bullets = [];
let enemies = [];
let keys = {};

// Input handling
document.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "Space" && !gameStarted && !gameOver) {
    gameStarted = true;
    startMessage.style.display = "none";
    spawnEnemies();
  }
  if (e.code === "KeyR" && gameOver) {
    resetGame();
  }
});
document.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

// Player movement and shooting
function updatePlayer() {
  if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
  if (keys["ArrowRight"] && player.x < canvas.width - player.width)
    player.x += player.speed;
  if (keys["Space"] && gameStarted && !gameOver) {
    // Limit bullet firing rate
    if (!player.lastShot || Date.now() - player.lastShot > 200) {
      bullets.push({
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 10,
        speed: -8,
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
}

// Enemy spawning and movement
function spawnEnemies() {
  enemies = [];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 3; j++) {
      enemies.push({
        x: 100 + i * 100,
        y: 50 + j * 50,
        width: 30,
        height: 20,
        speed: 2,
        direction: 1,
      });
    }
  }
}

function updateEnemies() {
  enemies.forEach((enemy) => {
    enemy.x += enemy.speed * enemy.direction;
    // Reverse direction at screen edges
    if (enemy.x <= 0 || enemy.x >= canvas.width - enemy.width) {
      enemy.direction *= -1;
      enemy.y += 20; // Move down
    }
    // Check for game over
    if (enemy.y >= canvas.height - 50) {
      gameOver = true;
      gameOverDisplay.style.display = "block";
    }
  });
}

// Collision detection
function checkCollisions() {
  bullets.forEach((bullet, bulletIndex) => {
    enemies.forEach((enemy, enemyIndex) => {
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        enemies.splice(enemyIndex, 1);
        bullets.splice(bulletIndex, 1);
        score += 10;
        scoreDisplay.textContent = `Score: ${score}`;
      }
    });
  });
}

// Reset game
function resetGame() {
  score = 0;
  gameOver = false;
  gameStarted = false;
  player.x = 400;
  bullets = [];
  enemies = [];
  scoreDisplay.textContent = `Score: ${score}`;
  gameOverDisplay.style.display = "none";
  startMessage.style.display = "block";
}

// Draw game elements
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw player (simple triangle for spaceship)
  ctx.fillStyle = "#0f0";
  ctx.beginPath();
  ctx.moveTo(player.x, player.y + player.height);
  ctx.lineTo(player.x + player.width / 2, player.y);
  ctx.lineTo(player.x + player.width, player.y + player.height);
  ctx.fill();

  // Draw bullets
  ctx.fillStyle = "#f00";
  bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  // Draw enemies
  ctx.fillStyle = "#f0f";
  enemies.forEach((enemy) => {
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
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

// Start game loop
gameLoop();
