const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");

let score = 0;
let gameOver = false;

// Load sprite sheets, background, platform, and heart image
const playerSprite = new Image();
playerSprite.src = "./player-sprite-R.png"; // Player sprite sheet
const enemySprite = new Image();
enemySprite.src = "./alligator1.png"; // Enemy sprite sheet (824x23, 8 frames of 103x23)
const backgroundImage = new Image();
backgroundImage.src = "./jungle-background3.png"; // Background image (800x560)
const platformImage = new Image();
platformImage.src = "./ancient-platform2.png"; // Platform image (450x90)
const heartImage = new Image();
heartImage.src = "./heart-full.png"; // Heart image (32x32)

// Camera for scrolling
const camera = {
  x: 0, // Camera offset for background and level scrolling
};

// Player object with animation, direction, hitbox, and health properties
const player = {
  x: 50,
  y: 390,
  width: 100, // Sprite size
  height: 100,
  hitboxWidth: 40, // Hitbox size for collisions
  hitboxHeight: 80,
  hitboxOffsetX: 28, // Center hitbox (100-80)/2
  hitboxOffsetY: 20,
  speed: 5,
  dy: 0,
  gravity: 0.75,
  jumpPower: -15,
  isJumping: false,
  frame: 0, // Current frame index (0: idle1, 1: walk1, 2: idle2, 3: walk2/jump)
  frameTimer: 0,
  frameInterval: 10,
  facingRight: true,
  health: 3, // Start with 3 hearts
  invincibilityTimer: 0, // Tracks grace period
  invincibilityDuration: 90, // 1.5 seconds at 60 FPS
};

// Platforms, coins, enemy
function getRandomFloat(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}
const platforms = [
  { id: 0, x: 0, y: 490, width: 2400, height: 20, isGround: true }, // Ground platform (transparent)
  { id: 0, x: 200, y: 400, width: 200, height: 20, isGround: false },
  { id: 0, x: 400, y: 150, width: 200, height: 20, isGround: false },
  { id: 0, x: 600, y: 300, width: 200, height: 20, isGround: false },
  { id: 0, x: 1000, y: 375, width: 100, height: 20, isGround: false },
  { id: 0, x: 1300, y: 275, width: 100, height: 20, isGround: false },
  { id: 0, x: 1550, y: 150, width: 100, height: 20, isGround: false },
  { id: 0, x: 1700, y: 400, width: 100, height: 20, isGround: false },
];

let coins = [
  { x: 250, y: 360, width: 16, height: 16, collected: false },
  { x: 550, y: 260, width: 16, height: 16, collected: false },
  { x: 950, y: 360, width: 16, height: 16, collected: false }, // Extended level
];

const enemy = {
  x: 600,
  y: 465,
  width: 106, // Scaled sprite size (from 103x23)
  height: 31,
  hitboxWidth: 85, // Hitbox size for collisions
  hitboxHeight: 22,
  hitboxOffsetX: 12, // Center hitbox (64-48)/2
  hitboxOffsetY: 1, // Align hitbox vertically
  speed: 2,
  direction: -1, // -1: left, 1: right
  frame: 0, // Current frame index (0-7)
  frameTimer: 0,
  frameInterval: 10, // Animation speed
};

// Keyboard input
const keys = { right: false, left: false, jump: false };
document.addEventListener("keydown", (e) => {
  if (e.code === "ArrowRight") {
    keys.right = true;
    player.facingRight = true;
  }
  if (e.code === "ArrowLeft") {
    keys.left = true;
    player.facingRight = false;
  }
  if (e.code === "Space" && !player.isJumping) {
    keys.jump = true;
    playSound(220, 0.1);
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

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update camera to follow player
  camera.x = Math.max(0, player.x - canvas.width / 2 + player.width / 2);
  camera.x = Math.min(camera.x, 2400 - canvas.width);

  // Draw tiled background
  if (backgroundImage.complete) {
    const bgWidth = 800;
    const bgHeight = 600; // Stretched as per your code
    const startX = Math.floor(camera.x / bgWidth) * bgWidth;
    for (let x = startX - bgWidth; x <= startX + canvas.width; x += bgWidth) {
      ctx.drawImage(
        backgroundImage,
        x - camera.x,
        canvas.height - bgHeight,
        bgWidth,
        bgHeight
      );
    }
  }

  // Player movement
  if (keys.right) player.x += player.speed;
  if (keys.left) player.x -= player.speed;
  if (keys.jump && !player.isJumping) {
    player.dy = player.jumpPower;
    player.isJumping = true;
    player.frame = 3; // Walk2/jump frame
  }

  // Apply gravity
  player.dy += player.gravity;
  player.y += player.dy;

  // Boundary checks (using hitbox)
  if (player.x + player.hitboxOffsetX < 0) player.x = -player.hitboxOffsetX;
  if (player.x + player.hitboxOffsetX + player.hitboxWidth > 2400) {
    player.x = 2400 - player.hitboxWidth - player.hitboxOffsetX;
  }

  // Update invincibility timer
  if (player.invincibilityTimer > 0) {
    player.invincibilityTimer--;
  }

  // Platform collision (using player hitbox)
  for (let platform of platforms) {
    if (
      player.x + player.hitboxOffsetX < platform.x + platform.width &&
      player.x + player.hitboxOffsetX + player.hitboxWidth > platform.x &&
      player.y + player.hitboxOffsetY + player.hitboxHeight > platform.y &&
      player.y + player.hitboxOffsetY + player.hitboxHeight <
        platform.y + platform.height &&
      player.dy > 0
    ) {
      player.y = platform.y - player.hitboxHeight - player.hitboxOffsetY;
      player.dy = 0;
      player.isJumping = false;
    }
  }

  // Ground collision (using hitbox)
  if (player.y + player.hitboxOffsetY + player.hitboxHeight > canvas.height) {
    player.y = canvas.height - player.hitboxHeight - player.hitboxOffsetY;
    player.dy = 0;
    player.isJumping = false;
  }

  // Animate player
  if (!player.isJumping) {
    if (keys.right || keys.left) {
      player.frameTimer++;
      if (player.frameTimer >= player.frameInterval) {
        player.frame = player.frame === 1 ? 3 : 1; // Cycle walk1 (1) and walk2 (3)
        player.frameTimer = 0;
      }
    } else {
      player.frame = 0; // Idle frame (idle1)
      player.frameTimer = 0;
      /*
      // Optional: Alternate between idle1 (0) and idle2 (2)
      player.frameTimer++;
      if (player.frameTimer >= player.frameInterval * 2) {
        player.frame = player.frame === 0 ? 2 : 0;
        player.frameTimer = 0;
      }
      */
    }
  }

  // Coin collection (using player hitbox)
  coins.forEach((coin) => {
    if (
      !coin.collected &&
      player.x + player.hitboxOffsetX < coin.x + coin.width &&
      player.x + player.hitboxOffsetX + player.hitboxWidth > coin.x &&
      player.y + player.hitboxOffsetY < coin.y + coin.height &&
      player.y + player.hitboxOffsetY + player.hitboxHeight > coin.y
    ) {
      coin.collected = true;
      score += 10;
      scoreDisplay.textContent = `Score: ${score}`;
      playSound(440, 0.1);
    }
  });

  // Enemy movement and animation
  enemy.x += enemy.speed * enemy.direction;
  if (enemy.x < 150 || enemy.x > 2000) enemy.direction *= -1;
  // Animate enemy when moving
  enemy.frameTimer++;
  if (enemy.frameTimer >= enemy.frameInterval) {
    enemy.frame = (enemy.frame + 1) % 8; // Cycle through frames 0-7
    enemy.frameTimer = 0;
  }

  // Enemy collision (player hitbox vs enemy hitbox)
  if (
    player.invincibilityTimer <= 0 &&
    player.x + player.hitboxOffsetX <
      enemy.x + enemy.hitboxOffsetX + enemy.hitboxWidth &&
    player.x + player.hitboxOffsetX + player.hitboxWidth >
      enemy.x + enemy.hitboxOffsetX &&
    player.y + player.hitboxOffsetY <
      enemy.y + enemy.hitboxOffsetY + enemy.hitboxHeight &&
    player.y + player.hitboxOffsetY + player.hitboxHeight >
      enemy.y + enemy.hitboxOffsetY
  ) {
    player.health--;
    player.invincibilityTimer = player.invincibilityDuration;
    playSound(110, 0.5);
    if (player.health <= 0) {
      gameOver = true;
    }
  }

  // Draw platforms (with camera offset)
  for (let platform of platforms) {
    if (!platform.isGround && platformImage.complete) {
      ctx.drawImage(
        platformImage,
        0,
        0,
        450,
        90,
        platform.x - camera.x,
        platform.y,
        platform.width,
        platform.height
      );
    } else if (!platform.isGround) {
      ctx.fillStyle = "#0f0";
      ctx.fillRect(
        platform.x - camera.x,
        platform.y,
        platform.width,
        platform.height
      );
    }
  }

  // Draw coins (with camera offset)
  ctx.fillStyle = "#ff0";
  for (let coin of coins) {
    if (!coin.collected) {
      ctx.beginPath();
      ctx.arc(coin.x - camera.x + 8, coin.y + 8, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw player with sprite sheet and flipping
  if (playerSprite.complete) {
    const frameWidth = 45;
    ctx.save();
    if (!player.facingRight) {
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      ctx.drawImage(
        playerSprite,
        player.frame * frameWidth,
        0,
        frameWidth,
        45,
        canvas.width - (player.x - camera.x + player.width),
        player.y,
        player.width,
        player.height
      );
    } else {
      ctx.drawImage(
        playerSprite,
        player.frame * frameWidth,
        0,
        frameWidth,
        45,
        player.x - camera.x,
        player.y,
        player.width,
        player.height
      );
    }
    ctx.restore();
  } else {
    ctx.fillStyle = "#f00";
    ctx.fillRect(player.x - camera.x, player.y, player.width, player.height);
  }

  // Draw enemy with sprite sheet and flipping
  if (enemySprite.complete) {
    const frameWidth = 103;
    ctx.save();
    if (enemy.direction === 1) {
      // Moving right, flip sprite
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      ctx.drawImage(
        enemySprite,
        enemy.frame * frameWidth,
        0,
        frameWidth,
        23,
        canvas.width - (enemy.x - camera.x + enemy.width),
        enemy.y,
        enemy.width,
        enemy.height
      );
    } else {
      // Moving left, no flip (sprite sheet is left-facing)
      ctx.drawImage(
        enemySprite,
        enemy.frame * frameWidth,
        0,
        frameWidth,
        23,
        enemy.x - camera.x,
        enemy.y,
        enemy.width,
        enemy.height
      );
    }
    ctx.restore();
  } else {
    ctx.fillStyle = "#f0f";
    ctx.fillRect(enemy.x - camera.x, enemy.y, enemy.width, enemy.height);
  }

  // Draw hearts (UI, no camera offset)
  if (heartImage.complete) {
    for (let i = 0; i < player.health; i++) {
      ctx.drawImage(heartImage, 10 + i * 40, 10, 32, 32);
    }
  }

  // Optional: Draw hitboxes for debugging

  ctx.fillStyle = "rgba(0, 255, 0, 0.3)"; // Player hitbox
  ctx.fillRect(
    player.x - camera.x + player.hitboxOffsetX,
    player.y + player.hitboxOffsetY,
    player.hitboxWidth,
    player.hitboxHeight
  );
  ctx.fillStyle = "rgba(255, 0, 0, 0.3)"; // Enemy hitbox
  ctx.fillRect(
    enemy.x - camera.x + enemy.hitboxOffsetX,
    enemy.y + enemy.hitboxOffsetY,
    enemy.hitboxWidth,
    enemy.hitboxHeight
  );

  requestAnimationFrame(update);
}

// Start game
update();
