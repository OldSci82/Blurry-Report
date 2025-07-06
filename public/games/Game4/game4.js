const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");

let score = 0;
let gameOver = false;
let levelComplete = false;
let selectedOption = 0; // 0: Restart, 1: Back to Games

// Load sprite sheets, background, platform, heart, temple, skull, and coin images
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
const templeImage = new Image();
templeImage.src = "./ruin-temple1.png"; // Temple image (500x520, unused but loaded)
const skullImage = new Image();
skullImage.src = "./elongated-skull2.png"; // Skull image (100x100)
const coinImage = new Image();
coinImage.src = "./gold-coin1.png"; // Coin image

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
  hitboxHeight: 60,
  hitboxOffsetX: 30, // Center hitbox (100-80)/2
  hitboxOffsetY: 40,
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

// Platforms (pyramid steps + ground)
const platforms = [
  { x: 0, y: 495, width: 2400, height: 20, isGround: true }, // Transparent ground
  { x: 200, y: 400, width: 200, height: 20, isGround: false }, // Floating platform
  { x: 500, y: 300, width: 200, height: 20, isGround: false }, // Floating platform
  // Pyramid steps, centered at x: 2150 (1900 + 250)
  { x: 1950, y: 400, width: 500, height: 100, isGround: false }, // Base
  { x: 2050, y: 350, width: 400, height: 80, isGround: false }, // Step 2
  { x: 2150, y: 300, width: 300, height: 60, isGround: false }, // Step 3
  { x: 2250, y: 275, width: 200, height: 40, isGround: false }, // Step 4
  { x: 2350, y: 260, width: 100, height: 20, isGround: false }, // Top
];

let coins = [
  {
    x: 250,
    y: 360,
    baseY: 360,
    width: 32,
    height: 32,
    collected: false,
    floatOffset: 0,
    floatTimer: 0,
  },
  {
    x: 550,
    y: 260,
    baseY: 260,
    width: 32,
    height: 32,
    collected: false,
    floatOffset: 0,
    floatTimer: 0,
  },
  {
    x: 950,
    y: 360,
    baseY: 360,
    width: 32,
    height: 32,
    collected: false,
    floatOffset: 0,
    floatTimer: 0,
  },
];

const enemy = {
  x: 600,
  y: 460,
  width: 140, // Scaled sprite size
  height: 38,
  hitboxWidth: 110,
  hitboxHeight: 24,
  hitboxOffsetX: 10,
  hitboxOffsetY: 1,
  speed: 2,
  direction: -1, // -1: left, 1: right
  frame: 0, // Current frame index (0-7)
  frameTimer: 0,
  frameInterval: 10,
};

const skull = {
  x: 2350, // Center on top step
  y: 210, // Above top step
  width: 50,
  height: 50,
  hitboxWidth: 28,
  hitboxHeight: 40, // Fixed: Corrected from "hitboxHeight:iyet: 40"
  hitboxOffsetX: 10, // Center hitbox (100-80)/2
  hitboxOffsetY: 1,
};

// Keyboard input
const keys = { right: false, left: false, jump: false };
document.addEventListener("keydown", (e) => {
  if (gameOver || levelComplete) {
    if (e.code === "ArrowUp") {
      selectedOption = 0; // Select Restart
      playSound(220, 0.1); // Feedback sound
    }
    if (e.code === "ArrowDown") {
      selectedOption = 1; // Select Back to Games
      playSound(220, 0.1);
    }
    if (e.code === "Enter") {
      if (selectedOption === 0) {
        restartGame();
      } else {
        window.location.href = "../../pages/games.html";
      }
      playSound(440, 0.1);
    }
  } else {
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

function restartGame() {
  // Reset player
  player.x = 50;
  player.y = 390;
  player.dy = 0;
  player.isJumping = false;
  player.frame = 0;
  player.frameTimer = 0;
  player.facingRight = true;
  player.health = 3;
  player.invincibilityTimer = 0;

  // Reset coins
  coins = [
    {
      x: 250,
      y: 360,
      baseY: 360,
      width: 32,
      height: 32,
      collected: false,
      floatOffset: 0,
      floatTimer: 0,
    },
    {
      x: 550,
      y: 260,
      baseY: 260,
      width: 32,
      height: 32,
      collected: false,
      floatOffset: 0,
      floatTimer: 0,
    },
    {
      x: 950,
      y: 360,
      baseY: 360,
      width: 32,
      height: 32,
      collected: false,
      floatOffset: 0,
      floatTimer: 0,
    },
  ];

  // Reset enemy
  enemy.x = 600;
  enemy.y = 460;
  enemy.direction = -1;
  enemy.frame = 0;
  enemy.frameTimer = 0;

  // Reset game state
  score = 0;
  scoreDisplay.textContent = `Score: ${score}`;
  gameOver = false;
  levelComplete = false;
  camera.x = 0;
  selectedOption = 0; // Reset to select "Restart" by default
}

// Click handler for end screen options
canvas.addEventListener("click", (e) => {
  if (gameOver || levelComplete) {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Font settings for measuring text
    ctx.font = '24px "Press Start 2P"'; // Match font size used for options
    const restartText = "Restart";
    const backText = "Back to Games";
    const restartWidth = ctx.measureText(restartText).width;
    const backWidth = ctx.measureText(backText).width;
    const restartX = (canvas.width - restartWidth) / 2;
    const backX = (canvas.width - backWidth) / 2;
    const restartY = canvas.height / 2 + 50;
    const backY = canvas.height / 2 + 100;
    const textHeight = 24; // Approximate height for click detection

    // Check if "Restart" was clicked
    if (
      clickX >= restartX &&
      clickX <= restartX + restartWidth &&
      clickY >= restartY - textHeight &&
      clickY <= restartY
    ) {
      restartGame();
    }

    // Check if "Back to Games" was clicked
    if (
      clickX >= backX &&
      clickX <= backX + backWidth &&
      clickY >= backY - textHeight &&
      clickY <= backY
    ) {
      window.location.href = "../../pages/games.html";
    }
  }
});

// Game loop
function update() {
  if (gameOver || levelComplete) {
    // Draw end screen
    ctx.fillStyle = "#ff0"; // Yellow
    ctx.font = '36px "Press Start 2P"'; // Font size for main message
    if (gameOver) {
      const text = "GAME OVER";
      const textWidth = ctx.measureText(text).width;
      const textX = (canvas.width - textWidth) / 2; // Center horizontally
      const textY = canvas.height / 2; // Center vertically
      ctx.fillText(text, textX, textY);
    } else {
      const text = "That's a big deal!";
      const textWidth = ctx.measureText(text).width;
      const textX = (canvas.width - textWidth) / 2; // Center horizontally
      const textY = canvas.height / 2; // Center vertically
      ctx.fillText(text, textX, textY);
    }

    // Draw restart and back options with highlight
    ctx.font = '24px "Press Start 2P"'; // Smaller font for options
    const restartText = "Restart";
    const backText = "Back to Games";
    const restartWidth = ctx.measureText(restartText).width;
    const backWidth = ctx.measureText(backText).width;
    const restartX = (canvas.width - restartWidth) / 2;
    const backX = (canvas.width - backWidth) / 2;
    const restartY = canvas.height / 2 + 50;
    const backY = canvas.height / 2 + 100;

    // Draw background for selected option
    ctx.fillStyle = selectedOption === 0 ? "#00f" : "#000"; // Blue for selected, black for unselected
    ctx.fillRect(restartX - 10, restartY - 24, restartWidth + 20, 34); // Padding around text
    ctx.fillStyle = selectedOption === 1 ? "#00f" : "#000";
    ctx.fillRect(backX - 10, backY - 24, backWidth + 20, 34);

    // Draw text
    ctx.fillStyle = "#ff0"; // Yellow text
    ctx.fillText(restartText, restartX, restartY);
    ctx.fillText(backText, backX, backY);

    requestAnimationFrame(update); // Continue rendering end screen
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update camera to follow player
  camera.x = Math.max(0, player.x - canvas.width / 2 + player.width / 2);
  camera.x = Math.min(camera.x, 2400 - canvas.width);

  // Draw tiled background
  if (backgroundImage.complete) {
    const bgWidth = 800;
    const bgHeight = 600;
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
    player.frame = 3;
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
      player.y + player.hitboxOffsetY < platform.y + platform.height &&
      player.dy >= 0 // Include dy=0 for edge cases
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
        player.frame = player.frame === 1 ? 3 : 1;
        player.frameTimer = 0;
      }
    } else {
      player.frame = 0;
      player.frameTimer = 0;
    }
  }

  // Update coin floating animation
  coins.forEach((coin) => {
    if (!coin.collected) {
      coin.floatTimer += 0.05; // Adjust speed of floating
      coin.floatOffset = Math.sin(coin.floatTimer) * 5; // Adjust amplitude (5 pixels up/down)
    }
  });

  // Coin collection (using player hitbox)
  coins.forEach((coin) => {
    if (
      !coin.collected &&
      player.x + player.hitboxOffsetX < coin.x + coin.width &&
      player.x + player.hitboxOffsetX + player.hitboxWidth > coin.x &&
      player.y + player.hitboxOffsetY <
        coin.baseY + coin.floatOffset + coin.height &&
      player.y + player.hitboxOffsetY + player.hitboxHeight >
        coin.baseY + coin.floatOffset
    ) {
      coin.collected = true;
      score += 10;
      scoreDisplay.textContent = `Score: ${score}`;
      playSound(440, 0.1);
    }
  });

  // Enemy movement and animation
  enemy.x += enemy.speed * enemy.direction;
  if (enemy.x < 500 || enemy.x > 2000) enemy.direction *= -1;
  enemy.frameTimer++;
  if (enemy.frameTimer >= enemy.frameInterval) {
    enemy.frame = (enemy.frame + 1) % 8;
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

  // Skull collision (player hitbox vs skull hitbox)
  if (
    player.x + player.hitboxOffsetX <
      skull.x + skull.hitboxOffsetX + skull.hitboxWidth &&
    player.x + player.hitboxOffsetX + player.hitboxWidth >
      skull.x + skull.hitboxOffsetX &&
    player.y + player.hitboxOffsetY <
      skull.y + skull.hitboxOffsetY + skull.hitboxHeight &&
    player.y + player.hitboxOffsetY + player.hitboxHeight >
      skull.y + skull.hitboxOffsetY
  ) {
    levelComplete = true;
    playSound(440, 0.3);
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
  for (let coin of coins) {
    if (!coin.collected && coinImage.complete) {
      ctx.drawImage(
        coinImage,
        coin.x - camera.x,
        coin.baseY + coin.floatOffset, // Use baseY with floatOffset
        coin.width,
        coin.height
      );
    } else if (!coin.collected) {
      // Fallback if image not loaded
      ctx.fillStyle = "#ff0";
      ctx.beginPath();
      ctx.arc(
        coin.x - camera.x + coin.width / 2,
        coin.baseY + coin.floatOffset + coin.height / 2,
        coin.width / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  // Draw skull (with camera offset)
  if (skullImage.complete) {
    ctx.drawImage(
      skullImage,
      skull.x - camera.x,
      skull.y,
      skull.width,
      skull.height
    );
  } else {
    ctx.fillStyle = "#fff";
    ctx.fillRect(skull.x - camera.x, skull.y, skull.width, skull.height);
  }

  // Draw player with sprite sheet, flipping, and blinking red during invincibility
  if (playerSprite.complete) {
    const frameWidth = 45;
    ctx.save();
    // Apply blinking red effect during invincibility
    if (
      player.invincibilityTimer > 0 &&
      Math.floor(player.invincibilityTimer / 10) % 2 === 0
    ) {
      ctx.filter =
        "hue-rotate(0deg) sepia(100%) saturate(500%) brightness(50%)"; // Red tint
    }
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
    ctx.filter = "none"; // Reset filter
  } else {
    ctx.fillStyle =
      player.invincibilityTimer > 0 &&
      Math.floor(player.invincibilityTimer / 10) % 2 === 0
        ? "#f00"
        : "#f0f";
    ctx.fillRect(player.x - camera.x, player.y, player.width, player.height);
  }

  // Draw enemy with sprite sheet and flipping
  if (enemySprite.complete) {
    const frameWidth = 103;
    ctx.save();
    if (enemy.direction === 1) {
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
        enemy.height // Fixed: Corrected from "engine.height"
      );
    } else {
      ctx.drawImage(
        enemySprite,
        enemy.frame * frameWidth,
        0,
        frameWidth,
        23,
        enemy.x - camera.x,
        enemy.y,
        enemy.width,
        enemy.height // Fixed: Corrected from "engine.height"
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
  ctx.fillStyle = "rgba(0, 0, 255, 0.3)"; // Skull hitbox
  ctx.fillRect(
    skull.x - camera.x + skull.hitboxOffsetX,
    skull.y + skull.hitboxOffsetY,
    skull.hitboxWidth,
    skull.hitboxHeight
  );

  requestAnimationFrame(update);
}

// Start game
update();
