// --- Game State Variables ---
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];

const DISPLAY_RANKS = { T: "10" };

function formatCard(card) {
  return `${DISPLAY_RANKS[card.rank] || card.rank}${card.suit}`;
}

let deck = [];
let players = [];
let communityCards = [];
let pot = 0;
let dealerIndex = 0; // Index of the player with the dealer button
let currentPlayerIndex = 0;
let currentBet = 0; // The highest bet placed in the current betting round
let bettingRound = "pre-flop"; // pre-flop, flop, turn, river, showdown
let roundMessage = ""; // Message to display for the current round

// Act-tracking: a street ends only when every still-in, non-all-in player
// has acted since the last bet/raise AND matched currentBet.
let playersActedThisRound = new Set(); // player indices who have acted since last aggression
let pendingTimer = null; // single scheduled turn/advance timer (cleared on Next Round)

// --- DOM Elements ---
const gameMessagesDiv = document.getElementById("game-messages");
const playerOptionsDiv = document.getElementById("player-options");
const startGameBtn = document.getElementById("start-game-btn");
const nextRoundBtn = document.getElementById("next-round-btn");
const betSlider = document.getElementById("bet-slider");
const betAmountSpan = document.getElementById("bet-amount");
const foldBtn = document.getElementById("fold-btn");
const checkCallBtn = document.getElementById("check-call-btn");
const betRaiseBtn = document.getElementById("bet-raise-btn");
const potDisplay = document.getElementById("pot-display");
const communityCardsDiv = document.getElementById("community-cards");

function clearPendingTimer() {
  if (pendingTimer !== null) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
}

function scheduleAction(fn, ms) {
  clearPendingTimer();
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    fn();
  }, ms);
}

/** Next seat clockwise that still has chips (eligible to be dealt in). */
function nextLiveSeat(fromIndex) {
  for (let step = 1; step <= players.length; step++) {
    const i = (fromIndex + step) % players.length;
    if (players[i].chips > 0) return i;
  }
  return fromIndex;
}

function liveSeatIndices() {
  return players.map((p, i) => i).filter((i) => players[i].chips > 0);
}

// --- Game Initialization ---
function initGame() {
  players = [
    {
      name: "You",
      chips: 100,
      hand: [],
      isHuman: true,
      folded: false,
      currentBetInRound: 0,
      playerArea: document.querySelector(".player-bottom-left"),
    },
    {
      name: "NPC 1",
      chips: 100,
      hand: [],
      isHuman: false,
      folded: false,
      currentBetInRound: 0,
      playerArea: document.querySelector(".player-top-left"),
    },
    {
      name: "NPC 2",
      chips: 100,
      hand: [],
      isHuman: false,
      folded: false,
      currentBetInRound: 0,
      playerArea: document.querySelector(".player-top-right"),
    },
  ];
  dealerIndex = 0; // Start with 'You' as dealer, rotates later
  updatePlayerDisplays();
  displayMessage("Welcome to Texas Hold'em! Click 'Start Game' to begin.");
  startGameBtn.classList.remove("hidden");
  nextRoundBtn.classList.add("hidden");
  playerOptionsDiv.classList.add("hidden");
}

// --- Card and Deck Functions ---
function createDeck() {
  deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
}

function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]; // Fisher-Yates shuffle
  }
}

function dealCard() {
  return deck.pop();
}

// --- Game Flow Functions ---
function startGame() {
  startGameBtn.classList.add("hidden");
  nextRoundBtn.classList.add("hidden");
  startNewRound();
}

function startNewRound() {
  clearPendingTimer();
  playerOptionsDiv.classList.add("hidden");
  nextRoundBtn.classList.add("hidden");

  const live = liveSeatIndices();
  if (live.length < 2) {
    const survivor = live.length === 1 ? players[live[0]] : null;
    displayMessage(
      survivor
        ? `${survivor.name} wins the table — not enough players left with chips.`
        : "Game over — no players left with chips."
    );
    startGameBtn.classList.remove("hidden");
    return;
  }

  displayMessage("New round starting!");
  createDeck();
  shuffleDeck();
  communityCards = [];
  pot = 0;
  currentBet = 0;
  bettingRound = "pre-flop";
  playersActedThisRound = new Set();

  // Reset player states; busted (0 chips) stay out of this hand
  players.forEach((p) => {
    p.hand = [];
    p.folded = p.chips <= 0; // eliminate / skip broke seats
    p.currentBetInRound = 0;
    p.playerArea.classList.remove("active-player");
    p.playerArea.querySelector(".player-hand-display").innerHTML = "";
  });

  // Rotate dealer among live seats
  dealerIndex = nextLiveSeat(dealerIndex);

  let smallBlindIndex;
  let bigBlindIndex;
  let utgIndex;

  if (live.length === 2) {
    // Heads-up: dealer is SB and acts first preflop; other seat is BB
    smallBlindIndex = dealerIndex;
    bigBlindIndex = nextLiveSeat(dealerIndex);
    utgIndex = dealerIndex;
  } else {
    smallBlindIndex = nextLiveSeat(dealerIndex);
    bigBlindIndex = nextLiveSeat(smallBlindIndex);
    utgIndex = nextLiveSeat(bigBlindIndex);
  }

  const smallBlindAmount = 5;
  const bigBlindAmount = 10;

  postBlind(players[smallBlindIndex], smallBlindAmount);
  postBlind(players[bigBlindIndex], bigBlindAmount);
  currentBet = bigBlindAmount;
  // Blinds are forced bets, not voluntary actions — BB still gets option if all limp.

  // Deal hole cards only to players in this hand (not busted/folded out)
  for (let i = 0; i < 2; i++) {
    players.forEach((p) => {
      if (!p.folded) p.hand.push(dealCard());
    });
  }

  updatePlayerDisplays();
  updateCommunityCardsDisplay();
  updatePotDisplay();

  currentPlayerIndex = utgIndex;
  displayMessage(
    `It's ${players[currentPlayerIndex].name}'s turn. Starting pre-flop.`
  );
  scheduleAction(handleTurn, 1000);
}

function postBlind(player, amount) {
  const actualAmount = Math.min(player.chips, amount);
  player.chips -= actualAmount;
  pot += actualAmount;
  player.currentBetInRound += actualAmount;
  displayMessage(`${player.name} posts a blind of $${actualAmount}.`);
}

function handleTurn() {
  const player = players[currentPlayerIndex];

  // Skip folded or all-in (no chips left to act with)
  if (player.folded || player.chips === 0) {
    moveToNextPlayer();
    return;
  }

  // Highlight current player
  players.forEach((p, idx) => {
    if (idx === currentPlayerIndex) {
      p.playerArea.classList.add("active-player");
    } else {
      p.playerArea.classList.remove("active-player");
    }
  });

  roundMessage = `It's ${player.name}'s turn. Current bet to match: $${currentBet}. Your current contribution: $${player.currentBetInRound}`;
  displayMessage(roundMessage);

  if (player.isHuman) {
    showPlayerOptions(player);
  } else {
    scheduleAction(() => npcTurn(player), 1500);
  }
}

function moveToNextPlayer() {
  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  if (isBettingRoundOver()) {
    endBettingRound();
  } else {
    handleTurn();
  }
}

function isBettingRoundOver() {
  const inHand = players.filter((p) => !p.folded);
  if (inHand.length <= 1) return true;

  // Still-in players who can still put chips in must have acted since the
  // last aggression and matched currentBet. All-in players are exempt.
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    if (p.folded) continue;
    if (p.chips === 0) continue; // all-in — no further action required
    if (p.currentBetInRound < currentBet) return false;
    if (!playersActedThisRound.has(i)) return false;
  }
  return true;
}

function notePlayerActed(playerIndex) {
  playersActedThisRound.add(playerIndex);
}

/** Bet or raise reopens action: only the aggressor has "acted" so far. */
function noteAggression(playerIndex) {
  playersActedThisRound = new Set([playerIndex]);
}

function endBettingRound() {
  players.forEach((p) => {
    p.currentBetInRound = 0;
  });
  playersActedThisRound = new Set();

  let activePlayersCount = players.filter((p) => !p.folded).length;

  if (activePlayersCount <= 1) {
    showdown();
    return;
  }

  switch (bettingRound) {
    case "pre-flop":
      bettingRound = "flop";
      displayMessage("Flop dealt!");
      dealCommunityCards(3);
      break;
    case "flop":
      bettingRound = "turn";
      displayMessage("Turn dealt!");
      dealCommunityCards(1);
      break;
    case "turn":
      bettingRound = "river";
      displayMessage("River dealt!");
      dealCommunityCards(1);
      break;
    case "river":
      bettingRound = "showdown";
      displayMessage("All betting complete. Time for Showdown!");
      break;
  }

  updateCommunityCardsDisplay();
  currentBet = 0;

  if (bettingRound === "showdown") {
    scheduleAction(showdown, 2000);
  } else {
    // First to act postflop: first live-in-hand seat left of dealer
    let startingPlayerFound = false;
    let startIndex = (dealerIndex + 1) % players.length;
    for (let i = 0; i < players.length; i++) {
      const potentialPlayerIndex = (startIndex + i) % players.length;
      const p = players[potentialPlayerIndex];
      if (!p.folded && p.chips > 0) {
        currentPlayerIndex = potentialPlayerIndex;
        startingPlayerFound = true;
        break;
      }
    }
    if (!startingPlayerFound) {
      // Everyone remaining is all-in — run out the board
      if (bettingRound === "flop") {
        dealCommunityCards(1);
        bettingRound = "turn";
        dealCommunityCards(1);
        bettingRound = "river";
        updateCommunityCardsDisplay();
      } else if (bettingRound === "turn") {
        dealCommunityCards(1);
        bettingRound = "river";
        updateCommunityCardsDisplay();
      }
      bettingRound = "showdown";
      scheduleAction(showdown, 1500);
      return;
    }
    scheduleAction(handleTurn, 1500);
  }
}

function dealCommunityCards(count) {
  for (let i = 0; i < count; i++) {
    communityCards.push(dealCard());
  }
}

// --- Player Actions (Human) ---
function showPlayerOptions(player) {
  playerOptionsDiv.classList.remove("hidden");

  let minBet = currentBet - player.currentBetInRound;
  if (minBet < 0) minBet = 0;
  const maxBet = player.chips;

  betSlider.min = minBet;
  betSlider.max = maxBet;
  betSlider.value = minBet;

  if (currentBet === 0 || player.currentBetInRound === currentBet) {
    checkCallBtn.textContent = "Check";
    betRaiseBtn.textContent = "Bet";
    betSlider.min = 0;
  } else {
    checkCallBtn.textContent = `Call ($${
      currentBet - player.currentBetInRound
    })`;
    betRaiseBtn.textContent = "Raise";
  }

  if (player.chips === 0) {
    betSlider.disabled = true;
    foldBtn.disabled = true;
    betRaiseBtn.disabled = true;
    if (player.currentBetInRound < currentBet) {
      checkCallBtn.disabled = true;
    } else {
      checkCallBtn.disabled = false;
    }
  } else {
    betSlider.disabled = false;
    foldBtn.disabled = false;
    betRaiseBtn.disabled = false;
    checkCallBtn.disabled = false;
  }

  betAmountSpan.textContent = `$${betSlider.value}`;
  betSlider.oninput = () => {
    betAmountSpan.textContent = `$${betSlider.value}`;
    if (
      betSlider.value < currentBet + 10 &&
      currentBet > 0 &&
      betSlider.value - player.currentBetInRound <
        currentBet - player.currentBetInRound + 10
    ) {
      betRaiseBtn.disabled = true;
    } else {
      betRaiseBtn.disabled = false;
    }

    if (betSlider.value < currentBet - player.currentBetInRound) {
      betRaiseBtn.disabled = true;
    }
  };
}

function handlePlayerAction(actionType, amount = 0) {
  const player = players[currentPlayerIndex];
  const playerIndex = currentPlayerIndex;
  playerOptionsDiv.classList.add("hidden");

  let actualAmount = 0;

  switch (actionType) {
    case "fold":
      player.folded = true;
      notePlayerActed(playerIndex);
      displayMessage(`You folded.`);
      break;
    case "check":
      notePlayerActed(playerIndex);
      displayMessage(`You checked.`);
      break;
    case "call":
      actualAmount = currentBet - player.currentBetInRound;
      performBet(player, actualAmount, "call");
      notePlayerActed(playerIndex);
      displayMessage(`You called $${actualAmount}.`);
      break;
    case "bet":
    case "raise":
      actualAmount = parseInt(betSlider.value);
      actualAmount = Math.min(
        actualAmount,
        player.chips + player.currentBetInRound
      );
      if (
        actualAmount < currentBet &&
        actualAmount < player.chips + player.currentBetInRound
      ) {
        displayMessage("Invalid bet/raise amount.");
        showPlayerOptions(player);
        return;
      }
      performBet(player, actualAmount - player.currentBetInRound, actionType);
      currentBet = actualAmount;
      noteAggression(playerIndex);
      displayMessage(
        `You ${actionType === "bet" ? "bet" : "raised"} to $${actualAmount}.`
      );
      break;
  }
  updatePlayerDisplays();
  updatePotDisplay();
  moveToNextPlayer();
}

// --- NPC Logic (Simplified) ---
function npcTurn(npc) {
  const npcIndex = players.indexOf(npc);
  const handStrength = calculateHandStrength(npc.hand, communityCards);
  const chipsToCall = currentBet - npc.currentBetInRound;
  let actionMessage = "";

  // Short all-in: never fold when you still have chips but can't cover the call
  if (chipsToCall > 0 && npc.chips > 0 && npc.chips < chipsToCall) {
    const pushed = npc.chips;
    performBet(npc, pushed, "call");
    notePlayerActed(npcIndex);
    actionMessage = `${npc.name} goes all-in with $${pushed}!`;
    displayMessage(actionMessage);
    updatePlayerDisplays();
    updatePotDisplay();
    scheduleAction(moveToNextPlayer, 1500);
    return;
  }

  // --- Basic NPC Strategy ---
  if (npc.name === "NPC 1") {
    if (handStrength > 7 || (handStrength > 4 && chipsToCall < 20)) {
      if (currentBet === 0 || (handStrength > 8 && Math.random() < 0.6)) {
        let betAmount = Math.min(npc.chips, Math.max(currentBet * 1.5, 20));
        performBet(npc, betAmount - npc.currentBetInRound, "raise");
        currentBet = npc.currentBetInRound;
        noteAggression(npcIndex);
        actionMessage = `${npc.name} raises to $${npc.currentBetInRound}!`;
      } else {
        performBet(npc, chipsToCall, "call");
        notePlayerActed(npcIndex);
        actionMessage = `${npc.name} calls $${chipsToCall}.`;
      }
    } else if (currentBet === 0 || chipsToCall === 0) {
      notePlayerActed(npcIndex);
      actionMessage = `${npc.name} checks.`;
    } else {
      npc.folded = true;
      notePlayerActed(npcIndex);
      actionMessage = `${npc.name} folds.`;
    }
  } else if (npc.name === "NPC 2") {
    if (handStrength > 6 || (handStrength > 3 && Math.random() < 0.4)) {
      if (currentBet === 0 || Math.random() < 0.7) {
        let betAmount = Math.min(
          npc.chips,
          Math.max(currentBet * 2, 25 + Math.floor(Math.random() * 15))
        );
        performBet(npc, betAmount - npc.currentBetInRound, "raise");
        currentBet = npc.currentBetInRound;
        noteAggression(npcIndex);
        actionMessage = `${npc.name} aggressively raises to $${npc.currentBetInRound}!`;
      } else {
        performBet(npc, chipsToCall, "call");
        notePlayerActed(npcIndex);
        actionMessage = `${npc.name} calls $${chipsToCall}.`;
      }
    } else if (currentBet === 0 || chipsToCall === 0) {
      notePlayerActed(npcIndex);
      actionMessage = `${npc.name} checks.`;
    } else {
      npc.folded = true;
      notePlayerActed(npcIndex);
      actionMessage = `${npc.name} folds.`;
    }
  }

  displayMessage(actionMessage);
  updatePlayerDisplays();
  updatePotDisplay();

  scheduleAction(moveToNextPlayer, 1500);
}

function performBet(player, amount, action) {
  const actualAmount = Math.min(player.chips, amount);
  player.chips -= actualAmount;
  pot += actualAmount;
  player.currentBetInRound += actualAmount;
}

// --- Very Basic Hand Strength (Placeholder - needs real poker logic) ---
function calculateHandStrength(holeCards, community) {
  const allCards = [...holeCards, ...community];
  if (allCards.length < 2) return 0;

  const ranksCount = {};
  for (const card of allCards) {
    ranksCount[card.rank] = (ranksCount[card.rank] || 0) + 1;
  }

  let pairs = 0;
  let threeOfAKind = 0;
  let fourOfAKind = 0;

  for (const rank in ranksCount) {
    if (ranksCount[rank] === 2) pairs++;
    if (ranksCount[rank] === 3) threeOfAKind++;
    if (ranksCount[rank] === 4) fourOfAKind++;
  }

  if (fourOfAKind) return 10;
  if (threeOfAKind && pairs) return 9;
  if (threeOfAKind) return 7;
  if (pairs >= 2) return 5;
  if (pairs === 1) return 3;

  const highestRank = Math.max(
    ...holeCards.map((card) => RANKS.indexOf(card.rank))
  );
  if (highestRank >= RANKS.indexOf("J")) return 2;
  if (highestRank >= RANKS.indexOf("T")) return 1;

  return 0;
}

// --- Showdown & Winner Determination ---
function showdown() {
  clearPendingTimer();
  displayMessage("Showdown! Revealing hands...");
  playerOptionsDiv.classList.add("hidden");

  let activePlayers = players.filter((p) => !p.folded);

  if (activePlayers.length === 0) {
    displayMessage(
      "No active players left? (Error/edge case) Starting new round."
    );
    scheduleAction(startNewRound, 3000);
    return;
  }

  if (activePlayers.length === 1) {
    const winner = activePlayers[0];
    winner.chips += pot;
    displayMessage(
      `${potWinPhrase(winner.name)} the pot of $${pot} because everyone else folded!`
    );
    updatePlayerDisplays();
    nextRoundBtn.classList.remove("hidden");
    return;
  }

  let bestStrength = -1;
  let winners = [];

  activePlayers.forEach((p) => {
    const handDisplay = p.playerArea.querySelector(".player-hand-display");
    handDisplay.innerHTML = p.hand
      .map((card) => `<div class="card">${formatCard(card)}</div>`)
      .join("");

    const strength = calculateHandStrength(p.hand, communityCards);
    displayMessage(`${p.name} hand strength: ${strength}`);

    if (strength > bestStrength) {
      bestStrength = strength;
      winners = [p];
    } else if (strength === bestStrength) {
      winners.push(p);
    }
  });

  if (winners.length === 1) {
    const winner = winners[0];
    winner.chips += pot;
    displayMessage(
      `${potWinPhrase(winner.name)} the pot of $${pot} with a hand strength of ${bestStrength}!`
    );
  } else {
    const share = Math.floor(pot / winners.length);
    winners.forEach((w) => {
      w.chips += share;
    });
    displayMessage(
      `It's a tie! ${winners
        .map((w) => w.name)
        .join(", ")} split the pot of $${pot}. Each gets $${share}.`
    );
  }

  updatePlayerDisplays();
  nextRoundBtn.classList.remove("hidden");
}

// --- UI Update Functions ---
function updatePlayerDisplays() {
  players.forEach((p) => {
    const playerInfoDiv = p.playerArea.querySelector(".player-info");
    const playerChipsSpan = playerInfoDiv.querySelector(".player-chips");
    playerChipsSpan.textContent = `$${p.chips}`;

    const handDisplay = p.playerArea.querySelector(".player-hand-display");
    if (p.chips <= 0 && p.hand.length === 0) {
      handDisplay.innerHTML = "";
    } else if (p.isHuman) {
      handDisplay.innerHTML = p.hand
        .map((card) => `<div class="card">${formatCard(card)}</div>`)
        .join("");
    } else if (bettingRound === "showdown" && !p.folded) {
      handDisplay.innerHTML = p.hand
        .map((card) => `<div class="card">${formatCard(card)}</div>`)
        .join("");
    } else if (p.hand.length > 0 && !p.folded) {
      handDisplay.innerHTML = `<div class="card hidden"></div><div class="card hidden"></div>`;
    } else {
      handDisplay.innerHTML = "";
    }

    if (p.folded || p.chips <= 0) {
      p.playerArea.classList.add("folded");
    } else {
      p.playerArea.classList.remove("folded");
    }
  });
}

function updatePotDisplay() {
  potDisplay.textContent = `Pot: $${pot}`;
}

function updateCommunityCardsDisplay() {
  communityCardsDiv.innerHTML = "";
  communityCards.forEach((card) => {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");
    cardDiv.textContent = formatCard(card);
    communityCardsDiv.appendChild(cardDiv);
  });
}

function potWinPhrase(name) {
  return name === "You" ? "You win" : `${name} wins`;
}

function displayMessage(message) {
  gameMessagesDiv.textContent = message;
}

// --- Event Listeners ---
startGameBtn.addEventListener("click", startGame);
nextRoundBtn.addEventListener("click", () => {
  clearPendingTimer();
  startNewRound();
});

foldBtn.addEventListener("click", () => handlePlayerAction("fold"));
checkCallBtn.addEventListener("click", () => {
  if (
    currentBet === 0 ||
    players[currentPlayerIndex].currentBetInRound === currentBet
  ) {
    handlePlayerAction("check");
  } else {
    handlePlayerAction("call");
  }
});
betRaiseBtn.addEventListener("click", () => {
  if (
    currentBet === 0 ||
    players[currentPlayerIndex].currentBetInRound === currentBet
  ) {
    handlePlayerAction("bet", parseInt(betSlider.value));
  } else {
    handlePlayerAction("raise", parseInt(betSlider.value));
  }
});

// Initial setup
initGame();
