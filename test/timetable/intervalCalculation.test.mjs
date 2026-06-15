import test from 'node:test';
import assert from 'node:assert';
import {
  calculateAverageInterval,
  fixFirstLastHourIntervals,
} from '../../src/components/timetable/intervalCalculation.mjs';

// ─── calculateAverageInterval ────────────────────────────────────────────────

test('default window: 6 departures → 10 min', () => {
  assert.strictEqual(calculateAverageInterval(6), 10);
});

test('default window: 4 departures → 15 min', () => {
  assert.strictEqual(calculateAverageInterval(4), 15);
});

test('single departure → 60 min (cannot estimate headway)', () => {
  assert.strictEqual(calculateAverageInterval(1), 60);
});

test('zero departures → 60 min', () => {
  assert.strictEqual(calculateAverageInterval(0), 60);
});

test('custom window: 3 departures in 30-minute window → 10 min', () => {
  assert.strictEqual(calculateAverageInterval(3, 30), 10);
});

test('first-hour formula: 2 departures, window = 60 - 45 = 15 → 8 min', () => {
  assert.strictEqual(calculateAverageInterval(2, 60 - 45), 8);
});

test('last-hour formula: 3 departures, window = 30 → 10 min', () => {
  assert.strictEqual(calculateAverageInterval(3, 30), 10);
});

// ─── fixFirstLastHourIntervals ───────────────────────────────────────────────

function makeEntry(hours, routeData) {
  const intervals = {};
  const counts = {};
  const lowestMinutes = {};
  const highestMinutes = {};
  for (const [id, { interval, count, low, high }] of Object.entries(routeData)) {
    intervals[id] = interval;
    counts[id] = count;
    lowestMinutes[id] = low;
    highestMinutes[id] = high;
  }
  return { hours, intervals, counts, lowestMinutes, highestMinutes };
}

test('first hour adjusted when route starts mid-hour', () => {
  // Route A: hour 07 starts at minute 45 with 2 departures (default would be 60/2=30)
  // first-hour window = 60-45 = 15 → 15/2 = 7.5 → 8
  // hour 08 is a genuine middle hour (not first, not last) → unchanged
  const sorted = [
    makeEntry('07', { A: { interval: 30, count: 2, low: 45, high: 55 } }),
    makeEntry('08', { A: { interval: 10, count: 6, low: 0, high: 50 } }),
    makeEntry('22', { A: { interval: 10, count: 6, low: 0, high: 50 } }),
  ];
  fixFirstLastHourIntervals(sorted);
  assert.strictEqual(sorted[0].intervals.A, 8); // (60-45)/2 = 8
  assert.strictEqual(sorted[1].intervals.A, 10); // middle hour unchanged
});

test('last hour adjusted when route ends mid-hour', () => {
  // Route A: full service in hour 08, ends at minute 30 in hour 22 with 3 departures
  // last-hour window = 30 → 30/3 = 10
  const sorted = [
    makeEntry('08', { A: { interval: 10, count: 6, low: 0, high: 50 } }),
    makeEntry('22', { A: { interval: 20, count: 3, low: 10, high: 30 } }),
  ];
  fixFirstLastHourIntervals(sorted);
  assert.strictEqual(sorted[0].intervals.A, 10); // first hour (here also middle) unchanged
  assert.strictEqual(sorted[1].intervals.A, 10); // 30/3 = 10
});

test('both first and last hour adjusted across three hours', () => {
  const sorted = [
    makeEntry('07', { A: { interval: 30, count: 2, low: 45, high: 55 } }),
    makeEntry('08', { A: { interval: 10, count: 6, low: 0, high: 50 } }),
    makeEntry('22', { A: { interval: 20, count: 3, low: 10, high: 30 } }),
  ];
  fixFirstLastHourIntervals(sorted);
  assert.strictEqual(sorted[0].intervals.A, 8); // (60-45)/2 = 8
  assert.strictEqual(sorted[1].intervals.A, 10); // middle, unchanged
  assert.strictEqual(sorted[2].intervals.A, 10); // 30/3 = 10
});

test('route in a single hour is not adjusted', () => {
  // Only one entry for route A — cannot distinguish first from last
  const sorted = [makeEntry('14', { A: { interval: 20, count: 3, low: 10, high: 40 } })];
  fixFirstLastHourIntervals(sorted);
  assert.strictEqual(sorted[0].intervals.A, 20); // unchanged
});

test('two routes are adjusted independently', () => {
  // Route A: 2 entries, starts late in hour 07, ends early in hour 22
  // Route B: 3 entries, starts at minute 0 (first-hour window = 60, unchanged)
  const sorted = [
    makeEntry('07', {
      A: { interval: 30, count: 2, low: 45, high: 55 },
      B: { interval: 10, count: 6, low: 0, high: 50 },
    }),
    makeEntry('12', {
      A: { interval: 10, count: 6, low: 0, high: 50 },
      B: { interval: 10, count: 6, low: 0, high: 50 },
    }),
    makeEntry('22', {
      A: { interval: 20, count: 3, low: 5, high: 25 },
      B: { interval: 20, count: 3, low: 0, high: 55 },
    }),
  ];
  fixFirstLastHourIntervals(sorted);

  // Route A
  assert.strictEqual(sorted[0].intervals.A, 8); // (60-45)/2 = 8
  assert.strictEqual(sorted[1].intervals.A, 10); // middle, unchanged
  assert.strictEqual(sorted[2].intervals.A, 8); // 25/3 = 8.3 → 8

  // Route B: first hour starts at 0 → window = 60 → same as default (10)
  assert.strictEqual(sorted[0].intervals.B, 10); // (60-0)/6 = 10
  assert.strictEqual(sorted[1].intervals.B, 10); // middle, unchanged
  assert.strictEqual(sorted[2].intervals.B, 18); // 55/3 = 18.3 → 18
});
