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

// Blinds / min-raise (simple cash-game style: min raise = last bet/raise size or BB)
const SMALL_BLIND = 5;
const BIG_BLIND = 10;
let minRaiseSize = BIG_BLIND; // chips added by the last full bet/raise this street

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
const betSliderLabel = document.getElementById("bet-slider-label");
const callAmountLabel = document.getElementById("call-amount-label");
const raiseToLabel = document.getElementById("raise-to-label");
const allinLabel = document.getElementById("allin-label");
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
      totalContribution: 0, // chips put into pots this hand (for side pots)
      playerArea: document.querySelector(".player-bottom-left"),
    },
    {
      name: "NPC 1",
      chips: 100,
      hand: [],
      isHuman: false,
      folded: false,
      currentBetInRound: 0,
      totalContribution: 0,
      playerArea: document.querySelector(".player-top-left"),
    },
    {
      name: "NPC 2",
      chips: 100,
      hand: [],
      isHuman: false,
      folded: false,
      currentBetInRound: 0,
      totalContribution: 0,
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
  minRaiseSize = BIG_BLIND;
  bettingRound = "pre-flop";
  playersActedThisRound = new Set();

  // Reset player states; busted (0 chips) stay out of this hand
  players.forEach((p) => {
    p.hand = [];
    p.folded = p.chips <= 0; // eliminate / skip broke seats
    p.currentBetInRound = 0;
    p.totalContribution = 0;
    p._lastShowdownHand = null;
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

  postBlind(players[smallBlindIndex], SMALL_BLIND);
  postBlind(players[bigBlindIndex], BIG_BLIND);
  currentBet = BIG_BLIND;
  minRaiseSize = BIG_BLIND; // next raise must be at least one BB more
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
  player.totalContribution += actualAmount;
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
  minRaiseSize = BIG_BLIND;

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
/**
 * Slider convention: RAISE-TO / BET-TO = total contribution THIS STREET.
 * Call is a separate button (never driven by the slider).
 * Max = chips remaining + already contributed this street (true all-in).
 */
function streetAllInTotal(player) {
  return player.chips + player.currentBetInRound;
}

function chipsToCallAmount(player) {
  return Math.max(0, currentBet - player.currentBetInRound);
}

/** Minimum legal bet/raise-to total this street (or short all-in total). */
function minRaiseToTotal(player) {
  const maxTotal = streetAllInTotal(player);
  if (maxTotal <= 0) return 0;
  if (currentBet === 0) {
    // Opening bet: at least one big blind (or all-in if short)
    return Math.min(maxTotal, BIG_BLIND);
  }
  // Raise: at least previous raise size more than currentBet
  const fullMin = currentBet + minRaiseSize;
  return Math.min(maxTotal, fullMin);
}

function updateBetLiveLabels(player) {
  const toCall = chipsToCallAmount(player);
  const maxTotal = streetAllInTotal(player);
  const raiseTo = parseInt(betSlider.value, 10) || 0;
  const opening = currentBet === 0;

  if (toCall > 0) {
    callAmountLabel.textContent = `Call: $${toCall}`;
    callAmountLabel.classList.remove("hidden");
  } else {
    callAmountLabel.textContent = "Call: —";
    callAmountLabel.classList.add("hidden");
  }

  if (opening) {
    raiseToLabel.textContent = `Bet to: $${raiseTo} total this round`;
    betSliderLabel.textContent = "Bet to (total this round)";
  } else {
    raiseToLabel.textContent = `Raise to: $${raiseTo} total this round`;
    betSliderLabel.textContent = "Raise to (total this round)";
  }

  const atAllIn = raiseTo >= maxTotal && maxTotal > 0;
  if (atAllIn) {
    allinLabel.textContent = `All-in ($${maxTotal})`;
    allinLabel.classList.remove("hidden");
  } else {
    allinLabel.textContent = "";
    allinLabel.classList.add("hidden");
  }

  betAmountSpan.textContent = `$${raiseTo}`;
}

function showPlayerOptions(player) {
  playerOptionsDiv.classList.remove("hidden");

  const toCall = chipsToCallAmount(player);
  const maxTotal = streetAllInTotal(player);
  const canCheck = toCall === 0;
  const opening = currentBet === 0;
  const minTo = minRaiseToTotal(player);
  // Can raise/bet if we can put more in than just matching currentBet
  const canRaise = maxTotal > currentBet && player.chips > 0;
  // Short all-in above call but below full min raise still allowed via slider max
  const canOnlyShove =
    canRaise && maxTotal < (opening ? BIG_BLIND : currentBet + minRaiseSize);

  if (canCheck) {
    checkCallBtn.textContent = "Check";
  } else {
    checkCallBtn.textContent = `Call $${toCall}`;
  }

  if (opening) {
    betRaiseBtn.textContent = canOnlyShove
      ? `All-in $${maxTotal}`
      : "Bet";
  } else {
    betRaiseBtn.textContent = canOnlyShove
      ? `All-in $${maxTotal}`
      : "Raise";
  }

  // Slider = total contribution this street (raise-to / bet-to)
  betSlider.min = minTo;
  betSlider.max = Math.max(minTo, maxTotal);
  betSlider.value = minTo;

  if (player.chips === 0) {
    betSlider.disabled = true;
    foldBtn.disabled = true;
    betRaiseBtn.disabled = true;
    checkCallBtn.disabled = toCall > 0; // already all-in; nothing to do
  } else {
    foldBtn.disabled = false;
    checkCallBtn.disabled = false;
    betSlider.disabled = !canRaise;
    betRaiseBtn.disabled = !canRaise;
  }

  updateBetLiveLabels(player);
  betSlider.oninput = () => {
    updateBetLiveLabels(player);
    const val = parseInt(betSlider.value, 10) || 0;
    const fullMin = opening ? BIG_BLIND : currentBet + minRaiseSize;
    // Allow short all-in; otherwise require full min raise-to
    const legal =
      canRaise &&
      (val >= fullMin || val >= maxTotal);
    betRaiseBtn.disabled = !legal;
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
      actualAmount = Math.min(
        player.chips,
        currentBet - player.currentBetInRound
      );
      performBet(player, actualAmount, "call");
      notePlayerActed(playerIndex);
      displayMessage(
        player.chips === 0
          ? `You go all-in calling $${actualAmount}!`
          : `You called $${actualAmount}.`
      );
      break;
    case "bet":
    case "raise": {
      // Slider value = total contribution this street ("raise to" / "bet to")
      actualAmount = parseInt(betSlider.value, 10);
      const maxTotal = streetAllInTotal(player);
      actualAmount = Math.min(actualAmount, maxTotal);
      const fullMin = currentBet === 0 ? BIG_BLIND : currentBet + minRaiseSize;
      const isAllIn = actualAmount >= maxTotal;
      if (
        actualAmount <= currentBet ||
        (!isAllIn && actualAmount < fullMin)
      ) {
        displayMessage("Invalid bet/raise amount.");
        showPlayerOptions(player);
        return;
      }
      const prevBet = currentBet;
      performBet(player, actualAmount - player.currentBetInRound, actionType);
      const newTotal = player.currentBetInRound;
      const raiseBy = newTotal - prevBet;
      currentBet = newTotal;
      // Full min-raise updates the minimum for the next raiser; short all-in does not
      if (raiseBy >= minRaiseSize) {
        minRaiseSize = raiseBy;
      }
      noteAggression(playerIndex);
      displayMessage(
        player.chips === 0
          ? `You go all-in — $${newTotal} total this round!`
          : `You ${actionType === "bet" ? "bet" : "raised"} to $${newTotal} total this round.`
      );
      break;
    }
  }
  updatePlayerDisplays();
  updatePotDisplay();
  moveToNextPlayer();
}

// --- NPC Logic (Simplified) ---
/** Apply a bet/raise-to total this street; updates currentBet + minRaiseSize. */
function npcBetOrRaiseTo(npc, targetTotal) {
  const maxTotal = streetAllInTotal(npc);
  let raiseTo = Math.min(Math.floor(targetTotal), maxTotal);
  const fullMin = currentBet === 0 ? BIG_BLIND : currentBet + minRaiseSize;
  // If they planned a raise but can't meet min and aren't shoving past current, just call
  if (raiseTo <= currentBet) {
    return false;
  }
  if (raiseTo < fullMin && raiseTo < maxTotal) {
    raiseTo = Math.min(maxTotal, fullMin);
  }
  if (raiseTo <= currentBet) return false;

  const prevBet = currentBet;
  performBet(npc, raiseTo - npc.currentBetInRound, "raise");
  const newTotal = npc.currentBetInRound;
  const raiseBy = newTotal - prevBet;
  currentBet = newTotal;
  if (raiseBy >= minRaiseSize) {
    minRaiseSize = raiseBy;
  }
  return true;
}

function npcTurn(npc) {
  const npcIndex = players.indexOf(npc);
  const handStrength = evaluateBestHand(npc.hand, communityCards).category;
  const chipsToCall = chipsToCallAmount(npc);
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
    if (handStrength >= 6 || (handStrength >= 2 && chipsToCall < 20)) {
      if (currentBet === 0 || (handStrength >= 6 && Math.random() < 0.6)) {
        const target = Math.max(currentBet === 0 ? BIG_BLIND : currentBet + minRaiseSize, currentBet * 1.5, 20);
        if (npcBetOrRaiseTo(npc, target)) {
          noteAggression(npcIndex);
          actionMessage =
            npc.chips === 0
              ? `${npc.name} goes all-in — $${npc.currentBetInRound} total this round!`
              : `${npc.name} raises to $${npc.currentBetInRound} total this round!`;
        } else if (chipsToCall > 0) {
          performBet(npc, chipsToCall, "call");
          notePlayerActed(npcIndex);
          actionMessage = `${npc.name} calls $${chipsToCall}.`;
        } else {
          notePlayerActed(npcIndex);
          actionMessage = `${npc.name} checks.`;
        }
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
    if (handStrength >= 4 || (handStrength >= 1 && Math.random() < 0.4)) {
      if (currentBet === 0 || Math.random() < 0.7) {
        const target = Math.max(
          currentBet === 0 ? BIG_BLIND : currentBet + minRaiseSize,
          currentBet * 2,
          25 + Math.floor(Math.random() * 15)
        );
        if (npcBetOrRaiseTo(npc, target)) {
          noteAggression(npcIndex);
          actionMessage =
            npc.chips === 0
              ? `${npc.name} goes all-in — $${npc.currentBetInRound} total this round!`
              : `${npc.name} aggressively raises to $${npc.currentBetInRound} total this round!`;
        } else if (chipsToCall > 0) {
          performBet(npc, chipsToCall, "call");
          notePlayerActed(npcIndex);
          actionMessage = `${npc.name} calls $${chipsToCall}.`;
        } else {
          notePlayerActed(npcIndex);
          actionMessage = `${npc.name} checks.`;
        }
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
  player.totalContribution += actualAmount;
}

// --- Texas Hold'em Hand Evaluation (best 5 of up to 7) ---
const HAND_CATEGORY = {
  HIGH_CARD: 0,
  PAIR: 1,
  TWO_PAIR: 2,
  THREE_OF_A_KIND: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  FOUR_OF_A_KIND: 7,
  STRAIGHT_FLUSH: 8,
  ROYAL_FLUSH: 9,
};

const HAND_CATEGORY_NAME = [
  "high card",
  "pair",
  "two pair",
  "three of a kind",
  "straight",
  "flush",
  "full house",
  "four of a kind",
  "straight flush",
  "royal flush",
];

function rankValue(rank) {
  return RANKS.indexOf(rank); // 0=2 ... 12=A
}

/** Score a exact 5-card hand. Returns { category, tiebreakers, name }. */
function scoreFiveCardHand(cards) {
  const values = cards.map((c) => rankValue(c.rank)).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);

  const counts = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;

  // Groups sorted by (count desc, rank desc)
  const groups = Object.keys(counts)
    .map((v) => ({ value: Number(v), count: counts[v] }))
    .sort((a, b) => b.count - a.count || b.value - a.value);

  const isFlush = suits.every((s) => s === suits[0]);

  // Straight detection (incl. wheel A-2-3-4-5)
  const unique = [...new Set(values)].sort((a, b) => b - a);
  let straightHigh = -1;
  if (unique.length === 5 && unique[0] - unique[4] === 4) {
    straightHigh = unique[0];
  } else if (
    unique.length === 5 &&
    unique[0] === 12 &&
    unique[1] === 3 &&
    unique[2] === 2 &&
    unique[3] === 1 &&
    unique[4] === 0
  ) {
    // A,5,4,3,2 -> wheel; high card for ranking is 5 (value 3)
    straightHigh = 3;
  }

  const isStraight = straightHigh >= 0;

  if (isStraight && isFlush) {
    if (straightHigh === 12) {
      return {
        category: HAND_CATEGORY.ROYAL_FLUSH,
        tiebreakers: [12],
        name: HAND_CATEGORY_NAME[HAND_CATEGORY.ROYAL_FLUSH],
      };
    }
    return {
      category: HAND_CATEGORY.STRAIGHT_FLUSH,
      tiebreakers: [straightHigh],
      name: HAND_CATEGORY_NAME[HAND_CATEGORY.STRAIGHT_FLUSH],
    };
  }

  if (groups[0].count === 4) {
    const kicker = groups[1].value;
    return {
      category: HAND_CATEGORY.FOUR_OF_A_KIND,
      tiebreakers: [groups[0].value, kicker],
      name: HAND_CATEGORY_NAME[HAND_CATEGORY.FOUR_OF_A_KIND],
    };
  }

  if (groups[0].count === 3 && groups[1] && groups[1].count === 2) {
    return {
      category: HAND_CATEGORY.FULL_HOUSE,
      tiebreakers: [groups[0].value, groups[1].value],
      name: HAND_CATEGORY_NAME[HAND_CATEGORY.FULL_HOUSE],
    };
  }

  if (isFlush) {
    return {
      category: HAND_CATEGORY.FLUSH,
      tiebreakers: values,
      name: HAND_CATEGORY_NAME[HAND_CATEGORY.FLUSH],
    };
  }

  if (isStraight) {
    return {
      category: HAND_CATEGORY.STRAIGHT,
      tiebreakers: [straightHigh],
      name: HAND_CATEGORY_NAME[HAND_CATEGORY.STRAIGHT],
    };
  }

  if (groups[0].count === 3) {
    const kickers = groups.slice(1).map((g) => g.value);
    return {
      category: HAND_CATEGORY.THREE_OF_A_KIND,
      tiebreakers: [groups[0].value, ...kickers],
      name: HAND_CATEGORY_NAME[HAND_CATEGORY.THREE_OF_A_KIND],
    };
  }

  if (groups[0].count === 2 && groups[1] && groups[1].count === 2) {
    const highPair = Math.max(groups[0].value, groups[1].value);
    const lowPair = Math.min(groups[0].value, groups[1].value);
    const kicker = groups[2] ? groups[2].value : -1;
    return {
      category: HAND_CATEGORY.TWO_PAIR,
      tiebreakers: [highPair, lowPair, kicker],
      name: HAND_CATEGORY_NAME[HAND_CATEGORY.TWO_PAIR],
    };
  }

  if (groups[0].count === 2) {
    const kickers = groups.slice(1).map((g) => g.value);
    return {
      category: HAND_CATEGORY.PAIR,
      tiebreakers: [groups[0].value, ...kickers],
      name: HAND_CATEGORY_NAME[HAND_CATEGORY.PAIR],
    };
  }

  return {
    category: HAND_CATEGORY.HIGH_CARD,
    tiebreakers: values,
    name: HAND_CATEGORY_NAME[HAND_CATEGORY.HIGH_CARD],
  };
}

function combinations(arr, k) {
  const result = [];
  function helper(start, combo) {
    if (combo.length === k) {
      result.push(combo.slice());
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  }
  helper(0, []);
  return result;
}

/** Compare two evaluated hands: >0 if a better, <0 if b better, 0 if tie. */
function compareEvaluatedHands(a, b) {
  if (a.category !== b.category) return a.category - b.category;
  const len = Math.max(a.tiebreakers.length, b.tiebreakers.length);
  for (let i = 0; i < len; i++) {
    const av = a.tiebreakers[i] ?? -1;
    const bv = b.tiebreakers[i] ?? -1;
    if (av !== bv) return av - bv;
  }
  return 0;
}

/**
 * Best 5-card hand from hole + community (2–7 cards).
 * With fewer than 5 cards, scores whatever is available (preflop/early).
 */
function evaluateBestHand(holeCards, community) {
  const allCards = [...holeCards, ...community];
  if (allCards.length === 0) {
    return {
      category: -1,
      tiebreakers: [],
      name: "no cards",
    };
  }

  if (allCards.length <= 5) {
    // Pad conceptually: score with what we have using the 5-card scorer
    // by only using available cards — for NPC preflop we need pair/high detection.
    return scorePartialHand(allCards);
  }

  let best = null;
  for (const five of combinations(allCards, 5)) {
    const scored = scoreFiveCardHand(five);
    if (!best || compareEvaluatedHands(scored, best) > 0) best = scored;
  }
  return best;
}

/** Score <5 cards for NPC decisions (pair / trips / high card only). */
function scorePartialHand(cards) {
  const values = cards.map((c) => rankValue(c.rank)).sort((a, b) => b - a);
  const counts = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;
  const groups = Object.keys(counts)
    .map((v) => ({ value: Number(v), count: counts[v] }))
    .sort((a, b) => b.count - a.count || b.value - a.value);

  if (groups[0] && groups[0].count === 4) {
    return {
      category: HAND_CATEGORY.FOUR_OF_A_KIND,
      tiebreakers: [groups[0].value],
      name: HAND_CATEGORY_NAME[HAND_CATEGORY.FOUR_OF_A_KIND],
    };
  }
  if (groups[0] && groups[0].count === 3 && groups[1] && groups[1].count >= 2) {
    return {
      category: HAND_CATEGORY.FULL_HOUSE,
      tiebreakers: [groups[0].value, groups[1].value],
      name: HAND_CATEGORY_NAME[HAND_CATEGORY.FULL_HOUSE],
    };
  }
  if (groups[0] && groups[0].count === 3) {
    return {
      category: HAND_CATEGORY.THREE_OF_A_KIND,
      tiebreakers: [groups[0].value, ...values.filter((v) => v !== groups[0].value)],
      name: HAND_CATEGORY_NAME[HAND_CATEGORY.THREE_OF_A_KIND],
    };
  }
  const pairGroups = groups.filter((g) => g.count === 2);
  if (pairGroups.length >= 2) {
    const highPair = Math.max(pairGroups[0].value, pairGroups[1].value);
    const lowPair = Math.min(pairGroups[0].value, pairGroups[1].value);
    const kicker = groups.find((g) => g.count === 1);
    return {
      category: HAND_CATEGORY.TWO_PAIR,
      tiebreakers: [highPair, lowPair, kicker ? kicker.value : -1],
      name: HAND_CATEGORY_NAME[HAND_CATEGORY.TWO_PAIR],
    };
  }
  if (pairGroups.length === 1) {
    return {
      category: HAND_CATEGORY.PAIR,
      tiebreakers: [
        pairGroups[0].value,
        ...values.filter((v) => v !== pairGroups[0].value),
      ],
      name: HAND_CATEGORY_NAME[HAND_CATEGORY.PAIR],
    };
  }
  return {
    category: HAND_CATEGORY.HIGH_CARD,
    tiebreakers: values,
    name: HAND_CATEGORY_NAME[HAND_CATEGORY.HIGH_CARD],
  };
}

// --- Showdown & Side Pots ---
/**
 * Build main + side pots from each player's totalContribution this hand.
 * Layer algorithm: sort unique contribution amounts; each layer is contested
 * only by players who put in at least that much (folded players cannot win
 * but their chips stay in the pot). Odd chips on a split go to the earliest
 * seat among tied winners (players[] order).
 */
function buildSidePots() {
  const levels = [
    ...new Set(
      players
        .filter((p) => p.totalContribution > 0)
        .map((p) => p.totalContribution)
    ),
  ].sort((a, b) => a - b);

  const pots = [];
  let prev = 0;
  for (const level of levels) {
    const layerSize = level - prev;
    if (layerSize <= 0) continue;
    const contributors = players.filter((p) => p.totalContribution >= level);
    const amount = layerSize * contributors.length;
    const eligible = contributors.filter((p) => !p.folded);
    if (amount > 0) {
      pots.push({ amount, eligible, level });
    }
    prev = level;
  }
  return pots;
}

/** Split amount among winners; odd chips go to earliest seats in players[]. */
function awardPotChips(amount, winners) {
  if (!winners.length || amount <= 0) return;
  // Seat order for odd-chip priority
  const ordered = [...winners].sort(
    (a, b) => players.indexOf(a) - players.indexOf(b)
  );
  const share = Math.floor(amount / ordered.length);
  let remainder = amount - share * ordered.length;
  ordered.forEach((w) => {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder--;
    w.chips += share + extra;
  });
}

function winnersAmongEligible(eligible) {
  if (eligible.length === 0) return [];
  if (eligible.length === 1) return eligible.slice();

  let bestHand = null;
  const winners = [];
  for (const p of eligible) {
    const evaluated =
      p._lastShowdownHand || evaluateBestHand(p.hand, communityCards);
    p._lastShowdownHand = evaluated;
    if (!bestHand || compareEvaluatedHands(evaluated, bestHand) > 0) {
      bestHand = evaluated;
      winners.length = 0;
      winners.push(p);
    } else if (compareEvaluatedHands(evaluated, bestHand) === 0) {
      winners.push(p);
    }
  }
  return winners;
}

function showdown() {
  clearPendingTimer();
  displayMessage("Showdown! Settling pots...");
  playerOptionsDiv.classList.add("hidden");

  const activePlayers = players.filter((p) => !p.folded);

  if (activePlayers.length === 0) {
    displayMessage(
      "No active players left? (Error/edge case) Starting new round."
    );
    scheduleAction(startNewRound, 3000);
    return;
  }

  const sidePots = buildSidePots();
  if (sidePots.length === 0) {
    displayMessage("No pot to award. Starting new round.");
    scheduleAction(startNewRound, 3000);
    return;
  }

  // Reveal hands for anyone who may need a showdown (eligible in a multi-way pot)
  const needsReveal = new Set();
  for (const potInfo of sidePots) {
    if (potInfo.eligible.length > 1) {
      potInfo.eligible.forEach((p) => needsReveal.add(p));
    }
  }
  needsReveal.forEach((p) => {
    const handDisplay = p.playerArea.querySelector(".player-hand-display");
    handDisplay.innerHTML = p.hand
      .map((card) => `<div class="card">${formatCard(card)}</div>`)
      .join("");
    p._lastShowdownHand = evaluateBestHand(p.hand, communityCards);
  });

  const messages = [];
  const multiPot = sidePots.length > 1;

  sidePots.forEach((potInfo, idx) => {
    const label = multiPot
      ? idx === 0
        ? "main pot"
        : `side pot ${idx}`
      : "pot";
    const { amount } = potInfo;
    // If every contributor at this layer folded (rare: fold when able to check),
    // fall back to any still-active players so chips are never stranded.
    let eligible = potInfo.eligible;
    if (eligible.length === 0) {
      eligible = activePlayers;
    }

    if (eligible.length === 1) {
      const winner = eligible[0];
      awardPotChips(amount, [winner]);
      messages.push(
        `${potWinPhrase(winner.name)} the ${label} of $${amount}${
          activePlayers.length === 1 ? " because everyone else folded" : " (uncontested)"
        }!`
      );
      return;
    }

    const winners = winnersAmongEligible(eligible);
    const handName = winners[0]._lastShowdownHand
      ? winners[0]._lastShowdownHand.name
      : "their hand";

    if (winners.length === 1) {
      awardPotChips(amount, winners);
      messages.push(
        `${potWinPhrase(winners[0].name)} the ${label} of $${amount} with a ${handName}!`
      );
    } else {
      awardPotChips(amount, winners);
      const share = Math.floor(amount / winners.length);
      messages.push(
        `Tie (${handName}) on the ${label} of $${amount}: ${winners
          .map((w) => w.name)
          .join(", ")} split (~$${share} each; odd chips to earliest seat).`
      );
    }
  });

  // Chip conservation: side-pot amounts must equal contributions; awardPotChips
  // already gives odd split chips to earliest seats. If anything is still left
  // in `pot` (should be 0), hand remainder to earliest still-active seat.
  const distributed = sidePots.reduce((s, p) => s + p.amount, 0);
  let leftover = pot - distributed;
  if (leftover > 0) {
    const fallback = activePlayers.slice().sort(
      (a, b) => players.indexOf(a) - players.indexOf(b)
    );
    if (fallback.length) {
      awardPotChips(leftover, fallback);
      messages.push(
        `$${leftover} leftover chip(s) awarded by seat order.`
      );
    }
  }
  pot = 0;
  displayMessage(messages.join(" "));
  updatePlayerDisplays();
  updatePotDisplay();
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
