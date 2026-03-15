export const MIN_BET = 1;
export const MAX_BET = 10;

export function clampBet(value, min = MIN_BET, max = MAX_BET) {
  const parsed = Number.parseInt(value, 10);
  const fallback = Number.isNaN(parsed) ? min : parsed;
  return Math.min(max, Math.max(min, fallback));
}

export function incrementBet(value, step = 1, max = MAX_BET) {
  return Math.min(max, clampBet(value) + step);
}

export function decrementBet(value, step = 1, min = MIN_BET) {
  return Math.max(min, clampBet(value) - step);
}
