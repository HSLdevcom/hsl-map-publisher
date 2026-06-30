import test from 'node:test';
import assert from 'node:assert';
import { calculateIntervals } from '../../src/components/timetable/intervalCalculation.mjs';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeEntry(hours, routeData) {
  const intervals = {};
  const counts = {};
  const lowestMinutes = {};
  const highestMinutes = {};
  for (const [id, { count, low, high }] of Object.entries(routeData)) {
    intervals[id] = null;
    counts[id] = count;
    lowestMinutes[id] = low;
    highestMinutes[id] = high;
  }
  return { hours, intervals, counts, lowestMinutes, highestMinutes };
}

// ─── three-hour example from spec ────────────────────────────────────────────

test('spec example: three hours with cross-hour borrowing', () => {
  // hour1: 10 30 50
  // hour2: 5 20 35 50
  // hour3: 10 30 50
  const sorted = [
    makeEntry('01', { A: { count: 3, low: 10, high: 50 } }),
    makeEntry('02', { A: { count: 4, low: 5,  high: 50 } }),
    makeEntry('03', { A: { count: 3, low: 10, high: 50 } }),
  ];
  calculateIntervals(sorted);

  // hour1: first=10 (no prev), last=5+60=65, gaps=2+1=3 → (65-10)/3 = 55/3 ≈ 18
  assert.strictEqual(sorted[0].intervals.A, 18);
  // hour2: first=50-60=-10, last=10+60=70, gaps=3+2=5 → 80/5 = 16
  assert.strictEqual(sorted[1].intervals.A, 16);
  // hour3: first=50-60=-10, last=50 (no next), gaps=2+1=3 → 60/3 = 20
  assert.strictEqual(sorted[2].intervals.A, 20);
});

// ─── edge: first hour of service (borrow right only) ─────────────────────────

test('first hour of service only borrows from next hour', () => {
  // hour07: 30 50 (no prev)
  // hour08: 10 30 50
  const sorted = [
    makeEntry('07', { A: { count: 2, low: 30, high: 50 } }),
    makeEntry('08', { A: { count: 3, low: 10, high: 50 } }),
  ];
  calculateIntervals(sorted);

  // hour07: first=30, last=10+60=70, gaps=1+1=2 → (70-30)/2 = 20
  assert.strictEqual(sorted[0].intervals.A, 20);
  // hour08: first=50-60=-10, no next → last=50, gaps=2+1=3 → (50-(-10))/3 = 20
  assert.strictEqual(sorted[1].intervals.A, 20);
});

// ─── edge: last hour of service (borrow left only) ───────────────────────────

test('last hour of service only borrows from previous hour', () => {
  // hour07: 10 30 50
  // hour22: 10 30 (no next)
  const sorted = [
    makeEntry('07', { A: { count: 3, low: 10, high: 50 } }),
    makeEntry('22', { A: { count: 2, low: 10, high: 30 } }),
  ];
  calculateIntervals(sorted);

  // hour07: no prev → first=10, next.low=10 → last=10+60=70, gaps=2+1=3 → (70-10)/3 = 20
  assert.strictEqual(sorted[0].intervals.A, 20);
  // hour22: prev.high=50 → first=50-60=-10, no next → last=30, gaps=1+1=2 → (30-(-10))/2 = 20
  assert.strictEqual(sorted[1].intervals.A, 20);
});

// ─── single hour, single departure → fallback 60 ─────────────────────────────

test('single departure with no adjacent hours falls back to 60', () => {
  const sorted = [makeEntry('14', { A: { count: 1, low: 30, high: 30 } })];
  calculateIntervals(sorted);
  assert.strictEqual(sorted[0].intervals.A, 60);
});

// ─── two routes adjusted independently ───────────────────────────────────────

test('two routes in same hours are calculated independently', () => {
  // Route A: 3 hours
  // Route B: only in hours 07 and 22 (no middle hour)
  const sorted = [
    makeEntry('07', {
      A: { count: 2, low: 30, high: 50 },
      B: { count: 3, low: 0,  high: 40 },
    }),
    makeEntry('12', {
      A: { count: 6, low: 0,  high: 50 },
    }),
    makeEntry('22', {
      A: { count: 3, low: 10, high: 30 },
      B: { count: 2, low: 20, high: 50 },
    }),
  ];
  calculateIntervals(sorted);

  // Route A hour07: no prev, next(12).low=0 → last=60, first=30, gaps=1+1=2 → (60-30)/2 = 15
  assert.strictEqual(sorted[0].intervals.A, 15);
  // Route A hour12: prev(07).high=50 → first=-10, next(22).low=10 → last=70, gaps=5+2=7 → 80/7 ≈ 11
  assert.strictEqual(sorted[1].intervals.A, 11);
  // Route A hour22: prev(12).high=50 → first=-10, no next → last=30, gaps=2+1=3 → 40/3 ≈ 13
  assert.strictEqual(sorted[2].intervals.A, 13);

  // Route B hour07: no prev, next(12) doesn't have B → no borrow → first=0, last=40, gaps=2 → 40/2 = 20
  assert.strictEqual(sorted[0].intervals.B, 20);
  // Route B hour22: prev(12) doesn't have B, but prev(07) is not adjacent → no borrow → first=20, last=50, gaps=1 → 30/1 = 30
  assert.strictEqual(sorted[2].intervals.B, 30);
});

// ─── middle hour with even spacing ───────────────────────────────────────────

test('evenly spaced departures produce exact interval', () => {
  // prev hour ends at 50, cur: 10 20 30 40 50, next starts at 0
  // first = 50-60 = -10, last = 0+60 = 60, gaps = 4+2 = 6 → 70/6 ≈ 12
  const sorted = [
    makeEntry('06', { A: { count: 6, low: 0,  high: 50 } }),
    makeEntry('07', { A: { count: 5, low: 10, high: 50 } }),
    makeEntry('08', { A: { count: 6, low: 0,  high: 50 } }),
  ];
  calculateIntervals(sorted);

  // hour07: first=50-60=-10, last=0+60=60, gaps=4+2=6 → 70/6 ≈ 12
  assert.strictEqual(sorted[1].intervals.A, 12);
});
