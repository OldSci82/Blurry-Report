// --- Game State Variables ---
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];

let deck = [];
let players = [];
let communityCards = [];
let pot = 0;
let dealerIndex = 0; // Index of the player with the dealer button
let currentPlayerIndex = 0;
let currentBet = 0; // The highest bet placed in the current betting round
let bettingRound = "pre-flop"; // pre-flop, flop, turn, river, showdown
let roundMessage = ""; // Message to display for the current round

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
  displayMessage("New round starting!");
  createDeck();
  shuffleDeck();
  communityCards = [];
  pot = 0;
  currentBet = 0;
  bettingRound = "pre-flop";

  // Reset player states
  players.forEach((p) => {
    p.hand = [];
    p.folded = false;
    p.currentBetInRound = 0;
    p.playerArea.classList.remove("active-player");
    // Clear previous hand display
    p.playerArea.querySelector(".player-hand-display").innerHTML = "";
  });

  // Rotate dealer button
  dealerIndex = (dealerIndex + 1) % players.length;

  // Small blind and Big blind positions
  const smallBlindIndex = (dealerIndex + 1) % players.length;
  const bigBlindIndex = (dealerIndex + 2) % players.length;
  const utgIndex = (dealerIndex + 3) % players.length; // Player after big blind starts pre-flop betting

  // Post blinds
  const smallBlindAmount = 5;
  const bigBlindAmount = 10;

  postBlind(players[smallBlindIndex], smallBlindAmount);
  postBlind(players[bigBlindIndex], bigBlindAmount);
  currentBet = bigBlindAmount; // The current bet to match is the big blind

  // Deal hole cards
  for (let i = 0; i < 2; i++) {
    players.forEach((p) => {
      p.hand.push(dealCard());
    });
  }

  updatePlayerDisplays();
  updateCommunityCardsDisplay();
  updatePotDisplay();

  // Set starting player for pre-flop (UTG)
  currentPlayerIndex = utgIndex;
  displayMessage(
    `It's ${players[currentPlayerIndex].name}'s turn. Starting pre-flop.`
  );
  setTimeout(handleTurn, 1000); // Small delay before first turn
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

  // Skip folded players
  if (player.folded) {
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
    setTimeout(() => npcTurn(player), 1500); // Give player time to read NPC actions
  }
}

function moveToNextPlayer() {
  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  // Check if betting round is over
  if (isBettingRoundOver()) {
    endBettingRound();
  } else {
    handleTurn();
  }
}

function isBettingRoundOver() {
  let activePlayers = players.filter((p) => !p.folded);
  if (activePlayers.length <= 1) return true; // Only one player left, round is over

  // All active players must have contributed equally to the current bet
  // OR have gone all-in (and contributed what they could up to currentBet)
  // AND must have had a chance to act on the currentBet
  let allPlayersActed = true;
  for (const player of activePlayers) {
    if (player.currentBetInRound < currentBet && player.chips > 0) {
      // Player hasn't matched the current bet and isn't all-in
      allPlayersActed = false;
      break;
    }
    // Also check if they've acted since the last raise/bet
    // This simplified version just checks currentBetInRound. A full game needs
    // to track 'last action player' for the round.
    // For now, if everyone has matched or folded/all-in, we assume it's over.
  }
  return allPlayersActed;
}

function endBettingRound() {
  // Collect all bets into the pot
  players.forEach((p) => {
    // In a real game, this is handled more granularly by the betting logic itself,
    // but for this basic version, we just ensure currentBetInRound is cleared
    // after being added to pot each time.
    // For simplicity, we just assume pot is updated as actions happen.
    p.currentBetInRound = 0; // Reset for next round
  });

  let activePlayersCount = players.filter((p) => !p.folded).length;

  if (activePlayersCount <= 1) {
    // Everyone else folded, one winner
    showdown();
    return;
  }

  // Advance the betting round
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
  currentBet = 0; // Reset current bet for the new round

  if (bettingRound === "showdown") {
    setTimeout(showdown, 2000);
  } else {
    // Start next betting round with the player to the left of the dealer (who is still active)
    let startingPlayerFound = false;
    let startIndex = (dealerIndex + 1) % players.length;
    for (let i = 0; i < players.length; i++) {
      const potentialPlayerIndex = (startIndex + i) % players.length;
      if (!players[potentialPlayerIndex].folded) {
        currentPlayerIndex = potentialPlayerIndex;
        startingPlayerFound = true;
        break;
      }
    }
    if (!startingPlayerFound) {
      // This shouldn't happen if activePlayersCount > 1
      showdown();
      return;
    }
    setTimeout(handleTurn, 1500);
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

  // Determine min/max for slider
  let minBet = currentBet - player.currentBetInRound; // Amount needed to call
  if (minBet < 0) minBet = 0; // If player already contributed more than currentBet
  const maxBet = player.chips;

  betSlider.min = minBet;
  betSlider.max = maxBet;
  betSlider.value = minBet; // Default to calling amount

  // Update button texts
  if (currentBet === 0 || player.currentBetInRound === currentBet) {
    checkCallBtn.textContent = "Check";
    betRaiseBtn.textContent = "Bet";
    betSlider.min = 0; // Can bet from 0 if checking
  } else {
    checkCallBtn.textContent = `Call ($${
      currentBet - player.currentBetInRound
    })`;
    betRaiseBtn.textContent = "Raise";
  }

  if (player.chips === 0) {
    // If player is all-in, disable actions except for maybe check/call if already matched
    betSlider.disabled = true;
    foldBtn.disabled = true;
    betRaiseBtn.disabled = true;
    if (player.currentBetInRound < currentBet) {
      checkCallBtn.disabled = true; // Cannot call if not enough chips
    } else {
      checkCallBtn.disabled = false; // Can still check if matched
    }
  } else {
    betSlider.disabled = false;
    foldBtn.disabled = false;
    betRaiseBtn.disabled = false;
    checkCallBtn.disabled = false; // Enable initially
  }

  // Update bet amount display
  betAmountSpan.textContent = `$${betSlider.value}`;
  betSlider.oninput = () => {
    betAmountSpan.textContent = `$${betSlider.value}`;
    // Disable bet/raise button if bet is too low
    if (
      betSlider.value < currentBet + 10 &&
      currentBet > 0 &&
      betSlider.value - player.currentBetInRound <
        currentBet - player.currentBetInRound + 10
    ) {
      // This is a simplified minimum raise.
      // A proper min raise is at least the previous raise amount (currentBet - previousBetInRound).
      // For now, if currentBet > 0, require a raise of at least currentBet + 10
      betRaiseBtn.disabled = true;
    } else {
      betRaiseBtn.disabled = false;
    }

    // If slider is less than currentBet, it can only be a fold or check/call
    if (betSlider.value < currentBet - player.currentBetInRound) {
      betRaiseBtn.disabled = true; // Cannot bet/raise if not matching
    }
  };
}

function handlePlayerAction(actionType, amount = 0) {
  const player = players[currentPlayerIndex];
  playerOptionsDiv.classList.add("hidden"); // Hide options after action

  let actualAmount = 0;

  switch (actionType) {
    case "fold":
      player.folded = true;
      displayMessage(`You folded.`);
      break;
    case "check":
      displayMessage(`You checked.`);
      break;
    case "call":
      actualAmount = currentBet - player.currentBetInRound;
      performBet(player, actualAmount, "call");
      displayMessage(`You called $${actualAmount}.`);
      break;
    case "bet":
    case "raise":
      actualAmount = parseInt(betSlider.value);
      // Ensure player can't bet more than they have
      actualAmount = Math.min(
        actualAmount,
        player.chips + player.currentBetInRound
      );
      if (
        actualAmount < currentBet &&
        actualAmount < player.chips + player.currentBetInRound
      ) {
        // Should be prevented by UI but as a fallback
        displayMessage("Invalid bet/raise amount.");
        showPlayerOptions(player); // Re-show options
        return;
      }
      performBet(player, actualAmount - player.currentBetInRound, actionType);
      currentBet = actualAmount; // Update current bet to player's new total contribution
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
  const handStrength = calculateHandStrength(npc.hand, communityCards); // Simplified strength
  const chipsToCall = currentBet - npc.currentBetInRound;
  const canAffordCall = npc.chips >= chipsToCall;
  const isBigBlind =
    players[(dealerIndex + 2) % players.length] === npc &&
    bettingRound === "pre-flop";

  let actionMessage = "";

  // --- Basic NPC Strategy ---
  // NPC 1 (Conservative)
  if (npc.name === "NPC 1") {
    if (chipsToCall > npc.chips) {
      // Cannot afford to call (all-in situation)
      actionMessage = `${npc.name} doesn't have enough to call and folds.`;
      npc.folded = true;
    } else if (handStrength > 7 || (handStrength > 4 && chipsToCall < 20)) {
      // Strong hand or decent and cheap to call
      if (currentBet === 0 || (handStrength > 8 && Math.random() < 0.6)) {
        // Check or bet/raise with strong hand
        let betAmount = Math.min(npc.chips, Math.max(currentBet * 1.5, 20)); // Bet/raise a reasonable amount
        performBet(npc, betAmount - npc.currentBetInRound, "raise");
        currentBet = npc.currentBetInRound;
        actionMessage = `${npc.name} raises to $${npc.currentBetInRound}!`;
      } else {
        performBet(npc, chipsToCall, "call");
        actionMessage = `${npc.name} calls $${chipsToCall}.`;
      }
    } else if (currentBet === 0 || (isBigBlind && chipsToCall === 0)) {
      // Check if possible
      actionMessage = `${npc.name} checks.`;
    } else {
      // Weak hand, or too expensive to call
      actionMessage = `${npc.name} folds.`;
      npc.folded = true;
    }
  }
  // NPC 2 (Aggressive)
  else if (npc.name === "NPC 2") {
    if (chipsToCall > npc.chips) {
      actionMessage = `${npc.name} doesn't have enough to call and folds.`;
      npc.folded = true;
    } else if (handStrength > 6 || (handStrength > 3 && Math.random() < 0.4)) {
      // Decent hand or semi-bluff
      if (currentBet === 0 || Math.random() < 0.7) {
        // Bet/Raise more often
        let betAmount = Math.min(
          npc.chips,
          Math.max(currentBet * 2, 25 + Math.floor(Math.random() * 15))
        );
        performBet(npc, betAmount - npc.currentBetInRound, "raise");
        currentBet = npc.currentBetInRound;
        actionMessage = `${npc.name} aggressively raises to $${npc.currentBetInRound}!`;
      } else {
        performBet(npc, chipsToCall, "call");
        actionMessage = `${npc.name} calls $${chipsToCall}.`;
      }
    } else if (currentBet === 0 || (isBigBlind && chipsToCall === 0)) {
      actionMessage = `${npc.name} checks.`;
    } else {
      actionMessage = `${npc.name} folds.`;
      npc.folded = true;
    }
  }

  displayMessage(actionMessage);
  updatePlayerDisplays();
  updatePotDisplay();

  // After a short delay, move to the next player
  setTimeout(moveToNextPlayer, 1500);
}

function performBet(player, amount, action) {
  const actualAmount = Math.min(player.chips, amount);
  player.chips -= actualAmount;
  pot += actualAmount;
  player.currentBetInRound += actualAmount;
  // For betting/raising, currentBet needs to be updated by the caller of this function
  // For calling, currentBet is already set
}

// --- Very Basic Hand Strength (Placeholder - needs real poker logic) ---
// This is a highly simplified heuristic. A real game needs a full hand evaluation algorithm.
function calculateHandStrength(holeCards, community) {
  const allCards = [...holeCards, ...community];
  if (allCards.length < 2) return 0; // Not enough cards yet

  // Just check for pairs and high cards for now
  const ranksCount = {};
  for (const card of allCards) {
    ranksCount[card.rank] = (ranksCount[card.rank] || 0) + 1;
  }

  let strength = 0;
  let pairs = 0;
  let threeOfAKind = 0;
  let fourOfAKind = 0;

  for (const rank in ranksCount) {
    if (ranksCount[rank] === 2) pairs++;
    if (ranksCount[rank] === 3) threeOfAKind++;
    if (ranksCount[rank] === 4) fourOfAKind++;
  }

  if (fourOfAKind) return 10; // Quads
  if (threeOfAKind && pairs) return 9; // Full House (simplified, might not be true from any three of a kind and a pair)
  if (threeOfAKind) return 7; // Three of a kind
  if (pairs >= 2) return 5; // Two pair
  if (pairs === 1) return 3; // One pair

  // Check for high card based on ranks in hand
  const highestRank = Math.max(
    ...holeCards.map((card) => RANKS.indexOf(card.rank))
  );
  if (highestRank >= RANKS.indexOf("J")) return 2; // Jack or higher
  if (highestRank >= RANKS.indexOf("T")) return 1; // Ten or higher

  return 0; // No significant hand
}

// --- Showdown & Winner Determination ---
function showdown() {
  displayMessage("Showdown! Revealing hands...");
  playerOptionsDiv.classList.add("hidden"); // Ensure player options are hidden

  let activePlayers = players.filter((p) => !p.folded);

  if (activePlayers.length === 0) {
    displayMessage(
      "No active players left? (Error/edge case) Starting new round."
    );
    setTimeout(startNewRound, 3000);
    return;
  }

  if (activePlayers.length === 1) {
    const winner = activePlayers[0];
    winner.chips += pot;
    displayMessage(
      `${winner.name} wins the pot of $${pot} because everyone else folded!`
    );
    updatePlayerDisplays();
    nextRoundBtn.classList.remove("hidden");
    return;
  }

  // --- VERY SIMPLIFIED WINNER LOGIC ---
  // In a real game, you need a full poker hand evaluator here (e.g., detect straight, flush, etc.)
  // For this basic version, we'll just use our simplified hand strength and pick the best one.
  let bestStrength = -1;
  let winners = [];

  activePlayers.forEach((p) => {
    // For actual showdown, display all hole cards
    const handDisplay = p.playerArea.querySelector(".player-hand-display");
    handDisplay.innerHTML = p.hand
      .map((card) => `<div class="card">${card.rank}${card.suit}</div>`)
      .join("");

    const strength = calculateHandStrength(p.hand, communityCards);
    displayMessage(`${p.name} hand strength: ${strength}`); // For debugging/explanation

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
      `${winner.name} wins the pot of $${pot} with a hand strength of ${bestStrength}!`
    );
  } else {
    // Handle ties (split pot) - simplified: just split equally
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
    if (p.isHuman) {
      handDisplay.innerHTML = p.hand
        .map((card) => `<div class="card">${card.rank}${card.suit}</div>`)
        .join("");
    } else if (bettingRound === "showdown") {
      // Show NPC cards only at showdown
      handDisplay.innerHTML = p.hand
        .map((card) => `<div class="card">${card.rank}${card.suit}</div>`)
        .join("");
    } else {
      handDisplay.innerHTML = `<div class="card hidden"></div><div class="card hidden"></div>`;
    }

    // Add 'folded' visual cue (optional)
    if (p.folded) {
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
    cardDiv.textContent = `${card.rank}${card.suit}`;
    communityCardsDiv.appendChild(cardDiv);
  });
}

function displayMessage(message) {
  gameMessagesDiv.textContent = message;
}

// --- Event Listeners ---
startGameBtn.addEventListener("click", startGame);
nextRoundBtn.addEventListener("click", startNewRound);

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
