import { CAT_ASSETS } from './assets/cats.js';
import { MAX_BET, MIN_BET, clampBet, decrementBet, incrementBet } from './game/bet.js';
import { BANKROLL_BASE, canTopOff, formatBankroll, topOff } from './game/bankroll.js';
import { PAYLINES, createReelStrip, evaluateSpin, spinReels } from './game/reels.js';

let bankroll = BANKROLL_BASE;

const reelStrip = createReelStrip(CAT_ASSETS);

const reelsEl = document.getElementById('reels');
const betInputEl = document.getElementById('bet');
const betDownButtonEl = document.getElementById('betDownButton');
const betUpButtonEl = document.getElementById('betUpButton');
const betMaxButtonEl = document.getElementById('betMaxButton');
const spinButtonEl = document.getElementById('spinButton');
const topOffButtonEl = document.getElementById('topOffButton');
const resultEl = document.getElementById('result');
const bankrollEl = document.getElementById('bankroll');

const REEL_COLUMNS = 3;
const REEL_ROWS = 3;
const REEL_COUNT = REEL_COLUMNS * REEL_ROWS;
const SPIN_FRAMES_PER_REEL = Array.from({ length: REEL_COUNT }, (_, i) => 16 + i * 3);
const FRAME_DURATION_MS = 160;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function emojiFallback(symbol) {
  return symbol.type === 'faceCloseUp' ? '😺' : '🐈';
}

function renderSymbols(symbols, options = {}) {
  const { spinning = false, settlingReel = null, winningLineIds = [] } = options;
  const winningLineIdSet = new Set(winningLineIds);
  reelsEl.innerHTML = '';
  for (let i = 0; i < symbols.length; i += 1) {
    const symbol = symbols[i];
    const card = document.createElement('article');
    card.className = 'symbol-card';
    card.classList.add(`symbol-${symbol.type}`);
    if (spinning) {
      card.classList.add('is-spinning');
    }
    if (settlingReel === i) {
      card.classList.add('is-settling');
    }

    for (const payline of PAYLINES) {
      if (winningLineIdSet.has(payline.id) && payline.indexes.includes(i)) {
        card.classList.add('win-line');
        card.classList.add(`win-line-${payline.id}`);
      }
    }

    const img = document.createElement('img');
    img.src = symbol.image;
    img.alt = symbol.label;
    img.loading = 'lazy';
    img.onerror = () => {
      img.style.display = 'none';
      fallback.style.display = 'grid';
    };

    const fallback = document.createElement('div');
    fallback.className = 'fallback';
    fallback.style.display = 'none';
    fallback.textContent = `${emojiFallback(symbol)} ${symbol.label}`;

    const caption = document.createElement('div');
    caption.className = 'caption';
    caption.textContent = symbol.label;

    card.append(img, fallback, caption);
    reelsEl.appendChild(card);
  }
}

function updateBankroll() {
  bankrollEl.textContent = formatBankroll(bankroll);
  topOffButtonEl.disabled = !canTopOff(bankroll);
}

function updateBetInput(value) {
  const bet = clampBet(value, MIN_BET, MAX_BET);
  betInputEl.value = String(bet);
  return bet;
}

function setSpinControlsDisabled(disabled) {
  spinButtonEl.disabled = disabled;
  betMaxButtonEl.disabled = disabled;
}

function topOffBankroll() {
  if (!canTopOff(bankroll)) {
    resultEl.textContent = 'Top Off is available only when bankroll is 0 or below.';
    return;
  }

  bankroll = topOff(bankroll);
  resultEl.textContent = `Bankroll topped off to $${BANKROLL_BASE.toLocaleString()}.`;
  updateBankroll();
}

async function animateSpin(finalSymbols) {
  const display = spinReels(reelStrip, REEL_COUNT);

  for (let frame = 0; frame < Math.max(...SPIN_FRAMES_PER_REEL); frame += 1) {
    for (let reelIndex = 0; reelIndex < REEL_COUNT; reelIndex += 1) {
      if (frame < SPIN_FRAMES_PER_REEL[reelIndex]) {
        display[reelIndex] = spinReels(reelStrip, 1)[0];
      }
      if (frame === SPIN_FRAMES_PER_REEL[reelIndex]) {
        display[reelIndex] = finalSymbols[reelIndex];
      }
    }

    const settlingReel = SPIN_FRAMES_PER_REEL.findIndex((stopFrame) => stopFrame === frame);
    renderSymbols(display, { spinning: true, settlingReel: settlingReel === -1 ? null : settlingReel });
    await sleep(FRAME_DURATION_MS);
  }

  renderSymbols(finalSymbols);
}

async function spin() {
  if (canTopOff(bankroll)) {
    resultEl.textContent = 'Bankroll is empty. Use Top Off to reset to $10,000.';
    return;
  }

  const bet = updateBetInput(betInputEl.value);

  if (bet > bankroll) {
    resultEl.textContent = 'Not enough bankroll for that bet.';
    return;
  }

  setSpinControlsDisabled(true);
  spinButtonEl.textContent = 'Spinning...';
  betMaxButtonEl.textContent = 'Max Spinning...';
  resultEl.textContent = 'Reels spinning...';

  bankroll -= bet;
  updateBankroll();

  const symbols = spinReels(reelStrip, REEL_COUNT);
  await animateSpin(symbols);

  const outcome = evaluateSpin(symbols, bet);
  bankroll += outcome.payout;
  renderSymbols(symbols, { winningLineIds: outcome.winningLines.map((line) => line.id) });

  resultEl.textContent = `${outcome.reason} | Multiplier x${outcome.multiplier} | Payout $${outcome.payout.toLocaleString()}`;
  updateBankroll();

  setSpinControlsDisabled(false);
  spinButtonEl.textContent = 'Spin';
  betMaxButtonEl.textContent = 'Bet Max + Spin';
}

function incrementBetControl() {
  const current = clampBet(betInputEl.value, MIN_BET, MAX_BET);
  const next = incrementBet(current, 1, MAX_BET);
  betInputEl.value = String(next);
}

function decrementBetControl() {
  const current = clampBet(betInputEl.value, MIN_BET, MAX_BET);
  const next = decrementBet(current, 1, MIN_BET);
  betInputEl.value = String(next);
}

async function betMaxAndSpin() {
  if (spinButtonEl.disabled) {
    return;
  }

  betInputEl.value = String(MAX_BET);
  await spin();
}

spinButtonEl.addEventListener('click', spin);
betDownButtonEl.addEventListener('click', decrementBetControl);
betUpButtonEl.addEventListener('click', incrementBetControl);
betMaxButtonEl.addEventListener('click', () => {
  void betMaxAndSpin();
});
topOffButtonEl.addEventListener('click', topOffBankroll);
updateBankroll();
updateBetInput(betInputEl.value);
renderSymbols(spinReels(reelStrip, REEL_COUNT));
