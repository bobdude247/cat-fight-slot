export const SYMBOL_TYPES = Object.freeze({
  FULL_BODY: 'fullBody',
  FACE_CLOSE_UP: 'faceCloseUp',
});

export const DEFAULT_REEL_COUNT = 3;

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

  if (symbols.length % 3 !== 0) {
    throw new Error('symbols length must be divisible by 3 for payline evaluation');
  }

  const rowCount = symbols.length / 3;
  let multiplier = 0;
  const reasons = [];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = symbols.slice(rowIndex * 3, rowIndex * 3 + 3);
    const byCat = new Map();
    for (const symbol of row) {
      byCat.set(symbol.catId, (byCat.get(symbol.catId) ?? 0) + 1);
    }

    const counts = [...byCat.values()].sort((a, b) => b - a);
    const top = counts[0] ?? 0;

    if (top === 3) {
      multiplier += 12;
      reasons.push(`Row ${rowIndex + 1}: 3 of a kind`);
    } else if (top === 2) {
      multiplier += 4;
      reasons.push(`Row ${rowIndex + 1}: 2 of a kind`);
    }
  }

  const payout = bet * multiplier;
  const reason = reasons.length > 0 ? reasons.join(' | ') : 'No line match';
  return { multiplier, payout, reason };
}
