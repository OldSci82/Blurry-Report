const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");

let score = 0;
let gameOver = false;

// Player object
const player = {
  x: 50,
  y: 500,
  width: 32,
  height: 32,
  speed: 5,
  dy: 0,
  gravity: 0.5,
  jumpPower: -15,
  isJumping: false,
};

// Platforms
const platforms = [
  { x: 0, y: 550, width: 800, height: 50 },
  { x: 200, y: 400, width: 200, height: 20 },
  { x: 500, y: 300, width: 200, height: 20 },
];

// Coins
let coins = [
  { x: 250, y: 360, width: 16, height: 16, collected: false },
  { x: 550, y: 260, width: 16, height: 16, collected: false },
];

// Enemy
const enemy = {
  x: 600,
  y: 270,
  width: 32,
  height: 32,
  speed: 2,
  direction: -1,
};

// Keyboard input
const keys = { right: false, left: false, jump: false };
document.addEventListener("keydown", (e) => {
  if (e.code === "ArrowRight") keys.right = true;
  if (e.code === "ArrowLeft") keys.left = true;
  if (e.code === "Space" && !player.isJumping) {
    keys.jump = true;
    playSound(220, 0.1); // Jump sound
  }
});
document.addEventListener("keyup", (e) => {
  if (e.code === "ArrowRight") keys.right = false;
  if (e.code === "ArrowLeft") keys.left = false;
  if (e.code === "Space") keys.jump = false;
});

// Simple sound for 80s feel
function playSound(frequency, duration) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  oscillator.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}

// Game loop
function update() {
  if (gameOver) {
    ctx.fillStyle = "#f00";
    ctx.font = '48px "Press Start 2P"';
    ctx.fillText("GAME OVER", 250, 300);
    return;
  }

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Player movement
  if (keys.right) player.x += player.speed;
  if (keys.left) player.x -= player.speed;
  if (keys.jump && !player.isJumping) {
    player.dy = player.jumpPower;
    player.isJumping = true;
  }

  // Apply gravity
  player.dy += player.gravity;
  player.y += player.dy;

  // Boundary checks
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width)
    player.x = canvas.width - player.width;

  // Platform collision
  for (let platform of platforms) {
    if (
      player.x < platform.x + platform.width &&
      player.x + player.width > platform.x &&
      player.y + player.height > platform.y &&
      player.y + player.height < platform.y + platform.height &&
      player.dy > 0
    ) {
      player.y = platform.y - player.height;
      player.dy = 0;
      player.isJumping = false;
    }
  }

  // Ground collision
  if (player.y > canvas.height - player.height) {
    player.y = canvas.height - player.height;
    player.dy = 0;
    player.isJumping = false;
  }

  // Coin collection
  coins.forEach((coin) => {
    if (
      !coin.collected &&
      player.x < coin.x + coin.width &&
      player.x + player.width > coin.x &&
      player.y < coin.y + coin.height &&
      player.y + player.height > coin.y
    ) {
      coin.collected = true;
      score += 10;
      scoreDisplay.textContent = `Score: ${score}`;
      playSound(440, 0.1); // Coin sound
    }
  });

  // Enemy movement
  enemy.x += enemy.speed * enemy.direction;
  if (enemy.x < 500 || enemy.x > 700) enemy.direction *= -1;

  // Enemy collision
  if (
    player.x < enemy.x + enemy.width &&
    player.x + player.width > enemy.x &&
    player.y < enemy.y + enemy.height &&
    player.y + player.height > enemy.y
  ) {
    gameOver = true;
    playSound(110, 0.5); // Game over sound
  }

  // Draw platforms
  ctx.fillStyle = "#0f0";
  for (let platform of platforms) {
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  }

  // Draw coins
  ctx.fillStyle = "#ff0";
  for (let coin of coins) {
    if (!coin.collected) {
      ctx.beginPath();
      ctx.arc(coin.x + 8, coin.y + 8, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw player
  ctx.fillStyle = "#f00";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Draw enemy
  ctx.fillStyle = "#f0f";
  ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

  requestAnimationFrame(update);
}

// Start game
update();
