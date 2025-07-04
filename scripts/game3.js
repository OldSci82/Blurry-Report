const game = document.getElementById("game");
const player = document.getElementById("player");
const scoreDisplay = document.getElementById("score-value");
const gameOverScreen = document.getElementById("game-over");

let score = 0;
let isGameOver = false;
let isJumping = false;

// Handle jump
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !isJumping && !isGameOver) {
    isJumping = true;
    player.classList.add("jumping");
    setTimeout(() => {
      player.classList.remove("jumping");
      isJumping = false;
    }, 500);
  }
  if (e.code === "KeyR" && isGameOver) {
    resetGame();
  }
});

// Spawn obstacles
function spawnObstacle() {
  if (isGameOver) return;
  const obstacle = document.createElement("div");
  obstacle.classList.add("obstacle");
  game.appendChild(obstacle);
  moveObstacle(obstacle);
  setTimeout(spawnObstacle, 2000); // New obstacle every 2 seconds
}

// Move obstacles
function moveObstacle(obstacle) {
  let obstaclePos = 800;
  const moveInterval = setInterval(() => {
    if (obstaclePos < -30) {
      clearInterval(moveInterval);
      obstacle.remove();
    } else if (!isGameOver) {
      obstaclePos -= 5;
      obstacle.style.right = 800 - obstaclePos + "px";
      checkCollision(obstacle);
    }
  }, 20);
}

// Spawn coins
function spawnCoin() {
  if (isGameOver) return;
  const coin = document.createElement("div");
  coin.classList.add("coin");
  game.appendChild(coin);
  moveCoin(coin);
  setTimeout(spawnCoin, 3000); // New coin every 3 seconds
}

// Move coins
function moveCoin(coin) {
  let coinPos = 800;
  const moveInterval = setInterval(() => {
    if (coinPos < -20) {
      clearInterval(moveInterval);
      coin.remove();
    } else if (!isGameOver) {
      coinPos -= 5;
      coin.style.right = 800 - coinPos + "px";
      checkCoinCollection(coin);
    }
  }, 20);
}

// Check obstacle collision
function checkCollision(obstacle) {
  const playerRect = player.getBoundingClientRect();
  const obstacleRect = obstacle.getBoundingClientRect();
  if (
    playerRect.left < obstacleRect.right &&
    playerRect.right > obstacleRect.left &&
    playerRect.bottom > obstacleRect.top &&
    playerRect.top < obstacleRect.bottom
  ) {
    gameOver();
  }
}

// Check coin collection
function checkCoinCollection(coin) {
  const playerRect = player.getBoundingClientRect();
  const coinRect = coin.getBoundingClientRect();
  if (
    playerRect.left < coinRect.right &&
    playerRect.right > coinRect.left &&
    playerRect.bottom > coinRect.top &&
    playerRect.top < coinRect.bottom
  ) {
    score += 10;
    scoreDisplay.textContent = score;
    coin.remove();
  }
}

// Game over
function gameOver() {
  isGameOver = true;
  gameOverScreen.style.display = "block";
}

// Reset game
function resetGame() {
  isGameOver = false;
  score = 0;
  scoreDisplay.textContent = score;
  gameOverScreen.style.display = "none";
  document.querySelectorAll(".obstacle, .coin").forEach((el) => el.remove());
  spawnObstacle();
  spawnCoin();
}

// Start game
spawnObstacle();
spawnCoin();
