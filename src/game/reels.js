export const SYMBOL_TYPES = Object.freeze({
  FULL_BODY: 'fullBody',
  FACE_CLOSE_UP: 'faceCloseUp',
});

export const DEFAULT_REEL_COUNT = 3;

export const PAYLINES = Object.freeze([
  { id: 'top', label: 'Top Row', indexes: [0, 1, 2] },
  { id: 'middle', label: 'Middle Row', indexes: [3, 4, 5] },
  { id: 'bottom', label: 'Bottom Row', indexes: [6, 7, 8] },
  { id: 'diagDown', label: 'Diagonal ↘', indexes: [0, 4, 8] },
  { id: 'diagUp', label: 'Diagonal ↗', indexes: [2, 4, 6] },
]);

function randomInt(maxExclusive) {
  return Math.floor(Math.random() * maxExclusive);
}

export function createReelStrip(catAssets, repeatsPerSymbol = 2) {
  if (!Array.isArray(catAssets) || catAssets.length === 0) {
    throw new Error('catAssets must be a non-empty array');
  }

  const strip = [];
  for (const cat of catAssets) {
    if (!cat.id) throw new Error('Each cat asset must include id');
    if (!cat.fullBody || !cat.faceCloseUp) {
      throw new Error(`Cat asset "${cat.id}" requires both fullBody and faceCloseUp image paths`);
    }

    for (let i = 0; i < repeatsPerSymbol; i += 1) {
      strip.push({ catId: cat.id, type: SYMBOL_TYPES.FULL_BODY, image: cat.fullBody, label: `${cat.name} (Full)` });
      strip.push({ catId: cat.id, type: SYMBOL_TYPES.FACE_CLOSE_UP, image: cat.faceCloseUp, label: `${cat.name} (Face)` });
    }
  }

  return strip;
}

export function spinReels(reelStrip, reelCount = DEFAULT_REEL_COUNT, rng = Math.random) {
  if (!Array.isArray(reelStrip) || reelStrip.length === 0) {
    throw new Error('reelStrip must be a non-empty array');
  }
  if (!Number.isInteger(reelCount) || reelCount <= 0) {
    throw new Error('reelCount must be a positive integer');
  }

  return Array.from({ length: reelCount }, () => {
    const index = Math.floor(rng() * reelStrip.length);
    return reelStrip[index];
  });
}

export function evaluateSpin(symbols, bet = 1) {
  if (!Array.isArray(symbols) || symbols.length === 0) {
    throw new Error('symbols must be a non-empty array');
  }

  if (symbols.length !== 9) {
    throw new Error('symbols length must be exactly 9 for 3x3 payline evaluation');
  }

  let multiplier = 0;
  const reasons = [];
  const winningLines = [];

  for (const payline of PAYLINES) {
    const lineSymbols = payline.indexes.map((index) => symbols[index]);
    const byCat = new Map();
    for (const symbol of lineSymbols) {
      byCat.set(symbol.catId, (byCat.get(symbol.catId) ?? 0) + 1);
    }

    const counts = [...byCat.values()].sort((a, b) => b - a);
    const top = counts[0] ?? 0;

    if (top === 3) {
      multiplier += 12;
      reasons.push(`${payline.label}: 3 of a kind`);
      winningLines.push({
        id: payline.id,
        label: payline.label,
        indexes: payline.indexes,
        kind: 'threeKind',
      });
    } else if (top === 2) {
      multiplier += 4;
      reasons.push(`${payline.label}: 2 of a kind`);
      winningLines.push({
        id: payline.id,
        label: payline.label,
        indexes: payline.indexes,
        kind: 'twoKind',
      });
    }
  }

  const payout = bet * multiplier;
  const reason = reasons.length > 0 ? reasons.join(' | ') : 'No line match';
  return { multiplier, payout, reason, winningLines };
}
