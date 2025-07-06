const canvas = document.getElementById("gameCanvas");
if (!canvas) {
  console.error("Canvas element with ID 'gameCanvas' not found!");
}
const ctx = canvas ? canvas.getContext("2d") : null;
const scoreDisplay = document.getElementById("score");
const loadingDisplay = document.getElementById("loading");
const settingsDiv = document.getElementById("settings");
const gameDiv = document.getElementById("game");
const startGameButton = document.getElementById("startGame");
const numPlatformsInput = document.getElementById("numPlatforms");
const numEnemiesInput = document.getElementById("numEnemies");

let score = 0;
let gameOver = false;
let levelComplete = false;
let selectedOption = 0;
let numPlatforms = 8;
let numEnemies = 2;

// Adjust canvas size
const maxWidth = Math.min(window.innerWidth, 800);
canvas.width = maxWidth;
canvas.height = maxWidth * 0.75;
const scaleX = maxWidth / 800;
const scaleY = (maxWidth * 0.75) / 600;

// Load images
const images = [
  {
    img: new Image(),
    src: "../images/player-sprite-R.png",
    name: "playerSprite",
  },
  { img: new Image(), src: "../images/alligator1.png", name: "enemySprite" },
  {
    img: new Image(),
    src: "../images/jungle-background3.png",
    name: "backgroundImage",
  },
  {
    img: new Image(),
    src: "../images/ancient-platform2.png",
    name: "platformImage",
  },
  { img: new Image(), src: "../images/heart-full.png", name: "heartImage" },
  { img: new Image(), src: "../images/ruin-temple1.png", name: "templeImage" },
  {
    img: new Image(),
    src: "../images/elongated-skull2.png",
    name: "skullImage",
  },
  { img: new Image(), src: "../images/gold-coin1.png", name: "coinImage" },
];
let loadedImages = 0;

images.forEach(({ img, src, name }) => {
  img.src = src;
  img.onload = () => {
    loadedImages++;
    if (loadedImages === images.length && ctx) {
      loadingDisplay.style.display = "none";
    }
  };
  img.onerror = () => console.error(`Failed to load ${name}: ${src}`);
});

if (loadingDisplay) {
  loadingDisplay.style.display = "block";
}

const camera = { x: 0 };

const player = {
  x: 50,
  y: 390,
  width: 100,
  height: 100,
  hitboxWidth: 40,
  hitboxHeight: 60,
  hitboxOffsetX: 30,
  hitboxOffsetY: 40,
  speed: 5,
  dy: 0,
  gravity: 0.75,
  jumpPower: -15,
  isJumping: false,
  frame: 0,
  frameTimer: 0,
  frameInterval: 10,
  facingRight: true,
  health: 3,
  invincibilityTimer: 0,
  invincibilityDuration: 90,
};

let platforms = [];
let coins = [];
let enemies = [];

const skull = {
  x: 3950,
  y: 210,
  width: 50,
  height: 50,
  hitboxWidth: 28,
  hitboxHeight: 40,
  hitboxOffsetX: 10,
  hitboxOffsetY: 1,
};

const keys = { right: false, left: false, jump: false };

const leftButton = document.getElementById("leftButton");
const rightButton = document.getElementById("rightButton");
const jumpButton = document.getElementById("jumpButton");

if (leftButton) {
  leftButton.addEventListener("touchstart", () => {
    keys.left = true;
  });
  leftButton.addEventListener("touchend", () => {
    keys.left = false;
  });
} else {
  console.error("Left button not found!");
}
if (rightButton) {
  rightButton.addEventListener("touchstart", () => {
    keys.right = true;
  });
  rightButton.addEventListener("touchend", () => {
    keys.right = false;
  });
} else {
  console.error("Right button not found!");
}
if (jumpButton) {
  jumpButton.addEventListener("touchstart", () => {
    if (!player.isJumping) {
      keys.jump = true;
      playSound(220, 0.1);
    }
  });
  jumpButton.addEventListener("touchend", () => {
    keys.jump = false;
  });
} else {
  console.error("Jump button not found!");
}

function generateLevel() {
  platforms = [{ x: 0, y: 495, width: 4000, height: 20, isGround: true }];
  platforms.push(
    { x: 3550, y: 400, width: 500, height: 100, isGround: false },
    { x: 3650, y: 350, width: 400, height: 80, isGround: false },
    { x: 3750, y: 300, width: 300, height: 60, isGround: false },
    { x: 3850, y: 275, width: 200, height: 40, isGround: false },
    { x: 3950, y: 260, width: 100, height: 20, isGround: false }
  );

  const minX = 200;
  const maxX = 3400;
  const minY = 250;
  const maxY = 450;
  const minWidth = 100;
  const maxWidth = 300;
  const minSpacingX = 150;
  const minSpacingY = 50;
  const maxJumpDistance = 250;
  const maxJumpHeight = 120;

  let placedPlatforms = 0;
  for (let i = 0; i < numPlatforms && placedPlatforms < numPlatforms; i++) {
    let valid = false;
    let attempts = 0;
    let platform;
    while (!valid && attempts < 50) {
      const x = Math.random() * (maxX - minX - maxWidth) + minX;
      const y = Math.random() * (maxY - minY) + minY;
      const width = Math.random() * (maxWidth - minWidth) + minWidth;
      platform = { x, y, width, height: 20, isGround: false };

      valid = true;
      for (let other of platforms) {
        const dx = Math.abs(
          platform.x + platform.width / 2 - (other.x + other.width / 2)
        );
        const dy = Math.abs(platform.y - other.y);
        if (dx < minSpacingX || (dx < minSpacingX * 1.5 && dy < minSpacingY)) {
          valid = false;
          break;
        }
      }

      let reachable = false;
      for (let other of platforms) {
        if (other === platform) continue;
        const dx = Math.abs(
          platform.x + platform.width / 2 - (other.x + other.width / 2)
        );
        const dy = Math.abs(platform.y - other.y);
        if (dx <= maxJumpDistance && dy <= maxJumpHeight) {
          reachable = true;
          break;
        }
      }
      if (!reachable && platform.y > 495 - maxJumpHeight) {
        reachable = true;
      }
      if (!reachable) valid = false;

      attempts++;
    }
    if (valid) {
      platforms.push(platform);
      placedPlatforms++;
    }
  }

  coins = [];
  const numCoins = Math.floor(numPlatforms / 2) + 1;
  const availablePlatforms = platforms.slice(1, platforms.length - 5);
  for (let i = 0; i < numCoins; i++) {
    let coin;
    if (i < Math.floor(numCoins * 0.8) && availablePlatforms.length > 0) {
      const platformIndex = Math.floor(
        Math.random() * availablePlatforms.length
      );
      const platform = availablePlatforms[platformIndex];
      coin = {
        x: platform.x + platform.width / 2 - 16,
        y: platform.y - 40,
        baseY: platform.y - 40,
        width: 32,
        height: 32,
        collected: false,
        floatOffset: 0,
        floatTimer: 0,
      };
      availablePlatforms.splice(platformIndex, 1);
    } else {
      const platform =
        availablePlatforms[
          Math.floor(Math.random() * availablePlatforms.length)
        ] || platforms[1];
      const x = platform.x + platform.width / 2 + (Math.random() * 100 - 50);
      const y = platform.y - Math.random() * 50 - 30;
      if (x >= 200 && x <= 3400 && y >= 200 && y <= 450) {
        coin = {
          x,
          y,
          baseY: y,
          width: 32,
          height: 32,
          collected: false,
          floatOffset: 0,
          floatTimer: 0,
        };
      } else {
        coin = {
          x: platform.x + platform.width / 2 - 16,
          y: platform.y - 40,
          baseY: platform.y - 40,
          width: 32,
          height: 32,
          collected: false,
          floatOffset: 0,
          floatTimer: 0,
        };
      }
    }
    coins.push(coin);
  }

  enemies = [];
  for (let i = 0; i < numEnemies; i++) {
    const patrolWidth = Math.random() * 300 + 200;
    const patrolStart = Math.random() * (3400 - patrolWidth - 200) + 200;
    const patrolEnd = patrolStart + patrolWidth;
    enemies.push({
      x: patrolStart,
      y: 460,
      width: 140,
      height: 38,
      hitboxWidth: 110,
      hitboxHeight: 24,
      hitboxOffsetX: 10,
      hitboxOffsetY: 1,
      speed: Math.random() * 1 + 1.5,
      direction: Math.random() > 0.5 ? 1 : -1,
      frame: 0,
      frameTimer: 0,
      frameInterval: 10,
      patrolStart,
      patrolEnd,
    });
  }
}

if (startGameButton) {
  const startGameHandler = () => {
    numPlatforms = Math.max(
      6,
      Math.min(12, parseInt(numPlatformsInput.value) || 8)
    );
    numEnemies = Math.max(1, Math.min(4, parseInt(numEnemiesInput.value) || 2));
    settingsDiv.style.display = "none";
    gameDiv.style.display = "block";
    generateLevel();
    if (loadedImages === images.length && ctx) {
      update();
    } else {
      const imageLoadInterval = setInterval(() => {
        if (loadedImages === images.length && ctx) {
          clearInterval(imageLoadInterval);
          update();
        }
      }, 100);
    }
  };
  startGameButton.addEventListener("click", startGameHandler);
  startGameButton.addEventListener("touchstart", startGameHandler);
}

document.addEventListener("keydown", (e) => {
  if (gameOver || levelComplete) {
    if (e.code === "ArrowUp") {
      selectedOption = 0;
      playSound(220, 0.1);
    }
    if (e.code === "ArrowDown") {
      selectedOption = 1;
      playSound(220, 0.1);
    }
    if (e.code === "Enter") {
      if (selectedOption === 0) {
        restartGame();
      } else {
        window.location.href = "../../../pages/games.html";
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
  player.x = 50;
  player.y = 390;
  player.dy = 0;
  player.isJumping = false;
  player.frame = 0;
  player.frameTimer = 0;
  player.facingRight = true;
  player.health = 3;
  player.invincibilityTimer = 0;

  score = 0;
  scoreDisplay.textContent = `Score: ${score}`;
  gameOver = false;
  levelComplete = false;
  camera.x = 0;
  selectedOption = 0;
  generateLevel();
}

if (canvas) {
  canvas.addEventListener("click", (e) => {
    if (gameOver || levelComplete) {
      const rect = canvas.getBoundingClientRect();
      const scaleXCanvas = canvas.width / rect.width;
      const scaleYCanvas = canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleXCanvas;
      const clickY = (e.clientY - rect.top) * scaleYCanvas;

      ctx.font = '24px "VCR OSD Mono"';
      const restartText = "Restart";
      const backText = "Back to Games";
      const restartWidth = ctx.measureText(restartText).width;
      const backWidth = ctx.measureText(backText).width;
      const restartX = (800 - restartWidth) / 2;
      const backX = (800 - backWidth) / 2;
      const restartY = 600 / 2 + 50;
      const backY = 600 / 2 + 100;
      const textHeight = 24;

      if (
        clickX >= restartX &&
        clickX <= restartX + restartWidth &&
        clickY >= restartY - textHeight &&
        clickY <= restartY
      ) {
        restartGame();
      }

      if (
        clickX >= backX &&
        clickX <= backX + backWidth &&
        clickY >= backY - textHeight &&
        clickY <= backY
      ) {
        window.location.href = "../../../pages/games.html";
      }
    }
  });
}

function update() {
  if (!ctx) {
    console.error("Canvas context not available, cannot render!");
    return;
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scaleX, scaleY);

  if (gameOver || levelComplete) {
    ctx.fillStyle = "#FFCC00";
    ctx.font = '36px "VCR OSD Mono"';
    if (gameOver) {
      const text = "GAME OVER";
      const textWidth = ctx.measureText(text).width;
      const textX = (800 - textWidth) / 2;
      const textY = 600 / 2;
      ctx.fillText(text, textX, textY);
    } else {
      const text = "That's a big deal!";
      const textWidth = ctx.measureText(text).width;
      const textX = (800 - textWidth) / 2;
      const textY = 600 / 2;
      ctx.fillText(text, textX, textY);
    }

    ctx.font = '24px "VCR OSD Mono"';
    const restartText = "Restart";
    const backText = "Back to Games";
    const restartWidth = ctx.measureText(restartText).width;
    const backWidth = ctx.measureText(backText).width;
    const restartX = (800 - restartWidth) / 2;
    const backX = (800 - backWidth) / 2;
    const restartY = 600 / 2 + 50;
    const backY = 600 / 2 + 100;

    ctx.fillStyle = selectedOption === 0 ? "#B13BFF" : "#090040";
    ctx.fillRect(restartX - 10, restartY - 24, restartWidth + 20, 34);
    ctx.fillStyle = selectedOption === 1 ? "#B13BFF" : "#090040";
    ctx.fillRect(backX - 10, backY - 24, backWidth + 34);

    ctx.fillStyle = "#FFCC00";
    ctx.fillText(restartText, restartX, restartY);
    ctx.fillText(backText, backX, backY);

    requestAnimationFrame(update);
    return;
  }

  camera.x = Math.max(0, player.x - 400 + player.width / 2);
  camera.x = Math.min(camera.x, 4000 - 800);

  const bgWidth = 800;
  const bgHeight = 600;
  const startX = Math.floor(camera.x / bgWidth) * bgWidth;
  for (let x = startX - bgWidth; x <= startX + 800; x += bgWidth) {
    ctx.drawImage(images[2].img, x - camera.x, 0, bgWidth, bgHeight);
  }

  if (keys.right) player.x += player.speed;
  if (keys.left) player.x -= player.speed;
  if (keys.jump && !player.isJumping) {
    player.dy = player.jumpPower;
    player.isJumping = true;
    player.frame = 3;
  }

  player.dy += player.gravity;
  player.y += player.dy;

  if (player.x + player.hitboxOffsetX < 0) player.x = -player.hitboxOffsetX;
  if (player.x + player.hitboxOffsetX + player.hitboxWidth > 4000) {
    player.x = 4000 - player.hitboxWidth - player.hitboxOffsetX;
  }

  if (player.invincibilityTimer > 0) {
    player.invincibilityTimer--;
  }

  for (let platform of platforms) {
    if (
      player.x + player.hitboxOffsetX < platform.x + platform.width &&
      player.x + player.hitboxOffsetX + player.hitboxWidth > platform.x &&
      player.y + player.hitboxOffsetY + player.hitboxHeight > platform.y &&
      player.y + player.hitboxOffsetY < platform.y + platform.height &&
      player.dy >= 0
    ) {
      player.y = platform.y - player.hitboxHeight - player.hitboxOffsetY;
      player.dy = 0;
      player.isJumping = false;
    }
  }

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

  coins.forEach((coin) => {
    if (!coin.collected) {
      coin.floatTimer += 0.05;
      coin.floatOffset = Math.sin(coin.floatTimer) * 5;
    }
  });

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

  enemies.forEach((enemy) => {
    enemy.x += enemy.speed * enemy.direction;
    if (enemy.x < enemy.patrolStart || enemy.x > enemy.patrolEnd) {
      enemy.direction *= -1;
    }
    enemy.frameTimer++;
    if (enemy.frameTimer >= enemy.frameInterval) {
      enemy.frame = (enemy.frame + 1) % 8;
      enemy.frameTimer = 0;
    }
  });

  enemies.forEach((enemy) => {
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
  });

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

  for (let platform of platforms) {
    if (!platform.isGround && images[3].img.complete) {
      ctx.drawImage(
        images[3].img,
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

  for (let coin of coins) {
    if (!coin.collected && images[7].img.complete) {
      ctx.drawImage(
        images[7].img,
        coin.x - camera.x,
        coin.baseY + coin.floatOffset,
        coin.width,
        coin.height
      );
    } else if (!coin.collected) {
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

  if (images[6].img.complete) {
    ctx.drawImage(
      images[6].img,
      skull.x - camera.x,
      skull.y,
      skull.width,
      skull.height
    );
  } else {
    ctx.fillStyle = "#fff";
    ctx.fillRect(skull.x - camera.x, skull.y, skull.width, skull.height);
  }

  if (images[0].img.complete) {
    const frameWidth = 45;
    ctx.save();
    if (
      player.invincibilityTimer > 0 &&
      Math.floor(player.invincibilityTimer / 10) % 2 === 0
    ) {
      ctx.filter =
        "hue-rotate(0deg) sepia(100%) saturate(500%) brightness(50%)";
    }
    if (!player.facingRight) {
      ctx.scale(-1, 1);
      ctx.translate(-800, 0);
      ctx.drawImage(
        images[0].img,
        player.frame * frameWidth,
        0,
        frameWidth,
        45,
        800 - (player.x - camera.x + player.width),
        player.y,
        player.width,
        player.height
      );
    } else {
      ctx.drawImage(
        images[0].img,
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
    ctx.filter = "none";
  } else {
    ctx.fillStyle =
      player.invincibilityTimer > 0 &&
      Math.floor(player.invincibilityTimer / 10) % 2 === 0
        ? "#f00"
        : "#f0f";
    ctx.fillRect(player.x - camera.x, player.y, player.width, player.height);
  }

  enemies.forEach((enemy) => {
    if (images[1].img.complete) {
      const frameWidth = 103;
      ctx.save();
      if (enemy.direction === 1) {
        ctx.scale(-1, 1);
        ctx.translate(-800, 0);
        ctx.drawImage(
          images[1].img,
          enemy.frame * frameWidth,
          0,
          frameWidth,
          23,
          800 - (enemy.x - camera.x + enemy.width),
          enemy.y,
          enemy.width,
          enemy.height
        );
      } else {
        ctx.drawImage(
          images[1].img,
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
  });

  if (images[4].img.complete) {
    for (let i = 0; i < player.health; i++) {
      ctx.drawImage(images[4].img, 10 + i * 40, 10, 32, 32);
    }
  }

  ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
  ctx.fillRect(
    player.x - camera.x + player.hitboxOffsetX,
    player.y + player.hitboxOffsetY,
    player.hitboxWidth,
    player.hitboxHeight
  );
  enemies.forEach((enemy) => {
    ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
    ctx.fillRect(
      enemy.x - camera.x + enemy.hitboxOffsetX,
      employee.y + enemy.hitboxOffsetY,
      enemy.hitboxWidth,
      enemy.hitboxHeight
    );
  });
  ctx.fillStyle = "rgba(0, 0, 255, 0.3)";
  ctx.fillRect(
    skull.x - camera.x + skull.hitboxOffsetX,
    skull.y + skull.hitboxOffsetY,
    skull.hitboxWidth,
    skull.hitboxHeight
  );

  requestAnimationFrame(update);
}
