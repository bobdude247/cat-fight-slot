import test from 'node:test';
import assert from 'node:assert/strict';

import { MAX_BET, MIN_BET, clampBet, decrementBet, incrementBet } from '../src/game/bet.js';

test('clampBet enforces min and max bounds', () => {
  assert.equal(clampBet('0'), MIN_BET);
  assert.equal(clampBet('5'), 5);
  assert.equal(clampBet('999'), MAX_BET);
});

test('clampBet falls back to min on invalid input', () => {
  assert.equal(clampBet('abc'), MIN_BET);
  assert.equal(clampBet(undefined), MIN_BET);
});

test('incrementBet increases by one and caps at max', () => {
  assert.equal(incrementBet(1), 2);
  assert.equal(incrementBet(MAX_BET), MAX_BET);
});

test('decrementBet decreases by one and floors at min', () => {
  assert.equal(decrementBet(MAX_BET), MAX_BET - 1);
  assert.equal(decrementBet(MIN_BET), MIN_BET);
});
